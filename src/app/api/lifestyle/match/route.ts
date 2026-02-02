import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      idealLifeDescription,
      priorities,
      budget,
      location,
      preferredPropertyTypes,
    } = body;

    if (!idealLifeDescription) {
      return NextResponse.json(
        {
          success: false,
          error: "idealLifeDescription is required",
        },
        { status: 400 },
      );
    }

    // In a real implementation, this would:
    // 1. Use z-ai-web-dev-sdk LLM to create embeddings from idealLifeDescription
    // 2. Query the database for properties with similar embeddings
    // 3. Calculate match scores using vector similarity
    // 4. Return ranked matches with reasons

    // Mock data for MVP
    const mockMatches = [
      {
        id: "1",
        title: "Villa Costera Moderna",
        address: "Calle del Sol, Dorado Beach",
        propertyType: "house",
        price: 485000,
        bedrooms: 3,
        bathrooms: 2.5,
        squareFeet: 2400,
        matchScore: 96,
        lifestyleFit: "excellent",
        matchReasons: [
          "Vista al mar perfecta para despertar con el sonido de las olas",
          "Ubicación tranquila pero cerca de restaurantes y cafeterías",
          "Espacio ideal para trabajo remoto con oficina integrada",
          "Diseño abierto perfecto para recibir visitas familiares",
          "A solo 5 minutos de la playa más cercana",
        ],
        amenities: [
          "Vista al mar",
          "Piscina",
          "Oficina en casa",
          "Terraza",
          "Parqueo para 3 autos",
        ],
      },
      {
        id: "2",
        title: "Penthouse Urbano con Vistas",
        address: "Avenida Ashford, Condado",
        propertyType: "condo",
        price: 625000,
        bedrooms: 2,
        bathrooms: 2,
        squareFeet: 1800,
        matchScore: 91,
        lifestyleFit: "excellent",
        matchReasons: [
          "Ubicación premium con acceso a vida nocturna y restaurantes",
          "Vistas panorámicas al océano",
          "Cercanía a servicios y transporte",
          "Diseño moderno ideal para profesional urbano",
          "Gimnasio y piscina en el edificio",
        ],
        amenities: [
          "Vista al mar",
          "Gimnasio",
          "Piscina",
          "Seguridad 24/7",
          "Balcón privado",
        ],
      },
      {
        id: "3",
        title: "Residencia Familiar con Jardín",
        address: "Calle Principal, Guaynabo",
        propertyType: "house",
        price: 375000,
        bedrooms: 4,
        bathrooms: 3,
        squareFeet: 2800,
        matchScore: 87,
        lifestyleFit: "good",
        matchReasons: [
          "Espacio amplio para familia y visitas",
          "Jardín privado perfecto para niños",
          "Zona tranquila y segura",
          "Cerca de escuelas de calidad",
          "Excelente relación precio-valor",
        ],
        amenities: [
          "Jardín",
          "Parqueo",
          "Cerca de escuelas",
          "Zona segura",
          "Terraza",
        ],
      },
    ];

    return NextResponse.json({
      success: true,
      matches: mockMatches,
      profile: {
        idealLifeDescription,
        keywords: extractedKeywords(idealLifeDescription),
        priorities,
        budget,
        location,
        preferredPropertyTypes,
      },
      meta: {
        total: mockMatches.length,
        searchTime: "2.3s",
      },
    });
  } catch (error) {
    console.error("Error processing lifestyle match:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process lifestyle match",
      },
      { status: 500 },
    );
  }
}

function extractedKeywords(text: string): string[] {
  const keywords: string[] = [];
  const commonKeywords = [
    "playa",
    "mar",
    "tranquilo",
    "restaurante",
    "cafetería",
    "trabajo",
    "remoto",
    "familia",
    "niños",
    "seguridad",
    "escuela",
    "vida",
    "nocturna",
  ];

  commonKeywords.forEach((keyword) => {
    if (text.toLowerCase().includes(keyword)) {
      keywords.push(keyword);
    }
  });

  return keywords.length > 0 ? keywords : ["general", "propiedad"];
}
