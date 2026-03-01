import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, LayersControl, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { UserData } from '../App';

// Fix for default marker icon issue with Webpack
// @ts-ignore
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

const RecenterMap = ({ movements }: { movements: Movement[] }) => {
  const map = useMap();
  useEffect(() => {
    if (movements.length > 0) {
      const bounds = L.latLngBounds(movements.map(m => [m.start_location.lat, m.start_location.lng]));
      movements.forEach(m => {
        if (m.end_location) {
          bounds.extend([m.end_location.lat, m.end_location.lng]);
        }
      });
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [movements, map]);
  return null;
};

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
  const [searchTerm, setSearchTerm] = useState('');

  const [availableFilters, setAvailableFilters] = useState<{divisions: string[], districts: string[], areas: string[]}>({
    divisions: [],
    districts: [],
    areas: []
  });

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const response = await fetch('/api/movements/filters');
        if (response.ok) {
          const data = await response.json();
          setAvailableFilters(data);
        }
      } catch (err) {
        console.error('Failed to fetch filters:', err);
      }
    };
    fetchFilters();
  }, []);

  const fetchMovements = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        staff_id: user.id.toString(),
        supervisor_id: user.id.toString(),
        role: user.role,
        division: filters.division,
        district: filters.district,
        area: filters.area,
        branch: filters.branch,
        search: searchTerm
      });
      
      const response = await fetch(`/api/movements?${queryParams}`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      
      // Map API data to Movement interface
      const mappedData: Movement[] = data.map((m: any) => ({
        id: m.id,
        user_id: m.staff_id,
        type: m.purpose || 'Movement',
        status: m.status,
        start_location: { 
          lat: m.start_lat || 14.5995, 
          lng: m.start_lng || 120.9842, 
          name: m.start_location || 'Start' 
        },
        end_location: { 
          lat: m.end_lat || 14.5995, 
          lng: m.end_lng || 120.9842, 
          name: m.end_location || 'End' 
        },
        start_time: m.date + 'T' + (m.time_in || '00:00'),
        end_time: m.date + 'T' + (m.time_out || '00:00'),
      }));
      
      setMovements(mappedData);
    } catch (err) {
      setError('Failed to fetch movements.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovements();
  }, [user.id, user.role, filters.division, filters.district, filters.area]);

  if (loading) {
    return <div className="p-8 text-center">Loading map data...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-destructive">Error: {error}</div>;
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
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchMovements()}
            className="w-full bg-card/90 border border-border rounded-lg py-2 px-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder-muted-foreground"
          />
          <div className="bg-card/80 backdrop-blur-md border border-border p-4 rounded-lg shadow-lg">
            <div className="space-y-4">
              <select onChange={(e) => setFilters({...filters, division: e.target.value})} value={filters.division} className="w-full bg-card/90 border border-border rounded-lg py-2 px-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer">
                <option value="">--Select Division--</option>
                {availableFilters.divisions.map(div => (
                  <option key={div} value={div}>{div}</option>
                ))}
              </select>
              <select onChange={(e) => setFilters({...filters, district: e.target.value})} value={filters.district} className="w-full bg-card/90 border border-border rounded-lg py-2 px-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer">
                <option value="">--Select District--</option>
                {availableFilters.districts.map(dist => (
                  <option key={dist} value={dist}>{dist}</option>
                ))}
              </select>
              <select onChange={(e) => setFilters({...filters, area: e.target.value})} value={filters.area} className="w-full bg-card/90 border border-border rounded-lg py-2 px-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer">
                <option value="">--Select Area--</option>
                {availableFilters.areas.map(area => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
              <input type="text" placeholder="--Select Branch--" onChange={(e) => setFilters({...filters, branch: e.target.value})} value={filters.branch} className="w-full bg-card/90 border border-border rounded-lg py-2 px-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder-muted-foreground" />
              <button onClick={fetchMovements} className="w-full bg-primary text-primary-foreground rounded-lg py-2 px-3 text-sm font-semibold hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background">
                Refresh
              </button>
            </div>
          </div>
        </div>
        <div className="absolute top-4 right-4 z-[1000] bg-card/80 backdrop-blur-sm p-2 rounded-lg shadow-lg">
          <select 
            onChange={(e) => setTileLayer(e.target.value)} 
            value={tileLayer}
            className="bg-transparent text-foreground text-xs focus:outline-none cursor-pointer pr-4"
          >
            <option value="street">Street</option>
            <option value="satellite">Satellite</option>
            <option value="terrain">Terrain</option>
          </select>
        </div>

        {tileLayer === 'street' && (
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          />
        )}
        {tileLayer === 'satellite' && (
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
          />
        )}
        {tileLayer === 'terrain' && (
          <TileLayer
            url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
            attribution='Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
          />
        )}

        <RecenterMap movements={movements} />

        {movements.map((movement) => {
          const isSameLocation = movement.start_location.lat === movement.end_location.lat && 
                                movement.start_location.lng === movement.end_location.lng;
          
          return (
            <React.Fragment key={movement.id}>
              <Marker position={[movement.start_location.lat, movement.start_location.lng]}>
                <Popup>
                  <div className="p-1">
                    <h3 className="font-bold text-primary mb-1">Movement #{movement.id}</h3>
                    <p className="text-xs"><b>Start:</b> {movement.start_location.name}</p>
                    <p className="text-xs"><b>Type:</b> {movement.type}</p>
                    <p className="text-xs"><b>Status:</b> {movement.status}</p>
                    <p className="text-xs"><b>Time:</b> {new Date(movement.start_time).toLocaleString()}</p>
                  </div>
                </Popup>
              </Marker>
              
              {!isSameLocation && (
                <>
                  <Marker position={[movement.end_location.lat, movement.end_location.lng]}>
                    <Popup>
                      <div className="p-1">
                        <h3 className="font-bold text-primary mb-1">Movement #{movement.id}</h3>
                        <p className="text-xs"><b>End:</b> {movement.end_location.name}</p>
                        <p className="text-xs"><b>Type:</b> {movement.type}</p>
                        <p className="text-xs"><b>Status:</b> {movement.status}</p>
                        <p className="text-xs"><b>Time:</b> {new Date(movement.end_time).toLocaleString()}</p>
                      </div>
                    </Popup>
                  </Marker>
                  <Polyline 
                    positions={[
                      [movement.start_location.lat, movement.start_location.lng],
                      [movement.end_location.lat, movement.end_location.lng]
                    ]} 
                    color="#0284c7" 
                    weight={3} 
                    opacity={0.6}
                    dashArray="5, 10"
                  />
                </>
              )}
            </React.Fragment>
          );
        })}
        </MapContainer>
      </div>
    </div>
  );
};

export default MovementMap;
