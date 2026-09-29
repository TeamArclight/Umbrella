'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import {
  ResilienceAsset,
  GreenFinanceApplication,
  AssetVerification,
  AssetImpactRecord,
  AuditEvent,
} from '@/lib/types';
import { Navbar } from '@/components/Navbar';
import { formatINR } from '@/lib/utils';
import {
  ShieldCheck,
  MapPin,
  Camera,
  CheckCircle2,
  Clock,
  UserCheck,
  FileCheck,
  ArrowLeft,
  Calendar,
  Layers,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';

export default function AssetDetailPage() {
  const params = useParams();
  const assetId = params?.id as string;

  const [asset, setAsset] = useState<ResilienceAsset | null>(null);
  const [application, setApplication] = useState<GreenFinanceApplication | null>(null);
  const [verification, setVerification] = useState<AssetVerification | null>(null);
  const [impactRecord, setImpactRecord] = useState<AssetImpactRecord | null>(null);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      if (!assetId) return;
      try {
        setIsLoading(true);
        const ast = await api.getAsset(assetId);
        setAsset(ast);

        const [app, vrfList, imp, aud] = await Promise.all([
          api.getApplication(ast.application_id).catch(() => null),
          api.getVerifications(assetId).catch(() => []),
          api.getAssetImpact(assetId).catch(() => null),
          api.getAuditTrail(assetId).catch(() => []),
        ]);

        setApplication(app);
        if (vrfList.length > 0) setVerification(vrfList[0]);
        setImpactRecord(imp);
        setAuditEvents(aud);
      } catch (err) {
        console.error('Failed to load asset details:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [assetId]);

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar title="Asset Lifecycle Traceability" horizon={5} onHorizonChange={() => {}} />
        <div className="p-8 text-center text-slate-400 text-xs">Loading asset record...</div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar title="Asset Lifecycle Traceability" horizon={5} onHorizonChange={() => {}} />
        <div className="p-8 text-center text-slate-400 text-xs">
          Resilience asset '{assetId}' not found.{' '}
          <Link href="/green-finance" className="text-sky-400 underline">
            Return to Green Finance
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar title={`Asset Lifecycle: ${asset.asset_id}`} horizon={5} onHorizonChange={() => {}} />

      <div className="p-6 space-y-6 flex-1 max-w-5xl mx-auto w-full">
        {/* Back Link */}
        <div className="flex items-center justify-between">
          <Link
            href="/field-officer"
            className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Field Verification</span>
          </Link>

          <span
            className={`text-xs font-mono font-bold px-3 py-1 rounded-full border ${
              asset.verification_status === 'VERIFIED'
                ? 'border-emerald-500 bg-emerald-950/80 text-emerald-400'
                : asset.verification_status === 'FLAGGED'
                ? 'border-red-500 bg-red-950/80 text-red-400'
                : 'border-amber-500 bg-amber-950/80 text-amber-300'
            }`}
          >
            STATUS: {asset.verification_status}
          </span>
        </div>

        {/* Top Summary Card */}
        <div className="p-5 rounded-xl border border-slate-800 bg-[#0f172a] shadow space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white">{asset.intervention_name}</h2>
              <div className="text-xs font-mono text-slate-400 mt-0.5">
                Asset ID: {asset.asset_id} • Serial Tag: {asset.serial_number_or_tag || 'N/A'}
              </div>
            </div>
            <div className="text-xs text-right">
              <div className="text-slate-400">Deployed Cluster</div>
              <div className="font-semibold text-white">{asset.village_name}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <div className="text-slate-400">Client / JLG</div>
              <div className="font-bold text-white mt-0.5">{asset.borrower_name}</div>
              <div className="text-[10px] text-slate-500">{asset.borrower_group_id}</div>
            </div>

            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <div className="text-slate-400">Financing ID</div>
              <div className="font-bold text-white mt-0.5">{asset.application_id}</div>
              <div className="text-[10px] text-slate-500 font-mono">
                {application ? formatINR(application.requested_amount_inr) : '—'}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <div className="text-slate-400">GPS Location</div>
              <div className="font-bold text-sky-400 mt-0.5 font-mono text-[11px]">
                {asset.expected_latitude.toFixed(4)}°N, {asset.expected_longitude.toFixed(4)}°E
              </div>
              <div className="text-[10px] text-slate-500">{asset.village_name}</div>
            </div>

            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <div className="text-slate-400">Emissions Proxy</div>
              <div className="font-bold text-emerald-400 mt-0.5 font-mono">
                {impactRecord?.emissions_avoided
                  ? `${impactRecord.emissions_avoided.estimated_emissions_avoided_tco2e_per_year} tCO2e/yr`
                  : 'N/A (Pure Adaptation)'}
              </div>
              <div className="text-[10px] text-slate-500">Uncertified proxy</div>
            </div>
          </div>
        </div>

        {/* COMPLETE LIFECYCLE PROGRESSION */}
        <div className="p-5 rounded-xl border border-slate-800 bg-[#0f172a] shadow space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            End-to-End Asset Lifecycle Progression
          </h3>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
            {/* Step 1: Recommendation */}
            <div className="relative">
              <div className="absolute -left-6 top-0 w-4 h-4 rounded-full bg-sky-500 flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5 text-black" />
              </div>
              <div className="text-xs font-bold text-white">1. Climate Hazard Early Warning & Recommendation</div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                High flood hazard alert in {asset.village_name} triggered recommendation for {asset.intervention_name}.
              </p>
            </div>

            {/* Step 2: Application Draft & Proposal */}
            <div className="relative">
              <div className="absolute -left-6 top-0 w-4 h-4 rounded-full bg-sky-500 flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5 text-black" />
              </div>
              <div className="text-xs font-bold text-white">2. Financing Application Created ({asset.application_id})</div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Borrower {asset.borrower_name} ({asset.borrower_group_id}) structured micro-loan with indicative reducing EMI schedule.
              </p>
            </div>

            {/* Step 3: Human Officer Decision */}
            <div className="relative">
              <div className="absolute -left-6 top-0 w-4 h-4 rounded-full bg-sky-500 flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5 text-black" />
              </div>
              <div className="text-xs font-bold text-white">3. Human Credit Officer Review & Authorization</div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {application?.human_decisions[0] ? (
                  <>
                    Authorized by <strong>{application.human_decisions[0].officer_name}</strong>: &quot;
                    {application.human_decisions[0].reason}&quot;
                  </>
                ) : (
                  'Pending human credit review.'
                )}
              </p>
            </div>

            {/* Step 4: Loan Disbursement & Equipment Deployment */}
            <div className="relative">
              <div className="absolute -left-6 top-0 w-4 h-4 rounded-full bg-sky-500 flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5 text-black" />
              </div>
              <div className="text-xs font-bold text-white">4. Loan Disbursed & Physical Asset Deployed</div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Physical technology installed with asset tag: <strong>{asset.serial_number_or_tag || asset.asset_id}</strong>.
              </p>
            </div>

            {/* Step 5: Field Verification & Evidence */}
            <div className="relative">
              <div
                className={`absolute -left-6 top-0 w-4 h-4 rounded-full flex items-center justify-center ${
                  verification?.verification_result === 'PASSED'
                    ? 'bg-emerald-500'
                    : verification?.verification_result === 'FLAGGED'
                    ? 'bg-red-500'
                    : 'bg-amber-500'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-black" />
              </div>
              <div className="text-xs font-bold text-white">
                5. On-Site Field Verification (Status: {verification?.verification_result || 'PENDING'})
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {verification ? (
                  <>
                    Inspected by {verification.officer_name}. Hash: {verification.photo_sha256?.substring(0, 16)}... • GPS Offset:{' '}
                    {verification.automated_summary.gps_consistency_check.metrics.distance_meters}m ({verification.automated_summary.gps_consistency_check.status}).
                  </>
                ) : (
                  'Assigned for field verification visit.'
                )}
              </p>
            </div>

            {/* Step 6: Measured Impact */}
            <div className="relative">
              <div
                className={`absolute -left-6 top-0 w-4 h-4 rounded-full flex items-center justify-center ${
                  asset.verification_status === 'VERIFIED' ? 'bg-emerald-500' : 'bg-slate-700'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-black" />
              </div>
              <div className="text-xs font-bold text-white">6. Measured Impact & Portfolio Learning</div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {impactRecord?.emissions_avoided ? (
                  <>
                    {impactRecord.emissions_avoided.estimated_emissions_avoided_tco2e_per_year} tCO2e/year avoided under{' '}
                    {impactRecord.emissions_avoided.methodology_name}.
                  </>
                ) : (
                  'Physical flood resilience benefits actively protecting borrower assets.'
                )}
              </p>
            </div>
          </div>
        </div>

        {/* AUDIT TRAIL LOG */}
        <div className="p-5 rounded-xl border border-slate-800 bg-[#0f172a] shadow space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Immutable Audit Trail Log ({auditEvents.length} Events)
          </h3>

          {auditEvents.length === 0 ? (
            <div className="text-xs text-slate-500">No audit events recorded for this specific asset ID.</div>
          ) : (
            <div className="space-y-2">
              {auditEvents.map((evt) => (
                <div
                  key={evt.event_id}
                  className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <span className="font-mono text-sky-400 font-bold">{evt.action}</span>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Actor: {evt.actor_name} ({evt.actor_type})
                    </div>
                  </div>
                  <div className="text-right text-[10px] font-mono text-slate-500">
                    <div>{new Date(evt.timestamp).toLocaleString()}</div>
                    <div>{evt.event_id}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
