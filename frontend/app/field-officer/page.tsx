'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api';
import {
  ResilienceAsset,
  AssetVerification,
  ResilienceIntervention,
} from '../../lib/types';
import { Navbar } from '../../components/Navbar';
import {
  Smartphone,
  MapPin,
  Camera,
  CheckSquare,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Clock,
  UploadCloud,
  FileCheck,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

export default function FieldOfficerPage() {
  const [assets, setAssets] = useState<ResilienceAsset[]>([]);
  const [verifications, setVerifications] = useState<AssetVerification[]>([]);
  const [interventionsMap, setInterventionsMap] = useState<Record<string, ResilienceIntervention>>({});
  const [activeTab, setActiveTab] = useState<'PENDING' | 'FLAGGED' | 'VERIFIED' | 'ALL'>('PENDING');
  const [selectedAsset, setSelectedAsset] = useState<ResilienceAsset | null>(null);

  // Verification Form State
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [officerId, setOfficerId] = useState<string>('FLD-OFF-108');
  const [officerName, setOfficerName] = useState<string>('Amit Kumar (Field Loan Officer)');
  const [submittedLat, setSubmittedLat] = useState<number>(25.9865);
  const [submittedLon, setSubmittedLon] = useState<number>(85.9082);
  const [checklistResponses, setChecklistResponses] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [latestVerificationResult, setLatestVerificationResult] = useState<AssetVerification | null>(null);

  const loadData = async () => {
    try {
      const [astList, vrfList, intList] = await Promise.all([
        api.getAssets(),
        api.getVerifications(),
        api.getInterventions(),
      ]);
      setAssets(astList);
      setVerifications(vrfList);

      const iMap: Record<string, ResilienceIntervention> = {};
      intList.forEach((item) => {
        iMap[item.intervention_id] = item;
      });
      setInterventionsMap(iMap);
    } catch (err) {
      console.error('Failed to load field data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenForm = (asset: ResilienceAsset) => {
    setSelectedAsset(asset);
    setSubmittedLat(asset.expected_latitude);
    setSubmittedLon(asset.expected_longitude);

    // Initialize checklist responses from intervention requirements
    const intervention = interventionsMap[asset.intervention_id];
    const initialChecklist: Record<string, boolean> = {};
    if (intervention) {
      intervention.verification_requirements.forEach((req) => {
        initialChecklist[req.item_id] = true; // default true for convenience
      });
    }
    setChecklistResponses(initialChecklist);
    setSelectedFile(null);
    setLatestVerificationResult(null);
    setIsFormOpen(true);
  };

  const handleToggleChecklist = (itemId: string) => {
    setChecklistResponses((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const handleSubmitVerification = async () => {
    if (!selectedAsset) return;
    try {
      setIsSubmitting(true);

      // 1. Submit checklist & coordinates record
      const vrf = await api.submitVerification({
        asset_id: selectedAsset.asset_id,
        officer_id: officerId,
        officer_name: officerName,
        submitted_latitude: submittedLat,
        submitted_longitude: submittedLon,
        checklist_responses: checklistResponses,
        notes: notes || `Field inspection completed on-site in ${selectedAsset.village_name}.`,
      });

      // 2. If photo file selected, upload evidence photo
      let finalVrf = vrf;
      if (selectedFile) {
        finalVrf = await api.uploadVerificationEvidence(vrf.verification_id, selectedFile);
      }

      setLatestVerificationResult(finalVrf);
      await loadData();
    } catch (err: any) {
      console.error('Failed to submit field verification:', err);
      alert('Verification submission error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSupervisorConfirm = async (verificationId: string, decision: 'CONFIRMED' | 'OVERRIDDEN') => {
    try {
      await api.recordVerificationDecision(verificationId, {
        decision,
        officer_id: 'MGR-OPS-012',
        officer_name: 'Sanjay Mishra (Branch Ops Manager)',
        reason: 'Evidence reviewed; GPS coordinates consistent with borrower homestead parcel.',
      });
      await loadData();
      setIsFormOpen(false);
    } catch (err: any) {
      alert('Error confirming verification: ' + err.message);
    }
  };

  // Filtered Assets
  const filteredAssets = assets.filter((a) => {
    if (activeTab === 'PENDING') return a.verification_status === 'PENDING_REVIEW' || a.verification_status === 'NOT_SUBMITTED';
    if (activeTab === 'FLAGGED') return a.verification_status === 'FLAGGED';
    if (activeTab === 'VERIFIED') return a.verification_status === 'VERIFIED';
    return true;
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar title="Field Officer Mobile Verification Workflow" horizon={5} onHorizonChange={() => {}} />

      <div className="p-4 sm:p-6 space-y-5 flex-1 max-w-5xl mx-auto w-full">
        {/* Mobile Header Banner */}
        <div className="p-4 rounded-xl border border-slate-800 bg-[#0f172a] shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Field Verification Portal
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  Officer: Amit Kumar
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                On-site inspection, cryptographic evidence hashing, and GPS spatial consistency check
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadData}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs flex items-center gap-1.5 self-start sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Visits</span>
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('PENDING')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'PENDING'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Visits ({assets.filter((a) => a.verification_status === 'PENDING_REVIEW' || a.verification_status === 'NOT_SUBMITTED').length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('FLAGGED')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'FLAGGED'
                ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            <span>Flagged Evidence ({assets.filter((a) => a.verification_status === 'FLAGGED').length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('VERIFIED')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'VERIFIED'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Completed & Verified ({assets.filter((a) => a.verification_status === 'VERIFIED').length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'ALL'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>All Assets ({assets.length})</span>
          </button>
        </div>

        {/* Asset Cards List */}
        <div className="space-y-3">
          {filteredAssets.length === 0 ? (
            <div className="p-8 text-center rounded-xl border border-slate-800 bg-[#0f172a] text-slate-400 text-xs">
              No assets in this category.
            </div>
          ) : (
            filteredAssets.map((ast) => {
              const matchedVerif = verifications.find((v) => v.asset_id === ast.asset_id);
              return (
                <div
                  key={ast.asset_id}
                  className="p-4 rounded-xl border border-slate-800 bg-[#0f172a] shadow hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{ast.intervention_name}</span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                          ast.verification_status === 'VERIFIED'
                            ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-400'
                            : ast.verification_status === 'FLAGGED'
                            ? 'border-red-500/40 bg-red-950/40 text-red-400'
                            : 'border-amber-500/40 bg-amber-950/40 text-amber-300'
                        }`}
                      >
                        {ast.verification_status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-300 font-medium">
                      Borrower: <span className="text-white font-semibold">{ast.borrower_name}</span> ({ast.borrower_group_id})
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-sky-400" />
                        {ast.village_name}
                      </span>
                      <span>Asset Tag: {ast.serial_number_or_tag || ast.asset_id}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Link
                      href={`/assets/${ast.asset_id}`}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1"
                    >
                      <span>Lifecycle Trace</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleOpenForm(ast)}
                      className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{ast.verification_status === 'VERIFIED' ? 'Re-inspect' : 'Verify Asset'}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* VERIFICATION FORM MODAL */}
        {isFormOpen && selectedAsset && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div className="bg-[#0f172a] border border-slate-700 rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl space-y-4 my-8">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 text-sky-400 font-bold text-sm">
                  <Camera className="w-5 h-5" />
                  <span>Field Verification: {selectedAsset.intervention_name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="text-slate-400 hover:text-white text-xs font-mono"
                >
                  ✕
                </button>
              </div>

              {/* Asset & Location Info */}
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Borrower:</span>
                  <span className="text-white font-bold">{selectedAsset.borrower_name} ({selectedAsset.borrower_group_id})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Village Location:</span>
                  <span className="text-slate-200">{selectedAsset.village_name}</span>
                </div>
                <div className="flex justify-between font-mono text-[11px]">
                  <span className="text-slate-400">Expected Coordinates:</span>
                  <span className="text-sky-300">
                    {selectedAsset.expected_latitude.toFixed(4)}°N, {selectedAsset.expected_longitude.toFixed(4)}°E
                  </span>
                </div>
              </div>

              {/* Dynamic Intervention Inspection Checklist */}
              <div>
                <label className="text-xs font-bold text-white block mb-2">
                  Physical Inspection Criteria (Mandatory)
                </label>
                <div className="space-y-2">
                  {interventionsMap[selectedAsset.intervention_id]?.verification_requirements.map((req) => {
                    const isChecked = !!checklistResponses[req.item_id];
                    return (
                      <div
                        key={req.item_id}
                        onClick={() => handleToggleChecklist(req.item_id)}
                        className={`p-2.5 rounded-lg border cursor-pointer text-xs flex items-start gap-2.5 transition-colors ${
                          isChecked
                            ? 'border-sky-500/40 bg-sky-950/20 text-white'
                            : 'border-slate-800 bg-slate-900/60 text-slate-400'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="mt-0.5 accent-sky-500 rounded"
                        />
                        <div>
                          <div className="font-semibold text-slate-200">{req.label}</div>
                          <div className="text-[11px] text-slate-400 leading-tight">{req.description}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Field Coordinates Input (Haversine Distance Test) */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Submitted Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={submittedLat}
                    onChange={(e) => setSubmittedLat(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Submitted Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={submittedLon}
                    onChange={(e) => setSubmittedLon(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-white font-mono"
                  />
                </div>
              </div>

              {/* Photo Evidence Upload */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white block">
                  On-Site Evidence Photo (MIME & SHA-256 Validated)
                </label>
                <div className="border-2 border-dashed border-slate-700 rounded-xl p-4 text-center bg-slate-900/40 hover:border-sky-500 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="evidence-file-upload"
                  />
                  <label htmlFor="evidence-file-upload" className="cursor-pointer block">
                    <UploadCloud className="w-8 h-8 text-sky-400 mx-auto mb-1" />
                    <span className="text-xs text-sky-300 font-semibold block">
                      {selectedFile ? selectedFile.name : 'Tap to capture / upload evidence photo'}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      Accepts JPEG, PNG, WebP (Max 5.0 MB)
                    </span>
                  </label>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Inspector Field Notes</label>
                <input
                  type="text"
                  placeholder="Structure inspected; serial number verified; operational."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-white text-xs"
                />
              </div>

              {/* AUTOMATED SUMMARY RESULT DISPLAY */}
              {latestVerificationResult && (
                <div className="p-3.5 rounded-xl border border-slate-700 bg-slate-900 text-xs space-y-2">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-white">Automated Evidence Integrity Summary:</span>
                    <span
                      className={`font-mono px-2 py-0.5 rounded text-[11px] ${
                        latestVerificationResult.automated_summary.overall_automated_status === 'PASS'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : latestVerificationResult.automated_summary.overall_automated_status === 'FLAGGED'
                          ? 'bg-red-950 text-red-400 border border-red-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {latestVerificationResult.automated_summary.overall_automated_status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <div className="flex justify-between p-1.5 rounded bg-slate-950">
                      <span className="text-slate-400">GPS Offset:</span>
                      <span className="text-slate-200">
                        {latestVerificationResult.automated_summary.gps_consistency_check.metrics.distance_meters} m
                      </span>
                    </div>
                    <div className="flex justify-between p-1.5 rounded bg-slate-950">
                      <span className="text-slate-400">Hash Check:</span>
                      <span className="text-slate-200">
                        {latestVerificationResult.automated_summary.evidence_integrity_check.status}
                      </span>
                    </div>
                  </div>

                  {latestVerificationResult.photo_sha256 && (
                    <div className="text-[10px] text-slate-400 font-mono truncate">
                      SHA-256: {latestVerificationResult.photo_sha256}
                    </div>
                  )}

                  {/* Supervisor confirmation buttons */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleSupervisorConfirm(latestVerificationResult.verification_id, 'CONFIRMED')}
                      className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                    >
                      Supervisor Confirm Verification
                    </button>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              {!latestVerificationResult && (
                <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleSubmitVerification}
                    className="px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700 text-white font-bold text-xs shadow flex items-center gap-1.5"
                  >
                    {isSubmitting ? 'Evaluating Evidence...' : 'Submit Field Verification'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
