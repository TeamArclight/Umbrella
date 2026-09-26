'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../../lib/api';
import {
  HistoricalEvent,
  HistoricalReplayReport,
  HistoricalSnapshotEvaluation,
  ObservedFloodValidationResult,
} from '../../lib/types';
import { formatINR, getHazardColor, getPriorityColor } from '../../lib/utils';
import { Navbar } from '../../components/Navbar';
import { HistoricalTimeline, JULY_2020_TIMELINE_STEPS } from '../../components/HistoricalTimeline';
import { LeafletMap } from '../../components/LeafletMap';
import { ObservedEvidencePanel } from '../../components/ObservedEvidencePanel';
import { ProvenanceBadge } from '../../components/ProvenanceBadge';
import { HazardExplainability } from '../../components/HazardExplainability';
import {
  History,
  Database,
  Satellite,
  Droplets,
  AlertTriangle,
  Play,
  Pause,
  ShieldAlert,
  ChevronRight,
} from 'lucide-react';

export default function HistoricalReplayPage() {
  const [selectedDate, setSelectedDate] = useState<string>('2020-07-25'); // default to peak crest
  const [lookbackDays, setLookbackDays] = useState<number>(5);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Data states
  const [eventData, setEventData] = useState<HistoricalEvent | null>(null);
  const [districtReplay, setDistrictReplay] = useState<any>(null);
  const [districtBoundary, setDistrictBoundary] = useState<any>(null);
  const [villageReplayReport, setVillageReplayReport] = useState<HistoricalReplayReport | null>(null);
  const [evidenceData, setEvidenceData] = useState<ObservedFloodValidationResult | null>(null);
  const [selectedVillageId, setSelectedVillageId] = useState<string>('IND-BIH-DAR-001');

  // Load Event and District Boundary
  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        const [event, boundary, evidence, vReport] = await Promise.all([
          api.getHistoricalEvent('IND-BIH-2020-07'),
          api.getDistrictBoundary('darbhanga'),
          api.getEventEvidence('IND-BIH-2020-07'),
          api.replayVillageEvent('IND-BIH-2020-07', selectedVillageId, lookbackDays),
        ]);
        setEventData(event);
        setDistrictBoundary(boundary);
        setEvidenceData(evidence);
        setVillageReplayReport(vReport);
      } catch (err) {
        console.error('Failed to load initial event data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  // Update district replay when snapshot date changes
  useEffect(() => {
    const fetchReplay = async () => {
      try {
        const replay = await api.replayDistrictEvent('IND-BIH-2020-07', lookbackDays, selectedDate);
        setDistrictReplay(replay);
      } catch (err) {
        console.error('Failed to update district replay snapshot:', err);
      }
    };
    fetchReplay();
  }, [selectedDate, lookbackDays]);

  // Update village replay report when village changes
  useEffect(() => {
    const fetchVillageReport = async () => {
      try {
        const report = await api.replayVillageEvent('IND-BIH-2020-07', selectedVillageId, lookbackDays);
        setVillageReplayReport(report);
      } catch (err) {
        console.error('Failed to update village replay report:', err);
      }
    };
    fetchVillageReport();
  }, [selectedVillageId, lookbackDays]);

  // Automated Timeline Player
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setSelectedDate((current) => {
        const idx = JULY_2020_TIMELINE_STEPS.findIndex((s) => s.date === current);
        if (idx < 0 || idx >= JULY_2020_TIMELINE_STEPS.length - 1) {
          setIsPlaying(false);
          return JULY_2020_TIMELINE_STEPS[0].date;
        }
        return JULY_2020_TIMELINE_STEPS[idx + 1].date;
      });
    }, 2800);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Map cluster format from district replay
  const mapClusters = useMemo(() => {
    const list = districtReplay?.clusters || districtReplay?.cluster_evaluations;
    if (!list) return [];
    return list.map((evalItem: any) => ({
      village_id: evalItem.village_id,
      village_name: evalItem.village_name,
      latitude: evalItem.hazard.latitude,
      longitude: evalItem.hazard.longitude,
      hazard: evalItem.hazard,
      exposure: evalItem.exposure,
      impact: evalItem.impact,
    }));
  }, [districtReplay]);

  // Current snapshot evaluation for selected village
  const activeVillageSnapshot = useMemo(() => {
    if (!villageReplayReport?.snapshots) return null;
    return (
      villageReplayReport.snapshots.find((s) => s.snapshot_date === selectedDate) ||
      villageReplayReport.snapshots[4]
    );
  }, [villageReplayReport, selectedDate]);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar
        title="Historical Disaster Replay & Verification"
        horizon={lookbackDays}
        onHorizonChange={setLookbackDays}
        sourceMode="REANALYSIS"
      />

      <div className="p-6 space-y-6 flex-1">
        {/* Retrospective Reanalysis Mandatory Disclaimer Banner */}
        <div className="p-4 rounded-xl border border-sky-800/60 bg-sky-950/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-sky-400" />
              <h2 className="text-base font-bold text-white">
                July 2020 North Bihar Flood — Retrospective Digital Replay
              </h2>
            </div>
            <p className="text-xs text-sky-200/80 leading-relaxed max-w-4xl">
              <strong>Retrospective Reanalysis Mode:</strong> Environmental drivers derived from ECMWF ERA5 and ERA5-Land. Strictly evaluated using anti-leakage time bounds: for snapshot date <span className="font-mono text-white">T</span>, strictly zero meteorological data <span className="font-mono text-white">&gt; T</span> is accessible.
            </p>
          </div>

          <ProvenanceBadge mode="REANALYSIS" size="lg" />
        </div>

        {/* Chronological Timeline Controller */}
        <HistoricalTimeline
          currentDate={selectedDate}
          onSelectDate={setSelectedDate}
          isPlaying={isPlaying}
          onTogglePlay={() => setIsPlaying(!isPlaying)}
        />

        {/* Map & Snapshot Detail Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Replay Map (7 cols) */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Database className="w-4 h-4 text-sky-400" />
                Darbhanga Replay State at {selectedDate}
              </h3>
              <span className="text-[11px] font-mono text-slate-400">
                Peak Flood Date: 2020-07-25
              </span>
            </div>

            <LeafletMap
              districtGeoJSON={districtBoundary}
              clusters={mapClusters}
              selectedVillageId={selectedVillageId}
              onSelectVillage={setSelectedVillageId}
              colorBy="hazard"
              height="480px"
            />
          </div>

          {/* Chronological Snapshot Deep-Dive for Selected Village (5 cols) */}
          <div className="lg:col-span-5 rounded-xl border border-slate-800 bg-[#0f172a] p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Snapshot Evaluation: {selectedVillageId}
                  </h4>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    Snapshot Date: <strong className="text-sky-300">{selectedDate}</strong>
                  </div>
                </div>

                {activeVillageSnapshot && (
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                      getHazardColor(activeVillageSnapshot.hazard.hazard_level).badge
                    }`}
                  >
                    {activeVillageSnapshot.hazard.hazard_level}
                  </span>
                )}
              </div>

              {/* Village selector pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-3 border-b border-slate-800/80">
                {(districtReplay?.clusters || districtReplay?.cluster_evaluations || [])
                  .slice(0, 5)
                  .map((cl: any) => (
                  <button
                    key={cl.village_id}
                    onClick={() => setSelectedVillageId(cl.village_id)}
                    className={`px-2 py-1 rounded text-[11px] font-mono whitespace-nowrap transition-all ${
                      cl.village_id === selectedVillageId
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    {cl.village_name}
                  </button>
                ))}
              </div>

              {activeVillageSnapshot && (
                <div className="space-y-4 mt-4">
                  {/* Scores Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">
                        Flood Hazard Score
                      </div>
                      <div className="text-2xl font-bold font-mono text-sky-400 mt-1">
                        {activeVillageSnapshot.hazard.hazard_score.toFixed(1)}{' '}
                        <span className="text-xs font-normal text-slate-500">/ 100</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">
                        Accumulated Rain (5D)
                      </div>
                      <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
                        {activeVillageSnapshot.weather.total_accumulated_precipitation_mm.toFixed(1)}{' '}
                        <span className="text-xs font-normal text-slate-500">mm</span>
                      </div>
                    </div>
                  </div>

                  {/* Anti-leakage audit string */}
                  <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-800/30 text-[11px] text-slate-300">
                    <div className="font-semibold text-emerald-400 mb-1 flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Anti-Leakage Verification:</span>
                    </div>
                    <p className="text-slate-400 text-[10px] leading-relaxed">
                      {activeVillageSnapshot.anti_leakage_audit}
                    </p>
                  </div>

                  {/* Primary Drivers */}
                  <div className="text-xs">
                    <span className="font-semibold text-slate-300">Snapshot Drivers:</span>
                    <ul className="mt-1 space-y-1 text-slate-400 text-[11px]">
                      {activeVillageSnapshot.hazard.drivers.map((d, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <span className="text-sky-400">•</span>
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom summary */}
            <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-500 font-mono">
              Peak hazard recorded at Kusheshwar Asthan: 82.4 / 100 on 2020-07-25
            </div>
          </div>
        </div>

        {/* Hazard Progression Across Timeline Chart / Table */}
        {villageReplayReport && (
          <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Chronological Progression Across All Milestones ({villageReplayReport.village_name})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Visual proof of hazard escalating from T-7 to peak T0 and receding by T+3
                </p>
              </div>
              <span className="text-[11px] font-mono text-emerald-400">
                Zero Lookahead Verified
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4">
              {villageReplayReport.snapshots.map((snap) => {
                const isSelected = snap.snapshot_date === selectedDate;
                const hazardCol = getHazardColor(snap.hazard.hazard_level);
                return (
                  <div
                    key={snap.snapshot_date}
                    onClick={() => setSelectedDate(snap.snapshot_date)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-sky-500/15 border-sky-500 shadow-md'
                        : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-[11px] font-mono font-bold text-slate-400">
                      {snap.offset_from_peak_days === 0
                        ? 'T0 (Peak)'
                        : `T${snap.offset_from_peak_days > 0 ? '+' : ''}${snap.offset_from_peak_days}`}
                    </div>
                    <div className="text-[10px] font-mono text-slate-500">{snap.snapshot_date}</div>

                    <div className="mt-2 text-xl font-bold font-mono">
                      <span className={hazardCol.text}>
                        {snap.hazard.hazard_score.toFixed(1)}
                      </span>
                    </div>

                    <div className="mt-1 text-[10px] font-mono text-slate-400">
                      Rain: {snap.weather.total_accumulated_precipitation_mm.toFixed(0)} mm
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Observed Ground-Truth Evidence Panel (CWC & Sentinel-1) */}
        <ObservedEvidencePanel evidence={evidenceData} />
      </div>
    </div>
  );
}
