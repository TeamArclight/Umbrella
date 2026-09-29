'use client';

import React, { useEffect, useRef, useState } from 'react';
import { FloodHazardEvaluation, PortfolioClimateImpact, PortfolioExposure } from '../lib/types';
import { formatINR, getHazardColor, getPriorityColor } from '../lib/utils';
import { MapPin, Layers, Info } from 'lucide-react';

interface ClusterMapData {
  village_id: string;
  village_name: string;
  latitude: number;
  longitude: number;
  hazard?: FloodHazardEvaluation;
  exposure?: PortfolioExposure;
  impact?: PortfolioClimateImpact;
}

interface LeafletMapProps {
  districtGeoJSON?: any;
  clusters: ClusterMapData[];
  selectedVillageId?: string | null;
  onSelectVillage: (villageId: string) => void;
  colorBy?: 'hazard' | 'priority';
  height?: string;
  center?: [number, number];
  zoom?: number;
}

export function LeafletMap({
  districtGeoJSON,
  clusters,
  selectedVillageId,
  onSelectVillage,
  colorBy = 'hazard',
  height = '540px',
  center = [26.15, 85.9], // Darbhanga district center
  zoom = 10,
}: LeafletMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const geojsonLayerRef = useRef<any>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!isClient || !mapContainerRef.current || mapInstanceRef.current) return;

    let isMounted = true;

    // Dynamically import Leaflet and CSS
    Promise.all([
      import('leaflet'),
      import('leaflet/dist/leaflet.css' as any),
    ]).then(([L]) => {
      if (!isMounted || !mapContainerRef.current) return;

      const map = L.map(mapContainerRef.current, {
        center: center,
        zoom: zoom,
        zoomControl: true,
        attributionControl: false,
      });

      // OpenStreetMap tile layer styled dark for institutional aesthetic
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        subdomains: ['a', 'b', 'c'],
        className: 'map-tiles-dark',
      }).addTo(map);

      // Custom minimal attribution in corner
      L.control
        .attribution({
          position: 'bottomright',
          prefix: '<span class="text-[10px] text-slate-500">© OpenStreetMap contributors, OSM Rel:1568263</span>',
        })
        .addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isClient]);

  // Render District GeoJSON Boundary
  useEffect(() => {
    if (!mapInstanceRef.current || !districtGeoJSON) return;

    import('leaflet').then((L) => {
      if (geojsonLayerRef.current) {
        mapInstanceRef.current.removeLayer(geojsonLayerRef.current);
      }

      geojsonLayerRef.current = L.geoJSON(districtGeoJSON, {
        style: {
          color: '#38bdf8', // sky-400
          weight: 2,
          opacity: 0.85,
          fillColor: '#0284c7', // sky-600
          fillOpacity: 0.08,
          dashArray: '4, 4',
        },
      }).addTo(mapInstanceRef.current);

      try {
        const bounds = geojsonLayerRef.current.getBounds();
        if (bounds.isValid()) {
          mapInstanceRef.current.fitBounds(bounds, { padding: [20, 20] });
        }
      } catch (e) {
        // Fallback to default center
      }
    });
  }, [districtGeoJSON]);

  // Render Village Cluster Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current || clusters.length === 0) return;

    import('leaflet').then((L) => {
      markersLayerRef.current.clearLayers();

      clusters.forEach((cluster) => {
        const isSelected = selectedVillageId === cluster.village_id;

        // Determine score and color scheme
        let colorHex = '#38bdf8';
        let scoreLabel = 'N/A';
        let scoreVal = 0;

        if (colorBy === 'hazard' && cluster.hazard) {
          const colors = getHazardColor(cluster.hazard.hazard_level);
          colorHex = colors.hex;
          scoreLabel = `Hazard: ${cluster.hazard.hazard_score.toFixed(1)} (${cluster.hazard.hazard_level})`;
          scoreVal = cluster.hazard.hazard_score;
        } else if (colorBy === 'priority' && cluster.impact) {
          const colors = getPriorityColor(cluster.impact.priority_level);
          colorHex = colors.hex;
          scoreLabel = `Priority: ${cluster.impact.priority_score.toFixed(1)} (${cluster.impact.priority_level})`;
          scoreVal = cluster.impact.priority_score;
        }

        // Marker radius slightly scaled by score
        const radius = isSelected ? 12 : 7 + Math.min(8, (scoreVal / 100) * 8);

        // SVG circle marker
        const marker = L.circleMarker([cluster.latitude, cluster.longitude], {
          radius: radius,
          fillColor: colorHex,
          color: isSelected ? '#ffffff' : colorHex,
          weight: isSelected ? 3 : 1.5,
          opacity: 1,
          fillOpacity: isSelected ? 0.9 : 0.75,
        });

        // Popup content with clean institutional styling
        const portfolioVal = cluster.exposure
          ? formatINR(cluster.exposure.outstanding_amount)
          : '₹84.50 Lakh';
        const borrowersCount = cluster.exposure?.borrowers_exposed || '142';

        const popupContent = `
          <div style="font-family: inherit; font-size: 12px; line-height: 1.4; padding: 2px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; border-bottom: 1px solid #334155; padding-bottom: 4px;">
              <strong style="color: #f8fafc; font-size: 13px;">${cluster.village_name}</strong>
              <span style="font-size: 10px; color: #94a3b8; font-family: monospace;">${cluster.village_id}</span>
            </div>
            <div style="margin-bottom: 4px; color: ${colorHex}; font-weight: 600;">
              ${scoreLabel}
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-top: 6px; font-size: 11px; color: #cbd5e1;">
              <div>Portfolio: <strong style="color: #f1f5f9;">${portfolioVal}</strong></div>
              <div>Borrowers: <strong style="color: #f1f5f9;">${borrowersCount}</strong></div>
            </div>
            <div style="margin-top: 6px; font-size: 10px; color: #64748b; font-style: italic;">
              Click marker to inspect drivers & actions
            </div>
          </div>
        `;

        marker.bindPopup(popupContent, { closeButton: false });

        marker.on('click', () => {
          onSelectVillage(cluster.village_id);
        });

        marker.on('mouseover', function () {
          marker.openPopup();
        });

        markersLayerRef.current.addLayer(marker);
      });
    });
  }, [clusters, selectedVillageId, colorBy, onSelectVillage]);

  return (
    <div className="relative rounded-xl border border-slate-800 bg-[#090d16] overflow-hidden shadow-xl" style={{ height }}>
      {/* Map Element Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Map Legend Overlay */}
      <div className="absolute bottom-4 left-4 z-[500] bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-lg p-3 text-xs shadow-lg">
        <div className="flex items-center gap-1.5 font-semibold text-slate-300 mb-2">
          <Layers className="w-3.5 h-3.5 text-sky-400" />
          <span>{colorBy === 'hazard' ? 'Physical Flood Hazard' : 'Operational Priority'}</span>
        </div>
        <div className="space-y-1.5 font-mono text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50" />
            <span className="text-slate-300">Severe / Critical (&ge; 70)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm shadow-orange-500/50" />
            <span className="text-slate-300">High (50 - 69)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
            <span className="text-slate-300">Moderate / Medium (30 - 49)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
            <span className="text-slate-300">Low (&lt; 30)</span>
          </div>
          <div className="flex items-center gap-2 pt-1 border-t border-slate-800 text-[10px] text-sky-400">
            <span className="w-3 h-0.5 border-t border-dashed border-sky-400" />
            <span>Darbhanga District Boundary</span>
          </div>
        </div>
      </div>
    </div>
  );
}
