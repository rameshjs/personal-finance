import { useState, useRef } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { save } from "@tauri-apps/plugin-dialog"
import { api } from "../../services/tauri"
import type { ExportBundle, ImportSummary } from "../../types/dashboard"

function today() {
  return new Date().toISOString().slice(0, 10)
}

export default function SettingsSection() {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [exportStatus, setExportStatus] = useState<string | null>(null)
  const [exportError, setExportError] = useState<string | null>(null)
  const [importStatus, setImportStatus] = useState<ImportSummary | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  function clearStatus() {
    setExportStatus(null)
    setExportError(null)
    setImportStatus(null)
    setImportError(null)
  }

  async function handleExportJson() {
    clearStatus()
    const chosenPath = await save({
      defaultPath: `personal_finance_${today()}.json`,
      filters: [{ name: "JSON", extensions: ["json"] }],
    })
    if (!chosenPath) return
    setBusy(true)
    try {
      const savedPath = await api.saveExportJson(chosenPath)
      setExportStatus(`Saved to: ${savedPath}`)
    } catch (err) {
      setExportError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  async function handleExportCsv() {
    clearStatus()
    const chosenPath = await save({
      defaultPath: `transactions_${today()}.csv`,
      filters: [{ name: "CSV", extensions: ["csv"] }],
    })
    if (!chosenPath) return
    setBusy(true)
    try {
      const savedPath = await api.saveExportCsv(chosenPath)
      setExportStatus(`Saved to: ${savedPath}`)
    } catch (err) {
      setExportError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ""
    clearStatus()
    setBusy(true)

    const text = await file.text()
    let summary: ImportSummary
    try {
      if (file.name.endsWith(".csv")) {
        summary = await api.importTransactionsCsv(text)
      } else {
        const parsed: ExportBundle & { exported_at?: string } = JSON.parse(text)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { exported_at: _drop, ...bundle } = parsed
        summary = await api.importData(bundle as ExportBundle)
      }
      setImportStatus(summary)
      queryClient.invalidateQueries()
    } catch (err) {
      setImportError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="p-4 space-y-6 max-w-xl">
      <h1 className="text-sm font-semibold tracking-widest text-muted-foreground">SETTINGS</h1>

      {/* Export section */}
      <div className="space-y-3">
        <p className="text-xs tracking-widest text-muted-foreground border-b border-border pb-1">EXPORT</p>

        <div className="border border-border p-4 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1 flex-1">
              <p className="text-xs font-medium text-foreground">Full Backup (JSON)</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Exports everything — investments, other investments, expense categories, and all transactions.
                Use this to back up your data or migrate to another device.
                You will be prompted to choose where to save the file.
              </p>
            </div>
            <button
              onClick={handleExportJson}
              disabled={busy}
              className="shrink-0 text-xs tracking-widest text-muted-foreground hover:text-foreground border border-border px-3 py-1.5 transition-colors disabled:opacity-40"
            >
              EXPORT JSON
            </button>
          </div>
        </div>

        <div className="border border-border p-4 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1 flex-1">
              <p className="text-xs font-medium text-foreground">Transactions CSV</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Exports only income and expense transactions as a spreadsheet-compatible CSV.
                Includes date, amount, type, category, and description.
                You will be prompted to choose where to save the file.
              </p>
            </div>
            <button
              onClick={handleExportCsv}
              disabled={busy}
              className="shrink-0 text-xs tracking-widest text-muted-foreground hover:text-foreground border border-border px-3 py-1.5 transition-colors disabled:opacity-40"
            >
              EXPORT CSV
            </button>
          </div>
        </div>
      </div>

      {/* Import section */}
      <div className="space-y-3">
        <p className="text-xs tracking-widest text-muted-foreground border-b border-border pb-1">IMPORT</p>

        <div className="border border-border p-4 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1 flex-1">
              <p className="text-xs font-medium text-foreground">Restore from File</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Accepts a <span className="text-foreground">.json</span> backup (full restore — investments, categories, transactions) or a{" "}
                <span className="text-foreground">.csv</span> file (transactions only).
                Duplicate records are skipped automatically.
              </p>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={busy}
              className="shrink-0 text-xs tracking-widest text-muted-foreground hover:text-foreground border border-border px-3 py-1.5 transition-colors disabled:opacity-40"
            >
              IMPORT
            </button>
          </div>
          <input ref={fileInputRef} type="file" accept=".json,.csv" className="hidden" onChange={handleImport} />
        </div>
      </div>

      {/* Status messages */}
      {exportStatus && (
        <div className="text-xs border border-border px-3 py-2 text-green-500 font-mono break-all">
          {exportStatus}
        </div>
      )}
      {exportError && (
        <div className="text-xs border border-red-500/30 px-3 py-2 text-red-500">
          EXPORT FAILED: {exportError}
        </div>
      )}
      {importStatus && (
        <div className="text-xs border border-border px-3 py-2 space-y-0.5">
          <p className="text-green-500 tracking-widest">
            IMPORT COMPLETE — {importStatus.inserted} inserted, {importStatus.skipped} skipped
          </p>
          {importStatus.errors.length > 0 && (
            <ul className="text-red-500 space-y-0.5 mt-1">
              {importStatus.errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          )}
        </div>
      )}
      {importError && (
        <div className="text-xs border border-red-500/30 px-3 py-2 text-red-500">
          IMPORT FAILED: {importError}
        </div>
      )}
    </div>
  )
}
