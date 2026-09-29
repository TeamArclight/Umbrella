'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { VillagePipelineResult } from '../../lib/types';
import { formatINR, getHazardColor, getPriorityColor } from '../../lib/utils';
import { Navbar } from '../../components/Navbar';
import { ActionModal } from '../../components/ActionModal';
import {
  CheckSquare,
  Clock,
  ShieldCheck,
  Send,
  AlertTriangle,
  FileCheck,
  Filter,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface LocalActionRecord {
  village_id: string;
  village_name: string;
  status: 'PENDING_REVIEW' | 'ACKNOWLEDGED' | 'ACTIONED' | 'DISMISSED';
  reviewed_by?: string;
  approved_grace_days?: number;
  notes?: string;
  timestamp?: string;
}

export default function ActionsPage() {
  const [horizon, setHorizon] = useState<number>(5);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [pipelineResults, setPipelineResults] = useState<VillagePipelineResult[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Human Decision Records Store
  const [actionRecords, setActionRecords] = useState<Record<string, LocalActionRecord>>({});
  const [activeModalVillage, setActiveModalVillage] = useState<VillagePipelineResult | null>(null);

  const loadData = async (h: number) => {
    try {
      setIsLoading(true);
      const results = await api.runAllVillages(h, 7);
      setPipelineResults(results);

      // Seed default action records from results
      setActionRecords((prev) => {
        const updated = { ...prev };
        results.forEach((r) => {
          if (!updated[r.village_id]) {
            updated[r.village_id] = {
              village_id: r.village_id,
              village_name: r.village_name,
              status: 'PENDING_REVIEW',
              approved_grace_days: r.recommendations.system_recommendation.recommended_grace_period_days,
            };
          }
        });
        return updated;
      });

      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        if (params.get('modal') === 'true' && results.length > 0) {
          setActiveModalVillage(results[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load actions data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(horizon);
  }, [horizon]);

  const handleSaveAction = (data: any) => {
    setActionRecords((prev) => ({
      ...prev,
      [data.village_id]: {
        village_id: data.village_id,
        village_name:
          pipelineResults.find((r) => r.village_id === data.village_id)?.village_name ||
          data.village_id,
        status: data.status,
        reviewed_by: data.reviewed_by,
        approved_grace_days: data.approved_grace_days,
        notes: data.notes,
        timestamp: new Date().toLocaleTimeString(),
      },
    }));
  };

  // Status Counts
  const counts = Object.values(actionRecords).reduce(
    (acc, curr) => {
      acc.total++;
      if (curr.status === 'PENDING_REVIEW') acc.pending++;
      else if (curr.status === 'ACKNOWLEDGED') acc.acknowledged++;
      else if (curr.status === 'ACTIONED') acc.actioned++;
      else if (curr.status === 'DISMISSED') acc.dismissed++;
      return acc;
    },
    { total: 0, pending: 0, acknowledged: 0, actioned: 0, dismissed: 0 }
  );

  const filteredResults = pipelineResults.filter((r) => {
    if (filterStatus === 'ALL') return true;
    const st = actionRecords[r.village_id]?.status || 'PENDING_REVIEW';
    return st === filterStatus;
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar
        title="Decision Support Action Center"
        horizon={horizon}
        onHorizonChange={setHorizon}
        onRefresh={() => loadData(horizon)}
        sourceMode="DERIVED"
      />

      <div className="p-6 space-y-6 flex-1">
        {/* Governance & Human Authorization Policy Banner */}
        <div className="p-4 rounded-xl border border-sky-800/60 bg-sky-950/25 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-sky-400" />
              <h2 className="text-base font-bold text-white">
                Human-in-the-Loop Risk Advisory Queue
              </h2>
            </div>
            <p className="text-xs text-sky-200/80 leading-relaxed max-w-4xl">
              Umbrella provides non-prescriptive, explainable decision support. The system <strong>never</strong> alters loan terms, executes automatic restructuring, or modifies core banking credit contracts without formal credit officer authorization.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-950/50 border border-emerald-700/50 px-3 py-1.5 rounded-lg">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Audit Trail Enabled</span>
          </div>
        </div>

        {/* Action Status Summary Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div
            onClick={() => setFilterStatus('PENDING_REVIEW')}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
              filterStatus === 'PENDING_REVIEW'
                ? 'bg-amber-950/40 border-amber-500'
                : 'bg-[#0f172a] border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="text-[11px] font-semibold text-slate-400 uppercase">Pending Review</div>
            <div className="text-2xl font-bold font-mono text-amber-400 mt-1">{counts.pending}</div>
          </div>

          <div
            onClick={() => setFilterStatus('ACKNOWLEDGED')}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
              filterStatus === 'ACKNOWLEDGED'
                ? 'bg-sky-950/40 border-sky-500'
                : 'bg-[#0f172a] border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="text-[11px] font-semibold text-slate-400 uppercase">Acknowledged</div>
            <div className="text-2xl font-bold font-mono text-sky-400 mt-1">{counts.acknowledged}</div>
          </div>

          <div
            onClick={() => setFilterStatus('ACTIONED')}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
              filterStatus === 'ACTIONED'
                ? 'bg-emerald-950/40 border-emerald-500'
                : 'bg-[#0f172a] border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="text-[11px] font-semibold text-slate-400 uppercase">Actioned</div>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">{counts.actioned}</div>
          </div>

          <div
            onClick={() => setFilterStatus('ALL')}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
              filterStatus === 'ALL'
                ? 'bg-slate-800/80 border-slate-600'
                : 'bg-[#0f172a] border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="text-[11px] font-semibold text-slate-400 uppercase">Total Queue</div>
            <div className="text-2xl font-bold font-mono text-white mt-1">{counts.total}</div>
          </div>
        </div>

        {/* Action Queue List */}
        <div className="space-y-4">
          {filteredResults.map((res) => {
            const hazardCol = getHazardColor(res.flood_hazard.hazard_level);
            const priorityCol = getPriorityColor(res.portfolio_impact.priority_level);
            const actionRecord = actionRecords[res.village_id] || { status: 'PENDING_REVIEW' };
            const rec = res.recommendations.system_recommendation;

            return (
              <div
                key={res.village_id}
                className="rounded-xl border border-slate-800 bg-[#0f172a] p-5 shadow-lg space-y-4 hover:border-slate-700/80 transition-all"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white">{res.village_name}</h3>
                        <span className="text-xs font-mono text-slate-400">({res.village_id})</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        District: {res.district} · Outstanding: {formatINR(res.portfolio_exposure.outstanding_amount)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded text-xs font-bold uppercase border ${hazardCol.badge}`}
                    >
                      Hazard: {res.flood_hazard.hazard_score.toFixed(1)} ({res.flood_hazard.hazard_level})
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded text-xs font-bold uppercase border ${priorityCol.badge}`}
                    >
                      Priority: {res.portfolio_impact.priority_level}
                    </span>
                  </div>
                </div>

                {/* Advisories Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Left: System Advisories */}
                  <div className="space-y-2 p-3.5 rounded-lg bg-slate-900/60 border border-slate-800">
                    <div className="font-semibold text-slate-200 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-sky-400">
                        <FileCheck className="w-4 h-4" />
                        System Advisory
                      </span>
                      <span className="font-mono text-sky-300">
                        Suggested Grace: +{rec.recommended_grace_period_days} Days
                      </span>
                    </div>

                    <ul className="space-y-1 text-slate-300">
                      {rec.operational_advisories.map((adv, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-sky-400">•</span>
                          <span>{adv}</span>
                        </li>
                      ))}
                    </ul>

                    {rec.sms_advisory_template && (
                      <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                        <span className="font-semibold text-slate-300">SMS Advisory Draft: </span>
                        <span className="italic">"{rec.sms_advisory_template}"</span>
                      </div>
                    )}
                  </div>

                  {/* Right: Human Decision Status & Audit Trail */}
                  <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-slate-200">Management Decision</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            actionRecord.status === 'ACTIONED'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : actionRecord.status === 'ACKNOWLEDGED'
                              ? 'bg-sky-950 text-sky-400 border border-sky-800'
                              : 'bg-amber-950 text-amber-400 border border-amber-800'
                          }`}
                        >
                          {actionRecord.status.replace('_', ' ')}
                        </span>
                      </div>

                      {actionRecord.reviewed_by ? (
                        <div className="space-y-1 text-[11px] text-slate-300">
                          <div>Reviewed by: <strong className="text-white">{actionRecord.reviewed_by}</strong></div>
                          <div>Approved Grace: <strong className="text-sky-300">+{actionRecord.approved_grace_days} Days</strong></div>
                          {actionRecord.notes && (
                            <div className="text-slate-400 italic">Notes: "{actionRecord.notes}"</div>
                          )}
                          {actionRecord.timestamp && (
                            <div className="text-[10px] font-mono text-slate-500 pt-1">
                              Recorded at: {actionRecord.timestamp}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-slate-400 text-xs italic mt-2">
                          Pending credit officer assessment and authorization.
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                      <button
                        onClick={() => setActiveModalVillage(res)}
                        className="px-3.5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold transition-all shadow"
                      >
                        {actionRecord.reviewed_by ? 'Update Review' : 'Authorize Action'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Authorization Modal */}
      {activeModalVillage && (
        <ActionModal
          recommendation={activeModalVillage.recommendations}
          isOpen={!!activeModalVillage}
          onClose={() => setActiveModalVillage(null)}
          onSaveAction={handleSaveAction}
        />
      )}
    </div>
  );
}
