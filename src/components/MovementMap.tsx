import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, LayersControl, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { UserData } from '../App';

// Fix for default marker icon issue with Webpack
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

interface MovementMapProps {
  user: UserData;
}

interface Movement {
  id: number;
  user_id: number;
  type: string;
  status: string;
  start_location: { lat: number; lng: number; name: string };
  end_location: { lat: number; lng: number; name: string };
  start_time: string;
  end_time: string;
}

const MovementMap: React.FC<MovementMapProps> = ({ user }) => {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tileLayer, setTileLayer] = useState('street');
  const [filters, setFilters] = useState({
    division: '',
    district: '',
    area: '',
    branch: ''
  });

  useEffect(() => {
    const fetchMovements = async () => {
      try {
        // Simulate fetching data
        const mockMovements: Movement[] = [
          {
            id: 1,
            user_id: user.id,
            type: 'Field Visit',
            status: 'Completed',
            start_location: { lat: 14.5995, lng: 120.9842, name: 'Manila' },
            end_location: { lat: 14.5995, lng: 120.9842, name: 'Manila' },
            start_time: '2023-01-01T09:00:00Z',
            end_time: '2023-01-01T17:00:00Z',
          },
          {
            id: 2,
            user_id: user.id,
            type: 'Site Inspection',
            status: 'Completed',
            start_location: { lat: 10.3157, lng: 123.8854, name: 'Cebu City' },
            end_location: { lat: 10.3157, lng: 123.8854, name: 'Cebu City' },
            start_time: '2023-01-05T10:00:00Z',
            end_time: '2023-01-05T14:00:00Z',
          },
          {
            id: 3,
            user_id: user.id,
            type: 'Delivery',
            status: 'Completed',
            start_location: { lat: 7.0645, lng: 125.607, name: 'Davao City' },
            end_location: { lat: 7.0645, lng: 125.607, name: 'Davao City' },
            start_time: '2023-01-10T11:00:00Z',
            end_time: '2023-01-10T12:00:00Z',
          },
        ];
        setMovements(mockMovements);
      } catch (err) {
        setError('Failed to fetch movements.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMovements();
  }, [user.id]);

  if (loading) {
    return <div className="p-8 text-center">Loading map data...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">Error: {error}</div>;
  }

  const center = [12.8797, 121.7740]; // Default to Philippines

  return (
    <div className="flex-1 h-full w-full">
      <div className="h-full w-full relative">
        <MapContainer center={center as [number, number]} zoom={5} className="h-full w-full rounded-xl shadow-lg">
        <div className="absolute bottom-4 left-4 z-[1000] w-full max-w-xs space-y-2">
          <input 
            type="text" 
            placeholder="Search..." 
            className="w-full bg-blue-900/50 border border-blue-400/50 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-blue-300/50"
          />
          <div className="bg-blue-900/30 backdrop-blur-md border border-blue-400/50 p-4 rounded-lg shadow-lg">
            <div className="space-y-4">
              <select onChange={(e) => setFilters({...filters, division: e.target.value})} value={filters.division} className="w-full bg-blue-900/50 border border-blue-400/50 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                <option value="" className="bg-blue-900">--Select Division--</option>
                {Array.from({ length: 8 }, (_, i) => `Division ${i + 1}`).map(div => (
                  <option key={div} value={div} className="bg-blue-900">{div}</option>
                ))}
              </select>
              <select onChange={(e) => setFilters({...filters, district: e.target.value})} value={filters.district} className="w-full bg-blue-900/50 border border-blue-400/50 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                <option value="" className="bg-blue-900">--Select District--</option>
                {Array.from({ length: 33 }, (_, i) => `District ${i + 1}`).map(dist => (
                  <option key={dist} value={dist} className="bg-blue-900">{dist}</option>
                ))}
              </select>
              <select onChange={(e) => setFilters({...filters, area: e.target.value})} value={filters.area} className="w-full bg-blue-900/50 border border-blue-400/50 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                <option value="" className="bg-blue-900">--Select Area--</option>
                {Array.from({ length: 165 }, (_, i) => `Area ${i + 1}`).map(area => (
                  <option key={area} value={area} className="bg-blue-900">{area}</option>
                ))}
              </select>
              <input type="text" placeholder="--Select Branch--" onChange={(e) => setFilters({...filters, branch: e.target.value})} value={filters.branch} className="w-full bg-blue-900/50 border border-blue-400/50 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-blue-300/50" />
              <button onClick={() => { /* Add refresh logic here */ }} className="w-full bg-blue-500 text-white rounded-lg py-2 px-3 text-sm font-semibold hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-blue-900/50">
                Refresh
              </button>
            </div>
          </div>
        </div>
        <div className="absolute top-4 right-4 z-[1000] bg-white/20 backdrop-blur-sm p-2 rounded-lg shadow-lg">
          <select 
            onChange={(e) => setTileLayer(e.target.value)} 
            value={tileLayer}
            className="bg-transparent text-white text-xs focus:outline-none appearance-none cursor-pointer"
          >
            <option value="street" className="bg-[#001a33]">Street</option>
            <option value="satellite" className="bg-[#001a33]">Satellite</option>
            <option value="terrain" className="bg-[#001a33]">Terrain</option>
          </select>
        </div>

        <LayersControl position="topright">
          <LayersControl.BaseLayer checked={tileLayer === 'street'} name="Street">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer checked={tileLayer === 'satellite'} name="Satellite">
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer checked={tileLayer === 'terrain'} name="Terrain">
            <TileLayer
              url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
              attribution='Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
            />
          </LayersControl.BaseLayer>
        </LayersControl>
        {movements.map((movement) => (
          <React.Fragment key={movement.id}>
            <Marker position={[movement.start_location.lat, movement.start_location.lng]}>
              <Popup>
                <b>Start:</b> {movement.start_location.name}<br/>
                Type: {movement.type}<br/>
                Status: {movement.status}<br/>
                Time: {new Date(movement.start_time).toLocaleString()}
              </Popup>
            </Marker>
            {movement.end_location && (
              <Marker position={[movement.end_location.lat, movement.end_location.lng]}>
                <Popup>
                  <b>End:</b> {movement.end_location.name}<br/>
                  Type: {movement.type}<br/>
                  Status: {movement.status}<br/>
                  Time: {new Date(movement.end_time).toLocaleString()}
                </Popup>
              </Marker>
            )}
          </React.Fragment>
        ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default MovementMap;
