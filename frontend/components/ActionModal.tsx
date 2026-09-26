'use client';

import React, { useState } from 'react';
import { MFIRecommendationResponse } from '../lib/types';
import { X, CheckCircle, AlertTriangle, ShieldCheck, FileCheck } from 'lucide-react';

interface ActionModalProps {
  recommendation: MFIRecommendationResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveAction: (actionData: {
    village_id: string;
    status: 'ACKNOWLEDGED' | 'ACTIONED' | 'DISMISSED';
    reviewed_by: string;
    approved_grace_days: number;
    notes: string;
  }) => void;
}

export function ActionModal({
  recommendation,
  isOpen,
  onClose,
  onSaveAction,
}: ActionModalProps) {
  if (!isOpen || !recommendation) return null;

  const [reviewerName, setReviewerName] = useState('Senior Credit Officer - Darbhanga Branch');
  const [graceDays, setGraceDays] = useState(
    recommendation.system_recommendation.recommended_grace_period_days || 0
  );
  const [decision, setDecision] = useState<'ACKNOWLEDGED' | 'ACTIONED' | 'DISMISSED'>('ACKNOWLEDGED');
  const [notes, setNotes] = useState(
    'Dispatched field credit coordinator to verify local embankment condition and contact village JLG leaders.'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveAction({
      village_id: recommendation.village_id,
      status: decision,
      reviewed_by: reviewerName,
      approved_grace_days: graceDays,
      notes: notes,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#0f172a] border border-slate-800 rounded-xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-sky-400" />
            <h3 className="text-sm font-bold text-white">
              Human Decision-Support Authorization
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div className="p-3 rounded-lg bg-sky-950/20 border border-sky-800/30 text-slate-300">
            <div className="font-semibold text-sky-300 mb-1">
              Village: {recommendation.system_recommendation.village_name} ({recommendation.village_id})
            </div>
            <div className="text-[11px] text-slate-400">
              System Advisory: Suggested {recommendation.system_recommendation.recommended_grace_period_days} Days Grace Period.
              Decision requires formal credit officer review.
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Reviewing Officer</label>
            <input
              type="text"
              value={reviewerName}
              onChange={(e) => setReviewerName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-sky-500 font-mono text-xs"
              required
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Management Decision</label>
            <div className="grid grid-cols-3 gap-2">
              {(['ACKNOWLEDGED', 'ACTIONED', 'DISMISSED'] as const).map((opt) => (
                <button
                  type="button"
                  key={opt}
                  onClick={() => setDecision(opt)}
                  className={`py-2 px-3 rounded-lg border text-center font-semibold transition-all ${
                    decision === opt
                      ? 'bg-sky-500/20 border-sky-500 text-sky-300 shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Approved Grace Period (Days)
            </label>
            <input
              type="number"
              min="0"
              max="30"
              value={graceDays}
              onChange={(e) => setGraceDays(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-sky-500 font-mono text-xs"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Suggested: {recommendation.system_recommendation.recommended_grace_period_days} days. Enter 0 for no extension.
            </span>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Audit Notes & Instructions</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:border-sky-500 text-xs resize-none"
              placeholder="Record rationale, field directives, or escalation justifications..."
              required
            />
          </div>

          <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-[10px] text-slate-400 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <span>
              Audit Trail Guarantee: Umbrella records all review actions with officer ID, timestamp, and justification. No autonomous core banking loan restructuring occurs.
            </span>
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold transition-all shadow-md"
            >
              Save Decision Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
