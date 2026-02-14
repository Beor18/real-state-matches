// Sponsors Configuration
// Define sponsors that appear during the property search loading screen

export interface SponsorConfig {
  id: string
  name: string
  description: string
  logoUrl: string // Path to image in /public/sponsors/ or external URL
  url?: string // Link when clicking (opens in new tab)
}

export const SPONSORS: SponsorConfig[] = [
  {
    id: 'cta-sponsor',
    name: 'Tu marca aquí',
    description: 'Llega a miles de personas buscando su próximo hogar. Contáctanos.',
    logoUrl: '/sponsors/placeholder-cta.svg',
    url: 'mailto:sponsors@tudominio.com',
  },
]
