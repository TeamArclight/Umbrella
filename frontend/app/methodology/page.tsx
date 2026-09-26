'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { SystemAttributions } from '../../lib/types';
import { Navbar } from '../../components/Navbar';
import {
  BookOpen,
  ShieldCheck,
  Cpu,
  Layers,
  CheckCircle,
  ExternalLink,
  Scale,
  Award,
} from 'lucide-react';

export default function MethodologyPage() {
  const [attributions, setAttributions] = useState<SystemAttributions | null>(null);

  useEffect(() => {
    api.getAttributions().then(setAttributions).catch(console.error);
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar title="Model Methodology & Open-Source Attribution" horizon={5} onHorizonChange={() => {}} />

      <div className="p-6 space-y-6 flex-1 max-w-6xl">
        {/* Architectural Separation Axiom Banner */}
        <div className="p-5 rounded-xl border border-sky-800/60 bg-sky-950/25 space-y-2">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-sky-400" />
            <h2 className="text-base font-bold text-white">
              The Fundamental Architectural Axiom of Umbrella
            </h2>
          </div>
          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 font-mono text-xs text-sky-300">
            Physical Climate Hazard ≠ Portfolio Business Exposure ≠ Credit Default Prediction
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            A village's physical flood hazard is entirely governed by atmospheric precipitations, basin hydrology, and terrain topography. It does <strong>not</strong> increase simply because a microfinance lender has a larger loan volume in that village. Portfolio exposure and climate hazard are strictly separated and only combined transparently at the operational priority stage to guide lender attention.
          </p>
        </div>

        {/* Flood Hazard Model v1.0 Mathematical Formulation */}
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-sky-400" />
              <h3 className="text-sm font-bold text-white">
                Flood Hazard Model v1.0 Formulation
              </h3>
            </div>
            <span className="text-xs font-mono text-emerald-400">
              Deterministic & 100% Explainable
            </span>
          </div>

          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-slate-200 overflow-x-auto leading-loose">
            <div className="text-sky-300 font-bold mb-1">
              Hazard Score (0 - 100) =
            </div>
            <div className="pl-4 space-y-1">
              <div>+ 0.35 × <span className="text-amber-300">NormalizedAccumulationScore</span> (mm cumulative rainfall)</div>
              <div>+ 0.25 × <span className="text-amber-300">NormalizedBurstIntensityScore</span> (peak single-day mm/day)</div>
              <div>+ 0.15 × <span className="text-amber-300">NormalizedSoilSaturationScore</span> (m³/m³ topsoil moisture)</div>
              <div>+ 0.15 × <span className="text-amber-300">NormalizedClimatologicalAnomaly</span> (% vs 30-year normal)</div>
              <div>+ 0.10 × <span className="text-amber-300">NormalizedTerrainSusceptibility</span> (slope, elevation, drainage)</div>
            </div>
          </div>

          {/* Component weights & descriptions table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-mono text-[11px] uppercase">
                <tr>
                  <th className="py-2.5 px-3">Component Identifier</th>
                  <th className="py-2.5 px-3">Weight</th>
                  <th className="py-2.5 px-3">Raw Metric & Unit</th>
                  <th className="py-2.5 px-3">Data Source</th>
                  <th className="py-2.5 px-3">Physical Rationale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-white">Forecast Accumulation</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-sky-400">35%</td>
                  <td className="py-2.5 px-3 font-mono text-slate-400">Precipitation (mm)</td>
                  <td className="py-2.5 px-3 text-slate-400">Open-Meteo Ensemble</td>
                  <td className="py-2.5 px-3 text-slate-400">Total volume of atmospheric water entering the village catchment</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-white">Peak Burst Intensity</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-sky-400">25%</td>
                  <td className="py-2.5 px-3 font-mono text-slate-400">Max Burst (mm/day)</td>
                  <td className="py-2.5 px-3 text-slate-400">Open-Meteo Ensemble</td>
                  <td className="py-2.5 px-3 text-slate-400">Single-day deluge rate overwhelming localized surface drainage channels</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-white">Soil Saturation</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-sky-400">15%</td>
                  <td className="py-2.5 px-3 font-mono text-slate-400">Moisture 0-10cm (m³/m³)</td>
                  <td className="py-2.5 px-3 text-slate-400">ECMWF ERA5-Land</td>
                  <td className="py-2.5 px-3 text-slate-400">Pre-existing soil water deficit governing immediate surface runoff generation</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-white">Historical Anomaly</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-sky-400">15%</td>
                  <td className="py-2.5 px-3 font-mono text-slate-400">Anomaly vs Normal (%)</td>
                  <td className="py-2.5 px-3 text-slate-400">CGIAR / CHIRPS Normal</td>
                  <td className="py-2.5 px-3 text-slate-400">Deviation from 30-year climatological baseline normal for the calendar month</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-white">Terrain Susceptibility</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-sky-400">10%</td>
                  <td className="py-2.5 px-3 font-mono text-slate-400">Index (0 - 1.0)</td>
                  <td className="py-2.5 px-3 text-slate-400">Local Topography / SRTM</td>
                  <td className="py-2.5 px-3 text-slate-400">Inherent drainage vulnerability based on elevation, slope, and river proximity</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Operational Priority Model Formulation */}
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-bold text-white">
                Portfolio Priority Index Formulation
              </h3>
            </div>
            <span className="text-xs font-mono text-amber-400">
              PortfolioPriority-v1.0
            </span>
          </div>

          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-slate-200">
            <div className="text-amber-300 font-bold mb-1">
              Priority Score (0 - 100) =
            </div>
            <div className="pl-4 space-y-1">
              <div>0.60 × <span className="text-sky-300">Hazard Score</span> + 0.40 × <span className="text-emerald-300">Normalized Capital Exposure Score</span></div>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            The Priority Score answers: <em>"Where should the lender focus field operations, contact center leaders, and dispatch relief support first?"</em> It prioritizes villages with severe climate hazards and substantial microfinance capital exposure, without corrupting the underlying physical flood probability.
          </p>
        </div>

        {/* Open-Source Attribution & Scientific Licenses */}
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Award className="w-5 h-5 text-sky-400" />
            <h3 className="text-sm font-bold text-white">
              Data Providers & Open-Source Attribution
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">Open-Meteo Weather API</span>
                <span className="text-[10px] font-mono text-emerald-400">CC-BY 4.0 / AGPL-3.0</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                High-resolution numerical weather prediction models (ECMWF IFS, DWD ICON, GFS) providing 3, 5, and 7-day precipitation forecasts.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">CGIAR Climate Data Hub / CHIRPS</span>
                <span className="text-[10px] font-mono text-emerald-400">MIT License</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Pre-calibrated 30-year climatological normal baselines (CHIRPS v2.0, Funk et al., 2015) used for historical anomaly comparison.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">Copernicus Sentinel-1 SAR</span>
                <span className="text-[10px] font-mono text-purple-400">ESA Open Access</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                European Space Agency Copernicus Sentinel-1 C-band Synthetic Aperture Radar (SAR) IW GRD acquisitions verifying flood inundation extent.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">Central Water Commission (CWC)</span>
                <span className="text-[10px] font-mono text-sky-400">Govt of India</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Ministry of Jal Shakti river hydrological gauge telemetry (Hayaghat, Kamtaul, Jhanjharpur) measuring peak flood crests against danger levels.
              </p>
            </div>
          </div>
        </div>

        {/* Mandatory Scientific Disclaimers Box */}
        <div className="p-4 rounded-xl border border-slate-800 bg-[#090d16] text-[11px] font-mono text-slate-400 space-y-2">
          <div className="text-slate-300 font-semibold uppercase tracking-wider">
            Mandatory Institutional Disclaimers
          </div>
          <p>
            1. <strong>Credit Default:</strong> Umbrella evaluates physical climate-exposed capital; it does <em>NOT</em> predict individual borrower credit default or credit scores.
          </p>
          <p>
            2. <strong>Carbon Accounting:</strong> Emissions avoided calculations are activity-based operational proxies (<code>ESTIMATED_EMISSIONS_AVOIDED</code>); they do not constitute certified carbon credits or guaranteed revenue.
          </p>
          <p>
            3. <strong>Decision Support:</strong> System recommendations are non-prescriptive advisories for human credit officer review; Umbrella does not automatically modify financial contracts.
          </p>
        </div>
      </div>
    </div>
  );
}
