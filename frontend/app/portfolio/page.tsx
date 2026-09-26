'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../../lib/api';
import { VillagePipelineResult } from '../../lib/types';
import { formatINR, formatNumber, getHazardColor, getPriorityColor } from '../../lib/utils';
import { Navbar } from '../../components/Navbar';
import { ProvenanceBadge } from '../../components/ProvenanceBadge';
import {
  Briefcase,
  Building,
  Users,
  ShieldCheck,
  ArrowUpDown,
  AlertTriangle,
  Leaf,
  Layers,
  ChevronRight,
} from 'lucide-react';

export default function PortfolioPage() {
  const [horizon, setHorizon] = useState<number>(5);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [pipelineResults, setPipelineResults] = useState<VillagePipelineResult[]>([]);
  const [sortBy, setSortBy] = useState<'priority' | 'hazard' | 'capital'>('priority');

  const loadData = async (h: number) => {
    try {
      setIsLoading(true);
      const results = await api.runAllVillages(h, 7);
      setPipelineResults(results);
    } catch (err) {
      console.error('Failed to load portfolio data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(horizon);
  }, [horizon]);

  // Aggregate metrics
  const totals = useMemo(() => {
    let capital = 0;
    let borrowers = 0;
    let jlgs = 0;
    let greenLoans = 0;

    let severeCapital = 0;
    let highCapital = 0;
    let modCapital = 0;
    let lowCapital = 0;

    pipelineResults.forEach((r) => {
      const amt = r.portfolio_exposure.outstanding_amount;
      capital += amt;
      borrowers += r.portfolio_exposure.borrowers_exposed;
      jlgs += r.portfolio_exposure.groups_exposed;
      greenLoans += r.portfolio_exposure.green_loans_exposed;

      if (r.flood_hazard.hazard_level === 'SEVERE') severeCapital += amt;
      else if (r.flood_hazard.hazard_level === 'HIGH') highCapital += amt;
      else if (r.flood_hazard.hazard_level === 'MODERATE') modCapital += amt;
      else lowCapital += amt;
    });

    return {
      capital,
      borrowers,
      jlgs,
      greenLoans,
      severeCapital,
      highCapital,
      modCapital,
      lowCapital,
    };
  }, [pipelineResults]);

  // Sorted list
  const sortedList = useMemo(() => {
    return [...pipelineResults].sort((a, b) => {
      if (sortBy === 'priority') {
        return b.portfolio_impact.priority_score - a.portfolio_impact.priority_score;
      }
      if (sortBy === 'hazard') {
        return b.flood_hazard.hazard_score - a.flood_hazard.hazard_score;
      }
      return b.portfolio_exposure.outstanding_amount - a.portfolio_exposure.outstanding_amount;
    });
  }, [pipelineResults, sortBy]);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar
        title="Microfinance Portfolio Climate Exposure"
        horizon={horizon}
        onHorizonChange={setHorizon}
        onRefresh={() => loadData(horizon)}
        sourceMode="SYNTHETIC"
      />

      <div className="p-6 space-y-6 flex-1">
        {/* Synthetic Portfolio Mandatory Banner */}
        <div className="p-4 rounded-xl border border-amber-800/60 bg-amber-950/25 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-bold text-white">
                Institutional Microfinance Portfolio Registry (Darbhanga District)
              </h2>
            </div>
            <p className="text-xs text-amber-200/80 leading-relaxed max-w-4xl">
              <strong>SYNTHETIC DEMO PORTFOLIO:</strong> All borrower counts, Joint Liability Groups (JLGs), and loan balances are deterministic synthetic demo values. Umbrella tracks institutional capital exposed to geographic hazards — it does <strong>NOT</strong> predict individual borrower credit default.
            </p>
          </div>

          <ProvenanceBadge mode="SYNTHETIC" size="lg" />
        </div>

        {/* Aggregate KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-slate-800 bg-[#0f172a]">
            <div className="text-xs text-slate-400 font-semibold uppercase">
              Total Outstanding Capital
            </div>
            <div className="text-2xl font-bold font-mono text-amber-300 mt-2">
              {formatINR(totals.capital)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Synthetic MFI portfolio in Darbhanga
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-[#0f172a]">
            <div className="text-xs text-slate-400 font-semibold uppercase">
              Active Microfinance Clients
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-2">
              {formatNumber(totals.borrowers)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Women borrowers in Joint Liability Groups
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-[#0f172a]">
            <div className="text-xs text-slate-400 font-semibold uppercase">
              JLG Centers Monitored
            </div>
            <div className="text-2xl font-bold font-mono text-white mt-2">
              {totals.jlgs} centers
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Across 10 primary operational clusters
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-[#0f172a]">
            <div className="text-xs text-slate-400 font-semibold uppercase">
              Green Adaptation Loans
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-2">
              {totals.greenLoans} accounts
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Solar micro-pumps & drip kits funded
            </div>
          </div>
        </div>

        {/* Portfolio Exposure Breakdown by Physical Hazard Severity */}
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-400" />
            Capital Distribution Across Physical Climate Hazard Tiers
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-rose-950/20 border border-rose-800/40">
              <div className="flex items-center justify-between text-xs text-rose-300 font-bold uppercase">
                <span>Severe Hazard Tier</span>
                <span>&ge; 70</span>
              </div>
              <div className="mt-2 text-xl font-bold font-mono text-rose-400">
                {formatINR(totals.severeCapital)}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                Highest operational intervention urgency
              </div>
            </div>

            <div className="p-4 rounded-lg bg-orange-950/20 border border-orange-800/40">
              <div className="flex items-center justify-between text-xs text-orange-300 font-bold uppercase">
                <span>High Hazard Tier</span>
                <span>50 - 69</span>
              </div>
              <div className="mt-2 text-xl font-bold font-mono text-orange-400">
                {formatINR(totals.highCapital)}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                Pre-emptive field contact suggested
              </div>
            </div>

            <div className="p-4 rounded-lg bg-amber-950/20 border border-amber-800/40">
              <div className="flex items-center justify-between text-xs text-amber-300 font-bold uppercase">
                <span>Moderate Hazard Tier</span>
                <span>30 - 49</span>
              </div>
              <div className="mt-2 text-xl font-bold font-mono text-amber-400">
                {formatINR(totals.modCapital)}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                Monitored drainage conditions
              </div>
            </div>

            <div className="p-4 rounded-lg bg-emerald-950/20 border border-emerald-800/40">
              <div className="flex items-center justify-between text-xs text-emerald-300 font-bold uppercase">
                <span>Low Hazard Tier</span>
                <span>&lt; 30</span>
              </div>
              <div className="mt-2 text-xl font-bold font-mono text-emerald-400">
                {formatINR(totals.lowCapital)}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                Normal business operations
              </div>
            </div>
          </div>
        </div>

        {/* Sortable Cluster Portfolio Registry */}
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Cluster Portfolio & Priority Table
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Sort to analyze decoupling: Physical Hazard is unaffected by portfolio scale
              </p>
            </div>

            {/* Sort Toggle */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-0.5 rounded-lg text-xs">
              <span className="text-[11px] font-semibold text-slate-400 px-2 uppercase">Sort By:</span>
              <button
                onClick={() => setSortBy('priority')}
                className={`px-2.5 py-1 rounded text-xs font-semibold ${
                  sortBy === 'priority' ? 'bg-sky-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Priority Index
              </button>
              <button
                onClick={() => setSortBy('hazard')}
                className={`px-2.5 py-1 rounded text-xs font-semibold ${
                  sortBy === 'hazard' ? 'bg-sky-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Physical Hazard
              </button>
              <button
                onClick={() => setSortBy('capital')}
                className={`px-2.5 py-1 rounded text-xs font-semibold ${
                  sortBy === 'capital' ? 'bg-sky-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Capital
              </button>
            </div>
          </div>

          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-mono text-[11px] uppercase">
                <tr>
                  <th className="py-3 px-3">Village Cluster</th>
                  <th className="py-3 px-3">Outstanding Capital</th>
                  <th className="py-3 px-3">Borrowers</th>
                  <th className="py-3 px-3">JLGs</th>
                  <th className="py-3 px-3">Physical Hazard</th>
                  <th className="py-3 px-3">Hazard Tier</th>
                  <th className="py-3 px-3">Lender Priority Index</th>
                  <th className="py-3 px-3 text-right">Priority Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {sortedList.map((res) => {
                  const hazardCol = getHazardColor(res.flood_hazard.hazard_level);
                  const priorityCol = getPriorityColor(res.portfolio_impact.priority_level);

                  return (
                    <tr key={res.village_id} className="hover:bg-slate-800/30">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-100">{res.village_name}</div>
                        <div className="text-[10px] font-mono text-slate-400">{res.village_id}</div>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-amber-300">
                        {formatINR(res.portfolio_exposure.outstanding_amount)}
                      </td>
                      <td className="py-3 px-3 font-mono">
                        {formatNumber(res.portfolio_exposure.borrowers_exposed)}
                      </td>
                      <td className="py-3 px-3 font-mono">
                        {res.portfolio_exposure.groups_exposed}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold">
                        <span className={hazardCol.text}>
                          {res.flood_hazard.hazard_score.toFixed(1)}
                        </span>
                        <span className="text-slate-500 text-[10px]"> / 100</span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${hazardCol.badge}`}
                        >
                          {res.flood_hazard.hazard_level}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold">
                        <span className={priorityCol.text}>
                          {res.portfolio_impact.priority_score.toFixed(1)}
                        </span>
                        <span className="text-slate-500 text-[10px]"> / 100</span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold border uppercase ${priorityCol.badge}`}
                        >
                          {res.portfolio_impact.priority_level}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
