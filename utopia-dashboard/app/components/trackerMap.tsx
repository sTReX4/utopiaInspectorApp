'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for missing marker icons in Next.js/Leaflet configurations
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface AuditRoute {
  id: string;
  inspector_name: string;
  branch_name: string;
  time_in: string;
  time_out: string;
  gps_latitude: number;
  gps_longitude: number;
}

interface TrackerMapProps {
    routes: AuditRoute[];
    selectedRouteId: string | null;
}

// --- NEW: The Map Animation Controller ---
function MapController({ routes, selectedRouteId }: TrackerMapProps) {
  const map = useMap();

  useEffect(() => {
    if (selectedRouteId) {
      // If a specific route is clicked, fly directly to it
      const route = routes.find(r => r.id === selectedRouteId);
      if (route) {
        map.flyTo([route.gps_latitude, route.gps_longitude], 17, { 
            animate: true, 
            duration: 1.5 // 1.5 seconds smooth animation
        });
      }
    } else if (routes.length > 0) {
      // If nothing is selected, zoom out to fit ALL markers on the screen
      const bounds = L.latLngBounds(routes.map(r => [r.gps_latitude, r.gps_longitude]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [selectedRouteId, routes, map]);

  return null; // This component doesn't render HTML, it only controls the map math
}


export default function TrackerMap({ routes, selectedRouteId }: TrackerMapProps) {
  // Safe center fallback for Manila if there are no routes today
  const centerLat = routes.length > 0 ? routes[0].gps_latitude : 14.5995;
  const centerLng = routes.length > 0 ? routes[0].gps_longitude : 120.9842;

  return (
    <MapContainer center={[centerLat, centerLng]} zoom={12} className="w-full h-full z-0">
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      
      {/* Inject the controller so it can manipulate the map camera */}
      <MapController routes={routes} selectedRouteId={selectedRouteId} />

      {routes.map((route) => (
        <Marker key={route.id} position={[route.gps_latitude, route.gps_longitude]}>
          <Popup>
            <div className="text-sm">
              <p className="font-bold text-gray-900 mb-1">{route.inspector_name}</p>
              <p className="text-blue-600 font-medium">{route.branch_name}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}