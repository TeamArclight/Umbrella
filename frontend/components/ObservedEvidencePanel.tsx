'use client';

import React from 'react';
import { ObservedFloodValidationResult } from '../lib/types';
import { Satellite, Droplets, CheckCircle, AlertCircle, FileText, ExternalLink, ShieldCheck } from 'lucide-react';
import { ProvenanceBadge } from './ProvenanceBadge';

interface ObservedEvidencePanelProps {
  evidence: ObservedFloodValidationResult | null;
}

export function ObservedEvidencePanel({ evidence }: ObservedEvidencePanelProps) {
  if (!evidence) {
    return (
      <div className="p-6 rounded-xl border border-slate-800 bg-[#090d16] text-center text-slate-400">
        Loading observational ground truth data...
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-[#090d16] p-5 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Satellite className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-bold text-white tracking-wide">
              Observational Remote Sensing & Ground-Truth Hydrology
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Independent observational evidence for North Bihar Flood (July 2020)
          </p>
        </div>

        {/* Evidence Status Badge - Strictly Compliant */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-purple-950/40 border border-purple-800/50 text-xs font-mono font-semibold text-purple-300">
          <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
          <span>Evidence available — flood extent processing pending</span>
        </div>
      </div>

      {/* CWC River Gauge Hydrographs / Records */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Droplets className="w-4 h-4 text-sky-400" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Central Water Commission (CWC) River Gauges — Peak Crests
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
          {evidence.cwc_gauge_records.map((gauge: any, idx: number) => {
            const station = gauge.station_name || gauge.station || `Station ${idx + 1}`;
            const crest = gauge.peak_water_level_recorded_m ?? gauge.crest_level_m ?? 0;
            const danger = gauge.danger_level_m ?? 0;
            const diff = gauge.water_level_above_danger_level_m != null
              ? Number(gauge.water_level_above_danger_level_m).toFixed(2)
              : (crest - danger).toFixed(2);
            return (
              <div
                key={station}
                className="p-3 rounded-lg bg-slate-900/70 border border-slate-800 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-100 font-sans">{station}</span>
                  <span className="text-[10px] text-sky-400">{gauge.river} River</span>
                </div>
                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-slate-400 text-[11px]">Observed Crest:</span>
                  <span className="text-sm font-bold text-rose-400">{crest} m</span>
                </div>
                <div className="flex items-baseline justify-between text-[11px]">
                  <span className="text-slate-400">Danger Level:</span>
                  <span className="text-slate-300">{danger} m</span>
                </div>
                <div className="pt-1.5 border-t border-slate-800 text-[10px] text-rose-300 flex items-center justify-between">
                  <span>Above Danger:</span>
                  <span className="font-bold">+{diff} m</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Copernicus Sentinel-1 SAR Acquisition Passes */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Satellite className="w-4 h-4 text-purple-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Copernicus Sentinel-1 SAR Radar Acquisitions (C-band IW GRD)
            </h4>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Relative Orbits: 121, 48 (VV + VH)
          </span>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-900/50">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 text-[11px]">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Scene ID</th>
                <th className="py-2.5 px-3 font-semibold">Acquisition Date</th>
                <th className="py-2.5 px-3 font-semibold">Orbit</th>
                <th className="py-2.5 px-3 font-semibold">Direction</th>
                <th className="py-2.5 px-3 font-semibold">Resolution</th>
                <th className="py-2.5 px-3 font-semibold">Baseline Type</th>
                <th className="py-2.5 px-3 font-semibold text-right">SAR Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {evidence.sar_acquisitions.map((sar: any, idx: number) => {
                const sceneId = sar.acquisition_id || `S1A-IW-GRD-${sar.orbit || 121}-${idx + 1}`;
                const date = sar.scene_date || sar.date || '2020-07';
                const orbit = sar.orbit || sar.relative_orbit || 121;
                const direction = sar.orbit_direction || (orbit === 121 ? 'Ascending' : 'Descending');
                const phase = sar.baseline_type || 'SAR Acquisition';
                return (
                  <tr key={sceneId} className="hover:bg-slate-800/30">
                    <td className="py-2 px-3 text-sky-400 font-medium">{sceneId}</td>
                    <td className="py-2 px-3">{date}</td>
                    <td className="py-2 px-3">{orbit}</td>
                    <td className="py-2 px-3">{direction}</td>
                    <td className="py-2 px-3">{sar.resolution || '10m (IW)'}</td>
                    <td className="py-2 px-3">{phase}</td>
                    <td className="py-2 px-3 text-right">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] bg-purple-950/60 text-purple-300 border border-purple-800/40">
                        RAW SAR AVAILABLE
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Model vs Observation Alignment Summary */}
      <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800/80 text-xs text-slate-300 space-y-2">
        <div className="font-semibold text-slate-200 flex items-center gap-1.5">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>Model vs Observation Alignment:</span>
        </div>
        <p className="leading-relaxed text-slate-300">
          {evidence.model_vs_observation_alignment}
        </p>
      </div>

      {/* Disclaimer */}
      <div className="pt-2 text-[10px] text-slate-400 italic font-mono leading-relaxed border-t border-slate-800/60">
        {evidence.scientific_disclaimer}
      </div>
    </div>
  );
}
