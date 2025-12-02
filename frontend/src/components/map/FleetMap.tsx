import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Trip } from "../../services/tripsApi";
import { tripsApi } from "../../services/tripsApi";

interface Event {
  event_id: string;
  event_type: string;
  timestamp: string;
  vehicle_id: string;
  trip_id: string;
  location: { lat: number; lng: number };
  movement?: { speed_kmh: number; heading_degrees?: number; moving: boolean };
  device?: { battery_level: number; charging: boolean };
  signal_quality?: string;
  distance_travelled_km?: number;
  [key: string]: any;
}

interface Props {
  trips: Trip[];
  selectedTrip: string | null;
  simTime: number | null;
  onTripClick?: (tripId: string) => void;
}

const FleetMap = ({ trips, selectedTrip, simTime, onTripClick }: Props) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<maplibregl.Marker[]>([]);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          "osm-tiles": {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "© OpenStreetMap contributors",
          },
        },
        layers: [
          {
            id: "osm-tiles",
            type: "raster",
            source: "osm-tiles",
          },
        ],
      },
      center: [-95.7129, 37.0902], // Center of USA
      zoom: 4,
    });

    map.current.addControl(new maplibregl.NavigationControl(), "top-right");
  }, []);

  useEffect(() => {
    if (!map.current || trips.length === 0 || !simTime) return;

    loadVehiclePositions();
  }, [trips, simTime, selectedTrip]);

  const loadVehiclePositions = async () => {
    if (!simTime) return;

    const positions = new Map<
      string,
      { lat: number; lng: number; status: string; speed: number }
    >();

    for (const trip of trips) {
      const startTime = new Date(trip.startTime).getTime();
      const endTime = new Date(trip.endTime).getTime();

      if (simTime >= startTime && simTime <= endTime) {
        try {
          const events = await tripsApi.getTripEvents(trip.id, simTime);
          const relevantEvents = events.filter(
            (e: Event) => new Date(e.timestamp).getTime() <= simTime
          );

          if (relevantEvents.length > 0) {
            const lastEvent = relevantEvents[relevantEvents.length - 1];
            const status = trip.status;
            const speed = lastEvent.movement?.speed_kmh || 0;

            positions.set(trip.id, {
              lat: lastEvent.location.lat,
              lng: lastEvent.location.lng,
              status,
              speed,
            });

            // Draw route
            if (relevantEvents.length > 1 && map.current) {
              const coordinates = relevantEvents
                .filter((e: Event) => e.location)
                .map(
                  (e: Event) =>
                    [e.location.lng, e.location.lat] as [number, number]
                );

              if (coordinates.length > 1) {
                const sourceId = `route-${trip.id}`;
                const layerId = `route-layer-${trip.id}`;

                // Remove existing route
                if (map.current.getLayer(layerId)) {
                  map.current.removeLayer(layerId);
                }
                if (map.current.getSource(sourceId)) {
                  map.current.removeSource(sourceId);
                }

                // Add new route
                map.current.addSource(sourceId, {
                  type: "geojson",
                  data: {
                    type: "Feature",
                    properties: {},
                    geometry: {
                      type: "LineString",
                      coordinates,
                    },
                  },
                });

                map.current.addLayer({
                  id: layerId,
                  type: "line",
                  source: sourceId,
                  layout: {
                    "line-join": "round",
                    "line-cap": "round",
                  },
                  paint: {
                    "line-color":
                      selectedTrip === trip.id ? "#3b82f6" : "#94a3b8",
                    "line-width": selectedTrip === trip.id ? 4 : 2,
                    "line-opacity": 0.6,
                  },
                });
              }
            }
          }
        } catch (error) {
          console.error(`Failed to load events for trip ${trip.id}:`, error);
        }
      }
    }

    updateMarkers(positions);
  };

  const updateMarkers = (
    positions: Map<
      string,
      { lat: number; lng: number; status: string; speed: number }
    >
  ) => {
    if (!map.current) return;

    // Clear existing markers
    markers.current.forEach((marker) => marker.remove());
    markers.current = [];

    positions.forEach((position, tripId) => {
      const trip = trips.find((t) => t.id === tripId);
      if (!trip) return;

      const isSelected = selectedTrip === tripId;
      const hasAlert =
        trip.status === "technical_issues" || position.speed > 100;

      const el = document.createElement("div");
      el.className = "vehicle-marker";
      el.style.cssText = `
        width: ${isSelected ? "40px" : "32px"};
        height: ${isSelected ? "40px" : "32px"};
        border-radius: 50%;
        background: ${
          hasAlert ? "#ef4444" : isSelected ? "#3b82f6" : "#10b981"
        };
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${isSelected ? "20px" : "16px"};
        cursor: pointer;
        transition: all 0.3s;
      `;
      el.innerHTML = "🚛";
      el.title = `${trip.name} - ${trip.vehicle_id} - ${position.speed.toFixed(
        0
      )} km/h`;

      el.addEventListener("click", () => {
        onTripClick?.(tripId);
      });

      const marker = new maplibregl.Marker(el)
        .setLngLat([position.lng, position.lat])
        .addTo(map.current!);

      markers.current.push(marker);
    });

    // Fit bounds if we have positions
    if (positions.size > 0) {
      const bounds = new maplibregl.LngLatBounds();
      positions.forEach((pos) => {
        bounds.extend([pos.lng, pos.lat]);
      });
      map.current.fitBounds(bounds, { padding: 50, maxZoom: 10 });
    }
  };

  return (
    <div
      ref={mapContainer}
      className="w-full h-full rounded-lg"
      style={{ minHeight: "500px" }}
    />
  );
};

export default FleetMap;
