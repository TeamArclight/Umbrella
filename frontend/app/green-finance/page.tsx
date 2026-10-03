'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api';
import {
  PilotVillage,
  ResilienceIntervention,
  AdaptationRecommendation,
  GreenFinanceProduct,
  FinancingScenarioResponse,
  GreenFinanceApplication,
  ResilienceAsset,
} from '../../lib/types';
import { Navbar } from '../../components/Navbar';
import { formatINR } from '../../lib/utils';
import {
  Leaf,
  Sun,
  Droplets,
  Package,
  ShieldCheck,
  AlertCircle,
  TrendingDown,
  Calculator,
  ArrowRight,
  CheckCircle2,
  Clock,
  UserCheck,
  Sparkles,
  FileCheck,
  Send,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';

export default function GreenFinancePage() {
  const [villages, setVillages] = useState<PilotVillage[]>([]);
  const [selectedVillageId, setSelectedVillageId] = useState<string>('VIL-DAR-HAY');
  const [interventions, setInterventions] = useState<ResilienceIntervention[]>([]);
  const [recommendations, setRecommendations] = useState<AdaptationRecommendation[]>([]);
  const [selectedIntervention, setSelectedIntervention] = useState<ResilienceIntervention | null>(null);
  const [financeProducts, setFinanceProducts] = useState<GreenFinanceProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('prod-micro-adaptation');

  // Calculator State
  const [interventionCost, setInterventionCost] = useState<number>(18000);
  const [borrowerMargin, setBorrowerMargin] = useState<number>(3000);
  const [annualRate, setAnnualRate] = useState<number>(13.5);
  const [tenureMonths, setTenureMonths] = useState<number>(12);
  const [calcResult, setCalcResult] = useState<FinancingScenarioResponse | null>(null);

  // Application Workflow State
  const [activeStep, setActiveStep] = useState<number>(1);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('step');
      if (p) setActiveStep(parseInt(p, 10));
    }
  }, []);
  const [borrowerName, setBorrowerName] = useState<string>('Geeta Devi');
  const [jlgGroupId, setJlgGroupId] = useState<string>('JLG-HAY-04');
  const [livelihood, setLivelihood] = useState<string>('AGRICULTURE_PADDY');
  const [createdApp, setCreatedApp] = useState<GreenFinanceApplication | null>(null);
  const [disbursedAsset, setDisbursedAsset] = useState<ResilienceAsset | null>(null);

  // Human Review Modal State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);
  const [officerId, setOfficerId] = useState<string>('OFF-RISK-019');
  const [officerName, setOfficerName] = useState<string>('Rakesh Kumar (Credit & Risk Lead)');
  const [reviewReason, setReviewReason] = useState<string>(
    'High seasonal flood vulnerability in Bagmati basin; verified 2 completed loan cycles without default.'
  );
  const [reviewNotes, setReviewNotes] = useState<string>('Approved with 30-day monsoon installation grace window.');

  // Load initial data
  useEffect(() => {
    async function init() {
      try {
        const [vList, iList, pList] = await Promise.all([
          api.getVillages('Bihar', 'Darbhanga'),
          api.getInterventions(),
          api.getGreenFinanceProducts(),
        ]);
        setVillages(vList);
        setInterventions(iList);
        setFinanceProducts(pList);

        if (iList.length > 0) {
          setSelectedIntervention(iList[0]);
          setInterventionCost(iList[0].indicative_cost_inr);
        }
      } catch (err) {
        console.error('Failed to load catalog:', err);
      }
    }
    init();
  }, []);

  // Fetch recommendations whenever village changes
  useEffect(() => {
    async function loadRecs() {
      if (!selectedVillageId) return;
      try {
        const resp = await api.getVillageAdaptationRecommendations(selectedVillageId, 5, 7);
        setRecommendations(resp.recommendations);
        if (resp.recommendations.length > 0) {
          const top = resp.recommendations[0].intervention;
          setSelectedIntervention(top);
          setInterventionCost(top.indicative_cost_inr);
          setBorrowerMargin(Math.round(top.indicative_cost_inr * 0.15));
        }
      } catch (err) {
        console.error('Failed to load adaptation recommendations:', err);
      }
    }
    loadRecs();
  }, [selectedVillageId]);

  // Recalculate financing scenario whenever parameters change
  useEffect(() => {
    async function runCalc() {
      if (!selectedIntervention || interventionCost <= 0) return;
      try {
        const res = await api.calculateFinancingScenario(
          {
            intervention_cost_inr: interventionCost,
            borrower_contribution_inr: borrowerMargin,
            annual_interest_rate_pct: annualRate,
            tenure_months: tenureMonths,
            repayment_frequency: 'MONTHLY',
          },
          selectedIntervention.intervention_id
        );
        setCalcResult(res);
      } catch (err) {
        console.error('Financing calculation error:', err);
      }
    }
    runCalc();
  }, [selectedIntervention, interventionCost, borrowerMargin, annualRate, tenureMonths]);

  // Select intervention handler
  const handleSelectIntervention = (item: ResilienceIntervention) => {
    setSelectedIntervention(item);
    setInterventionCost(item.indicative_cost_inr);
    setBorrowerMargin(Math.round(item.indicative_cost_inr * 0.15));
    // Match product
    if (item.category === 'CLEAN_ENERGY_IRRIGATION') {
      setSelectedProductId('prod-solar-equipment');
      setAnnualRate(12.0);
      setTenureMonths(24);
    } else if (item.category === 'LIVESTOCK_PROTECTION') {
      setSelectedProductId('prod-farm-resilience');
      setAnnualRate(14.0);
      setTenureMonths(18);
    } else {
      setSelectedProductId('prod-micro-adaptation');
      setAnnualRate(13.5);
      setTenureMonths(12);
    }
  };

  // Submit Application Draft
  const handleCreateApplication = async () => {
    if (!selectedIntervention || !calcResult) return;
    try {
      const app = await api.createApplication({
        village_id: selectedVillageId,
        borrower_group_id: jlgGroupId,
        borrower_name: borrowerName,
        livelihood: livelihood as any,
        intervention_id: selectedIntervention.intervention_id,
        finance_product_id: selectedProductId,
        requested_amount_inr: calcResult.financed_principal_inr,
        borrower_contribution_inr: borrowerMargin,
        notes: `Application generated for ${selectedIntervention.name} during pre-monsoon risk review.`,
      });
      // Move to UNDER_REVIEW
      const underReview = await api.submitApplicationForReview(app.application_id);
      setCreatedApp(underReview);
      setActiveStep(3);
    } catch (err) {
      console.error('Failed to create application:', err);
      alert('Error creating application: ' + err);
    }
  };

  // Human Review Decision
  const handleRecordDecision = async (decision: 'APPROVED' | 'REJECTED') => {
    if (!createdApp) return;
    try {
      const updated = await api.recordApplicationDecision(createdApp.application_id, {
        decision,
        officer_id: officerId,
        officer_name: officerName,
        approved_amount_inr: createdApp.requested_amount_inr,
        reason: reviewReason,
        notes: reviewNotes,
      });
      setCreatedApp(updated);
      setIsReviewModalOpen(false);

      if (decision === 'APPROVED') {
        // Disburse loan and register physical asset
        const asset = await api.disburseApplication(createdApp.application_id);
        setDisbursedAsset(asset);
        setActiveStep(4);
      }
    } catch (err) {
      console.error('Failed to record human decision:', err);
      alert('Error recording decision: ' + err);
    }
  };

  const selectedVillage = villages.find((v) => v.village_id === selectedVillageId);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar title="Resilience Financing & Green Adaptation Workflow" horizon={5} onHorizonChange={() => {}} />

      <div className="p-6 space-y-6 flex-1 max-w-7xl mx-auto w-full">
        {/* Institutional Header Banner */}
        <div className="p-4 rounded-xl border border-emerald-800/60 bg-emerald-950/25 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Leaf className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white">
                Climate Adaptation & Resilience Financing Workflow
              </h2>
            </div>
            <p className="text-xs text-emerald-200/80 leading-relaxed max-w-4xl">
              <strong>NON-AUTOMATED DECISION SUPPORT:</strong> Umbrella identifies vulnerable clusters and models deterministic financing terms. All loan approvals require auditable human officer authorization. Emissions avoided are uncertified operational proxies.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-700/60 px-3 py-1.5 rounded-lg whitespace-nowrap flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>DECISION_SUPPORT_ONLY</span>
            </span>
          </div>
        </div>

        {/* Stepper Header */}
        <div className="p-4 rounded-xl border border-slate-800 bg-[#0f172a] shadow-lg">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div
              className={`p-3 rounded-lg border flex items-center gap-3 transition-colors ${
                activeStep === 1
                  ? 'border-sky-500/50 bg-sky-950/30 text-white'
                  : 'border-slate-800 bg-slate-900/60 text-slate-400'
              }`}
            >
              <div className="w-7 h-7 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs">
                1
              </div>
              <div>
                <div className="font-semibold">Hazard & Interventions</div>
                <div className="text-[10px] text-slate-400">Match resilience to risk</div>
              </div>
            </div>

            <div
              className={`p-3 rounded-lg border flex items-center gap-3 transition-colors ${
                activeStep === 2
                  ? 'border-sky-500/50 bg-sky-950/30 text-white'
                  : 'border-slate-800 bg-slate-900/60 text-slate-400'
              }`}
            >
              <div className="w-7 h-7 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs">
                2
              </div>
              <div>
                <div className="font-semibold">Financing Calculator</div>
                <div className="text-[10px] text-slate-400">Model EMI & payback</div>
              </div>
            </div>

            <div
              className={`p-3 rounded-lg border flex items-center gap-3 transition-colors ${
                activeStep === 3
                  ? 'border-sky-500/50 bg-sky-950/30 text-white'
                  : 'border-slate-800 bg-slate-900/60 text-slate-400'
              }`}
            >
              <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                3
              </div>
              <div>
                <div className="font-semibold">Human Officer Review</div>
                <div className="text-[10px] text-slate-400">Credit authorization</div>
              </div>
            </div>

            <div
              className={`p-3 rounded-lg border flex items-center gap-3 transition-colors ${
                activeStep === 4
                  ? 'border-emerald-500/50 bg-emerald-950/30 text-white'
                  : 'border-slate-800 bg-slate-900/60 text-slate-400'
              }`}
            >
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                4
              </div>
              <div>
                <div className="font-semibold">Asset Registered</div>
                <div className="text-[10px] text-slate-400">Ready for field verify</div>
              </div>
            </div>
          </div>
        </div>

        {/* STEP 1: CLUSTER SELECTION & RECOMMENDATIONS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Village Selection & Profile */}
          <div className="p-5 rounded-xl border border-slate-800 bg-[#0f172a] shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                1. Monitored Cluster
              </h3>
              <span className="text-[10px] font-mono text-sky-400">Darbhanga Pilot</span>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1.5">
                Select Operational Cluster
              </label>
              <select
                value={selectedVillageId}
                onChange={(e) => setSelectedVillageId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-sky-500"
              >
                {villages.map((v) => (
                  <option key={v.village_id} value={v.village_id}>
                    {v.village_name} ({(v as any).block_name || v.subdivision || 'Darbhanga'})
                  </option>
                ))}
              </select>
            </div>

            {selectedVillage && (
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs space-y-2">
                <div className="flex justify-between text-slate-400">
                  <span>River Basin:</span>
                  <span className="text-slate-200 font-medium">
                    {selectedVillage.terrain?.primary_river_system || selectedVillage.nearest_river || 'Bagmati Basin'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>River Proximity:</span>
                  <span className="text-amber-400 font-mono">
                    {selectedVillage.terrain?.distance_to_major_river_km ?? 1.4} km
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Drainage Rating:</span>
                  <span className="text-slate-200">
                    {selectedVillage.terrain?.drainage_capacity_rating ?? 2} / 5 (Slow)
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Crops Cultivated:</span>
                  <span className="text-slate-200">
                    {Array.isArray((selectedVillage as any).primary_crops)
                      ? (selectedVillage as any).primary_crops.join(', ')
                      : ((selectedVillage as any).primary_crops || 'Paddy, Maize, Lentils')}
                  </span>
                </div>
              </div>
            )}

            <div className="p-3 rounded-lg bg-sky-950/20 border border-sky-800/40 text-[11px] text-sky-300 leading-relaxed">
              <strong>Environmental Insight:</strong> Cluster exhibits high monsoon rainfall susceptibility. Transparent recommendations below are ranked to protect primary agricultural and dairy assets.
            </div>
          </div>

          {/* Right: Ranked Resilience Interventions */}
          <div className="lg:col-span-2 p-5 rounded-xl border border-slate-800 bg-[#0f172a] shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Ranked Resilience Interventions (Rule-Based)
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                {recommendations.length} Suitable Technologies
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {recommendations.map((rec) => {
                const item = rec.intervention;
                const isSelected = selectedIntervention?.intervention_id === item.intervention_id;
                return (
                  <div
                    key={item.intervention_id}
                    onClick={() => handleSelectIntervention(item)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-sky-500 bg-sky-950/20 shadow-md ring-1 ring-sky-500'
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-white leading-snug">
                          {item.name}
                        </span>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 whitespace-nowrap">
                          {rec.ranking_score} pts
                        </span>
                      </div>

                      <div className="mt-1 text-[11px] text-slate-400 font-mono">
                        {item.category.replace(/_/g, ' ')}
                      </div>

                      <p className="mt-2 text-xs text-slate-300 leading-relaxed line-clamp-3">
                        {rec.primary_reason}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Indicative Cost</span>
                        <span className="font-mono font-bold text-amber-300">
                          {formatINR(item.indicative_cost_inr)}
                        </span>
                      </div>
                      <button
                        type="button"
                        className={`text-xs px-3 py-1 rounded font-medium transition-colors ${
                          isSelected
                            ? 'bg-sky-500 text-white font-semibold'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {isSelected ? 'Selected' : 'Model Finance'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* STEP 2: FINANCING SCENARIO CALCULATOR & PROPOSAL */}
        {selectedIntervention && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calculator Controls */}
            <div className="p-5 rounded-xl border border-slate-800 bg-[#0f172a] shadow-lg space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-sky-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    2. Loan Calculator
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-amber-400">DEMO TERMS</span>
              </div>

              {/* Cost Input */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Intervention Cost:</span>
                  <span className="font-mono text-white font-bold">{formatINR(interventionCost)}</span>
                </div>
                <input
                  type="range"
                  min={10000}
                  max={150000}
                  step={2000}
                  value={interventionCost}
                  onChange={(e) => setInterventionCost(Number(e.target.value))}
                  className="w-full accent-sky-500"
                />
              </div>

              {/* Borrower Margin */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Borrower Contribution:</span>
                  <span className="font-mono text-emerald-400 font-bold">{formatINR(borrowerMargin)}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={interventionCost - 2000}
                  step={1000}
                  value={borrowerMargin}
                  onChange={(e) => setBorrowerMargin(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>

              {/* Interest Rate */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Indicative Annual Rate:</span>
                  <span className="font-mono text-white font-bold">{annualRate}% p.a.</span>
                </div>
                <input
                  type="range"
                  min={8.0}
                  max={24.0}
                  step={0.5}
                  value={annualRate}
                  onChange={(e) => setAnnualRate(Number(e.target.value))}
                  className="w-full accent-sky-500"
                />
              </div>

              {/* Tenure Months */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Tenure (Months):</span>
                  <span className="font-mono text-white font-bold">{tenureMonths} Months</span>
                </div>
                <input
                  type="range"
                  min={6}
                  max={36}
                  step={6}
                  value={tenureMonths}
                  onChange={(e) => setTenureMonths(Number(e.target.value))}
                  className="w-full accent-sky-500"
                />
              </div>

              {/* Product Match */}
              <div className="pt-2 border-t border-slate-800">
                <label className="text-[11px] text-slate-400 block mb-1">Financing Product</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-white text-xs font-medium focus:outline-none"
                >
                  {financeProducts.map((p) => (
                    <option key={p.finance_product_id} value={p.finance_product_id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Calculator Outputs & Operational Payback */}
            <div className="lg:col-span-2 p-5 rounded-xl border border-slate-800 bg-[#0f172a] shadow-lg space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Financing Schedule & Return Summary
                  </h3>
                  <span className="text-xs font-mono text-emerald-400">Reducing Balance Model</span>
                </div>

                {calcResult && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                    <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="text-[11px] text-slate-400">Net Financed Principal</div>
                      <div className="text-xl font-bold font-mono text-amber-300 mt-1">
                        {formatINR(calcResult.financed_principal_inr)}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">Loan capital disbursed</div>
                    </div>

                    <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="text-[11px] text-slate-400">Estimated Monthly EMI</div>
                      <div className="text-xl font-bold font-mono text-sky-400 mt-1">
                        {formatINR(calcResult.estimated_installment_inr)}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        {calcResult.number_of_installments} monthly payments
                      </div>
                    </div>

                    <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="text-[11px] text-slate-400">Total Repayment</div>
                      <div className="text-xl font-bold font-mono text-slate-200 mt-1">
                        {formatINR(calcResult.total_repayment_inr)}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        Total interest: {formatINR(calcResult.total_financing_cost_inr)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Savings & Payback Model */}
                {calcResult?.savings_payback?.supported && (
                  <div className="mt-4 p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/40 text-xs space-y-2">
                    <div className="flex items-center justify-between font-bold text-emerald-300">
                      <span>Operational Savings & Simple Payback Estimate</span>
                      <span className="font-mono text-white">
                        Payback: ~{calcResult.savings_payback.simple_payback_years} Years
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[11px] text-emerald-200/90">
                      <div>
                        Baseline Operating Cost: {formatINR(calcResult.savings_payback.baseline_annual_operating_cost_inr)}/yr
                      </div>
                      <div>
                        Estimated Annual Savings: {formatINR(calcResult.savings_payback.estimated_annual_savings_inr)}/yr
                      </div>
                    </div>

                    <div className="text-[10px] text-emerald-300/70 pt-1">
                      * Savings derived from verified agricultural displacement data (e.g. diesel pump fuel or grain rot prevention).
                    </div>
                  </div>
                )}
              </div>

              {/* Action Form to Create Application */}
              <div className="pt-4 border-t border-slate-800 mt-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Borrower Name</label>
                    <input
                      type="text"
                      value={borrowerName}
                      onChange={(e) => setBorrowerName(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-white text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">JLG Group ID</label>
                    <input
                      type="text"
                      value={jlgGroupId}
                      onChange={(e) => setJlgGroupId(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-white text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Primary Livelihood</label>
                    <select
                      value={livelihood}
                      onChange={(e) => setLivelihood(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-white text-xs font-medium"
                    >
                      <option value="AGRICULTURE_PADDY">Paddy Farming</option>
                      <option value="AGRICULTURE_MAKHANA">Makhana Processing</option>
                      <option value="AGRICULTURE_VEGETABLES">Vegetable Cultivation</option>
                      <option value="DAIRY_AND_LIVESTOCK">Dairy & Livestock</option>
                      <option value="FISHERIES">Fisheries</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="text-[11px] text-slate-400">
                    Creates application in <span className="font-mono text-amber-400">UNDER_REVIEW</span> for human authorization.
                  </div>
                  <button
                    type="button"
                    onClick={handleCreateApplication}
                    className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow"
                  >
                    <span>Submit Proposal for Credit Review</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3 & 4: APPLICATION STATUS & HUMAN DECISION CARD */}
        {createdApp && (
          <div className="p-5 rounded-xl border border-sky-800/60 bg-sky-950/20 shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-sky-900/60">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-sky-400" />
                <h3 className="text-sm font-bold text-white">
                  Application Created: {createdApp.application_id}
                </h3>
              </div>
              <span
                className={`text-xs font-mono font-bold px-3 py-1 rounded-full border ${
                  createdApp.status === 'VERIFIED'
                    ? 'border-emerald-500 bg-emerald-950/80 text-emerald-400'
                    : createdApp.status === 'APPROVED' || createdApp.status === 'VERIFICATION_PENDING'
                    ? 'border-sky-500 bg-sky-950/80 text-sky-300'
                    : 'border-amber-500 bg-amber-950/80 text-amber-300'
                }`}
              >
                STATUS: {createdApp.status}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="text-slate-400">Borrower</div>
                <div className="font-bold text-white mt-0.5">{createdApp.borrower_name}</div>
                <div className="text-[10px] text-slate-500">{createdApp.borrower_group_id}</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="text-slate-400">Technology</div>
                <div className="font-bold text-white mt-0.5">{selectedIntervention?.name}</div>
                <div className="text-[10px] text-slate-500">{createdApp.village_name}</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="text-slate-400">Loan Principal</div>
                <div className="font-bold text-amber-300 mt-0.5 font-mono">
                  {formatINR(createdApp.requested_amount_inr)}
                </div>
                <div className="text-[10px] text-slate-500">Equity: {formatINR(createdApp.borrower_contribution_inr)}</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex flex-col justify-center">
                {createdApp.status === 'UNDER_REVIEW' && (
                  <button
                    type="button"
                    onClick={() => setIsReviewModalOpen(true)}
                    className="w-full py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Authorize as Credit Officer</span>
                  </button>
                )}

                {disbursedAsset && (
                  <Link
                    href={`/assets/${disbursedAsset.asset_id}`}
                    className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow"
                  >
                    <span>View Asset Lifecycle Traceability</span>
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </div>

            {/* Human decision history banner */}
            {createdApp.human_decisions.length > 0 && (
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Human Credit Authorization Recorded</span>
                </div>
                <p className="text-slate-300 text-[11px]">
                  <strong>Officer:</strong> {createdApp.human_decisions[0].officer_name} ({createdApp.human_decisions[0].officer_id})
                </p>
                <p className="text-slate-400 text-[11px]">
                  <strong>Justification:</strong> {createdApp.human_decisions[0].reason}
                </p>
              </div>
            )}
          </div>
        )}

        {/* HUMAN REVIEW MODAL */}
        {isReviewModalOpen && createdApp && (
          <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
            <div className="bg-[#0f172a] border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <UserCheck className="w-5 h-5" />
                  <span>Human Credit Officer Review</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="text-slate-400 hover:text-white text-xs font-mono"
                >
                  ✕
                </button>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs space-y-1">
                <div className="text-slate-400">Application: {createdApp.application_id}</div>
                <div className="text-white font-bold">{createdApp.borrower_name} ({createdApp.borrower_group_id})</div>
                <div className="text-amber-300 font-mono">Amount: {formatINR(createdApp.requested_amount_inr)}</div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Authorizing Officer Name & ID</label>
                  <input
                    type="text"
                    value={officerName}
                    onChange={(e) => setOfficerName(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-700 text-white font-medium"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Officer Staff Reference ID</label>
                  <input
                    type="text"
                    value={officerId}
                    onChange={(e) => setOfficerId(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-700 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Credit Approval Justification</label>
                  <textarea
                    rows={2}
                    value={reviewReason}
                    onChange={(e) => setReviewReason(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-700 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Operational Conditions / Grace Policy</label>
                  <input
                    type="text"
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-700 text-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => handleRecordDecision('REJECTED')}
                  className="px-4 py-2 rounded-lg bg-red-900/60 border border-red-700 hover:bg-red-800 text-red-200 text-xs font-semibold"
                >
                  Reject Application
                </button>
                <button
                  type="button"
                  onClick={() => handleRecordDecision('APPROVED')}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow"
                >
                  Authorize & Disburse Loan
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
