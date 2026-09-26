'use client';

import React from 'react';
import {
  FloodHazardEvaluation,
  MFIRecommendationResponse,
  PilotVillage,
  PortfolioClimateImpact,
  PortfolioExposure,
} from '../lib/types';
import { formatINR, formatNumber, getHazardColor, getPriorityColor } from '../lib/utils';
import { ProvenanceBadge } from './ProvenanceBadge';
import { HazardExplainability } from './HazardExplainability';
import {
  X,
  MapPin,
  Compass,
  Mountain,
  Droplets,
  Calendar,
  AlertTriangle,
  FileText,
  Send,
  Users,
  Building,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';

interface ClusterDetailDrawerProps {
  village?: PilotVillage | null;
  hazard?: FloodHazardEvaluation | null;
  exposure?: PortfolioExposure | null;
  impact?: PortfolioClimateImpact | null;
  recommendations?: MFIRecommendationResponse | null;
  onClose: () => void;
  onOpenActionModal?: () => void;
}

export function ClusterDetailDrawer({
  village,
  hazard,
  exposure,
  impact,
  recommendations,
  onClose,
  onOpenActionModal,
}: ClusterDetailDrawerProps) {
  if (!village && !hazard) return null;

  const villageName = hazard?.village_name || village?.village_name || 'Village Node';
  const villageId = hazard?.village_id || village?.village_id || '';
  const hazardColors = hazard ? getHazardColor(hazard.hazard_level) : getHazardColor('LOW');
  const priorityColors = impact ? getPriorityColor(impact.priority_level) : getPriorityColor('LOW');

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-xl bg-[#090d16] border-l border-slate-800 shadow-2xl z-50 flex flex-col h-screen overflow-hidden">
      {/* Top Header */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white">{villageName}</h2>
            <span className="text-xs font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60">
              {villageId}
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-sky-400" />
            <span>
              {village?.subdivision || 'Darbhanga'}, {hazard?.district || 'Darbhanga'},{' '}
              {hazard?.state || 'Bihar'}
            </span>
            <span>·</span>
            <span className="font-mono text-slate-400">
              {hazard?.latitude.toFixed(4)}°N, {hazard?.longitude.toFixed(4)}°E
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Scrollable Content Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 content-auto">
        {/* Provenance Mode Banner */}
        {hazard && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            <span className="text-slate-400">Hazard Data Provenance:</span>
            <ProvenanceBadge mode={hazard.data_source_mode} />
          </div>
        )}

        {/* Dual Core Metric Cards: Physical Hazard vs Operational Priority */}
        <div className="grid grid-cols-2 gap-3">
          {/* Card 1: Physical Hazard (Zero Portfolio Bias) */}
          <div className={`p-4 rounded-xl border ${hazardColors.border} ${hazardColors.bg}`}>
            <div className="text-[11px] font-semibold tracking-wider uppercase text-slate-400">
              Physical Flood Hazard
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className={`text-3xl font-extrabold font-mono ${hazardColors.text}`}>
                {hazard ? hazard.hazard_score.toFixed(1) : '--'}
              </span>
              <span className="text-xs font-mono text-slate-400">/ 100</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <span className={`text-xs font-bold uppercase tracking-wider ${hazardColors.text}`}>
                {hazard?.hazard_level || 'LOW'} SEVERITY
              </span>
            </div>
            <p className="mt-2 text-[10px] text-slate-400 leading-snug">
              Atmospheric & hydrological probability only. Zero portfolio weighting.
            </p>
          </div>

          {/* Card 2: Combined Operational Priority */}
          <div className={`p-4 rounded-xl border ${priorityColors.border} ${priorityColors.bg}`}>
            <div className="text-[11px] font-semibold tracking-wider uppercase text-slate-400">
              Lender Priority Index
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className={`text-3xl font-extrabold font-mono ${priorityColors.text}`}>
                {impact ? impact.priority_score.toFixed(1) : '--'}
              </span>
              <span className="text-xs font-mono text-slate-400">/ 100</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <span className={`text-xs font-bold uppercase tracking-wider ${priorityColors.text}`}>
                {impact?.priority_level || 'LOW'} PRIORITY
              </span>
            </div>
            <p className="mt-2 text-[10px] text-slate-400 leading-snug">
              60% Physical Hazard + 40% Portfolio Capital Exposure.
            </p>
          </div>
        </div>

        {/* Hazard Explainability Component */}
        {hazard && <HazardExplainability hazard={hazard} />}

        {/* Independent Portfolio Exposure Section */}
        {exposure && (
          <div className="rounded-xl border border-slate-800 bg-[#0c1220] p-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Microfinance Portfolio Exposure
                </h4>
              </div>
              <ProvenanceBadge mode={exposure.data_type} size="sm" />
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                <div className="text-[10px] font-medium text-slate-400">Total Outstanding Capital</div>
                <div className="text-sm font-bold font-mono text-slate-200 mt-1">
                  {formatINR(exposure.outstanding_amount)}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                <div className="text-[10px] font-medium text-slate-400">Active Borrowers</div>
                <div className="text-sm font-bold font-mono text-slate-200 mt-1">
                  {formatNumber(exposure.borrowers_exposed)} clients
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                <div className="text-[10px] font-medium text-slate-400">Joint Liability Groups (JLGs)</div>
                <div className="text-sm font-bold font-mono text-slate-200 mt-1">
                  {exposure.groups_exposed} groups
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                <div className="text-[10px] font-medium text-slate-400">Green Agriculture Loans</div>
                <div className="text-sm font-bold font-mono text-emerald-400 mt-1">
                  {exposure.green_loans_exposed} active
                </div>
              </div>
            </div>

            <p className="mt-3 text-[10px] text-slate-400 italic font-mono leading-relaxed">
              {exposure.disclaimer}
            </p>
          </div>
        )}

        {/* Physical Terrain Attributes */}
        {village?.terrain && (
          <div className="rounded-xl border border-slate-800 bg-[#0c1220] p-4 text-xs">
            <h4 className="font-bold text-white uppercase tracking-wider text-xs mb-3 flex items-center gap-2">
              <Mountain className="w-4 h-4 text-sky-400" />
              Physical Terrain & Hydrology
            </h4>
            <div className="grid grid-cols-2 gap-2 text-slate-300 font-mono text-[11px]">
              <div>Elevation: <span className="text-white font-bold">{village.terrain.elevation_meters} m</span></div>
              <div>Slope: <span className="text-white font-bold">{village.terrain.slope_percentage}%</span></div>
              <div>River Proximity: <span className="text-white font-bold">{village.terrain.distance_to_major_river_km} km</span></div>
              <div>Basin: <span className="text-sky-300 font-medium">{village.terrain.primary_river_system}</span></div>
              <div>Drainage Capacity: <span className="text-white font-bold">{village.terrain.drainage_capacity_rating} / 5</span></div>
              <div>Crop Vulnerability: <span className="text-amber-300 font-bold">{village.terrain.crop_flood_vulnerability_index}</span></div>
            </div>
          </div>
        )}

        {/* Decision Support Recommendations */}
        {recommendations?.system_recommendation && (
          <div className="rounded-xl border border-sky-800/40 bg-sky-950/20 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-sky-900/40 pb-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-400" />
                <h4 className="text-xs font-bold text-white tracking-wide">
                  Decision Support Advisories
                </h4>
              </div>
              <span className="text-[10px] text-sky-300 bg-sky-900/40 px-2 py-0.5 rounded border border-sky-700/50">
                Human Review Required
              </span>
            </div>

            {/* Suggested grace window */}
            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-200">Suggested Repayment Flexibility</div>
                <div className="text-[11px] text-slate-400">Non-prescriptive advisory window</div>
              </div>
              <div className="text-base font-bold font-mono text-sky-400">
                +{recommendations.system_recommendation.recommended_grace_period_days} Days
              </div>
            </div>

            {/* Field advisories */}
            <div>
              <div className="text-[11px] font-semibold text-slate-300 mb-1.5">Recommended Actions:</div>
              <ul className="space-y-1 text-xs text-slate-300">
                {recommendations.system_recommendation.operational_advisories.map((adv, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-sky-400 font-bold">•</span>
                    <span>{adv}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* SMS Template */}
            {recommendations.system_recommendation.sms_advisory_template && (
              <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-xs">
                <div className="flex items-center gap-1.5 text-slate-400 font-semibold mb-1">
                  <Send className="w-3 h-3 text-sky-400" />
                  <span>Draft SMS Advisory (Field Staff / Borrowers):</span>
                </div>
                <p className="text-slate-300 font-sans italic bg-slate-950 p-2 rounded border border-slate-800/80 text-[11px]">
                  "{recommendations.system_recommendation.sms_advisory_template}"
                </p>
              </div>
            )}

            {/* Environmental proxy carbon metric */}
            <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-800/30 text-[11px]">
              <div className="flex items-center justify-between text-emerald-400 font-semibold mb-1">
                <span>Estimated Emissions Avoided (Proxy):</span>
                <span className="font-mono">
                  {recommendations.system_recommendation.estimated_emissions_avoided.toFixed(2)} tCO2e
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                {recommendations.system_recommendation.carbon_disclaimer}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="p-4 border-t border-slate-800 bg-[#090d16] flex items-center justify-between">
        <div className="text-[10px] text-slate-400 max-w-xs leading-tight">
          Advisories require human credit officer authorization before implementation.
        </div>
        <button
          onClick={onOpenActionModal}
          className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold transition-all shadow-md flex items-center gap-2"
        >
          <CheckCircle className="w-4 h-4" />
          <span>Review & Acknowledge</span>
        </button>
      </div>
    </div>
  );
}
