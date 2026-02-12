"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ModuleSection } from "@/components/modules/ModuleWrapper";
import { useModules } from "@/hooks/useModules";
import { usePageConfig } from "@/hooks/usePageConfig";
import DemandPredictionEngine from "@/components/reai/DemandPredictionEngine";
import EquityForecast from "@/components/reai/EquityForecast";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import {
  Sparkles,
  ArrowRight,
  CheckCircle,
  Star,
  Crown,
  MapPin,
  Brain,
  Target,
  TrendingUp,
  LineChart,
  MessageSquare,
  LayoutGrid,
} from "lucide-react";
import { useState, useEffect } from "react";

interface Plan {
  id: string;
  plan_key: string;
  name: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  popular?: boolean;
}

// Plan colors based on plan key
const planColors: Record<string, string> = {
  starter: "border-[#ECF1F6]",
  pro: "border-[#007978]",
  vip: "border-[#FFD566]",
};

// Hero Mockup Component - simulates the chat UI
function HeroMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, delay: 0.3 }}
      className="relative"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 max-w-md">
        {/* Window dots */}
        <div className="flex gap-1.5 mb-4">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
        </div>

        {/* Chat message - User */}
        <div className="flex gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-600">
            TÚ
          </div>
          <div className="flex-1 bg-slate-50 rounded-xl p-3">
            <p className="text-sm text-slate-700">
              Busco un apartamento luminoso, cerca del centro, con espacio para
              home office y que admita mascotas.
            </p>
          </div>
        </div>

        {/* Chat message - AI */}
        <div className="flex gap-3 mb-6">
          <div className="w-8 h-8 rounded-full bg-[#007978] flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 bg-[#F0FAFA] rounded-xl p-3 border border-[#007978]/20">
            <p className="text-sm text-slate-700">
              Encontré{" "}
              <span className="font-semibold text-[#007978]">
                23 propiedades
              </span>{" "}
              que coinciden con tu estilo de vida ideal...
            </p>
          </div>
        </div>

        {/* Results preview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg font-bold text-slate-900">2,500+</span>
            <span className="text-xs text-slate-500">
              Propiedades analizadas
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Property Card 1 */}
            <div className="bg-[#007978] rounded-xl p-3 text-white">
              <img
                src="/casa-00.jpg"
                alt="Apartamento Centro"
                className="h-16 w-full object-cover rounded-lg mb-2"
              />
              <p className="text-xs font-medium">Apartamento Centro</p>
              <p className="text-[10px] opacity-80">92% match</p>
            </div>
            {/* Property Card 2 */}
            <div className="bg-slate-100 rounded-xl p-3">
              <img
                src="/casa-01.jpg"
                alt="Loft Moderno"
                className="h-16 w-full object-cover rounded-lg mb-2"
              />
              <p className="text-xs font-medium text-slate-700">Loft Moderno</p>
              <p className="text-[10px] text-slate-500">89% match</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Feature Mockup Component - simulates the app interface
function FeatureMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      className="relative"
    >
      <div className="bg-[#1a3a3a] rounded-2xl p-6 shadow-2xl border border-[#007978]/30">
        {/* Window dots */}
        <div className="flex gap-1.5 mb-6">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
        </div>

        {/* Search input */}
        <div className="bg-[#0f2828] rounded-xl p-4 mb-4 border border-[#007978]/20">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-[#64C99C]" />
            <span className="text-sm font-medium text-white">
              Buscar por estilo de vida
            </span>
          </div>
          <p className="text-xs text-slate-400 italic">
            "Quiero vivir cerca de la playa con buena luz..."
          </p>
        </div>

        {/* Property Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#007978] rounded-xl overflow-hidden">
            <img
              src="/casa-02.jpg"
              alt="Condado, PR"
              className="h-36 w-full object-cover object-center"
            />
            <div className="p-3">
              <p className="text-xs font-medium text-white">Condado, PR</p>
              <p className="text-[10px] text-white/70">$1,950/mes</p>
              <Badge className="mt-2 bg-white/20 text-white text-[10px] px-2 py-0">
                92%
              </Badge>
            </div>
          </div>
          <div className="bg-[#007978] rounded-xl overflow-hidden">
            <img
              src="/casa-03.jpg"
              alt="Isla Verde, PR"
              className="h-36 w-full object-cover object-center"
            />
            <div className="p-3">
              <p className="text-xs font-medium text-white">Isla Verde, PR</p>
              <p className="text-[10px] text-white/70">$1,650/mes</p>
              <Badge className="mt-2 bg-white/20 text-white text-[10px] px-2 py-0">
                85%
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function LandingPage() {
  const { isEnabled } = useModules();
  const { isPageEnabled } = usePageConfig();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  const hasActiveModules =
    isEnabled("demand-prediction") || isEnabled("equity-forecast");

  // Check if pages are enabled
  const isPreciosEnabled = isPageEnabled("page-precios");
  const isBuscarEnabled = isPageEnabled("page-buscar");

  // Fetch plans from API
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await fetch("/api/plans");
        const data = await res.json();
        if (data.success) {
          const plansWithPopular = data.plans.map((plan: Plan) => ({
            ...plan,
            popular: plan.plan_key === "pro",
          }));
          setPlans(plansWithPopular);
        }
      } catch (error) {
        console.error("Error fetching plans:", error);
      } finally {
        setLoadingPlans(false);
      }
    };
    fetchPlans();
  }, []);

  const stats = [
    {
      value: "2,500+",
      label: "Propiedades analizadas",
      sublabel: "PUERTO RICO",
    },
    {
      value: "98%",
      label: "Clientes satisfechos",
      sublabel: "RATING PROMEDIO",
    },
    {
      value: "<2min",
      label: "Para encontrar matches",
      sublabel: "TIEMPO PROMEDIO",
    },
    { value: "24/7", label: "Siempre disponible", sublabel: "SIN ESPERAS" },
  ];

  const steps = [
    {
      icon: MessageSquare,
      number: "01",
      title: "Describe tu vida ideal",
      description:
        "Cuéntanos cómo imaginas tu día a día perfecto. Sin formularios aburridos, solo conversa con nuestra IA.",
    },
    {
      icon: Brain,
      number: "02",
      title: "Análisis inteligente",
      description:
        "Procesamos tu perfil contra miles de propiedades usando análisis semántico avanzado en segundos.",
    },
    {
      icon: Target,
      number: "03",
      title: "Matches personalizados",
      description:
        "Recibe propiedades que realmente encajan contigo, ordenadas por compatibilidad con tu estilo de vida.",
    },
  ];

  const testimonials = [
    {
      name: "María González",
      role: "Compradora",
      location: "San Juan, PR",
      text: "Encontré mi apartamento ideal en Condado en solo 2 semanas. El matching por estilo de vida cambió todo.",
      avatar: "M",
    },
    {
      name: "Carlos Rodríguez",
      role: "Inversionista",
      location: "Dorado, PR",
      text: "Las predicciones de plusvalía me dieron la confianza para invertir. Ya tengo 3 propiedades.",
      avatar: "C",
    },
    {
      name: "Ana Martínez",
      role: "Nómada Digital",
      location: "Rincón, PR",
      text: "Describí que quería surf y trabajo remoto. Me encontraron exactamente eso cerca de la playa.",
      avatar: "A",
    },
  ];

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 },
  };

  const staggerContainer = {
    initial: {},
    whileInView: { transition: { staggerChildren: 0.1 } },
    viewport: { once: true },
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <Header showCTA />

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section - Background Image */}
        <section
          className="relative min-h-[75vh] flex items-center py-4 md:py-6 overflow-hidden"
          style={{
            backgroundImage: "url('/background-hero.jpeg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          {/* Overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/20" />
          <div className="relative max-w-7xl mx-auto px-6 w-full">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Left Column - Content */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="space-y-6 flex flex-col justify-center"
              >
                {/* Badge */}
                <Badge className="bg-white/15 text-white border-white/30 gap-2 px-4 py-1.5 backdrop-blur-sm">
                  <Sparkles className="h-3.5 w-3.5" />
                  Impulsado por Inteligencia Artificial
                </Badge>

                {/* Main Headline */}
                <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.1] drop-shadow-lg">
                  Encuentra tu
                  <br />
                  hogar{" "}
                  <span className="relative">
                    <span className="text-[#4FD1C5] italic">perfecto</span>
                    <svg
                      className="absolute -bottom-2 left-0 w-full"
                      viewBox="0 0 200 12"
                      fill="none"
                    >
                      <path
                        d="M2 8C50 2 150 2 198 8"
                        stroke="#4FD1C5"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                </h1>

                {/* Subheadline */}
                <p className="text-lg md:text-xl text-white/80 max-w-lg leading-relaxed drop-shadow">
                  Describe cómo quieres vivir y recibe propiedades que realmente
                  se adaptan a tu estilo de vida. Sin filtros complicados.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  {isBuscarEnabled && (
                    <Link href="/buscar">
                      <Button
                        size="lg"
                        className="bg-[#007978] hover:bg-[#006666] text-white rounded-full px-8 h-12 text-base gap-2"
                      >
                        Comenzar Ahora
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-full px-8 h-12 text-base border-white/40 text-white hover:bg-white/10 backdrop-blur-sm"
                  >
                    Ver cómo funciona
                  </Button>
                </div>

                {/* Trust indicator */}
                <p className="text-sm text-white/60">
                  Sin tarjeta de crédito · Resultados en 2 minutos
                </p>
              </motion.div>

              {/* Right Column - Mockup */}
              <div className="hidden lg:flex lg:justify-end lg:items-center">
                <HeroMockup />
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 bg-[#F8FAFC] border-y border-slate-100">
          <div className="max-w-6xl mx-auto px-6">
            <motion.div
              {...fadeInUp}
              className="grid grid-cols-2 md:grid-cols-4 gap-8"
            >
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-[#007978]">
                    {stat.value}
                  </div>
                  <div className="text-sm text-[#0D172A] font-medium mt-1">
                    {stat.label}
                  </div>
                  <div className="text-xs text-[#94A3B8] uppercase tracking-wide mt-0.5">
                    {stat.sublabel}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* How it Works - 3 Steps */}
        <section className="py-20 md:py-28 bg-white">
          <div className="max-w-6xl mx-auto px-6">
            <motion.div {...fadeInUp} className="text-center mb-16">
              <Badge
                variant="outline"
                className="mb-4 text-[#64748B] border-slate-200 uppercase text-xs tracking-wider"
              >
                Cómo Funciona
              </Badge>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-[#0D172A] mb-4">
                Tan simple como 1, 2, 3
              </h2>
              <p className="text-lg text-[#64748B] max-w-xl mx-auto">
                Olvídate de filtros complicados. Solo describe tu vida ideal.
              </p>
            </motion.div>

            <motion.div
              {...staggerContainer}
              className="grid md:grid-cols-3 gap-8"
            >
              {steps.map((step, index) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15 }}
                  className="relative"
                >
                  <Card className="relative bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow h-full">
                    <CardContent className="p-6 pt-8">
                      {/* Large number background */}
                      <div className="absolute top-4 right-4 text-6xl font-bold text-slate-100">
                        {step.number}
                      </div>

                      {/* Icon */}
                      <div className="relative z-10 inline-flex items-center justify-center h-14 w-14 rounded-xl bg-[#E6F7F7] mb-4">
                        <step.icon className="h-7 w-7 text-[#007978]" />
                      </div>

                      <h3 className="text-xl font-semibold text-[#0D172A] mb-2 relative z-10">
                        {step.title}
                      </h3>
                      <p className="text-[#64748B] relative z-10">
                        {step.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* AI Features Section - Dark Teal Background */}
        <section className="py-20 md:py-28 bg-[#0F4C4C] text-white overflow-hidden">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Left - Mockup */}
              <FeatureMockup />

              {/* Right - Content */}
              <motion.div {...fadeInUp} className="space-y-6">
                <Badge className="bg-[#007978]/30 text-[#64C99C] border-[#007978]/50 uppercase text-xs tracking-wider">
                  Tecnología Inteligente
                </Badge>
                <h2 className="font-serif text-3xl md:text-4xl font-bold leading-tight">
                  No buscas propiedades.
                  <br />
                  <span className="text-[#64C99C]">Describes tu vida.</span>
                </h2>
                <p className="text-lg text-slate-300 leading-relaxed">
                  Entendemos tus palabras y las traducimos en características
                  concretas: ubicación, amenidades, estilo, presupuesto. Todo
                  automáticamente.
                </p>
                <ul className="space-y-4 pt-2">
                  {[
                    "Análisis semántico de tus preferencias",
                    "Matching con scoring de compatibilidad",
                    "Predicciones de valorización",
                    "Alertas inteligentes personalizadas",
                  ].map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-[#64C99C] shrink-0" />
                      <span className="text-slate-200">{feature}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Pricing Preview - Only show if precios page is enabled */}
        {isPreciosEnabled && plans.length > 0 && !loadingPlans && (
          <section className="py-20 md:py-28 bg-[#F8FAFC]">
            <div className="max-w-6xl mx-auto px-6">
              <motion.div {...fadeInUp} className="text-center mb-16">
                <h2 className="font-serif text-3xl md:text-4xl font-bold text-[#0D172A] mb-4">
                  Invierte en encontrar tu lugar
                </h2>
                <p className="text-lg text-[#64748B]">
                  Planes flexibles que se adaptan a tu búsqueda.
                </p>
              </motion.div>

              <motion.div
                {...staggerContainer}
                className={`grid gap-6 max-w-4xl mx-auto ${
                  plans.length === 1
                    ? "md:grid-cols-1 max-w-md"
                    : plans.length === 2
                      ? "md:grid-cols-2 max-w-2xl"
                      : "md:grid-cols-3"
                }`}
              >
                {plans.map((plan, index) => {
                  const color = planColors[plan.plan_key] || "border-[#ECF1F6]";
                  return (
                    <motion.div
                      key={plan.id}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card
                        className={`relative h-full border-2 bg-white ${color} ${
                          plan.popular ? "shadow-lg" : ""
                        }`}
                      >
                        {plan.popular && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                            <Badge className="bg-[#FFD566] text-[#0D172A] font-medium">
                              Más popular
                            </Badge>
                          </div>
                        )}
                        <CardContent className="p-6 space-y-6">
                          <div>
                            <h3 className="text-xl font-semibold text-[#0D172A]">
                              {plan.name}
                            </h3>
                            <p className="text-sm text-[#64748B]">
                              {plan.description}
                            </p>
                          </div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-bold text-[#0D172A]">
                              ${plan.price_monthly}
                            </span>
                            <span className="text-[#64748B]">/mes</span>
                          </div>
                          <ul className="space-y-3">
                            {plan.features.map((feature) => (
                              <li
                                key={feature}
                                className="flex items-center gap-2 text-sm text-[#0D172A]/80"
                              >
                                <CheckCircle className="h-4 w-4 text-[#007978] shrink-0" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                          <Link href="/precios" className="block">
                            <Button
                              variant={plan.popular ? "default" : "outline"}
                              className={`w-full ${
                                plan.popular
                                  ? "bg-[#007978] hover:bg-[#006666] text-white"
                                  : "border-slate-200 text-[#0D172A] hover:bg-slate-50"
                              }`}
                            >
                              Elegir plan
                            </Button>
                          </Link>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>
          </section>
        )}

        {/* Testimonials */}
        <section className="py-20 md:py-28 bg-white">
          <div className="max-w-6xl mx-auto px-6">
            <motion.div {...fadeInUp} className="text-center mb-16">
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-[#0D172A] mb-4">
                Lo que dicen nuestros usuarios
              </h2>
            </motion.div>

            <motion.div
              {...staggerContainer}
              className="grid md:grid-cols-3 gap-6"
            >
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={testimonial.name}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full bg-white border border-slate-100 shadow-sm">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className="h-4 w-4 fill-[#FFD566] text-[#FFD566]"
                          />
                        ))}
                      </div>
                      <p className="text-[#0D172A]/80 leading-relaxed">
                        "{testimonial.text}"
                      </p>
                      <div className="flex items-center gap-3 pt-2">
                        <div className="h-10 w-10 rounded-full bg-[#0D172A] flex items-center justify-center text-white font-medium">
                          {testimonial.avatar}
                        </div>
                        <div>
                          <p className="font-medium text-[#0D172A]">
                            {testimonial.name}
                          </p>
                          <p className="text-xs text-[#64748B] flex items-center gap-1">
                            {testimonial.role} · <MapPin className="h-3 w-3" />{" "}
                            {testimonial.location}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Smarlin Modules Section - Shown only if modules are enabled */}
        {hasActiveModules && (
          <section className="py-20 md:py-28 bg-[#F8FAFC]">
            <div className="max-w-6xl mx-auto px-6">
              <motion.div {...fadeInUp} className="text-center mb-16">
                <Badge
                  variant="outline"
                  className="gap-2 mb-4 px-4 py-1.5 border-[#007978]/30 bg-[#E6F7F7] text-[#007978]"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Herramientas Pro
                </Badge>
                <h2 className="font-serif text-3xl md:text-4xl font-bold text-[#0D172A] mb-4">
                  Análisis profesional de mercado
                </h2>
                <p className="text-lg text-[#64748B] max-w-xl mx-auto">
                  Accede a insights exclusivos para tomar mejores decisiones
                </p>
              </motion.div>

              <div className="space-y-8">
                <ModuleSection moduleKey="demand-prediction" showHeader={false}>
                  <motion.div {...fadeInUp}>
                    <Card className="border-2 border-[#007978]/20 bg-white">
                      <CardContent className="p-8">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="h-12 w-12 rounded-xl bg-[#E6F7F7] flex items-center justify-center">
                            <TrendingUp className="h-6 w-6 text-[#007978]" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-[#0D172A]">
                              Predicción de Demanda
                            </h3>
                            <p className="text-sm text-[#64748B]">
                              Identifica zonas calientes
                            </p>
                          </div>
                        </div>
                        <DemandPredictionEngine />
                      </CardContent>
                    </Card>
                  </motion.div>
                </ModuleSection>

                <ModuleSection moduleKey="equity-forecast" showHeader={false}>
                  <motion.div {...fadeInUp}>
                    <Card className="border-2 border-[#007978]/20 bg-white">
                      <CardContent className="p-8">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="h-12 w-12 rounded-xl bg-[#E6F7F7] flex items-center justify-center">
                            <LineChart className="h-6 w-6 text-[#007978]" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-[#0D172A]">
                              Proyección de Plusvalía
                            </h3>
                            <p className="text-sm text-[#64748B]">
                              Valor futuro de tu inversión
                            </p>
                          </div>
                        </div>
                        <EquityForecast />
                      </CardContent>
                    </Card>
                  </motion.div>
                </ModuleSection>
              </div>
            </div>
          </section>
        )}

        {/* Final CTA Section */}
        {isBuscarEnabled && (
          <section className="py-20 md:py-28 bg-[#F8FAFC]">
            <div className="max-w-3xl mx-auto px-6 text-center">
              <motion.div {...fadeInUp} className="space-y-6">
                <h2 className="font-serif text-3xl md:text-4xl font-bold text-[#0D172A]">
                  ¿Listo para encontrar
                  <br />
                  tu hogar ideal?
                </h2>
                <p className="text-lg text-[#64748B] max-w-xl mx-auto">
                  Únete a miles de personas que ya encontraron su lugar perfecto
                  usando Smarlin. Comienza gratis hoy.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
                  <Link href="/buscar">
                    <Button
                      size="lg"
                      className="bg-[#007978] hover:bg-[#006666] text-white rounded-full px-8 h-12 text-base gap-2"
                    >
                      Comenzar Gratis
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-full px-8 h-12 text-base border-slate-300 text-slate-700 hover:bg-white"
                  >
                    Hablar con Ventas
                  </Button>
                </div>
                <p className="text-sm text-[#94A3B8]">
                  Sin tarjeta de crédito · Configuración en 2 minutos
                </p>
              </motion.div>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
