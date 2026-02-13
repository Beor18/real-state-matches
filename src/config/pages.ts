// Page Configuration for Controllable Public Pages
// Defines all pages that can be enabled/disabled by admin

import {
  LucideIcon,
  CreditCard,
  Search,
  LayoutDashboard,
  Home,
  FileText,
  HelpCircle,
} from "lucide-react";

export interface PageConfig {
  key: string; // Must match feature_flags module_key (e.g., 'page-precios')
  name: string; // Display name in admin
  description: string; // Description for admin
  route: string; // URL path (e.g., '/precios')
  icon: LucideIcon; // Lucide icon component
  navLabel: string; // Label shown in navigation
  showInNav: boolean; // Whether to show in main navigation
  requiresAuth: boolean; // Whether page requires authentication
  alwaysEnabled?: boolean; // If true, cannot be disabled (e.g., home)
}

// All controllable pages
export const PAGES: Record<string, PageConfig> = {
  "page-home": {
    key: "page-home",
    name: "Página de Inicio",
    description: "Página principal de la aplicación",
    route: "/",
    icon: Home,
    navLabel: "Inicio",
    showInNav: true,
    requiresAuth: false,
    alwaysEnabled: true, // Home page cannot be disabled
  },
  "page-buscar": {
    key: "page-buscar",
    name: "Página de Búsqueda",
    description: "Permite a los usuarios buscar propiedades",
    route: "/buscar",
    icon: Search,
    navLabel: "Buscar Propiedades",
    showInNav: true,
    requiresAuth: false,
  },
  "page-precios": {
    key: "page-precios",
    name: "Página de Precios",
    description: "Muestra los planes de suscripción y precios",
    route: "/precios",
    icon: CreditCard,
    navLabel: "Precios",
    showInNav: true,
    requiresAuth: false,
  },
  "page-dashboard": {
    key: "page-dashboard",
    name: "Dashboard de Usuario",
    description: "Panel personal del usuario con propiedades guardadas",
    route: "/dashboard",
    icon: LayoutDashboard,
    navLabel: "Mi Cuenta",
    showInNav: false, // Shown in auth section, not main nav
    requiresAuth: true,
  },
};

// Get all pages that should appear in main navigation
export const getNavPages = (): PageConfig[] => {
  return Object.values(PAGES).filter((p) => p.showInNav);
};

// Get all controllable pages (excludes alwaysEnabled)
export const getControllablePages = (): PageConfig[] => {
  return Object.values(PAGES).filter((p) => !p.alwaysEnabled);
};

// Get page config by route
export const getPageByRoute = (route: string): PageConfig | undefined => {
  return Object.values(PAGES).find((p) => p.route === route);
};

// Get page config by key
export const getPageByKey = (key: string): PageConfig | undefined => {
  return PAGES[key];
};

// Map route to page key
export const routeToPageKey = (route: string): string | undefined => {
  const page = getPageByRoute(route);
  return page?.key;
};
