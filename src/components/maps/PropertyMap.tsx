'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet default marker icon issue in Next.js/Webpack
// The default icon paths get broken by bundlers
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

L.Marker.prototype.options.icon = defaultIcon

interface PropertyMapProps {
  latitude: number
  longitude: number
  title: string
  address?: string
  price?: number
  zoom?: number
  height?: string
}

export default function PropertyMap({
  latitude,
  longitude,
  title,
  address,
  price,
  zoom = 15,
  height = '300px',
}: PropertyMapProps) {
  return (
    <div style={{ height, width: '100%' }}>
      <MapContainer
        center={[latitude, longitude]}
        zoom={zoom}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[latitude, longitude]}>
          <Popup>
            <div className="text-sm">
              <p className="font-semibold">{title}</p>
              {address && <p className="text-gray-600">{address}</p>}
              {price && (
                <p className="text-emerald-600 font-medium mt-1">
                  ${price.toLocaleString('en-US')}
                </p>
              )}
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  )
}
