'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default Leaflet marker icons in Next.js
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface LocationPickerProps {
  position: { lat: number; lng: number } | null;
  setPosition: (pos: { lat: number; lng: number }) => void;
}

// Component to handle map clicks
function MapEvents({ setPosition }: { setPosition: (pos: { lat: number; lng: number }) => void }) {
  useMapEvents({
    click(e) {
      setPosition({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export default function LocationPicker({ position, setPosition }: LocationPickerProps) {
  // Default center point (Metro Manila)
  const defaultCenter = { lat: 14.5995, lng: 120.9842 };

  // Ensure leaflet CSS is loaded properly
  useEffect(() => {
    // This forces the map to resize correctly when placed inside a modal
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 200);
  }, []);

  return (
    <div className="h-64 w-full rounded-lg overflow-hidden border border-gray-300 relative z-0">
      <MapContainer 
        center={position ? [position.lat, position.lng] : [defaultCenter.lat, defaultCenter.lng]} 
        zoom={13} 
        scrollWheelZoom={true} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapEvents setPosition={setPosition} />
        {position && (
          <Marker position={[position.lat, position.lng]} icon={icon} />
        )}
      </MapContainer>
    </div>
  );
}