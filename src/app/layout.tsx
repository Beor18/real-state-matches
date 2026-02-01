import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { PageConfigProvider } from "@/components/providers/PageConfigProvider";
import { getPageConfigFromServer } from "@/lib/page-config-server";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SREIS - Smart Real Estate Intelligence System",
  description: "Describe tu estilo de vida ideal y nuestra IA encontrará las propiedades perfectas para ti en Puerto Rico.",
  keywords: ["bienes raíces", "real estate", "Puerto Rico", "IA", "AI", "propiedades", "hogar", "apartamentos", "SREIS"],
  authors: [{ name: "SREIS" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "SREIS - Smart Real Estate Intelligence System",
    description: "Búsqueda inteligente de propiedades basada en tu estilo de vida",
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    siteName: "SREIS",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SREIS - Smart Real Estate Intelligence System",
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
      <body className={`${inter.variable} font-sans antialiased bg-background text-foreground`}>
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
