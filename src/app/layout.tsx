import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { PageConfigProvider } from "@/components/providers/PageConfigProvider";
import { getPageConfigFromServer } from "@/lib/page-config-server";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Smarlin - Tu Hogar Inteligente en Puerto Rico",
  description: "Describe tu estilo de vida ideal y nuestra IA encontrará las propiedades perfectas para ti en Puerto Rico.",
  keywords: ["bienes raíces", "real estate", "Puerto Rico", "IA", "AI", "propiedades", "hogar", "apartamentos", "Smarlin"],
  authors: [{ name: "Smarlin" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "Smarlin - Tu Hogar Inteligente en Puerto Rico",
    description: "Búsqueda inteligente de propiedades basada en tu estilo de vida",
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    siteName: "Smarlin",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Smarlin - Tu Hogar Inteligente en Puerto Rico",
    description: "Búsqueda inteligente de propiedades basada en tu estilo de vida",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch page config on the server - no flash on client
  const pageConfig = await getPageConfigFromServer();

  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased bg-background text-foreground`}>
        <PageConfigProvider initialConfig={pageConfig}>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </PageConfigProvider>
      </body>
    </html>
  );
}
