import React, { useMemo, useState } from 'react'
import { addDays, format } from 'date-fns'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { Dropzone } from '../components/Dropzone'
import { Button } from '../components/ui/Button'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { useDocuments } from '../contexts/DocumentsContext'
import { useToasts } from '../contexts/ToastContext'
import type { DocumentItem } from '../types/document'

function randomId() {
  return `DOC-${Math.floor(100 + Math.random() * 900)}`
}

function mockExtractDeadline(): string {
  // Mock "deadline extraction": 3..35 days from now
  const days = 3 + Math.floor(Math.random() * 33)
  const d = addDays(new Date(), days)
  return format(d, 'yyyy-MM-dd')
}

async function mockUpload(file: File): Promise<void> {
  // Simulate network + parsing time
  await new Promise((r) => setTimeout(r, 1100))
  // Small chance of a failure to exercise error UI
  if (file.name.toLowerCase().includes('fail')) throw new Error('Upload failed (mock).')
}

export function UploadPage() {
  const { addDocument } = useDocuments()
  const { pushToast } = useToasts()

  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const meta = useMemo(() => {
    if (!file) return null
    const mb = (file.size / (1024 * 1024)).toFixed(2)
    return { name: file.name, size: `${mb} MB`, type: file.type || 'unknown' }
  }, [file])

  async function onUpload() {
    if (!file) return
    setError(null)
    setSuccess(null)
    setIsUploading(true)
    try {
      await mockUpload(file)
      const doc: DocumentItem = {
        id: randomId(),
        name: file.name,
        deadlineISO: mockExtractDeadline(),
        completed: false,
        uploadedAtISO: new Date().toISOString(),
      }
      addDocument(doc)
      setSuccess(`Uploaded successfully. Extracted deadline: ${doc.deadlineISO}`)
      pushToast({
        kind: 'success',
        title: 'Upload successful',
        message: `Deadline extracted: ${doc.deadlineISO}`,
      })
      setFile(null)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Upload failed.'
      setError(msg)
      pushToast({ kind: 'error', title: 'Upload failed', message: msg })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Upload</h1>
        <div className="mt-1 text-sm text-slate-600">
          Upload a document to automatically track a deadline (mock extraction for now).
        </div>
      </div>

      <Card>
        <CardHeader title="Upload Document" subtitle="Drag & drop or browse to select a file." />
        <CardBody className="space-y-4">
          <Dropzone
            disabled={isUploading}
            onFileSelected={(f) => {
              setError(null)
              setSuccess(null)
              setFile(f)
            }}
            error={error}
          />

          {meta ? (
            <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <div className="text-xs font-semibold text-slate-900">Selected file</div>
              <div className="mt-2 grid gap-2 text-xs text-slate-700 sm:grid-cols-3">
                <div>
                  <div className="text-slate-500">Name</div>
                  <div className="font-medium text-slate-900 break-all">{meta.name}</div>
                </div>
                <div>
                  <div className="text-slate-500">Type</div>
                  <div className="font-medium text-slate-900">{meta.type}</div>
                </div>
                <div>
                  <div className="text-slate-500">Size</div>
                  <div className="font-medium text-slate-900">{meta.size}</div>
                </div>
              </div>
            </div>
          ) : null}

          {success ? (
            <div className="rounded-lg bg-green-50 px-3 py-2 text-xs text-green-700 ring-1 ring-green-200">
              <div className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>{success}</span>
              </div>
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-slate-500">
              Tip: include “fail” in the filename to simulate an upload error.
            </div>
            <Button
              onClick={onUpload}
              disabled={!file || isUploading}
              leftIcon={isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
            >
              {isUploading ? 'Uploading…' : 'Upload'}
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}


