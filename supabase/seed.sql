-- Seed data for REAI MVP
-- Run this after the initial migration to populate with sample data

-- Insert sample properties
INSERT INTO public.properties (
    mls_id, idx_source, title, description, address, city, state, zip_code, country,
    property_type, listing_type, price, bedrooms, bathrooms, square_feet, lot_size, year_built,
    amenities, features, images, latitude, longitude, neighborhood,
    agent_name, agent_email, agent_phone, agent_company, status, featured
) VALUES
(
    'MLS-2025-001', 'manual', 'Villa Costera Moderna en Dorado',
    'Hermosa villa moderna con vista al mar en la exclusiva zona de Dorado. Cocina gourmet, pisos de mármol, y amplia terraza con piscina infinity. Perfecta para quienes buscan lujo y tranquilidad cerca de la playa.',
    '123 Calle del Sol', 'Dorado', 'PR', '00646', 'PR',
    'house', 'sale', 485000, 3, 2.5, 2400, 5000, 2018,
    '["Vista al Mar", "Piscina Infinity", "Terraza", "Parqueo 3 autos", "Seguridad 24/7"]',
    '["Cocina Gourmet", "Pisos de Mármol", "Sistema de Sonido", "Generador"]',
    '["https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800", "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800"]',
    18.4589, -66.2679, 'Dorado Beach',
    'María González', 'maria@realestate-pr.com', '787-555-0101', 'Elite Properties PR',
    'active', true
),
(
    'MLS-2025-002', 'manual', 'Penthouse Urbano en Condado',
    'Espectacular penthouse en el corazón de Condado con vistas panorámicas al océano Atlántico. Acabados de lujo, gimnasio privado en el edificio, y acceso directo a la playa. Ideal para profesionales o inversión en Airbnb.',
    '456 Avenida Ashford', 'San Juan', 'PR', '00907', 'PR',
    'condo', 'sale', 625000, 2, 2, 1800, NULL, 2020,
    '["Vista al Mar", "Gimnasio", "Piscina", "Seguridad 24/7", "Lobby con Conserje"]',
    '["Acabados de Lujo", "Balcón Amplio", "Cocina Moderna", "AC Central"]',
    '["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800", "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800"]',
    18.4519, -66.0749, 'Condado',
    'Carlos Rivera', 'carlos@luxurypr.com', '787-555-0202', 'Luxury Condado Realty',
    'active', true
),
(
    'MLS-2025-003', 'manual', 'Residencial Familiar en Guaynabo',
    'Residencia familiar en urbanización privada con excelentes escuelas cercanas. Amplio jardín, terraza techada, y vecindario tranquilo. Perfecta para familias que buscan espacio y seguridad.',
    '789 Calle Principal', 'Guaynabo', 'PR', '00969', 'PR',
    'house', 'sale', 375000, 4, 3, 2800, 8000, 2015,
    '["Jardín Amplio", "Parqueo", "Cerca de Escuelas", "Zona Segura", "Control de Acceso"]',
    '["Terraza Techada", "Cuarto de Lavado", "Closets Walk-in", "Marquesina 2 autos"]',
    '["https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800", "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800"]',
    18.3589, -66.1107, 'Garden Hills',
    'Ana Martínez', 'ana@familyhomes-pr.com', '787-555-0303', 'Family Homes PR',
    'active', false
),
(
    'MLS-2025-004', 'manual', 'Apartamento de Inversión en Río Piedras',
    'Apartamento moderno cerca de la UPR, ideal para inversión con alto potencial de renta. Zona en gentrificación con proyectos de renovación urbana próximos. Excelente oportunidad de valorización.',
    '321 Calle Universidad', 'San Juan', 'PR', '00925', 'PR',
    'apartment', 'sale', 195000, 2, 1, 950, NULL, 2010,
    '["Cerca de UPR", "Transporte Público", "Área Comercial", "Parqueo Visitantes"]',
    '["Remodelado", "Cocina Moderna", "Balcón", "Internet incluido"]',
    '["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800"]',
    18.4030, -66.0509, 'Río Piedras',
    'José López', 'jose@investpr.com', '787-555-0404', 'Investment Properties PR',
    'active', false
),
(
    'MLS-2025-005', 'manual', 'Casa de Playa de Lujo en Rincón',
    'Casa de playa de ensueño en Rincón, la capital del surf de Puerto Rico. Diseño tropical moderno con materiales sostenibles, paneles solares, y acceso privado a la playa. Perfecta para retiro o Airbnb de lujo.',
    '555 Ocean Drive', 'Rincón', 'PR', '00677', 'PR',
    'house', 'sale', 850000, 4, 4, 3500, 12000, 2022,
    '["Frente a la Playa", "Piscina", "Terraza Sunset", "Parqueo 4 autos", "Generador Tesla"]',
    '["Paneles Solares", "Diseño Sostenible", "Acceso Playa Privado", "Cocina Exterior", "Jacuzzi"]',
    '["https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800", "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800"]',
    18.3405, -67.2500, 'Rincón Beach',
    'Sofía Rodríguez', 'sofia@beachproperties-pr.com', '787-555-0505', 'Beach Properties PR',
    'active', true
);

-- Insert sample property predictions
INSERT INTO public.property_predictions (
    property_id, demand_score, demand_trend, demand_reason,
    migration_trend, fanbase_sentiment, current_value,
    predicted_value_1y, predicted_value_3y, predicted_value_5y, predicted_value_10y,
    confidence_level, remodel_tips, zoning_info, development_opportunities,
    is_hot_zone, is_undervalued
)
SELECT 
    p.id,
    CASE 
        WHEN p.city = 'Dorado' THEN 92
        WHEN p.city = 'San Juan' AND p.address LIKE '%Ashford%' THEN 88
        ELSE 75
    END,
    'increasing',
    'Alta demanda en la zona por migración de profesionales y desarrollo turístico',
    'influx',
    0.85,
    p.price,
    p.price * 1.12,
    p.price * 1.28,
    p.price * 1.45,
    p.price * 1.85,
    85,
    '[{"improvement": "Renovación de cocina", "cost": 25000, "addedValue": 45000, "roi": 80}, {"improvement": "Paisajismo", "cost": 8000, "addedValue": 15000, "roi": 88}]',
    'Residencial, permite Airbnb con licencia',
    'Potencial para ADU, expansión de terraza',
    CASE WHEN p.city IN ('Dorado', 'San Juan') THEN true ELSE false END,
    CASE WHEN p.price < 400000 THEN true ELSE false END
FROM public.properties p
WHERE p.mls_id IN ('MLS-2025-001', 'MLS-2025-002', 'MLS-2025-003', 'MLS-2025-004', 'MLS-2025-005');


