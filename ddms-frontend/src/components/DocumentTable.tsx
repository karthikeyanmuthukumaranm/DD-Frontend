import { format, parseISO } from 'date-fns'
import { CheckCircle2, CircleAlert, Clock4, FileText } from 'lucide-react'
import type { DocumentItem } from '../types/document'
import { getStatus } from '../utils/date'
import { Badge } from './ui/Badge'

export function DocumentTable({
  documents,
  onToggleCompleted,
}: {
  documents: DocumentItem[]
  onToggleCompleted: (id: string, completed: boolean) => void
}) {
  return (
    <div className="overflow-hidden rounded-xl bg-white ring-1 ring-slate-200 shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs text-slate-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Document Name</th>
              <th className="px-4 py-3 font-semibold">Deadline</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold text-right">Completed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {documents.map((doc) => {
              const status = getStatus(doc)
              const tone = status === 'Completed' ? 'green' : status === 'Overdue' ? 'red' : 'amber'
              const Icon =
                status === 'Completed' ? CheckCircle2 : status === 'Overdue' ? CircleAlert : Clock4

              return (
                <tr key={doc.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{doc.name}</div>
                    <div className="mt-0.5 text-xs text-slate-500">ID: {doc.id}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {format(parseISO(doc.deadlineISO), 'MMM d, yyyy')}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={tone}>
                      <span className="inline-flex items-center gap-1.5">
                        <Icon className="h-3.5 w-3.5" />
                        {status}
                      </span>
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400/40"
                      checked={doc.completed}
                      onChange={(e) => onToggleCompleted(doc.id, e.target.checked)}
                      aria-label={`Mark ${doc.name} as completed`}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {documents.length === 0 ? (
        <div className="p-6 text-center">
          <div className="mx-auto inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <FileText className="h-6 w-6" />
          </div>
          <div className="mt-3 text-sm text-slate-600">No documents match your filters.</div>
        </div>
      ) : null}
    </div>
  )
}


