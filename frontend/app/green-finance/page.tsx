'use client';

import React, { useState } from 'react';
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
  Sparkles,
} from 'lucide-react';

interface GreenProduct {
  id: string;
  name: string;
  category: string;
  icon: any;
  indicativeCostINR: number;
  subsidyAvailableINR: number;
  netLoanAmountINR: number;
  emissionsAvoidedPerUnit: number; // tCO2e/year
  resilienceBenefit: string;
  tenorMonths: number;
  targetCrops: string[];
}

const GREEN_PRODUCTS: GreenProduct[] = [
  {
    id: 'solar-pump',
    name: 'Solar Micro-Irrigation Pump Set (1-2 HP)',
    category: 'Clean Energy & Water',
    icon: Sun,
    indicativeCostINR: 125000,
    subsidyAvailableINR: 75000, // PM-KUSUM Component B
    netLoanAmountINR: 50000,
    emissionsAvoidedPerUnit: 2.14,
    resilienceBenefit:
      'Displaces diesel fuel costs during pre-monsoon sowing; immune to grid power outages during flood inundation.',
    tenorMonths: 24,
    targetCrops: ['Paddy (Rice)', 'Maize', 'Vegetables'],
  },
  {
    id: 'solar-dryer',
    name: 'Portable Solar Tunnel Agro-Dryer',
    category: 'Post-Harvest Loss Prevention',
    icon: Leaf,
    indicativeCostINR: 35000,
    subsidyAvailableINR: 10000,
    netLoanAmountINR: 25000,
    emissionsAvoidedPerUnit: 0.85,
    resilienceBenefit:
      'Prevents post-harvest fungal aflatoxin rot and grain spoilage when sudden flash floods saturate open drying fields.',
    tenorMonths: 18,
    targetCrops: ['Makhana (Foxnut)', 'Paddy', 'Chili'],
  },
  {
    id: 'resilient-storage',
    name: 'Elevated Flood-Resilient Hermetic Grain Silo',
    category: 'Asset Protection',
    icon: Package,
    indicativeCostINR: 18000,
    subsidyAvailableINR: 3000,
    netLoanAmountINR: 15000,
    emissionsAvoidedPerUnit: 0.35,
    resilienceBenefit:
      'Watertight, elevated hermetic bin preserving seed grains and food security even when courtyard floodwaters rise to 1.2m.',
    tenorMonths: 12,
    targetCrops: ['Seed Rice', 'Wheat', 'Pulses'],
  },
  {
    id: 'drip-kit',
    name: 'Gravity-Fed Micro Drip Irrigation Kit',
    category: 'Water Efficiency',
    icon: Droplets,
    indicativeCostINR: 22000,
    subsidyAvailableINR: 8000,
    netLoanAmountINR: 14000,
    emissionsAvoidedPerUnit: 0.55,
    resilienceBenefit:
      'Enables high-value post-monsoon winter cropping on residual silt moisture with 60% water conservation.',
    tenorMonths: 14,
    targetCrops: ['Pointed Gourd (Parwal)', 'Tomato', 'Mustard'],
  },
];

export default function GreenFinancePage() {
  const [selectedUnits, setSelectedUnits] = useState<Record<string, number>>({
    'solar-pump': 25,
    'solar-dryer': 40,
    'resilient-storage': 100,
    'drip-kit': 50,
  });

  const handleUnitChange = (id: string, units: number) => {
    setSelectedUnits((prev) => ({
      ...prev,
      [id]: Math.max(0, units),
    }));
  };

  // Cumulative impacts
  const cumulativeImpact = GREEN_PRODUCTS.reduce(
    (acc, prod) => {
      const units = selectedUnits[prod.id] || 0;
      acc.totalLoanVolume += prod.netLoanAmountINR * units;
      acc.totalEmissionsAvoided += prod.emissionsAvoidedPerUnit * units;
      acc.totalUnits += units;
      return acc;
    },
    { totalLoanVolume: 0, totalEmissionsAvoided: 0, totalUnits: 0 }
  );

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar title="Climate Adaptation & Green Microfinance Products" horizon={5} onHorizonChange={() => {}} />

      <div className="p-6 space-y-6 flex-1">
        {/* Uncertified Carbon Metrics Mandatory Scientific Disclaimer Banner */}
        <div className="p-4 rounded-xl border border-emerald-800/60 bg-emerald-950/25 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Leaf className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white">
                Climate Adaptation & Resilience Product Catalog
              </h2>
            </div>
            <p className="text-xs text-emerald-200/80 leading-relaxed max-w-4xl">
              <strong>UNCERTIFIED OPERATIONAL ESTIMATE:</strong> Emissions avoided metrics represent activity-based proxy calculations (e.g. displacement of diesel irrigation pumps with solar energy). They strictly do <strong>NOT</strong> constitute certified carbon credits, offsets, or guaranteed revenue.
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-700/60 px-3 py-1.5 rounded-lg whitespace-nowrap">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>ESTIMATED_EMISSIONS_AVOIDED</span>
          </div>
        </div>

        {/* Portfolio Adaptation Calculator Summary */}
        <div className="p-5 rounded-xl border border-slate-800 bg-[#0f172a] shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Simulated Adaptation Deployment (Darbhanga District)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Model the capital requirement and emissions avoided across borrower communities
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-400">
              {cumulativeImpact.totalUnits} Units Planned
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <div className="p-4 rounded-lg bg-slate-900 border border-slate-800">
              <div className="text-[11px] font-semibold text-slate-400 uppercase">
                Simulated Adaptation Loan Volume
              </div>
              <div className="text-2xl font-bold font-mono text-amber-300 mt-1">
                {formatINR(cumulativeImpact.totalLoanVolume)}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Net borrower borrowing volume</div>
            </div>

            <div className="p-4 rounded-lg bg-slate-900 border border-slate-800">
              <div className="text-[11px] font-semibold text-slate-400 uppercase">
                Estimated Emissions Avoided (Annual)
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                {cumulativeImpact.totalEmissionsAvoided.toFixed(1)} tCO2e
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                Annual diesel & spoilage displacement proxy
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-900 border border-slate-800">
              <div className="text-[11px] font-semibold text-slate-400 uppercase">
                Smallholder Flood Resilience Impact
              </div>
              <div className="text-2xl font-bold font-mono text-sky-400 mt-1">
                High Protection
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                Asset & livelihood preservation during peak monsoon
              </div>
            </div>
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {GREEN_PRODUCTS.map((prod) => {
            const Icon = prod.icon;
            const units = selectedUnits[prod.id] || 0;
            return (
              <div
                key={prod.id}
                className="rounded-xl border border-slate-800 bg-[#0f172a] p-5 shadow-lg space-y-4 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">{prod.name}</h4>
                        <span className="text-[11px] font-mono text-slate-400">
                          {prod.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-slate-300 leading-relaxed">
                    {prod.resilienceBenefit}
                  </p>

                  {/* Financial Breakdown Table */}
                  <div className="mt-4 p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs space-y-1.5 font-mono">
                    <div className="flex justify-between text-slate-400">
                      <span>Gross System Cost:</span>
                      <span>{formatINR(prod.indicativeCostINR)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-400">
                      <span>Government Subsidy (Indicative):</span>
                      <span>-{formatINR(prod.subsidyAvailableINR)}</span>
                    </div>
                    <div className="flex justify-between text-white font-bold pt-1 border-t border-slate-800">
                      <span>MFI Net Loan Amount:</span>
                      <span className="text-amber-300">{formatINR(prod.netLoanAmountINR)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400 pt-1">
                      <span>Repayment Tenor:</span>
                      <span>{prod.tenorMonths} Months (Monsoon Grace)</span>
                    </div>
                  </div>

                  {/* Carbon proxy */}
                  <div className="mt-3 flex items-center justify-between text-[11px] text-emerald-400 font-mono">
                    <span>Emissions Avoided:</span>
                    <span className="font-bold">+{prod.emissionsAvoidedPerUnit} tCO2e/yr/unit</span>
                  </div>
                </div>

                {/* Units Deployment Input */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Simulate Deployment Units:</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={units}
                      onChange={(e) => handleUnitChange(prod.id, parseInt(e.target.value) || 0)}
                      className="w-20 px-2 py-1 rounded bg-slate-900 border border-slate-800 text-white font-mono text-center focus:outline-none focus:border-sky-500"
                    />
                    <span className="text-[11px] text-slate-500">units</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
