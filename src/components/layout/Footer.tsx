"use client";

import Link from "next/link";
import { Home } from "lucide-react";
import { usePageConfig } from "@/hooks/usePageConfig";

export default function Footer() {
  const { isPageEnabled } = usePageConfig();

  const isBuscarEnabled = isPageEnabled("page-buscar");
  const isPreciosEnabled = isPageEnabled("page-precios");

  return (
    <footer className="bg-[#1A1A1A]">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center">
                <Home className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold text-white">Smarlin</span>
            </Link>
            <p className="text-sm text-neutral-400">
              La forma más inteligente de encontrar tu próximo hogar.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-white mb-4">Producto</h4>
            <ul className="space-y-2 text-sm text-neutral-400">
              {isBuscarEnabled && (
                <li>
                  <Link href="/buscar" className="hover:text-white transition-colors">
                    Buscar Casa
                  </Link>
                </li>
              )}
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  API
                </Link>
              </li>
              {isPreciosEnabled && (
                <li>
                  <Link href="/precios" className="hover:text-white transition-colors">
                    Precios
                  </Link>
                </li>
              )}
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-white mb-4">Empresa</h4>
            <ul className="space-y-2 text-sm text-neutral-400">
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Sobre Nosotros
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Contacto
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-white mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-neutral-400">
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Términos
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Privacidad
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Cookies
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-neutral-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-neutral-500">
            © {new Date().getFullYear()} Smarlin. Todos los derechos
            reservados.
          </p>
          <p className="text-sm text-neutral-500">
            Hecho con amor en Puerto Rico
          </p>
        </div>
      </div>
    </footer>
  );
}
