import React, { useId, useMemo, useState } from 'react'
import clsx from 'clsx'
import { FileUp, Image as ImageIcon, FileText } from 'lucide-react'
import { Button } from './ui/Button'

const ACCEPTED_MIME = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
])

const ACCEPTED_EXT = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg', '.webp', '.gif']

export function Dropzone({
  disabled,
  onFileSelected,
  error,
}: {
  disabled?: boolean
  onFileSelected: (file: File) => void
  error?: string | null
}) {
  const inputId = useId()
  const [isDragging, setIsDragging] = useState(false)

  const acceptAttr = useMemo(() => ACCEPTED_EXT.join(','), [])

  function validate(file: File): string | null {
    if (!ACCEPTED_MIME.has(file.type)) {
      return `Invalid file type. Supported: ${ACCEPTED_EXT.join(', ')}`
    }
    // 15MB soft limit for UX (mock upload)
    if (file.size > 15 * 1024 * 1024) {
      return 'File is too large (max 15MB).'
    }
    return null
  }

  function handleFile(file: File) {
    const err = validate(file)
    if (err) return // Upload page shows error UI
    onFileSelected(file)
  }

  return (
    <div className="space-y-3">
      <div
        className={clsx(
          'rounded-xl border-2 border-dashed p-6 transition',
          'bg-white',
          isDragging
            ? 'border-slate-900/60 bg-slate-50'
            : 'border-slate-200 hover:border-slate-300',
          disabled && 'opacity-70 pointer-events-none',
        )}
        onDragEnter={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setIsDragging(true)
        }}
        onDragOver={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setIsDragging(true)
        }}
        onDragLeave={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setIsDragging(false)
        }}
        onDrop={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setIsDragging(false)
          const file = e.dataTransfer.files?.[0]
          if (file) handleFile(file)
        }}
      >
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm shadow-slate-900/10">
            <FileUp className="h-5 w-5" />
          </div>
          <div className="mt-3 text-sm font-semibold text-slate-900">Drag & drop a document</div>
          <div className="mt-1 text-xs text-slate-600">
            PDF, DOC/DOCX, and images (PNG/JPG/WebP/GIF)
          </div>

          <div className="mt-4 flex items-center gap-3">
            <label htmlFor={inputId}>
              <Button type="button" variant="secondary">
                Browse files
              </Button>
            </label>
            <div className="flex items-center gap-2 text-slate-500">
              <FileText className="h-4 w-4" />
              <ImageIcon className="h-4 w-4" />
            </div>
          </div>

          <input
            id={inputId}
            type="file"
            className="hidden"
            accept={acceptAttr}
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleFile(f)
              e.currentTarget.value = ''
            }}
          />
        </div>
      </div>

      {error ? (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 ring-1 ring-red-200">
          {error}
        </div>
      ) : null}
    </div>
  )
}


