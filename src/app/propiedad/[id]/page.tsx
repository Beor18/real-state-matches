"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/auth/AuthProvider";
import { LoginPromptModal } from "@/components/auth/LoginPromptModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/layout/Header";
import {
  ArrowLeft,
  Bed,
  Bath,
  Maximize,
  Calendar,
  MapPin,
  Home,
  MessageCircle,
  Share2,
  Heart,
  ChevronLeft,
  ChevronRight,
  X,
  Star,
  Building,
  Loader2,
  Check,
  Phone,
  Sparkles,
  CheckCircle,
  Target,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

// Broker info - TODO: Make configurable from admin
const BROKER_INFO = {
  name: "Kelvin García",
  phone: "+17875461557", // Placeholder - update with real number
  company: "Smart Real Estate",
  license: "LIC. C-26882",
};

interface PropertyDetail {
  id: string;
  sourceProvider: string;
  mlsNumber: string;
  title: string;
  description: string;
  price: number;
  listingType: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    neighborhood?: string;
  };
  coordinates?: {
    latitude: number;
    longitude: number;
  } | null;
  details: {
    propertyType: string;
    bedrooms: number;
    bathrooms: number;
    squareFeet: number;
    lotSize?: number;
    yearBuilt?: number;
  };
  features: string[];
  amenities: string[];
  images: string[];
  virtualTourUrl?: string;
  listDate: string;
  status: string;
  featured: boolean;
  // Match data (from search)
  matchScore?: number;
  matchReasons?: string[];
}

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showGallery, setShowGallery] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    if (params.id) {
      loadProperty(params.id as string);
    }
  }, [params.id]);

  // Load property: first from sessionStorage, then from API
  const loadProperty = async (id: string) => {
    try {
      setLoading(true);

      // 1. Try sessionStorage first (data passed from search)
      const cachedData = sessionStorage.getItem(`property_${id}`);
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        // Transform to PropertyDetail format
        const propertyFromCache: PropertyDetail = {
          id: parsed.id,
          sourceProvider: parsed.sourceProvider || "unknown",
          mlsNumber: parsed.id.replace(/^(xposure|bridge|realtor)-/, ""),
          title: parsed.title,
          description: parsed.description || "",
          price: parsed.price,
          listingType: "sale",
          address: {
            street: parsed.address || "",
            city: parsed.city || "",
            state: "",
            zipCode: "",
            country: "PR",
          },
          coordinates: null,
          details: {
            propertyType: "residential",
            bedrooms: parsed.bedrooms || 0,
            bathrooms: parsed.bathrooms || 0,
            squareFeet: parsed.squareFeet || 0,
          },
          features: [],
          amenities: parsed.amenities || [],
          images: parsed.images || [],
          listDate: new Date().toISOString(),
          status: "active",
          featured: parsed.sourceProvider === "xposure",
          // Include match data if available
          matchScore: parsed.matchScore,
          matchReasons: parsed.matchReasons,
        };
        setProperty(propertyFromCache);
        setLoading(false);
        // Clean up sessionStorage
        sessionStorage.removeItem(`property_${id}`);
        // Check if saved
        checkIfSaved(id);
        return;
      }

      // 2. Fetch from API
      const response = await fetch(`/api/properties/${id}`);
      const data = await response.json();

      if (data.success && data.property) {
        setProperty(data.property);
        // Check if saved
        checkIfSaved(id);
      } else {
        setError(data.error || "Propiedad no encontrada");
      }
    } catch (err) {
      console.error("Error loading property:", err);
      setError("Error al cargar la propiedad");
    } finally {
      setLoading(false);
    }
  };

  // Check if property is saved by user
  const checkIfSaved = async (propertyId: string) => {
    try {
      const response = await fetch("/api/saved-properties");
      const data = await response.json();
      if (data.success && data.savedProperties) {
        const saved = data.savedProperties.some(
          (p: any) => p.property_id === propertyId,
        );
        setIsSaved(saved);
      }
    } catch (error) {
      console.error("Error checking saved status:", error);
    }
  };

  // Toggle save property
  const toggleSaveProperty = async () => {
    if (!property) return;

    // Show login modal if user is not authenticated
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    setIsSaving(true);
    try {
      if (isSaved) {
        // Remove from saved
        const response = await fetch(
          `/api/saved-properties?propertyId=${property.id}`,
          {
            method: "DELETE",
          },
        );
        const data = await response.json();
        if (data.success) {
          setIsSaved(false);
        }
      } else {
        // Save property
        const response = await fetch("/api/saved-properties", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            property: {
              id: property.id,
              sourceProvider: property.sourceProvider,
              externalId: property.mlsNumber,
              title: property.title,
              description: property.description,
              price: property.price,
              address: property.address.street,
              city: property.address.city,
              state: property.address.state,
              zipCode: property.address.zipCode,
              bedrooms: property.details?.bedrooms ?? 0,
              bathrooms: property.details?.bathrooms ?? 0,
              squareFeet: property.details?.squareFeet ?? 0,
              propertyType: property.details?.propertyType ?? "residential",
              features: property.features,
              amenities: property.amenities,
              images: property.images,
              // AI match data
              matchScore: property.matchScore,
              matchReasons: property.matchReasons,
            },
          }),
        });
        const data = await response.json();
        if (data.success) {
          setIsSaved(true);
        }
      }
    } catch (error) {
      console.error("Error toggling save property:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleWhatsAppContact = () => {
    if (!property) return;

    const message =
      `Hola ${BROKER_INFO.name}, me interesa la propiedad:\n\n` +
      `📍 ${property.title}\n` +
      `💰 $${property.price.toLocaleString("en-US")}\n` +
      `📌 ${property.address.city}, ${property.address.state}\n` +
      `🔗 MLS: ${property.mlsNumber}\n\n` +
      `¿Podrías darme más información?`;

    const whatsappUrl = `https://wa.me/${BROKER_INFO.phone.replace(
      /[^0-9]/g,
      "",
    )}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleShare = async () => {
    if (!property) return;

    const shareUrl = window.location.href;
    const shareText = `${property.title} - $${property.price.toLocaleString(
      "en-US",
    )}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: property.title,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const nextImage = () => {
    if (!property) return;
    setCurrentImageIndex((prev) =>
      prev === property.images.length - 1 ? 0 : prev + 1,
    );
  };

  const prevImage = () => {
    if (!property) return;
    setCurrentImageIndex((prev) =>
      prev === 0 ? property.images.length - 1 : prev - 1,
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="pt-20 flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-slate-400 mx-auto" />
            <p className="text-slate-500">Cargando propiedad...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="pt-20 flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-6">
            <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
              <Home className="h-10 w-10 text-slate-400" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-900">
                Propiedad no encontrada
              </h2>
              <p className="text-slate-500">
                {error || "No pudimos encontrar esta propiedad"}
              </p>
            </div>
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isFeatured = property.sourceProvider === "xposure";

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      {/* Back Navigation */}
      <div className="pt-20 bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Volver a resultados</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Images & Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="bg-white rounded-xl overflow-hidden shadow-sm">
              {property.images.length > 0 ? (
                <>
                  {/* Main Image */}
                  <div
                    className="relative aspect-[16/10] cursor-pointer group"
                    onClick={() => setShowGallery(true)}
                  >
                    <img
                      src={property.images[currentImageIndex]}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />

                    {/* Navigation Arrows */}
                    {property.images.length > 1 && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            prevImage();
                          }}
                          className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            nextImage();
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </>
                    )}

                    {/* Image Counter */}
                    <div className="absolute bottom-3 right-3 bg-black/60 text-white text-sm px-3 py-1 rounded-full">
                      {currentImageIndex + 1} / {property.images.length}
                    </div>

                    {/* Featured Badge */}
                    {isFeatured && (
                      <Badge className="absolute top-3 left-3 bg-amber-500 text-white border-0 shadow-lg">
                        <Star className="h-3 w-3 mr-1 fill-current" />
                        Destacado
                      </Badge>
                    )}
                  </div>

                  {/* Thumbnails */}
                  {property.images.length > 1 && (
                    <div className="flex gap-2 p-3 overflow-x-auto">
                      {property.images.slice(0, 6).map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentImageIndex(idx)}
                          className={cn(
                            "shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-all",
                            currentImageIndex === idx
                              ? "border-amber-500"
                              : "border-transparent opacity-70 hover:opacity-100",
                          )}
                        >
                          <img
                            src={img}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                      {property.images.length > 6 && (
                        <button
                          onClick={() => setShowGallery(true)}
                          className="shrink-0 w-20 h-16 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 text-sm font-medium"
                        >
                          +{property.images.length - 6}
                        </button>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="aspect-[16/10] bg-slate-200 flex items-center justify-center">
                  <Home className="h-16 w-16 text-slate-400" />
                </div>
              )}
            </div>

            {/* Property Info */}
            <Card className="shadow-sm">
              <CardContent className="p-6 space-y-6">
                {/* Title & Price */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <h1 className="text-2xl font-bold text-slate-900">
                      {property.title}
                    </h1>
                    <Badge
                      className={cn(
                        "shrink-0",
                        isFeatured
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-700",
                      )}
                    >
                      {property.sourceProvider === "xposure"
                        ? "Puerto Rico"
                        : property.sourceProvider}
                    </Badge>
                  </div>
                  <p className="flex items-center gap-2 text-slate-500">
                    <MapPin className="h-4 w-4" />
                    {property.address.street}, {property.address.city}, ,{" "}
                    {property.address.neighborhood}, {property.address.zipCode}
                    {property.address.state}
                  </p>
                </div>

                {/* Price */}
                <div
                  className={cn(
                    "p-4 rounded-xl",
                    isFeatured ? "bg-amber-50" : "bg-slate-50",
                  )}
                >
                  <p className="text-sm text-slate-500 mb-1">
                    Precio{" "}
                    {property.listingType === "rent"
                      ? "de alquiler"
                      : "de venta"}
                  </p>
                  <p
                    className={cn(
                      "text-3xl font-bold",
                      isFeatured ? "text-amber-600" : "text-slate-900",
                    )}
                  >
                    ${property.price.toLocaleString("en-US")}
                    {property.listingType === "rent" && (
                      <span className="text-lg font-normal text-slate-500">
                        /mes
                      </span>
                    )}
                  </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-slate-50 rounded-xl">
                    <Bed className="h-5 w-5 mx-auto mb-2 text-slate-400" />
                    <p className="text-lg font-semibold text-slate-900">
                      {property.details?.bedrooms ?? 0}
                    </p>
                    <p className="text-xs text-slate-500">Habitaciones</p>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-xl">
                    <Bath className="h-5 w-5 mx-auto mb-2 text-slate-400" />
                    <p className="text-lg font-semibold text-slate-900">
                      {property.details?.bathrooms ?? 0}
                    </p>
                    <p className="text-xs text-slate-500">Baños</p>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-xl">
                    <Maximize className="h-5 w-5 mx-auto mb-2 text-slate-400" />
                    <p className="text-lg font-semibold text-slate-900">
                      {(property.details?.squareFeet ?? 0).toLocaleString(
                        "en-US",
                      )}
                    </p>
                    <p className="text-xs text-slate-500">ft²</p>
                  </div>
                  {property.details?.yearBuilt && (
                    <div className="text-center p-4 bg-slate-50 rounded-xl">
                      <Calendar className="h-5 w-5 mx-auto mb-2 text-slate-400" />
                      <p className="text-lg font-semibold text-slate-900">
                        {property.details.yearBuilt}
                      </p>
                      <p className="text-xs text-slate-500">Año</p>
                    </div>
                  )}
                </div>

                {/* Description */}
                {property.description && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-slate-900">
                      Descripción
                    </h3>
                    <p className="text-slate-600 leading-relaxed">
                      {property.description}
                    </p>
                  </div>
                )}

                {/* MLS Info */}
                <div className="flex items-center gap-4 text-sm text-slate-500 pt-4 border-t">
                  <span>MLS: {property.mlsNumber}</span>
                  <span>•</span>
                  <span>
                    Publicado:{" "}
                    {new Date(property.listDate).toLocaleDateString("es-PR")}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Amenities & Features */}
            {(property.amenities.length > 0 ||
              property.features.length > 0) && (
              <Card className="shadow-sm">
                <CardContent className="p-6 space-y-6">
                  {property.amenities.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-semibold text-slate-900">
                        Amenidades
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {property.amenities.map((amenity, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="text-sm py-1.5 px-3"
                          >
                            <Check className="h-3.5 w-3.5 mr-1.5 text-emerald-500" />
                            {amenity}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {property.features.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-semibold text-slate-900">
                        Características
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {property.features.map((feature, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="text-sm py-1.5 px-3"
                          >
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Match Score Section - Only shown if matchScore is available */}
            {property.matchScore !== undefined && property.matchScore > 0 && (
              <Card className="shadow-sm border-2 border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-teal-50/50">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                        <Target className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          Match Score
                        </h3>
                        <p className="text-xs text-slate-500">
                          Compatibilidad con tu búsqueda
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-3xl font-bold text-emerald-600">
                        {property.matchScore}%
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <Progress value={property.matchScore} className="h-2" />
                    <p className="text-xs text-slate-500 text-right">
                      {property.matchScore >= 90
                        ? "Excelente match"
                        : property.matchScore >= 75
                        ? "Muy buen match"
                        : property.matchScore >= 60
                        ? "Buen match"
                        : "Match regular"}
                    </p>
                  </div>

                  {/* Match Reasons */}
                  {property.matchReasons && property.matchReasons.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <h4 className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4 text-amber-500" />
                        Por qué encaja contigo
                      </h4>
                      <ul className="space-y-2">
                        {property.matchReasons.map((reason, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2 text-sm text-slate-600"
                          >
                            <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Explanation */}
                  <div className="bg-white/60 rounded-lg p-3 text-xs text-slate-500 mt-2">
                    Este puntaje refleja qué tan bien esta propiedad se alinea
                    con las preferencias que describiste en tu búsqueda.
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Contact Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              {/* Contact Card */}
              <Card
                className={cn(
                  "shadow-lg",
                  isFeatured && "ring-2 ring-amber-400",
                )}
              >
                <CardContent className="p-6 space-y-6">
                  <div className="text-center space-y-2">
                    <div className="h-24 w-24 rounded-full mx-auto overflow-hidden relative">
                      <Image
                        src="/kelvin.jpg"
                        alt={BROKER_INFO.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">
                        {BROKER_INFO.name}
                      </p>
                      <p className="text-sm text-slate-600">
                        {BROKER_INFO.company}
                      </p>
                      <p className="text-xs text-slate-400">
                        {BROKER_INFO.license}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Button
                      onClick={handleWhatsAppContact}
                      className={cn(
                        "w-full gap-2 h-12 text-base",
                        isFeatured
                          ? "bg-emerald-600 hover:bg-emerald-700"
                          : "bg-emerald-600 hover:bg-emerald-700",
                      )}
                    >
                      <MessageCircle className="h-5 w-5" />
                      Contactar por WhatsApp
                    </Button>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={handleShare}
                        className="flex-1 gap-2"
                      >
                        {copied ? (
                          <>
                            <Check className="h-4 w-4" />
                            Copiado
                          </>
                        ) : (
                          <>
                            <Share2 className="h-4 w-4" />
                            Compartir
                          </>
                        )}
                      </Button>

                      <Button
                        variant="outline"
                        onClick={toggleSaveProperty}
                        disabled={isSaving}
                        className={cn(
                          "gap-2",
                          isSaved &&
                            "border-red-300 text-red-500 hover:text-red-600 hover:bg-red-50",
                        )}
                      >
                        {isSaving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Heart
                            className={cn("h-4 w-4", isSaved && "fill-current")}
                          />
                        )}
                        {isSaved ? "Guardada" : "Guardar"}
                      </Button>
                    </div>
                  </div>

                  <p className="text-xs text-center text-slate-400">
                    Al contactar, mencionarás esta propiedad automáticamente
                  </p>
                </CardContent>
              </Card>

              {/* Quick Info */}
              <Card className="shadow-sm">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Tipo</span>
                    <span className="font-medium capitalize">
                      {property.details?.propertyType ?? "Residencia"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Estado</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        property.status === "active" &&
                          "border-emerald-500 text-emerald-600",
                        property.status === "pending" &&
                          "border-amber-500 text-amber-600",
                        property.status === "sold" &&
                          "border-slate-500 text-slate-600",
                      )}
                    >
                      {property.status === "active"
                        ? "Disponible"
                        : property.status === "pending"
                        ? "En proceso"
                        : "Vendido"}
                    </Badge>
                  </div>
                  {property.address.neighborhood && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Sector</span>
                      <span className="font-medium">
                        {property.address.neighborhood}
                      </span>
                    </div>
                  )}
                  {property.details?.lotSize && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Terreno</span>
                      <span className="font-medium">
                        {property.details.lotSize.toLocaleString("en-US")} ft²
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Sticky CTA */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg z-50">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-lg">
              ${property.price.toLocaleString("en-US")}
            </p>
            <p className="text-xs text-slate-500 truncate">
              {property.address.city}
            </p>
          </div>
          <button
            onClick={toggleSaveProperty}
            disabled={isSaving}
            className={cn(
              "p-2.5 rounded-full transition-all shrink-0",
              isSaved
                ? "bg-red-100 text-red-500"
                : "bg-slate-100 text-slate-500",
            )}
          >
            {isSaving ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Heart className={cn("h-5 w-5", isSaved && "fill-current")} />
            )}
          </button>
          <Button
            onClick={handleWhatsAppContact}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 shrink-0"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </Button>
        </div>
      </div>

      {/* Fullscreen Gallery Modal */}
      <AnimatePresence>
        {showGallery && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-[100] flex items-center justify-center"
            onClick={() => setShowGallery(false)}
          >
            <button
              onClick={() => setShowGallery(false)}
              className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                prevImage();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            <img
              src={property.images[currentImageIndex]}
              alt=""
              className="max-h-[90vh] max-w-[90vw] object-contain"
              onClick={(e) => e.stopPropagation()}
            />

            <button
              onClick={(e) => {
                e.stopPropagation();
                nextImage();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <ChevronRight className="h-6 w-6" />
            </button>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm">
              {currentImageIndex + 1} / {property.images.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Padding for mobile sticky CTA */}
      <div className="lg:hidden h-20" />

      {/* Login Prompt Modal - shown when unauthenticated user tries to save */}
      <LoginPromptModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        returnTo={`/propiedad/${params.id}`}
        propertyTitle={property?.title}
      />
    </div>
  );
}
