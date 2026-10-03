'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../../lib/api';
import {
  DistrictPilotProfile,
  FloodHazardEvaluation,
  MFIRecommendationResponse,
  PilotVillage,
  PortfolioClimateImpact,
  PortfolioExposure,
  VillagePipelineResult,
} from '../../lib/types';
import { formatINR, formatNumber, getHazardColor, getPriorityColor } from '../../lib/utils';
import { Navbar } from '../../components/Navbar';
import { LeafletMap } from '../../components/LeafletMap';
import { ClusterDetailDrawer } from '../../components/ClusterDetailDrawer';
import { ActionModal } from '../../components/ActionModal';
import { ProvenanceBadge } from '../../components/ProvenanceBadge';
import {
  AlertTriangle,
  Building,
  Users,
  Droplets,
  Layers,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  Loader2,
} from 'lucide-react';

export default function DashboardPage() {
  const [horizon, setHorizon] = useState<number>(5);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [colorMode, setColorMode] = useState<'hazard' | 'priority'>('hazard');

  // Data states
  const [pilotProfile, setPilotProfile] = useState<DistrictPilotProfile | null>(null);
  const [districtGeoJSON, setDistrictGeoJSON] = useState<any>(null);
  const [pipelineResults, setPipelineResults] = useState<VillagePipelineResult[]>([]);
  const [selectedVillageId, setSelectedVillageId] = useState<string | null>(null);

  // Action Modal state
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionLog, setActionLog] = useState<Record<string, any>>({});

  // Load initial pilot data
  const loadData = async (h: number = horizon) => {
    try {
      setIsRefreshing(true);
      const [profile, boundary, results] = await Promise.all([
        api.getPilotGeography(),
        api.getDistrictBoundary('darbhanga'),
        api.runAllVillages(h, 7), // 7 is July monsoon baseline
      ]);

      setPilotProfile(profile);
      setDistrictGeoJSON(boundary);
      setPipelineResults(results);
      setLastUpdated(new Date().toLocaleTimeString('en-IN'));

      // NOTE: We do NOT auto-select a cluster on mount by default.
      // When NO cluster is selected, the dashboard uses 100% full available width.
      // If a ?village= or ?cluster= query param is specified, or when user clicks a cluster, it opens the detail layout.
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const qVillage = params.get('village') || params.get('cluster');
        if (qVillage && results.some((r) => r.village_id === qVillage)) {
          setSelectedVillageId(qVillage);
        }
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData(horizon);
  }, [horizon]);

  // Selected village detail items
  const selectedResult = useMemo(() => {
    if (!selectedVillageId) return null;
    return pipelineResults.find((r) => r.village_id === selectedVillageId) || null;
  }, [pipelineResults, selectedVillageId]);

  const selectedVillageMeta = useMemo(() => {
    if (!selectedVillageId) return null;
    const list = pilotProfile?.operational_clusters || pilotProfile?.monitored_clusters || [];
    return list.find((c: any) => c.village_id === selectedVillageId) || null;
  }, [pilotProfile, selectedVillageId]);

  // Aggregate KPI Calculations
  const kpis = useMemo(() => {
    if (pipelineResults.length === 0) {
      return {
        highestHazard: { score: 0, level: 'LOW', village: 'N/A' },
        highRiskClustersCount: 0,
        totalPortfolioExposed: 0,
        totalBorrowersExposed: 0,
        totalJLGsExposed: 0,
      };
    }

    let highestScore = 0;
    let highestLevel = 'LOW';
    let highestVillage = '';
    let highRiskCount = 0;
    let totalPort = 0;
    let totalBorrowers = 0;
    let totalJLGs = 0;

    pipelineResults.forEach((res) => {
      const score = res.flood_hazard.hazard_score;
      if (score > highestScore) {
        highestScore = score;
        highestLevel = res.flood_hazard.hazard_level;
        highestVillage = res.village_name;
      }
      if (res.flood_hazard.hazard_level === 'HIGH' || res.flood_hazard.hazard_level === 'SEVERE') {
        highRiskCount++;
      }
      totalPort += res.portfolio_exposure.outstanding_amount;
      totalBorrowers += res.portfolio_exposure.borrowers_exposed;
      totalJLGs += res.portfolio_exposure.groups_exposed;
    });

    return {
      highestHazard: {
        score: highestScore,
        level: highestLevel,
        village: highestVillage,
      },
      highRiskClustersCount: highRiskCount,
      totalPortfolioExposed: totalPort,
      totalBorrowersExposed: totalBorrowers,
      totalJLGsExposed: totalJLGs,
    };
  }, [pipelineResults]);

  // Map cluster format
  const mapClusters = useMemo(() => {
    return pipelineResults.map((r) => ({
      village_id: r.village_id,
      village_name: r.village_name,
      latitude: r.flood_hazard.latitude,
      longitude: r.flood_hazard.longitude,
      hazard: r.flood_hazard,
      exposure: r.portfolio_exposure,
      impact: r.portfolio_impact,
    }));
  }, [pipelineResults]);

  const handleSaveAction = (actionData: any) => {
    setActionLog((prev) => ({
      ...prev,
      [actionData.village_id]: {
        ...actionData,
        timestamp: new Date().toISOString(),
      },
    }));
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Navbar */}
      <Navbar
        title="Climate Risk Command Center"
        horizon={horizon}
        onHorizonChange={setHorizon}
        isRefreshing={isRefreshing}
        onRefresh={() => loadData(horizon)}
        lastUpdated={lastUpdated}
        sourceMode={pipelineResults[0]?.flood_hazard?.data_source_mode || 'LIVE'}
      />

      {/* Main Content Area */}
      <div className="p-6 space-y-6 flex-1">
        {/* Synthetic Portfolio Advisory Banner */}
        <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-800/40 flex items-center justify-between text-xs text-amber-300">
          <div className="flex items-center gap-2">
            <span className="font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-200 border border-amber-500/30 font-mono text-[10px]">
              SYNTHETIC PORTFOLIO
            </span>
            <span>
              All borrower counts, loan volumes, and JLG balances are deterministic synthetic demo values. Physical climate hazard is evaluated independently.
            </span>
          </div>
          <span className="font-mono text-[11px] text-amber-400/80 hidden lg:inline">
            Decoupled Architecture
          </span>
        </div>

        {/* Master-Detail Responsive Layout */}
        <div className={selectedResult ? 'grid grid-cols-1 xl:grid-cols-12 gap-6 items-start' : 'space-y-6'}>
          {/* Main Dashboard Column: Full width when no selection, ~67% (col-span-8) when cluster selected */}
          <div className={selectedResult ? 'xl:col-span-8 space-y-6' : 'space-y-6'}>
            {/* 4 Top KPI Metric Cards */}
            <div
              className={
                selectedResult
                  ? 'grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-4'
                  : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'
              }
            >
              {/* Card 1: Peak Physical Hazard */}
              <div className="p-4 rounded-xl border border-slate-800 bg-[#0f172a] shadow-lg">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold uppercase tracking-wider text-[11px]">
                    Peak Physical Hazard
                  </span>
                  <Droplets className="w-4 h-4 text-sky-400" />
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span
                    className={`text-3xl font-extrabold font-mono ${
                      getHazardColor(kpis.highestHazard.level as any).text
                    }`}
                  >
                    {kpis.highestHazard.score.toFixed(1)}
                  </span>
                  <span className="text-xs font-mono text-slate-400">/ 100</span>
                  <span
                    className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                      getHazardColor(kpis.highestHazard.level as any).badge
                    }`}
                  >
                    {kpis.highestHazard.level}
                  </span>
                </div>
                <div className="mt-2 text-xs text-slate-300 flex items-center justify-between">
                  <span>
                    Cluster: <strong>{kpis.highestHazard.village || 'N/A'}</strong>
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">{horizon}D Horizon</span>
                </div>
              </div>

              {/* Card 2: Active High-Risk Clusters */}
              <div className="p-4 rounded-xl border border-slate-800 bg-[#0f172a] shadow-lg">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold uppercase tracking-wider text-[11px]">
                    High-Risk Clusters
                  </span>
                  <AlertTriangle className="w-4 h-4 text-orange-400" />
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold font-mono text-orange-400">
                    {kpis.highRiskClustersCount}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    / {pipelineResults.length || 10} monitored
                  </span>
                </div>
                <div className="mt-2 text-xs text-slate-400">
                  Clusters exceeding 50.0 hazard threshold
                </div>
              </div>

              {/* Card 3: Total Portfolio Exposed */}
              <div className="p-4 rounded-xl border border-slate-800 bg-[#0f172a] shadow-lg">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold uppercase tracking-wider text-[11px]">
                    Portfolio Capital Exposed
                  </span>
                  <Building className="w-4 h-4 text-amber-400" />
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold font-mono text-amber-300">
                    {formatINR(kpis.totalPortfolioExposed)}
                  </span>
                </div>
                <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
                  <span>Across {kpis.totalJLGsExposed} JLG Centers</span>
                  <span className="text-[10px] text-amber-400 font-mono">Synthetic</span>
                </div>
              </div>

              {/* Card 4: Borrowers Exposed */}
              <div className="p-4 rounded-xl border border-slate-800 bg-[#0f172a] shadow-lg">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold uppercase tracking-wider text-[11px]">
                    Clients Geographically Exposed
                  </span>
                  <Users className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold font-mono text-emerald-400">
                    {formatNumber(kpis.totalBorrowersExposed)}
                  </span>
                  <span className="text-xs font-mono text-slate-400">borrowers</span>
                </div>
                <div className="mt-2 text-xs text-slate-400">
                  Agrarian livelihoods in Bagmati floodplains
                </div>
              </div>
            </div>

            {/* Map & Quick Inspection Layout */}
            <div className={selectedResult ? 'space-y-6' : 'grid grid-cols-1 lg:grid-cols-12 gap-6'}>
              {/* Map Container */}
              <div className={selectedResult ? 'w-full space-y-3' : 'lg:col-span-8 space-y-3'}>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white tracking-wide">
                      Geospatial Climate Hazard & Portfolio Map
                    </h3>
                    <span className="text-xs font-mono text-slate-400">
                      Darbhanga District (OSM Rel: 1568263)
                    </span>
                  </div>

                  {/* Map Layer Mode Toggle */}
                  <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-0.5 rounded-lg text-xs">
                    <button
                      onClick={() => setColorMode('hazard')}
                      className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                        colorMode === 'hazard'
                          ? 'bg-sky-500 text-slate-950 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Physical Hazard
                    </button>
                    <button
                      onClick={() => setColorMode('priority')}
                      className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                        colorMode === 'priority'
                          ? 'bg-sky-500 text-slate-950 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Lender Priority
                    </button>
                  </div>
                </div>

                <LeafletMap
                  districtGeoJSON={districtGeoJSON}
                  clusters={mapClusters}
                  selectedVillageId={selectedVillageId}
                  onSelectVillage={(id) => setSelectedVillageId(id)}
                  colorBy={colorMode}
                  height={selectedResult ? '480px' : '520px'}
                />
              </div>

              {/* Quick Monitored Clusters Rank List */}
              <div
                className={
                  selectedResult
                    ? 'w-full rounded-xl border border-slate-800 bg-[#0f172a] p-4 flex flex-col max-h-[380px]'
                    : 'lg:col-span-4 rounded-xl border border-slate-800 bg-[#0f172a] p-4 flex flex-col h-[560px]'
                }
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Operational Clusters ({pipelineResults.length})
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Sorted by {colorMode === 'hazard' ? 'Hazard' : 'Priority'}
                  </span>
                </div>

                <div className="mt-3 flex-1 overflow-y-auto space-y-2 pr-1 content-auto">
                  {[...pipelineResults]
                    .sort((a, b) =>
                      colorMode === 'hazard'
                        ? b.flood_hazard.hazard_score - a.flood_hazard.hazard_score
                        : b.portfolio_impact.priority_score - a.portfolio_impact.priority_score
                    )
                    .map((res) => {
                      const isSelected = res.village_id === selectedVillageId;
                      const hazardCol = getHazardColor(res.flood_hazard.hazard_level);
                      const priorityCol = getPriorityColor(res.portfolio_impact.priority_level);
                      const actionRecord = actionLog[res.village_id];

                      return (
                        <div
                          key={res.village_id}
                          onClick={() => setSelectedVillageId(res.village_id)}
                          className={`p-3 rounded-lg border cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-sky-500/10 border-sky-500/60 shadow-md'
                              : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-xs text-slate-100">
                              {res.village_name}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              {res.village_id}
                            </span>
                          </div>

                          <div className="mt-2 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-xs font-mono font-bold ${hazardCol.text}`}>
                                H: {res.flood_hazard.hazard_score.toFixed(1)}
                              </span>
                              <span className="text-slate-600">|</span>
                              <span className={`text-xs font-mono font-bold ${priorityCol.text}`}>
                                P: {res.portfolio_impact.priority_score.toFixed(1)}
                              </span>
                            </div>

                            <span className="text-xs font-mono font-medium text-slate-300">
                              {formatINR(res.portfolio_exposure.outstanding_amount)}
                            </span>
                          </div>

                          {/* Action status pill if reviewed */}
                          {actionRecord && (
                            <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                              <span className="text-emerald-400 font-medium flex items-center gap-1">
                                <CheckCircle className="w-3 h-3 text-emerald-400" />
                                {actionRecord.status}
                              </span>
                              <span className="text-slate-500 font-mono">
                                +{actionRecord.approved_grace_days}d Grace
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>

                {/* Quick Inspect / Close Buttons */}
                {selectedResult && (
                  <button
                    onClick={() => setSelectedVillageId(null)}
                    className="mt-3 w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Close Cluster Details (Full View)</span>
                  </button>
                )}
              </div>
            </div>

            {/* Complete Operational Clusters Table */}
            <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">
                    Monitored Village Clusters — Risk & Exposure Registry
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Explicit decoupling: Physical Flood Hazard is evaluated independently of Synthetic Portfolio Exposure
                  </p>
                </div>
                <div className="text-xs font-mono text-slate-400">
                  Showing {pipelineResults.length} Clusters · Horizon: {horizon} Days
                </div>
              </div>

              <div className="overflow-x-auto mt-4">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 text-[11px] font-mono uppercase">
                    <tr>
                      <th className="py-3 px-3">Village Cluster</th>
                      <th className="py-3 px-3">Subdivision</th>
                      <th className="py-3 px-3">Physical Hazard</th>
                      <th className="py-3 px-3">Severity</th>
                      <th className="py-3 px-3">Portfolio Exposed</th>
                      <th className="py-3 px-3">Borrowers</th>
                      <th className="py-3 px-3">Lender Priority</th>
                      <th className="py-3 px-3">Human Review</th>
                      <th className="py-3 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300 font-sans">
                    {pipelineResults.map((res) => {
                      const hazardCol = getHazardColor(res.flood_hazard.hazard_level);
                      const priorityCol = getPriorityColor(res.portfolio_impact.priority_level);
                      const isSelected = res.village_id === selectedVillageId;
                      const actionRecord = actionLog[res.village_id];

                      return (
                        <tr
                          key={res.village_id}
                          onClick={() => setSelectedVillageId(res.village_id)}
                          className={`hover:bg-slate-800/40 cursor-pointer transition-colors ${
                            isSelected ? 'bg-sky-500/10' : ''
                          }`}
                        >
                          <td className="py-3 px-3">
                            <div className="font-semibold text-slate-100">{res.village_name}</div>
                            <div className="text-[10px] font-mono text-slate-400">{res.village_id}</div>
                          </td>
                          <td className="py-3 px-3 text-slate-400">
                            {(pilotProfile?.operational_clusters || pilotProfile?.monitored_clusters || []).find(
                              (c: any) => c.village_id === res.village_id
                            )?.subdivision || (res as any).block_name || 'Darbhanga'}
                          </td>
                          <td className="py-3 px-3 font-mono font-bold">
                            <span className={hazardCol.text}>{res.flood_hazard.hazard_score.toFixed(1)}</span>
                            <span className="text-slate-400 text-[10px]"> / 100</span>
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${hazardCol.badge}`}
                            >
                              {res.flood_hazard.hazard_level}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-200">
                            {formatINR(res.portfolio_exposure.outstanding_amount)}
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-300">
                            {formatNumber(res.portfolio_exposure.borrowers_exposed)}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${priorityCol.badge}`}
                            >
                              {res.portfolio_impact.priority_level} ({res.portfolio_impact.priority_score.toFixed(1)})
                            </span>
                          </td>
                          <td className="py-3 px-3 text-[11px]">
                            {actionRecord ? (
                              <span className="text-emerald-400 font-semibold font-mono">
                                {actionRecord.status}
                              </span>
                            ) : (
                              <span className="text-amber-400/90 font-mono">PENDING</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedVillageId(res.village_id);
                                setIsActionModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 text-[11px] font-medium border border-slate-700 transition-all"
                            >
                              Review
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column: Inline Master-Detail Panel on Desktop (xl:col-span-4, ~33%) */}
          {selectedResult && (
            <div className="hidden xl:block xl:col-span-4 transition-all duration-300">
              <ClusterDetailDrawer
                variant="inline"
                village={selectedVillageMeta}
                hazard={selectedResult.flood_hazard}
                exposure={selectedResult.portfolio_exposure}
                impact={selectedResult.portfolio_impact}
                recommendations={selectedResult.recommendations}
                onClose={() => setSelectedVillageId(null)}
                onOpenActionModal={() => setIsActionModalOpen(true)}
              />
            </div>
          )}
        </div>

        {/* Responsive Drawer on Tablet & Mobile (<xl: Drawer with Backdrop, No Screen Crowding) */}
        {selectedResult && (
          <div className="xl:hidden">
            <ClusterDetailDrawer
              variant="drawer"
              village={selectedVillageMeta}
              hazard={selectedResult.flood_hazard}
              exposure={selectedResult.portfolio_exposure}
              impact={selectedResult.portfolio_impact}
              recommendations={selectedResult.recommendations}
              onClose={() => setSelectedVillageId(null)}
              onOpenActionModal={() => setIsActionModalOpen(true)}
            />
          </div>
        )}
      </div>

      {/* Action Authorization Modal */}
      {selectedResult && (
        <ActionModal
          recommendation={selectedResult.recommendations}
          isOpen={isActionModalOpen}
          onClose={() => setIsActionModalOpen(false)}
          onSaveAction={handleSaveAction}
        />
      )}
    </div>
  );
}
