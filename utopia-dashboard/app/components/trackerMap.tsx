'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default Leaflet marker icons in Next.js
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

interface AuditRoute {
  id: string;
  inspector_name: string;
  branch_name: string;
  time_in: string;
  time_out: string;
  gps_latitude: number;
  gps_longitude: number;
}

export default function TrackerMap({ routes }: { routes: AuditRoute[] }) {
  // Center on Metro Manila by default
  const defaultCenter = { lat: 14.5995, lng: 120.9842 };

  // If we have routes, center the map on the most recent one
  const centerPos = routes.length > 0 
    ? [routes[0].gps_latitude, routes[0].gps_longitude] 
    : [defaultCenter.lat, defaultCenter.lng];

  useEffect(() => {
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 200);
  }, [routes]);

  return (
    <MapContainer 
      center={centerPos as [number, number]} 
      zoom={12} 
      scrollWheelZoom={true} 
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Loop through the audits and plot them on the map */}
      {routes.map((route) => (
        <Marker 
          key={route.id} 
          position={[route.gps_latitude, route.gps_longitude]} 
          icon={icon}
        >
          <Popup>
            <div className="text-sm font-sans">
              <strong className="block text-base mb-1">{route.inspector_name}</strong>
              <span className="text-gray-600 block mb-2">{route.branch_name}</span>
              <div className="border-t pt-1 mt-1">
                <span className="block text-xs text-green-700">IN: {new Date(route.time_in).toLocaleTimeString()}</span>
                <span className="block text-xs text-red-700">OUT: {new Date(route.time_out).toLocaleTimeString()}</span>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}