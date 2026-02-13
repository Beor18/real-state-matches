/**
 * Embed Layout
 *
 * Minimal layout for embeddable pages (e.g. iframe in WordPress).
 * - No header / footer
 * - Inherits root layout's <html>/<body>, fonts, providers (AuthProvider, PageConfigProvider)
 * - Adds an `sreis-embed` class so embedded pages can apply specific overrides if needed
 */

export const metadata = {
  title: "Smarlin - Búsqueda Embebida",
  robots: "noindex, nofollow", // Embed pages should not be indexed
};

export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="sreis-embed" style={{ minHeight: "100dvh" }}>
      {children}
    </div>
  );
}
