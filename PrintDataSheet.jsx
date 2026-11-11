import React from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, X } from 'lucide-react';
import { format } from 'date-fns';

const PROMPT_LEVELS = [
  { key: 'I', label: 'IND' },
  { key: 'G', label: 'G' },
  { key: 'V', label: 'V' },
  { key: 'M', label: 'M' },
  { key: 'P', label: 'P' },
];

const LEVEL_LABELS = {
  I: 'Independent', G: 'Gestural', V: 'Verbal', M: 'Model', P: 'Physical', INC: 'Incorrect',
};

export default function PrintDataSheet({ isOpen, onClose, goal, student, teacherName, dataPoints }) {
  if (!goal || !student) return null;

  const trials = (dataPoints || []).filter((p) => p.goal_id === goal.id);
  const today = format(new Date(), 'MMM d, yyyy');
  const studentName = `${student.first_name} ${student.last_name}`;
  const accommodations = student.accommodations || [];

  const handlePrint = () => window.print();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto print-sheet-content">
        <style>{`
          @media print {
            html, body { height: auto !important; overflow: hidden !important; }
            body * { visibility: hidden !important; }
            #printable-data-sheet, #printable-data-sheet * { visibility: visible !important; }
            #printable-data-sheet {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 20px !important;
              background: white !important;
              color: black !important;
              display: block !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            #printable-data-sheet table { table-layout: fixed !important; }
            #printable-data-sheet tr, #printable-data-sheet td, #printable-data-sheet th { page-break-inside: avoid !important; break-inside: avoid !important; }
            .no-print { display: none !important; }
            .print-sheet-content {
              position: static !important;
              transform: none !important;
              max-height: none !important;
              overflow: visible !important;
              padding: 0 !important;
              margin: 0 !important;
              border: none !important;
              box-shadow: none !important;
              background: transparent !important;
              width: 100% !important;
              max-width: none !important;
              inset: auto !important;
            }
            [data-radix-dialog-overlay] { display: none !important; }
            @page { size: letter portrait; margin: 12mm; }
          }
        `}</style>

        {/* Toolbar — not printed */}
        <div className="no-print flex items-center justify-between mb-3">
          <DialogTitle>Data Sheet — {studentName}</DialogTitle>
          <div className="flex gap-2">
            <Button size="sm" onClick={handlePrint} className="bg-slate-900 hover:bg-slate-800">
              <Printer className="h-4 w-4 mr-2" /> Print / Save PDF
            </Button>
            <Button size="sm" variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" /> Close
            </Button>
          </div>
        </div>

        {/* Printable sheet */}
        <div id="printable-data-sheet" className="bg-white text-black">
          {/* Document Title */}
          <div className="text-center pb-3 mb-4 border-b-2 border-black">
            <h1 className="text-lg font-bold tracking-tight">Classroom Compass™ — IEP Data Collection</h1>
          </div>
          {/* Header */}
          <div className="border-b-2 border-black pb-3 mb-4">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-xl font-bold">{studentName}</h1>
                <p className="text-sm mt-1">Grade: {student.grade} &nbsp;|&nbsp; DOB: ______________</p>
              </div>
              <div className="text-right text-sm">
                <p><span className="font-semibold">Date:</span> {today}</p>
                <p className="mt-1"><span className="font-semibold">Teacher/Observer:</span> {teacherName || '______________________'}</p>
              </div>
            </div>
            {accommodations.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {accommodations.map((a, i) => (
                  <span key={i} className="text-xs border border-black rounded-full px-2 py-0.5">{a}</span>
                ))}
              </div>
            )}
          </div>

          {/* Goal Focus & Target Criteria */}
          <div className="mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wide border-b border-black pb-1 mb-2">Goal Focus &amp; Target Criteria</h2>
            <p className="text-xs font-semibold uppercase text-gray-600">{goal.goal_area}</p>
            <p className="text-sm mt-1">{goal.goal_description}</p>
            {goal.target && <p className="text-sm mt-1"><span className="font-semibold">Target Benchmark:</span> {goal.target}</p>}
          </div>

          {/* Quick Scoring Grid */}
          <div className="mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wide border-b border-black pb-1 mb-2">Quick Scoring Grid (10 Trials)</h2>
            <table className="w-full border-collapse text-[11px]" style={{ tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '8%' }} />
                <col style={{ width: '18%' }} />
                <col style={{ width: '34%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '28%' }} />
              </colgroup>
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-black px-2 py-1.5 text-center">Trial #</th>
                  <th className="border border-black px-2 py-1.5 text-left">Date / Time</th>
                  <th className="border border-black px-2 py-1.5 text-center">Prompt Level (IND | G | V | M | P)</th>
                  <th className="border border-black px-2 py-1.5 text-center">Response (+ / −)</th>
                  <th className="border border-black px-2 py-1.5 text-left">Anecdotal Notes / Setting</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} style={{ height: '26px' }}>
                    <td className="border border-black px-2 py-1.5 text-center font-semibold">{i + 1}</td>
                    <td className="border border-black px-2 py-1.5"></td>
                    <td className="border border-black px-2 py-1.5">
                      <div className="flex items-center justify-center gap-2.5 whitespace-nowrap">
                        {PROMPT_LEVELS.map((l) => (
                          <span key={l.key} className="inline-flex items-center gap-1">
                            <span className="inline-block w-3 h-3 border border-black"></span>
                            <span className="text-[10px] leading-none">{l.label}</span>
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="border border-black px-2 py-1.5">
                      <div className="flex items-center justify-center gap-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1"><span className="inline-block w-3 h-3 border border-black"></span>+</span>
                        <span className="inline-flex items-center gap-1"><span className="inline-block w-3 h-3 border border-black"></span>−</span>
                      </div>
                    </td>
                    <td className="border border-black px-2 py-1.5"></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Recent App Logs */}
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wide border-b border-black pb-1 mb-2">Recent App Logs</h2>
            {trials.length === 0 ? (
              <p className="text-xs text-gray-500 italic">No digital trials logged yet for this goal.</p>
            ) : (
              <table className="w-full border-collapse text-[11px]">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-black px-2 py-1.5 text-left">Date / Time</th>
                    <th className="border border-black px-2 py-1.5 text-left">Prompt Level</th>
                    <th className="border border-black px-2 py-1.5 text-center">Response</th>
                  </tr>
                </thead>
                <tbody>
                  {trials.slice(0, 20).map((t) => (
                    <tr key={t.id}>
                      <td className="border border-black px-2 py-1.5">{t.created_date ? format(new Date(t.created_date), 'MMM d, yyyy h:mm a') : t.date}</td>
                      <td className="border border-black px-2 py-1.5">{LEVEL_LABELS[t.prompt_level] || t.prompt_level}</td>
                      <td className="border border-black px-2 py-1.5 text-center">{t.trials_correct ? '+' : '−'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Document Footer */}
          <div className="mt-6 pt-2 border-t border-black text-center text-[10px] text-gray-600">
            Confidential IEP Progress Record • Classroom Compass
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}