import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/components/auth/AuthProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HogarAI - Encuentra tu hogar ideal en Puerto Rico",
  description: "Describe tu estilo de vida ideal y nuestra IA encontrará las propiedades perfectas para ti en Puerto Rico.",
  keywords: ["bienes raíces", "real estate", "Puerto Rico", "IA", "AI", "propiedades", "hogar", "apartamentos"],
  authors: [{ name: "HogarAI" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "HogarAI - Encuentra tu hogar ideal",
    description: "Búsqueda inteligente de propiedades basada en tu estilo de vida",
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    siteName: "HogarAI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "HogarAI - Encuentra tu hogar ideal",
    description: "Búsqueda inteligente de propiedades basada en tu estilo de vida",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased bg-background text-foreground`}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
