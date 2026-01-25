-- =============================================
-- PAGE VISIBILITY CONTROL
-- =============================================
-- Migration to add page visibility controls to feature_flags
-- Allows admin to enable/disable public pages like Precios, Buscar, etc.

-- =============================================
-- INSERT PAGE FLAGS
-- =============================================
-- Pages use category 'pages' and module_key starts with 'page-'

INSERT INTO public.feature_flags (module_key, name, description, category, enabled, sort_order, config)
VALUES
    (
        'page-precios', 
        'Página de Precios', 
        'Muestra la página de planes y precios en la navegación pública. Si se deshabilita, los usuarios no verán el link ni podrán acceder a /precios.', 
        'pages', 
        TRUE, 
        100,
        '{"route": "/precios", "icon": "CreditCard", "showInNav": true}'::jsonb
    ),
    (
        'page-buscar', 
        'Página de Búsqueda', 
        'Muestra la página de búsqueda de propiedades en la navegación. Si se deshabilita, los usuarios no podrán buscar propiedades.', 
        'pages', 
        TRUE, 
        101,
        '{"route": "/buscar", "icon": "Search", "showInNav": true}'::jsonb
    ),
    (
        'page-dashboard',
        'Dashboard de Usuario',
        'Permite a los usuarios acceder a su dashboard personal. Si se deshabilita, los usuarios no podrán ver su cuenta.',
        'pages',
        TRUE,
        102,
        '{"route": "/dashboard", "icon": "LayoutDashboard", "showInNav": false, "requiresAuth": true}'::jsonb
    )
ON CONFLICT (module_key) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    config = EXCLUDED.config;

-- =============================================
-- COMMENT ON PURPOSE
-- =============================================
COMMENT ON TABLE public.feature_flags IS 'Stores feature flags for modules and pages. Category "pages" controls public page visibility.';

