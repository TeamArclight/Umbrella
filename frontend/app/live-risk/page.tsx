'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { VillagePipelineResult } from '../../lib/types';
import { formatINR, getHazardColor, getPriorityColor } from '../../lib/utils';
import { Navbar } from '../../components/Navbar';
import { ProvenanceBadge } from '../../components/ProvenanceBadge';
import { HazardExplainability } from '../../components/HazardExplainability';
import {
  CloudRain,
  Radio,
  Droplets,
  Wind,
  Thermometer,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Calendar,
} from 'lucide-react';

export default function LiveRiskPage() {
  const [horizon, setHorizon] = useState<number>(5);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [pipelineResults, setPipelineResults] = useState<VillagePipelineResult[]>([]);
  const [selectedVillageId, setSelectedVillageId] = useState<string>('IND-BIH-DAR-001');

  const loadData = async (h: number) => {
    try {
      setIsLoading(true);
      const results = await api.runAllVillages(h, 7);
      setPipelineResults(results);
      if (!selectedVillageId && results.length > 0) {
        setSelectedVillageId(results[0].village_id);
      }
    } catch (err) {
      console.error('Failed to load live risk data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(horizon);
  }, [horizon]);

  const selectedVillage = pipelineResults.find((r) => r.village_id === selectedVillageId) || pipelineResults[0];

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar
        title="Live Meteorological Flood Risk Monitor"
        horizon={horizon}
        onHorizonChange={setHorizon}
        onRefresh={() => loadData(horizon)}
        sourceMode={selectedVillage?.flood_hazard.data_source_mode || selectedVillage?.weather_forecast?.data_source_mode || 'LIVE'}
      />

      <div className="p-6 space-y-6 flex-1">
        {/* Offline / Mock Fallback Alert Banner */}
        {(selectedVillage?.weather_forecast?.data_source_mode === 'MOCK' || selectedVillage?.flood_hazard.data_source_mode === 'MOCK') && (
          <div className="p-3 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-300 text-xs font-medium flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
              <span>
                <strong>DEMO / MOCK DATA ACTIVE:</strong> Live meteorological feed fell back to validated deterministic mock data ({selectedVillage?.weather_forecast?.fallback_reason || 'Network offline or upstream API rate limit'}).
              </span>
            </div>
            <span className="text-[10px] uppercase tracking-wider font-mono bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded text-amber-200 shrink-0 self-start sm:self-auto">
              Offline Demonstration Mode
            </span>
          </div>
        )}

        {/* Prominent Provenance Header */}
        <div className="p-4 rounded-xl border border-slate-800 bg-[#0f172a] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CloudRain className="w-5 h-5 text-sky-400" />
              <h2 className="text-base font-bold text-white">
                Short-Range Atmospheric & Hydrological Exposure
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Direct ingestion from Open-Meteo Weather Forecast API (ECMWF IFS & DWD ICON)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <ProvenanceBadge
              mode={selectedVillage?.weather_forecast?.data_source_mode || selectedVillage?.weather_forecast?.source_mode || 'LIVE'}
              size="lg"
            />
          </div>
        </div>

        {/* Selected Cluster Weather Deep-Dive & Daily Forecast Cards */}
        {selectedVillage && (
          <div className="space-y-6">
            {/* Cluster Selector Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800">
              {pipelineResults.map((r) => {
                const isSelected = r.village_id === selectedVillage.village_id;
                const hazardCol = getHazardColor(r.flood_hazard.hazard_level);
                return (
                  <button
                    key={r.village_id}
                    onClick={() => setSelectedVillageId(r.village_id)}
                    className={`px-3 py-2 rounded-lg border text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                      isSelected
                        ? 'bg-sky-500/15 border-sky-500 text-sky-300 shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>{r.village_name}</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${hazardCol.badge}`}>
                      {r.flood_hazard.hazard_score.toFixed(1)}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Weather Metrics Summary Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-slate-800 bg-[#0c1220]">
                <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                  Accumulated Rainfall ({horizon}D)
                </div>
                <div className="mt-2 text-2xl font-bold font-mono text-sky-400">
                  {selectedVillage.weather_forecast.total_accumulated_precipitation_mm.toFixed(1)} mm
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Cumulative precipitation over forecast horizon
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-800 bg-[#0c1220]">
                <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                  Max Daily Burst Intensity
                </div>
                <div className="mt-2 text-2xl font-bold font-mono text-amber-400">
                  {selectedVillage.weather_forecast.max_daily_burst_precipitation_mm.toFixed(1)} mm/day
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Peak single-day deluge threat
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-800 bg-[#0c1220]">
                <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                  Physical Flood Hazard Score
                </div>
                <div className="mt-2 text-2xl font-bold font-mono text-white">
                  {selectedVillage.flood_hazard.hazard_score.toFixed(1)} / 100
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Severity: <span className="font-bold text-sky-400">{selectedVillage.flood_hazard.hazard_level}</span>
                </div>
              </div>
            </div>

            {/* Daily Weather Series Breakdown */}
            <div className="p-5 rounded-xl border border-slate-800 bg-[#0f172a]">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-sky-400" />
                  Day-by-Day Forecast Breakdown ({selectedVillage.village_name})
                </h3>
                <span className="text-[11px] font-mono text-slate-400">
                  Provider: {selectedVillage.weather_forecast.provider}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-4">
                {selectedVillage.weather_forecast.daily_forecasts.map((day) => (
                  <div
                    key={day.date}
                    className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-2 text-xs"
                  >
                    <div className="font-bold text-slate-200 font-mono text-center border-b border-slate-800 pb-1.5">
                      {day.date}
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">Precipitation:</span>
                      <span className="font-mono font-bold text-sky-400">
                        {day.precipitation_mm.toFixed(1)} mm
                      </span>
                    </div>
                    {day.precipitation_probability_pct !== undefined && (
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-400">Rain Prob:</span>
                        <span className="font-mono text-slate-300">
                          {day.precipitation_probability_pct}%
                        </span>
                      </div>
                    )}
                    {day.temperature_max_celsius !== undefined && (
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-400">Max Temp:</span>
                        <span className="font-mono text-slate-300">
                          {day.temperature_max_celsius.toFixed(0)}°C
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Hazard Explainability Component */}
            <HazardExplainability hazard={selectedVillage.flood_hazard} />
          </div>
        )}
      </div>
    </div>
  );
}
