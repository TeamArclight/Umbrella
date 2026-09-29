'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api';
import {
  PortfolioImpactSummary,
  ImpactMethodology,
  CarbonScenarioCalculation,
} from '../../lib/types';
import { Navbar } from '../../components/Navbar';
import { formatINR } from '../../lib/utils';
import {
  BarChart3,
  Leaf,
  ShieldCheck,
  TrendingDown,
  DollarSign,
  Info,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Layers,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

export default function ImpactPage() {
  const [summary, setSummary] = useState<PortfolioImpactSummary | null>(null);
  const [methodologies, setMethodologies] = useState<ImpactMethodology[]>([]);
  const [carbonPriceUsd, setCarbonPriceUsd] = useState<number>(15.0);
  const [carbonScenario, setCarbonScenario] = useState<CarbonScenarioCalculation | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [sumRes, methList] = await Promise.all([
          api.getPortfolioImpact(),
          api.getMethodologies(),
        ]);
        setSummary(sumRes);
        setMethodologies(methList);

        if (sumRes.total_estimated_emissions_avoided_tco2e >= 0) {
          const scen = await api.calculateCarbonScenario(
            sumRes.total_estimated_emissions_avoided_tco2e,
            15.0
          );
          setCarbonScenario(scen);
        }
      } catch (err) {
        console.error('Failed to load impact metrics:', err);
      }
    }
    loadData();
  }, []);

  const handlePriceChange = async (price: number) => {
    setCarbonPriceUsd(price);
    if (!summary) return;
    try {
      const scen = await api.calculateCarbonScenario(
        summary.total_estimated_emissions_avoided_tco2e,
        price
      );
      setCarbonScenario(scen);
    } catch (err) {
      console.error('Carbon scenario calculation error:', err);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar title="Resilience Impact & Uncertified Emissions Avoided" horizon={5} onHorizonChange={() => {}} />

      <div className="p-6 space-y-6 flex-1 max-w-7xl mx-auto w-full">
        {/* Institutional Banner */}
        <div className="p-4 rounded-xl border border-emerald-800/60 bg-emerald-950/25 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Leaf className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white">
                Dual-Track Climate Impact Command Center
              </h2>
            </div>
            <p className="text-xs text-emerald-200/80 leading-relaxed max-w-4xl">
              <strong>MANDATORY METHODOLOGICAL NOTICE:</strong> Tracks operational adaptation resilience (physical assets protecting borrower assets against floods) separately from uncertified greenhouse gas mitigation proxies. Umbrella does <strong>NOT</strong> issue, certify, or trade carbon credits.
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-700/60 px-3 py-1.5 rounded-lg whitespace-nowrap">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>ESTIMATED_EMISSIONS_AVOIDED</span>
          </div>
        </div>

        {/* TRACK 1: ADAPTATION & RESILIENCE METRICS */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-sky-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Track 1: Operational Adaptation & Resilience Impact
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">Darbhanga Pilot District</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-slate-800 bg-[#0f172a] shadow">
              <div className="text-[11px] text-slate-400 font-medium">Resilience Capital Deployed</div>
              <div className="text-2xl font-bold font-mono text-amber-300 mt-1">
                {summary ? formatINR(summary.total_capital_deployed_inr) : '₹0'}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                Approved & disbursed micro-loans
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-[#0f172a] shadow">
              <div className="text-[11px] text-slate-400 font-medium">Assets Installed & Verified</div>
              <div className="text-2xl font-bold font-mono text-white mt-1">
                {summary?.total_assets_verified} <span className="text-xs text-slate-400 font-normal">/ {summary?.total_assets_installed} Installed</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                Verification rate: <span className="text-emerald-400 font-bold">{summary?.verification_rate_pct}%</span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-[#0f172a] shadow">
              <div className="text-[11px] text-slate-400 font-medium">Borrowers / JLGs Protected</div>
              <div className="text-2xl font-bold font-mono text-sky-400 mt-1">
                {summary?.borrowers_covered} <span className="text-xs text-slate-400 font-normal">Clients</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                Across {summary?.breakdown_by_village.length} flood-prone clusters
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-[#0f172a] shadow">
              <div className="text-[11px] text-slate-400 font-medium">Flagged Evidence Audits</div>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                {summary?.flagged_verifications_count} <span className="text-xs text-slate-400 font-normal">Flagged</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                Cryptographic hash & GPS discrepancy
              </div>
            </div>
          </div>
        </div>

        {/* TRACK 2: UNCERTIFIED MITIGATION & CARBON VALUATION SCENARIO */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Leaf className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Track 2: Uncertified Emissions Avoided & Illustrative Scenario
              </h3>
            </div>
            <span className="text-xs font-mono text-emerald-400">Activity-Based GHG Proxies</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Avoided Emissions Summary Card */}
            <div className="p-5 rounded-xl border border-slate-800 bg-[#0f172a] shadow space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs text-slate-400 font-medium">Total Avoided Emissions</span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                  Annualized
                </span>
              </div>

              <div>
                <div className="text-3xl font-bold font-mono text-emerald-400">
                  {summary?.total_estimated_emissions_avoided_tco2e.toFixed(2)}{' '}
                  <span className="text-sm font-sans text-slate-400 font-normal">tCO2e/year</span>
                </div>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Calculated using verified physical asset deployment displacing diesel irrigation and reducing grain spoilage decay emissions.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="font-semibold text-slate-300">Methodology References:</div>
                <div>• UNFCCC AMS-I.A (Small-scale Solar Pumping)</div>
                <div>• FAO/ICRISAT Post-Harvest Waste GHG Proxy</div>
              </div>
            </div>

            {/* Illustrative Carbon Price Valuation Calculator */}
            <div className="lg:col-span-2 p-5 rounded-xl border border-slate-800 bg-[#0f172a] shadow space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Illustrative Carbon Price Scenario Calculator
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Adjust hypothetical voluntary carbon price to model prospective portfolio value
                  </p>
                </div>
                <span className="text-xs font-mono text-amber-400">NOT ACTUAL REVENUE</span>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Assumed Carbon Price:</span>
                  <span className="font-mono text-white font-bold">${carbonPriceUsd.toFixed(1)} / tCO2e</span>
                </div>
                <input
                  type="range"
                  min={5.0}
                  max={80.0}
                  step={2.5}
                  value={carbonPriceUsd}
                  onChange={(e) => handlePriceChange(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>

              {carbonScenario && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-[11px] text-slate-400 font-medium">Illustrative Value (USD)</div>
                    <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                      ${carbonScenario.illustrative_annual_value_usd.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      {carbonScenario.estimated_emissions_avoided_tco2e} tCO2e × ${carbonPriceUsd}/t
                    </div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-[11px] text-slate-400 font-medium">Illustrative Value (INR)</div>
                    <div className="text-xl font-bold font-mono text-amber-300 mt-1">
                      {formatINR(carbonScenario.illustrative_annual_value_inr)}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      @ ₹84.0 / USD indicative exchange rate
                    </div>
                  </div>
                </div>
              )}

              <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-800/40 text-[10px] text-amber-300/80 leading-relaxed">
                <strong>DISCLAIMER:</strong> This is a hypothetical sensitivity model. Umbrella does not certify credits, guarantee carbon off-take contracts, or execute carbon revenue disbursements.
              </div>
            </div>
          </div>
        </div>

        {/* BREAKDOWN TABLES */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Breakdown by Intervention */}
          <div className="p-5 rounded-xl border border-slate-800 bg-[#0f172a] shadow space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Deployment & Impact by Intervention
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[10px] uppercase text-slate-500 border-b border-slate-800">
                  <tr>
                    <th className="pb-2">Intervention</th>
                    <th className="pb-2 text-center">Deployed</th>
                    <th className="pb-2 text-center">Verified</th>
                    <th className="pb-2 text-right">Avoided tCO2e</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
                  {summary?.breakdown_by_intervention.map((item) => (
                    <tr key={item.intervention_id} className="hover:bg-slate-900/60">
                      <td className="py-2.5 font-sans font-medium text-slate-200">
                        {item.intervention_name}
                      </td>
                      <td className="py-2.5 text-center text-slate-400">{item.count}</td>
                      <td className="py-2.5 text-center text-emerald-400 font-bold">{item.verified_count}</td>
                      <td className="py-2.5 text-right">
                        {item.mitigation_status === 'NOT_APPLICABLE' || item.emissions_avoided_tco2e === null || item.emissions_avoided_tco2e === undefined ? (
                          <span className="text-slate-500 font-sans text-[10px]">N/A (Adaptation Only)</span>
                        ) : (
                          <span className="text-emerald-300 font-mono font-medium">
                            {Number(item.emissions_avoided_tco2e).toFixed(2)} t
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Published Methodologies Registry */}
          <div className="p-5 rounded-xl border border-slate-800 bg-[#0f172a] shadow space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Published Impact Methodologies Registry
            </h4>

            <div className="space-y-3">
              {methodologies.map((m) => (
                <div key={m.methodology_id} className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-200">
                    <span>{m.name}</span>
                    <span className="font-mono text-[10px] text-sky-400">{m.version}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    <strong>Baseline:</strong> {m.baseline_description}
                  </p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    <strong>Emission Factor:</strong> {m.emission_factor_description}
                  </p>
                  <div className="text-[10px] text-slate-500 font-mono pt-1">
                    Citation: {m.source_citation}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
