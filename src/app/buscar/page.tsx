"use client";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { PageGuard } from "@/components/PageGuard";
import BuscarContent from "@/components/search/BuscarContent";

export default function BuscarPage() {
  return (
    <PageGuard
      pageKey="page-buscar"
      disabledTitle="Búsqueda no disponible"
      disabledMessage="La búsqueda de propiedades no está disponible en este momento. Contacta al administrador para más información."
    >
      {/* Header */}
      <Header activeItem="/buscar" variant="dashboard" />

      {/* Search Content (shared with embed) */}
      <BuscarContent />

      {/* Footer */}
      <Footer />
    </PageGuard>
  );
}
