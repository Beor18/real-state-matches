"use client";

import PropertyDetailContent from "@/components/property/PropertyDetailContent";

/**
 * Embeddable property detail page — renders without Header/Footer.
 *
 * Designed to be loaded inside an <iframe> from a WordPress site,
 * navigated to from /embed/buscar within the same iframe.
 */
export default function EmbedPropertyDetailPage() {
  const appBaseUrl =
    typeof window !== "undefined" ? window.location.origin : "";

  return (
    <PropertyDetailContent
      embedMode={true}
      appBaseUrl={appBaseUrl}
    />
  );
}
