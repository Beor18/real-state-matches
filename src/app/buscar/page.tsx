"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { LoginPromptModal } from "@/components/auth/LoginPromptModal";
import { MatchScoreModal } from "@/components/search/MatchScoreModal";
import { LocationAutocomplete } from "@/components/search/LocationAutocomplete";
import { PageGuard } from "@/components/PageGuard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ModuleWrapper } from "@/components/modules/ModuleWrapper";
import EquityForecast from "@/components/reai/EquityForecast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Header from "@/components/layout/Header";
import {
  Home,
  Search,
  Heart,
  Sparkles,
  MapPin,
  DollarSign,
  Bed,
  Bath,
  Maximize,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  LineChart,
  AlertCircle,
  Database,
  Briefcase,
  Clock,
  Target,
  Palmtree,
  TrendingUp,
  Users,
  Shield,
  Shuffle,
  HelpCircle,
  Star,
  Building,
  Building2,
  LandPlot,
  ShoppingBag,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PropertyMatch {
  id: string;
  title: string;
  address: string;
  city?: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  matchScore: number;
  matchReasons: string[];
  amenities: string[];
  images?: string[];
  sourceProvider?: string;
}

interface SearchError {
  code?: string;
  message: string;
}

// Form options
const PURPOSE_OPTIONS = [
  { value: "vivir", label: "Vivir", icon: Home },
  { value: "retiro", label: "Retiro", icon: Palmtree },
  { value: "invertir", label: "Invertir", icon: TrendingUp },
  { value: "negocio", label: "Establecer un negocio", icon: Briefcase },
  { value: "no_seguro", label: "Todavía no estoy seguro", icon: HelpCircle },
];

const TIMELINE_OPTIONS = [
  { value: "inmediato", label: "Inmediato", description: "0–3 meses" },
  { value: "pronto", label: "Pronto", description: "3–6 meses" },
  {
    value: "explorando",
    label: "Explorando opciones",
    description: "6+ meses",
  },
];

const PRIORITY_OPTIONS = [
  { value: "tranquilidad", label: "Tranquilidad", icon: Shield },
  { value: "social", label: "Cercanía y vida social", icon: Users },
  {
    value: "crecimiento",
    label: "Oportunidad de crecimiento",
    icon: TrendingUp,
  },
  { value: "estabilidad", label: "Estabilidad a largo plazo", icon: Target },
  { value: "flexibilidad", label: "Flexibilidad", icon: Shuffle },
];

const PROPERTY_TYPE_OPTIONS = [
  { value: "", label: "Cualquiera", icon: Home },
  { value: "house", label: "Casa", icon: Home },
  { value: "apartment", label: "Apartamento", icon: Building },
  { value: "townhouse", label: "Townhouse", icon: Building2 },
  { value: "land", label: "Terreno", icon: LandPlot },
];

const LISTING_TYPE_OPTIONS = [
  { value: "", label: "Cualquiera", icon: ShoppingBag },
  { value: "sale", label: "Compra", icon: ShoppingBag },
  { value: "rent", label: "Alquiler", icon: ShoppingBag },
];

export default function BuscarPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<"form" | "analyzing" | "results" | "error">(
    "form",
  );
  const [answers, setAnswers] = useState({
    lifestyle: "",
    budget: "500000",
    location: "",
    purpose: "",
    timeline: "",
    priority: "",
    propertyType: "",
    listingType: "",
  });
  const [matches, setMatches] = useState<PropertyMatch[]>([]);
  const [searchError, setSearchError] = useState<SearchError | null>(null);
  const [providersQueried, setProvidersQueried] = useState<string[]>([]);
  const [savedPropertyIds, setSavedPropertyIds] = useState<Set<string>>(
    new Set(),
  );
  const [savingPropertyId, setSavingPropertyId] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginModalProperty, setLoginModalProperty] = useState<PropertyMatch | null>(null);
  const [showMatchScoreModal, setShowMatchScoreModal] = useState(false);
  const [matchScoreProperty, setMatchScoreProperty] = useState<PropertyMatch | null>(null);

  // Restore search state from sessionStorage if returning from property detail
  useEffect(() => {
    const savedState = sessionStorage.getItem("search_state");
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        // Only restore if saved within last 30 minutes
        if (Date.now() - parsed.savedAt < 30 * 60 * 1000) {
          setStep(parsed.step);
          setAnswers(parsed.answers);
          setMatches(parsed.matches);
          setProvidersQueried(parsed.providersQueried || []);
        }
        // Clean up after restoring
        sessionStorage.removeItem("search_state");
      } catch (e) {
        console.error("Error restoring search state:", e);
        sessionStorage.removeItem("search_state");
      }
    }
  }, []);

  // Fetch saved properties on mount if user is logged in
  useEffect(() => {
    if (user) {
      fetchSavedProperties();
    }
  }, [user]);

  const fetchSavedProperties = async () => {
    try {
      const response = await fetch("/api/saved-properties");
      const data = await response.json();
      if (data.success && data.savedProperties) {
        const ids = new Set(
          data.savedProperties.map((p: any) => p.property_id),
        );
        setSavedPropertyIds(ids as Set<string>);
      }
    } catch (error) {
      console.error("Error fetching saved properties:", error);
    }
  };

  const toggleSaveProperty = async (match: PropertyMatch) => {
    if (!user) {
      // Show login prompt modal
      setLoginModalProperty(match);
      setShowLoginModal(true);
      return;
    }

    setSavingPropertyId(match.id);
    const isSaved = savedPropertyIds.has(match.id);

    try {
      if (isSaved) {
        // Remove from saved
        const response = await fetch(
          `/api/saved-properties?propertyId=${match.id}`,
          {
            method: "DELETE",
          },
        );
        const data = await response.json();
        if (data.success) {
          setSavedPropertyIds((prev) => {
            const newSet = new Set(prev);
            newSet.delete(match.id);
            return newSet;
          });
        }
      } else {
        // Save property
        const response = await fetch("/api/saved-properties", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            property: {
              id: match.id,
              sourceProvider: match.sourceProvider || "unknown",
              externalId: match.id,
              title: match.title,
              description: "",
              price: match.price,
              address: match.address,
              city: match.city || "",
              state: "",
              zipCode: "",
              bedrooms: match.bedrooms,
              bathrooms: match.bathrooms,
              squareFeet: match.squareFeet,
              propertyType: "residential",
              features: [],
              amenities: match.amenities,
              images: match.images || [],
              matchScore: match.matchScore,
              matchReasons: match.matchReasons,
            },
          }),
        });
        const data = await response.json();
        if (data.success) {
          setSavedPropertyIds((prev) => new Set(prev).add(match.id));
        }
      }
    } catch (error) {
      console.error("Error toggling save property:", error);
    } finally {
      setSavingPropertyId(null);
    }
  };

  // Navigate to property detail, saving data to sessionStorage first
  const handleViewDetails = (match: PropertyMatch) => {
    // Save search state to restore when returning
    const searchState = {
      step,
      answers,
      matches,
      providersQueried,
      savedAt: Date.now(),
    };
    sessionStorage.setItem("search_state", JSON.stringify(searchState));

    // Save complete property data to sessionStorage for detail page
    const propertyData = {
      id: match.id,
      sourceProvider: match.sourceProvider || "unknown",
      title: match.title,
      description: "",
      price: match.price,
      address: match.address,
      city: match.city || "",
      bedrooms: match.bedrooms,
      bathrooms: match.bathrooms,
      squareFeet: match.squareFeet,
      amenities: match.amenities,
      images: match.images || [],
      matchScore: match.matchScore,
      matchReasons: match.matchReasons,
    };
    sessionStorage.setItem(
      `property_${match.id}`,
      JSON.stringify(propertyData),
    );
    router.push(`/propiedad/${match.id}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep("analyzing");
    setSearchError(null);

    try {
      const response = await fetch("/api/ai/lifestyle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idealLifeDescription: answers.lifestyle,
          priorities: answers.location,
          budget: parseFloat(answers.budget),
          location: answers.location,
          // New fields for refined matching
          purpose: answers.purpose,
          timeline: answers.timeline,
          mainPriority: answers.priority,
          // Property filters
          propertyType: answers.propertyType || undefined,
          listingType: answers.listingType || undefined,
        }),
      });

      const data = await response.json();

      if (data.success && data.matches && data.matches.length > 0) {
        const transformedMatches = data.matches.map((match: any) => ({
          id: match.id,
          title: match.title,
          address: match.address,
          city: match.city,
          price: match.price,
          bedrooms: match.bedrooms || 0,
          bathrooms: match.bathrooms || 0,
          squareFeet: match.squareFeet || match.square_feet || 0,
          matchScore: match.matchScore,
          matchReasons: match.matchReasons || [],
          amenities: Array.isArray(match.amenities) ? match.amenities : [],
          images: match.images || [],
          sourceProvider: match.sourceProvider,
        }));
        setMatches(transformedMatches);
        setProvidersQueried(data.providers?.providersQueried || []);
        setStep("results");
      } else if (data.code === "NO_PROVIDERS") {
        setSearchError({
          code: "NO_PROVIDERS",
          message:
            data.error || "No hay proveedores de propiedades configurados.",
        });
        setStep("error");
      } else if (!data.success) {
        setSearchError({
          code: "API_ERROR",
          message: data.error || "Error al procesar la búsqueda.",
        });
        setStep("error");
      } else {
        // No matches found but search was successful
        setMatches([]);
        setProvidersQueried(data.providers?.providersQueried || []);
        setStep("results");
      }
    } catch (error) {
      console.error("Error:", error);
      setSearchError({
        code: "NETWORK_ERROR",
        message: "Error de conexión. Por favor intenta de nuevo.",
      });
      setStep("error");
    }
  };

  const resetSearch = () => {
    // Clear any saved search state
    sessionStorage.removeItem("search_state");
    setStep("form");
    setAnswers({
      lifestyle: "",
      budget: "500000",
      location: "",
      purpose: "",
      timeline: "",
      priority: "",
      propertyType: "",
      listingType: "",
    });
    setMatches([]);
    setSearchError(null);
  };

  return (
    <PageGuard
      pageKey="page-buscar"
      disabledTitle="Búsqueda no disponible"
      disabledMessage="La búsqueda de propiedades no está disponible en este momento. Contacta al administrador para más información."
    >
      <div className="min-h-screen bg-white">
        {/* Header */}
        <Header activeItem="/buscar" />

        {/* Main Content */}
        <main className="pt-20">
          <AnimatePresence mode="wait">
            {/* Form Step */}
            {step === "form" && (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Hero Section - Dark */}
                <section className="bg-slate-900 text-white py-16 md:py-20">
                  <div className="max-w-4xl mx-auto px-6 text-center">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6"
                    >
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                        <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                        Búsqueda inteligente
                      </Badge>
                      <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                        Describe tu vida.
                        <br />
                        <span className="text-emerald-400">
                          Encuentra tu lugar.
                        </span>
                      </h1>
                      <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                        Cuéntanos cómo imaginas tu día a día y encontraremos
                        propiedades que realmente se adaptan a tu estilo de
                        vida.
                      </p>
                    </motion.div>
                  </div>
                </section>

                {/* Form Section */}
                <section className="py-12 md:py-16 bg-slate-50">
                  <div className="max-w-2xl mx-auto px-6">
                    {/* Form is now public - no login required to search */}
                    <Card className="border-0 shadow-lg bg-white overflow-visible">
                        <CardContent className="p-6 md:p-8 overflow-visible">
                          <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Lifestyle Description */}
                            <div className="space-y-2">
                              <Label
                                htmlFor="lifestyle"
                                className="text-base font-medium"
                              >
                                ¿Cómo imaginas tu vida ideal? *
                              </Label>
                              <Textarea
                                id="lifestyle"
                                placeholder="Ej: Me imagino despertar cerca del mar, caminar a cafeterías locales, trabajar remoto con buena conexión, y tener espacio para recibir familia los fines de semana..."
                                value={answers.lifestyle}
                                onChange={(e) =>
                                  setAnswers({
                                    ...answers,
                                    lifestyle: e.target.value,
                                  })
                                }
                                className="min-h-32 resize-none"
                                required
                              />
                              <p className="text-xs text-slate-500">
                                Mientras más detalles nos des, mejores serán los
                                resultados
                              </p>
                            </div>

                            {/* Location Preferences */}
                            <div className="space-y-2" style={{ overflow: 'visible', position: 'relative', zIndex: 50 }}>
                              <Label
                                htmlFor="location"
                                className="text-base font-medium"
                              >
                                ¿Tienes preferencia de zona? (opcional)
                              </Label>
                              <LocationAutocomplete
                                value={answers.location}
                                onChange={(value) =>
                                  setAnswers({
                                    ...answers,
                                    location: value,
                                  })
                                }
                                placeholder="Buscar ciudad o barrio en Puerto Rico..."
                              />
                            </div>

                            {/* Budget */}
                            <div className="space-y-3">
                              <Label className="text-base font-medium">
                                Presupuesto máximo
                              </Label>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-slate-500">
                                    $30,000
                                  </span>
                                  <span className="font-semibold text-lg text-emerald-600">
                                    $
                                    {parseInt(answers.budget).toLocaleString(
                                      "en-US",
                                    )}
                                  </span>
                                  <span className="text-slate-500">
                                    $2,000,000
                                  </span>
                                </div>
                                <Input
                                  type="range"
                                  min="30000"
                                  max="2000000"
                                  step="10000"
                                  value={answers.budget}
                                  onChange={(e) =>
                                    setAnswers({
                                      ...answers,
                                      budget: e.target.value,
                                    })
                                  }
                                  className="w-full accent-emerald-600"
                                />
                              </div>
                            </div>

                            {/* Purpose */}
                            <div className="space-y-3">
                              <Label className="text-base font-medium">
                                ¿Cuál es el objetivo principal de esta búsqueda?
                                *
                              </Label>
                              <RadioGroup
                                value={answers.purpose}
                                onValueChange={(value) =>
                                  setAnswers({ ...answers, purpose: value })
                                }
                                className="grid grid-cols-2 sm:grid-cols-3 gap-3"
                              >
                                {PURPOSE_OPTIONS.map((option) => {
                                  const Icon = option.icon;
                                  return (
                                    <Label
                                      key={option.value}
                                      htmlFor={`purpose-${option.value}`}
                                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                        answers.purpose === option.value
                                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                      }`}
                                    >
                                      <RadioGroupItem
                                        value={option.value}
                                        id={`purpose-${option.value}`}
                                        className="sr-only"
                                      />
                                      <Icon
                                        className={`h-6 w-6 ${
                                          answers.purpose === option.value
                                            ? "text-emerald-600"
                                            : "text-slate-400"
                                        }`}
                                      />
                                      <span className="text-sm font-medium text-center">
                                        {option.label}
                                      </span>
                                    </Label>
                                  );
                                })}
                              </RadioGroup>
                            </div>

                            {/* Timeline */}
                            <div className="space-y-3">
                              <Label className="text-base font-medium">
                                ¿Cuándo te gustaría tomar esta decisión?
                              </Label>
                              <RadioGroup
                                value={answers.timeline}
                                onValueChange={(value) =>
                                  setAnswers({ ...answers, timeline: value })
                                }
                                className="grid grid-cols-3 gap-3"
                              >
                                {TIMELINE_OPTIONS.map((option) => (
                                  <Label
                                    key={option.value}
                                    htmlFor={`timeline-${option.value}`}
                                    className={`flex flex-col items-center gap-1 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                      answers.timeline === option.value
                                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                    }`}
                                  >
                                    <RadioGroupItem
                                      value={option.value}
                                      id={`timeline-${option.value}`}
                                      className="sr-only"
                                    />
                                    <Clock
                                      className={`h-5 w-5 ${
                                        answers.timeline === option.value
                                          ? "text-emerald-600"
                                          : "text-slate-400"
                                      }`}
                                    />
                                    <span className="text-sm font-medium">
                                      {option.label}
                                    </span>
                                    <span className="text-xs text-slate-500">
                                      {option.description}
                                    </span>
                                  </Label>
                                ))}
                              </RadioGroup>
                            </div>

                            {/* Priority */}
                            <div className="space-y-3">
                              <Label className="text-base font-medium">
                                ¿Qué es más importante para ti ahora mismo? *
                              </Label>
                              <RadioGroup
                                value={answers.priority}
                                onValueChange={(value) =>
                                  setAnswers({ ...answers, priority: value })
                                }
                                className="grid grid-cols-2 sm:grid-cols-3 gap-3"
                              >
                                {PRIORITY_OPTIONS.map((option) => {
                                  const Icon = option.icon;
                                  return (
                                    <Label
                                      key={option.value}
                                      htmlFor={`priority-${option.value}`}
                                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                        answers.priority === option.value
                                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                      }`}
                                    >
                                      <RadioGroupItem
                                        value={option.value}
                                        id={`priority-${option.value}`}
                                        className="sr-only"
                                      />
                                      <Icon
                                        className={`h-6 w-6 ${
                                          answers.priority === option.value
                                            ? "text-emerald-600"
                                            : "text-slate-400"
                                        }`}
                                      />
                                      <span className="text-sm font-medium text-center">
                                        {option.label}
                                      </span>
                                    </Label>
                                  );
                                })}
                              </RadioGroup>
                            </div>

                            {/* Property Type */}
                            <div className="space-y-3">
                              <Label className="text-base font-medium">
                                Tipo de propiedad
                              </Label>
                              <RadioGroup
                                value={answers.propertyType}
                                onValueChange={(value) =>
                                  setAnswers({
                                    ...answers,
                                    propertyType: value,
                                  })
                                }
                                className="grid grid-cols-2 sm:grid-cols-3 gap-3"
                              >
                                {PROPERTY_TYPE_OPTIONS.map((option) => {
                                  const Icon = option.icon;
                                  return (
                                    <Label
                                      key={option.value}
                                      htmlFor={`propertyType-${
                                        option.value || "any"
                                      }`}
                                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                        answers.propertyType === option.value
                                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                      }`}
                                    >
                                      <RadioGroupItem
                                        value={option.value}
                                        id={`propertyType-${
                                          option.value || "any"
                                        }`}
                                        className="sr-only"
                                      />
                                      <Icon
                                        className={`h-6 w-6 ${
                                          answers.propertyType === option.value
                                            ? "text-emerald-600"
                                            : "text-slate-400"
                                        }`}
                                      />
                                      <span className="text-sm font-medium text-center">
                                        {option.label}
                                      </span>
                                    </Label>
                                  );
                                })}
                              </RadioGroup>
                            </div>

                            {/* Listing Type */}
                            <div className="space-y-3">
                              <Label className="text-base font-medium">
                                ¿Compra o alquiler?
                              </Label>
                              <RadioGroup
                                value={answers.listingType}
                                onValueChange={(value) =>
                                  setAnswers({ ...answers, listingType: value })
                                }
                                className="grid grid-cols-3 gap-3"
                              >
                                {LISTING_TYPE_OPTIONS.map((option) => {
                                  const Icon = option.icon;
                                  return (
                                    <Label
                                      key={option.value}
                                      htmlFor={`listingType-${
                                        option.value || "any"
                                      }`}
                                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                        answers.listingType === option.value
                                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                      }`}
                                    >
                                      <RadioGroupItem
                                        value={option.value}
                                        id={`listingType-${
                                          option.value || "any"
                                        }`}
                                        className="sr-only"
                                      />
                                      <Icon
                                        className={`h-6 w-6 ${
                                          answers.listingType === option.value
                                            ? "text-emerald-600"
                                            : "text-slate-400"
                                        }`}
                                      />
                                      <span className="text-sm font-medium text-center">
                                        {option.label}
                                      </span>
                                    </Label>
                                  );
                                })}
                              </RadioGroup>
                            </div>

                            <Button
                              type="submit"
                              size="lg"
                              className="w-full gap-2 bg-slate-900 hover:bg-slate-800 h-14 text-base rounded-xl"
                              disabled={
                                !answers.lifestyle.trim() ||
                                !answers.purpose ||
                                !answers.priority
                              }
                            >
                              <Search className="h-5 w-5" />
                              Encontrar mi hogar ideal
                            </Button>
                          </form>
                        </CardContent>
                      </Card>
                  </div>
                </section>
              </motion.div>
            )}

            {/* Analyzing Step */}
            {step === "analyzing" && (
              <motion.div
                key="analyzing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="min-h-[60vh] flex flex-col items-center justify-center py-20"
              >
                <div className="text-center space-y-8">
                  <div className="relative">
                    <div className="h-24 w-24 mx-auto rounded-full bg-slate-900 flex items-center justify-center">
                      <Loader2 className="h-12 w-12 text-emerald-400 animate-spin" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-3xl font-bold text-slate-900">
                      Analizando tu perfil...
                    </h2>
                    <p className="text-slate-500 max-w-md mx-auto">
                      Estamos procesando tus preferencias y buscando propiedades
                      que encajen con tu estilo de vida
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Error Step */}
            {step === "error" && searchError && (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-16"
              >
                <div className="max-w-2xl mx-auto px-6">
                  <Card className="border-0 shadow-lg bg-white">
                    <CardContent className="p-8 md:p-12 text-center space-y-8">
                      <div className="h-20 w-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
                        {searchError.code === "NO_PROVIDERS" ? (
                          <Database className="h-10 w-10 text-amber-600" />
                        ) : (
                          <AlertCircle className="h-10 w-10 text-amber-600" />
                        )}
                      </div>

                      <div className="space-y-3">
                        <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
                          {searchError.code === "NO_PROVIDERS"
                            ? "Búsqueda No Disponible"
                            : "Error en la Búsqueda"}
                        </h2>
                        <p className="text-slate-500">{searchError.message}</p>
                      </div>

                      {searchError.code === "NO_PROVIDERS" && (
                        <div className="bg-slate-50 rounded-xl p-6 text-left space-y-4">
                          <p className="text-sm text-slate-700 font-medium">
                            Para habilitar la búsqueda:
                          </p>
                          <ul className="text-sm text-slate-600 space-y-3">
                            <li className="flex items-start gap-3">
                              <span className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-medium shrink-0">
                                1
                              </span>
                              <span>
                                Un administrador debe acceder al panel de
                                administración
                              </span>
                            </li>
                            <li className="flex items-start gap-3">
                              <span className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-medium shrink-0">
                                2
                              </span>
                              <span>
                                Configurar al menos un proveedor de datos
                              </span>
                            </li>
                            <li className="flex items-start gap-3">
                              <span className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-medium shrink-0">
                                3
                              </span>
                              <span>Ingresar las credenciales de API</span>
                            </li>
                          </ul>
                        </div>
                      )}

                      <div className="flex justify-center gap-3 pt-2">
                        <Button
                          variant="outline"
                          onClick={resetSearch}
                          className="gap-2 rounded-full px-6"
                        >
                          <ArrowLeft className="h-4 w-4" />
                          Volver
                        </Button>
                        <Link href="/">
                          <Button className="gap-2 bg-slate-900 hover:bg-slate-800 rounded-full px-6">
                            <Home className="h-4 w-4" />
                            Ir al Inicio
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}

            {/* Results Step */}
            {step === "results" && (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Results Header - Dark */}
                <section
                  className={`py-12 ${
                    matches.length > 0
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100"
                  }`}
                >
                  <div className="max-w-6xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-center gap-4">
                        <div
                          className={`h-14 w-14 rounded-xl flex items-center justify-center ${
                            matches.length > 0
                              ? "bg-emerald-500/20"
                              : "bg-white"
                          }`}
                        >
                          {matches.length > 0 ? (
                            <CheckCircle className="h-7 w-7 text-emerald-400" />
                          ) : (
                            <Search className="h-7 w-7 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <h1
                            className={`text-2xl md:text-3xl font-bold ${
                              matches.length > 0
                                ? "text-white"
                                : "text-slate-900"
                            }`}
                          >
                            {matches.length > 0
                              ? `${matches.length} propiedades encontradas`
                              : "Sin resultados"}
                          </h1>
                          <p
                            className={
                              matches.length > 0
                                ? "text-slate-400"
                                : "text-slate-500"
                            }
                          >
                            {matches.length > 0
                              ? "Propiedades que encajan con tu estilo de vida"
                              : "Intenta ampliar tus criterios de búsqueda"}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant={matches.length > 0 ? "secondary" : "outline"}
                        onClick={resetSearch}
                        className={`gap-2 rounded-full px-6 ${
                          matches.length > 0
                            ? "bg-white text-slate-900 hover:bg-slate-100"
                            : ""
                        }`}
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Nueva Búsqueda
                      </Button>
                    </div>
                  </div>
                </section>

                {/* Results Content */}
                <section className="py-12 bg-white">
                  <div className="max-w-6xl mx-auto px-6 space-y-8">
                    {/* No Results Message */}
                    {matches.length === 0 && (
                      <Card className="border-0 shadow-lg bg-slate-50">
                        <CardContent className="p-12 text-center space-y-6">
                          <div className="h-20 w-20 rounded-full bg-slate-200 flex items-center justify-center mx-auto">
                            <Search className="h-10 w-10 text-slate-400" />
                          </div>
                          <div className="space-y-3">
                            <h3 className="text-xl font-bold text-slate-900">
                              No encontramos propiedades
                            </h3>
                            <p className="text-slate-500 max-w-md mx-auto">
                              Intenta con una descripción diferente, amplía tu
                              presupuesto o cambia la ubicación preferida.
                            </p>
                          </div>
                          <Button
                            onClick={resetSearch}
                            className="gap-2 bg-slate-900 hover:bg-slate-800 rounded-full px-8"
                          >
                            <Search className="h-4 w-4" />
                            Nueva Búsqueda
                          </Button>
                        </CardContent>
                      </Card>
                    )}

                    {/* Results Grid */}
                    {matches.length > 0 &&
                      (() => {
                        // Separate Xposure (featured) properties from others
                        const featuredMatches = matches
                          .filter((m) => m.sourceProvider === "xposure")
                          .slice(0, 5);
                        const regularMatches = matches.filter(
                          (m) =>
                            m.sourceProvider !== "xposure" ||
                            !featuredMatches.find((f) => f.id === m.id),
                        );

                        // Helper function to render a property card
                        const renderPropertyCard = (
                          match: PropertyMatch,
                          index: number,
                          isFeatured: boolean = false,
                        ) => (
                          <motion.div
                            key={match.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="h-full"
                          >
                            <div
                              className={cn(
                                "h-full flex flex-col bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all",
                                isFeatured && "ring-2 ring-amber-400",
                              )}
                            >
                              {/* Image Section */}
                              <div className="relative aspect-[4/3] overflow-hidden">
                                {match.images && match.images.length > 0 ? (
                                  <img
                                    src={match.images[0]}
                                    alt={match.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                                    <Home className="h-12 w-12 text-slate-400" />
                                  </div>
                                )}

                                {/* Badges on image */}
                                <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
                                  {isFeatured ? (
                                    <Badge className="bg-amber-500 text-white border-0 shadow-lg text-xs px-2 py-1">
                                      <Star className="h-3 w-3 mr-1 fill-current" />
                                      Destacado
                                    </Badge>
                                  ) : (
                                    <div />
                                  )}
                                  <Badge
                                    className={cn(
                                      "text-xs px-2 py-1 shadow-lg",
                                      isFeatured
                                        ? "bg-amber-500/90 text-white border-0"
                                        : "bg-black/60 text-white border-0",
                                    )}
                                  >
                                    {isFeatured ? "Puerto Rico" : match.city}
                                  </Badge>
                                </div>

                                {/* Save button on image - always visible, prompts login if not authenticated */}
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    toggleSaveProperty(match);
                                  }}
                                  disabled={savingPropertyId === match.id}
                                  className={cn(
                                    "absolute bottom-3 right-3 p-2 rounded-full shadow-lg transition-all",
                                    savedPropertyIds.has(match.id)
                                      ? "bg-white text-red-500"
                                      : "bg-white/90 text-slate-500 hover:text-red-500",
                                  )}
                                  title={
                                    savedPropertyIds.has(match.id)
                                      ? "Quitar de guardados"
                                      : "Guardar propiedad"
                                  }
                                >
                                  {savingPropertyId === match.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Heart
                                      className={cn(
                                        "h-4 w-4",
                                        savedPropertyIds.has(match.id) &&
                                          "fill-current",
                                      )}
                                    />
                                  )}
                                </button>
                              </div>

                              {/* Content Section */}
                              <div className="flex flex-col flex-1 p-4">
                                {/* Title & Score */}
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <h3 className="font-semibold text-slate-900 line-clamp-1 flex-1">
                                    {match.title}
                                  </h3>
                                  <Badge
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setMatchScoreProperty(match);
                                      setShowMatchScoreModal(true);
                                    }}
                                    className={cn(
                                      "shrink-0 text-xs cursor-pointer hover:scale-105 transition-transform",
                                      isFeatured
                                        ? "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200"
                                        : "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200",
                                    )}
                                    title="Ver detalles del match"
                                  >
                                    {match.matchScore}%
                                  </Badge>
                                </div>

                                {/* Address */}
                                <p className="text-sm text-slate-500 flex items-center gap-1 mb-3">
                                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                                  <span className="line-clamp-1">
                                    {match.city
                                      ? `${match.city}`
                                      : match.address}
                                  </span>
                                </p>

                                {/* Price */}
                                <p
                                  className={cn(
                                    "text-xl font-bold mb-2",
                                    isFeatured
                                      ? "text-amber-600"
                                      : "text-slate-900",
                                  )}
                                >
                                  ${match.price.toLocaleString("en-US")}
                                </p>

                                {/* Stats Row */}
                                <div className="flex items-center gap-4 text-sm text-slate-600 mb-3">
                                  <span className="flex items-center gap-1.5">
                                    <Bed className="h-4 w-4 text-slate-400" />
                                    <span>{match.bedrooms} hab</span>
                                  </span>
                                  <span className="flex items-center gap-1.5">
                                    <Bath className="h-4 w-4 text-slate-400" />
                                    <span>{match.bathrooms} baños</span>
                                  </span>
                                  <span className="flex items-center gap-1.5">
                                    <Maximize className="h-4 w-4 text-slate-400" />
                                    <span>
                                      {match.squareFeet.toLocaleString("en-US")}{" "}
                                      ft²
                                    </span>
                                  </span>
                                </div>

                                {/* Match Reasons */}
                                {match.matchReasons.length > 0 && (
                                  <div className="mb-3 space-y-1.5">
                                    {match.matchReasons
                                      .slice(0, 2)
                                      .map((reason, idx) => (
                                        <p
                                          key={idx}
                                          className="text-xs text-slate-600 flex items-start gap-2"
                                        >
                                          <CheckCircle
                                            className={cn(
                                              "h-3.5 w-3.5 shrink-0 mt-0.5",
                                              isFeatured
                                                ? "text-amber-500"
                                                : "text-emerald-500",
                                            )}
                                          />
                                          <span className="line-clamp-1">
                                            {reason}
                                          </span>
                                        </p>
                                      ))}
                                  </div>
                                )}

                                {/* Amenities */}
                                {match.amenities.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 mb-4">
                                    {match.amenities
                                      .slice(0, 3)
                                      .map((amenity, idx) => (
                                        <span
                                          key={idx}
                                          className={cn(
                                            "text-xs px-2 py-0.5 rounded-full",
                                            isFeatured
                                              ? "bg-amber-50 text-amber-700"
                                              : "bg-slate-100 text-slate-600",
                                          )}
                                        >
                                          {amenity}
                                        </span>
                                      ))}
                                    {match.amenities.length > 3 && (
                                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-400">
                                        +{match.amenities.length - 3}
                                      </span>
                                    )}
                                  </div>
                                )}

                                {/* Spacer */}
                                <div className="flex-1" />

                                {/* Button */}
                                <Button
                                  onClick={() => handleViewDetails(match)}
                                  className={cn(
                                    "w-full",
                                    isFeatured
                                      ? "bg-amber-500 hover:bg-amber-600 text-white"
                                      : "bg-slate-900 hover:bg-slate-800",
                                  )}
                                >
                                  Ver Detalles
                                  <ArrowRight className="h-4 w-4 ml-2" />
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        );

                        return (
                          <div className="space-y-10">
                            {/* Featured Properties Section (Xposure) */}
                            {featuredMatches.length > 0 && (
                              <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                  <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                                    <Star className="h-5 w-5 text-amber-600" />
                                  </div>
                                  <div>
                                    <h2 className="text-xl font-bold text-slate-900">
                                      Propiedades Destacadas
                                    </h2>
                                    <p className="text-sm text-slate-500">
                                      Listados verificados
                                    </p>
                                  </div>
                                </div>
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                  {featuredMatches.map((match, index) =>
                                    renderPropertyCard(match, index, true),
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Regular Properties Section */}
                            {regularMatches.length > 0 && (
                              <div className="space-y-6">
                                {featuredMatches.length > 0 && (
                                  <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                                      <Home className="h-5 w-5 text-slate-600" />
                                    </div>
                                    <div>
                                      <h2 className="text-xl font-bold text-slate-900">
                                        Más Propiedades
                                      </h2>
                                      <p className="text-sm text-slate-500">
                                        Otras opciones que podrían interesarte
                                      </p>
                                    </div>
                                  </div>
                                )}
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                  {regularMatches.map((match, index) =>
                                    renderPropertyCard(
                                      match,
                                      featuredMatches.length + index,
                                      false,
                                    ),
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                    {/* Upsell for non-logged users */}
                    {!user && matches.length > 0 && (
                      <Card className="border-0 bg-slate-900 text-white shadow-xl">
                        <CardContent className="p-8">
                          <div className="flex flex-col md:flex-row items-center gap-6">
                            <div className="h-16 w-16 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                              <Sparkles className="h-8 w-8 text-emerald-400" />
                            </div>
                            <div className="flex-1 text-center md:text-left">
                              <h3 className="font-bold text-xl">
                                ¿Te gustan estos resultados?
                              </h3>
                              <p className="text-slate-400 mt-1">
                                Crea una cuenta para guardar tus búsquedas,
                                recibir alertas de nuevas propiedades y más.
                              </p>
                            </div>
                            <Link href="/auth/login">
                              <Button className="gap-2 bg-white text-slate-900 hover:bg-slate-100 rounded-full px-8">
                                Crear Cuenta
                                <ArrowRight className="h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Equity Forecast Module - Shown if enabled and has results */}
                    {matches.length > 0 && (
                      <ModuleWrapper moduleKey="equity-forecast">
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                        >
                          <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-900 to-slate-800 text-white">
                            <CardContent className="p-8">
                              <div className="flex items-center gap-4 mb-6">
                                <div className="h-14 w-14 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                  <LineChart className="h-7 w-7 text-emerald-400" />
                                </div>
                                <div>
                                  <h3 className="text-xl font-bold">
                                    ¿Cuánto valdrá en el futuro?
                                  </h3>
                                  <p className="text-sm text-slate-400">
                                    Proyección de valorización para propiedades
                                    similares
                                  </p>
                                </div>
                              </div>
                              <EquityForecast />
                            </CardContent>
                          </Card>
                        </motion.div>
                      </ModuleWrapper>
                    )}
                  </div>
                </section>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Login Prompt Modal - shown when unauthenticated user tries to save */}
        <LoginPromptModal
          isOpen={showLoginModal}
          onClose={() => {
            setShowLoginModal(false);
            setLoginModalProperty(null);
          }}
          returnTo="/buscar"
          propertyTitle={loginModalProperty?.title}
        />

        {/* Match Score Modal - shows detailed match information */}
        <MatchScoreModal
          isOpen={showMatchScoreModal}
          onClose={() => {
            setShowMatchScoreModal(false);
            setMatchScoreProperty(null);
          }}
          propertyTitle={matchScoreProperty?.title || ""}
          matchScore={matchScoreProperty?.matchScore || 0}
          matchReasons={matchScoreProperty?.matchReasons || []}
          price={matchScoreProperty?.price}
          city={matchScoreProperty?.city}
        />
      </div>
    </PageGuard>
  );
}
