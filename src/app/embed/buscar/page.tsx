"use client";

import BuscarContent from "@/components/search/BuscarContent";

/**
 * Embeddable search page — renders without Header/Footer/PageGuard.
 *
 * Designed to be loaded inside an <iframe> from a WordPress site.
 * The `appBaseUrl` is derived at runtime so that "Ver Detalles" and login
 * links open in a new tab pointing to the main app.
 */
export default function EmbedBuscarPage() {
  // Derive the base URL from the current origin so links work correctly
  const appBaseUrl =
    typeof window !== "undefined" ? window.location.origin : "";

  return (
    <BuscarContent
      embedMode={true}
      appBaseUrl={appBaseUrl}
    />
  );
}
