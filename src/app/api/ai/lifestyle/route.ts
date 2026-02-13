import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  analyzeLifestyleProfile,
  matchPropertiesWithProfile,
} from "@/services/ai/openai-services";
import {
  searchPropertiesFromProviders,
  hasActiveProviders,
} from "@/lib/property-client";
import { loadAIConfigFromDatabase } from "@/lib/ai-client";

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  // Helper to create SSE event
  function sseEvent(data: Record<string, unknown>): Uint8Array {
    return encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
  }

  // Helper to send progress
  function progress(
    step: string,
    message: string,
    detail: string,
    percent: number,
  ) {
    return sseEvent({ type: "progress", step, message, detail, percent });
  }

  // Helper to send error
  function errorEvent(error: string, code?: string) {
    return sseEvent({ type: "error", error, code });
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        const body = await request.json();
        const {
          idealLifeDescription,
          priorities,
          budget,
          location,
          preferredPropertyTypes,
          propertyType,
          listingType,
          purpose,
          timeline,
          mainPriority,
        } = body;

        if (!idealLifeDescription) {
          controller.enqueue(errorEvent("idealLifeDescription is required"));
          controller.close();
          return;
        }

        // Step 0: Check providers
        controller.enqueue(
          progress(
            "init",
            "Iniciando busqueda...",
            "Verificando configuracion",
            5,
          ),
        );

        const hasProviders = await hasActiveProviders();
        if (!hasProviders) {
          controller.enqueue(
            errorEvent(
              "No hay proveedores de propiedades configurados. Un administrador debe configurar al menos un proveedor de datos.",
              "NO_PROVIDERS",
            ),
          );
          controller.close();
          return;
        }

        const aiConfig = await loadAIConfigFromDatabase();
        if (!aiConfig) {
          controller.enqueue(
            errorEvent(
              "No hay proveedor de IA configurado. Un administrador debe configurar un proveedor de IA.",
              "NO_AI_PROVIDER",
            ),
          );
          controller.close();
          return;
        }

        // Step 1: Analyze lifestyle profile
        controller.enqueue(
          progress(
            "analyzing",
            "Analizando tu estilo de vida...",
            "Extrayendo preferencias, ubicaciones y palabras clave",
            10,
          ),
        );

        const profileAnalysis = await analyzeLifestyleProfile({
          idealLifeDescription,
          priorities: priorities || "",
          budget,
          location,
          preferredPropertyTypes,
        });

        // Step 2: Locations detected
        interface SearchLocation {
          city?: string;
          state?: string;
          zipCode?: string;
          source: string;
        }

        const searchLocations: SearchLocation[] = [];

        if (
          profileAnalysis.suggestedLocations &&
          profileAnalysis.suggestedLocations.length > 0
        ) {
          for (const loc of profileAnalysis.suggestedLocations) {
            searchLocations.push({
              city: loc.city,
              state: loc.state,
              zipCode: loc.postalCode,
              source: "ai_extracted",
            });
          }
        }

        if (location && location.trim()) {
          const userLoc = location.trim().toLowerCase();
          const alreadyIncluded = searchLocations.some(
            (loc) =>
              loc.city?.toLowerCase() === userLoc ||
              loc.state?.toLowerCase() === userLoc,
          );
          if (!alreadyIncluded) {
            searchLocations.push({
              city: location.trim(),
              source: "user",
            });
          }
        }

        if (searchLocations.length === 0) {
          searchLocations.push({
            city: undefined,
            state: "PR",
            source: "default",
          });
        }

        const locationNames = searchLocations
          .map((l) => l.city || l.state || "Puerto Rico")
          .join(", ");

        controller.enqueue(
          progress(
            "locations",
            `Ubicaciones detectadas: ${locationNames}`,
            `${searchLocations.length} ubicacion${searchLocations.length > 1 ? "es" : ""} para buscar`,
            20,
          ),
        );

        // Step 3: Search properties
        controller.enqueue(
          progress(
            "searching",
            `Buscando propiedades en ${locationNames}...`,
            "Consultando proveedores de MLS",
            30,
          ),
        );

        const locationResults = await Promise.all(
          searchLocations.map(async (loc) => {
            return searchPropertiesFromProviders({
              city: loc.city,
              state: loc.state,
              zipCode: loc.zipCode,
              minPrice: undefined,
              maxPrice: budget || undefined,
              propertyType: propertyType || preferredPropertyTypes?.[0],
              listingType: listingType || undefined,
              status: "active",
            });
          }),
        );

        // Combine results
        const combinedProperties: (typeof locationResults)[0]["properties"] =
          [];
        const combinedTotalByProvider: Record<string, number> = {};
        const combinedErrors: Record<string, string> = {};
        const combinedProvidersQueried = new Set<string>();
        let searchSettings = locationResults[0]?.searchSettings;

        for (const result of locationResults) {
          for (const prop of result.properties) {
            if (!combinedProperties.find((p) => p.id === prop.id)) {
              combinedProperties.push(prop);
            }
          }
          for (const [provider, total] of Object.entries(
            result.totalByProvider,
          )) {
            combinedTotalByProvider[provider] =
              (combinedTotalByProvider[provider] || 0) + total;
          }
          Object.assign(combinedErrors, result.errors);
          result.providersQueried.forEach((p) =>
            combinedProvidersQueried.add(p),
          );
          if (!searchSettings) searchSettings = result.searchSettings;
        }

        const propertyResult = {
          success:
            combinedProperties.length > 0 ||
            Object.keys(combinedErrors).length === 0,
          properties: combinedProperties,
          totalByProvider: combinedTotalByProvider,
          errors: combinedErrors,
          providersQueried: Array.from(combinedProvidersQueried) as any[],
          searchSettings: searchSettings!,
        };

        // Step 4: Properties found
        const budgetStr = budget
          ? `$${Number(budget).toLocaleString("en-US")}`
          : "sin limite";
        controller.enqueue(
          progress(
            "found",
            `Encontradas ${combinedProperties.length} propiedades`,
            `Presupuesto maximo: ${budgetStr} | Proveedores: ${Array.from(combinedProvidersQueried).join(", ")}`,
            50,
          ),
        );

        let matches: any[] = [];
        const providerInfo = {
          providersQueried: propertyResult.providersQueried,
          totalByProvider: propertyResult.totalByProvider,
          errors: propertyResult.errors,
        };

        if (propertyResult.properties.length > 0) {
          const maxForAI = propertyResult.searchSettings.max_properties_for_ai;
          const propertiesForAI = propertyResult.properties.slice(0, maxForAI);

          // Step 5: AI matching
          const keywordsStr =
            profileAnalysis.keywords?.slice(0, 4).join(", ") || "";
          controller.enqueue(
            progress(
              "matching",
              `Evaluando +2500 propiedades...`,
              `Buscando: ${keywordsStr}`,
              60,
            ),
          );

          const matchResult = await matchPropertiesWithProfile(
            {
              idealLifeDescription,
              priorities: priorities || "",
              budget,
              location,
              preferredPropertyTypes,
              purpose,
              timeline,
              mainPriority,
            },
            propertiesForAI.map((p) => ({
              id: p.id,
              title: p.title,
              description: p.description,
              address: p.address.street,
              city: p.address.city,
              amenities: p.amenities,
              features: p.features,
              price: p.price,
              bedrooms: p.details.bedrooms || undefined,
              bathrooms: p.details.bathrooms || undefined,
              squareFeet: p.details.squareFeet || undefined,
              coordinates: p.coordinates || undefined,
              neighborhood: (p.address as any).neighborhood || undefined,
              yearBuilt: p.details.yearBuilt || undefined,
            })),
          );

          // Step 6: Finalizing
          controller.enqueue(
            progress(
              "finalizing",
              "Preparando resultados...",
              "Ordenando por mejor compatibilidad",
              85,
            ),
          );

          const allMatches = matchResult.matches
            .map((match) => {
              const property = propertyResult.properties.find(
                (p) => p.id === match.propertyId,
              );
              if (!property) return null;

              return {
                id: property.id,
                sourceProvider: property.sourceProvider,
                externalId: property.externalId,
                mlsNumber: property.mlsNumber,
                title: property.title,
                description: property.description,
                price: property.price,
                address: property.address.street,
                city: property.address.city,
                state: property.address.state,
                zipCode: property.address.zipCode,
                bedrooms: property.details.bedrooms,
                bathrooms: property.details.bathrooms,
                squareFeet: property.details.squareFeet,
                yearBuilt: property.details.yearBuilt,
                propertyType: property.details.propertyType,
                features: property.features,
                amenities: property.amenities,
                images: property.images,
                virtualTourUrl: property.virtualTourUrl,
                coordinates: property.coordinates || null,
                agent: property.agent,
                listDate: property.listDate,
                status: property.status,
                matchScore: match.matchScore,
                matchReasons: match.matchReasons,
                lifestyleFit: match.lifestyleFit,
              };
            })
            .filter(Boolean);

          const xposureMatches = allMatches
            .filter((m) => m?.sourceProvider === "xposure")
            .sort((a, b) => (b?.matchScore || 0) - (a?.matchScore || 0));

          const otherMatches = allMatches
            .filter((m) => m?.sourceProvider !== "xposure")
            .sort((a, b) => (b?.matchScore || 0) - (a?.matchScore || 0));

          const prioritizedXposure = xposureMatches.slice(0, 5);
          const remainingXposure = xposureMatches.slice(5);
          const remainingCombined = [...remainingXposure, ...otherMatches].sort(
            (a, b) => (b?.matchScore || 0) - (a?.matchScore || 0),
          );

          matches = [...prioritizedXposure, ...remainingCombined];
        }

        // Build effective locations
        const preferredCities: string[] = [];
        for (const loc of searchLocations) {
          if (loc.city && !preferredCities.includes(loc.city)) {
            preferredCities.push(loc.city);
          }
        }
        for (const loc of profileAnalysis.suggestedLocations || []) {
          if (loc.city && !preferredCities.includes(loc.city)) {
            preferredCities.push(loc.city);
          }
        }

        const effectiveLocation = preferredCities.join(", ") || location || "";
        const locationSource =
          searchLocations.length > 1
            ? "multi_location"
            : searchLocations[0]?.source || "default";

        // Save profile (non-blocking)
        if (user && profileAnalysis) {
          supabase
            .from("lifestyle_profiles")
            .upsert(
              {
                user_id: user.id,
                ideal_life_description: idealLifeDescription,
                lifestyle_keywords: profileAnalysis.keywords,
                preferred_property_types: preferredPropertyTypes || [],
                preferred_cities: preferredCities,
                budget_min: budget ? budget * 0.8 : null,
                budget_max: budget ? budget * 1.2 : null,
                lifestyle_priorities: priorities
                  ? priorities.split(",").map((p: string) => p.trim())
                  : [],
                embedding: profileAnalysis.embedding
                  ? JSON.stringify(profileAnalysis.embedding)
                  : null,
              } as any,
              {
                onConflict: "user_id",
              },
            )
            .then(({ error: profileError }) => {
              if (profileError) {
                console.error("Error saving lifestyle profile:", profileError);
              }
            });
        }

        // Final result
        controller.enqueue(
          progress(
            "done",
            `Listo! ${matches.length} propiedades encontradas`,
            "",
            100,
          ),
        );

        controller.enqueue(
          sseEvent({
            type: "result",
            data: {
              success: true,
              matches,
              profile: {
                idealLifeDescription,
                keywords: profileAnalysis.keywords,
                summary: profileAnalysis.summary,
                lifestyleType: profileAnalysis.lifestyleType,
                suggestedLocation: profileAnalysis.suggestedLocation,
                suggestedLocations: profileAnalysis.suggestedLocations,
                priorities,
                budget,
                location: effectiveLocation,
                locationSource,
                searchedLocations: searchLocations.length,
                preferredPropertyTypes,
              },
              providers: providerInfo,
              meta: {
                total: matches.length,
                locationsSearched: searchLocations.length,
                analyzedAt: new Date().toISOString(),
              },
            },
          }),
        );

        controller.close();
      } catch (error) {
        console.error("Error processing lifestyle match:", error);
        controller.enqueue(
          errorEvent("Error al procesar la busqueda de estilo de vida"),
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
