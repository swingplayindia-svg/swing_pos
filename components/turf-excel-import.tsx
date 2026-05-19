"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { addTurfsBulk } from "@/lib/storage";
import {
  downloadImportTemplate,
  parseExcelFile,
  type ImportPreview,
} from "@/lib/turf-excel";
import { Download, FileSpreadsheet, Upload } from "lucide-react";

interface TurfExcelImportProps {
  onImported: () => void;
}

export function TurfExcelImport({ onImported }: TurfExcelImportProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [fileName, setFileName] = useState("");

  const reset = () => {
    setPreview(null);
    setFileName("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleFile = async (file: File) => {
    setIsParsing(true);
    setFileName(file.name);
    try {
      const result = await parseExcelFile(file);
      setPreview(result);
      setOpen(true);
    } catch {
      setPreview({
        turfs: [],
        errors: [{ row: 0, message: "Could not read this file. Use .xlsx or .csv." }],
        skipped: 0,
      });
      setOpen(true);
    } finally {
      setIsParsing(false);
    }
  };

  const handleImport = async () => {
    if (!preview || preview.turfs.length === 0) return;
    setIsImporting(true);
    try {
      await addTurfsBulk(preview.turfs);
      setOpen(false);
      reset();
      onImported();
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      <Button
        type="button"
        variant="outline"
        className="border-border bg-white shadow-sm"
        onClick={() => downloadImportTemplate()}
      >
        <Download className="w-4 h-4 mr-2" />
        Download template
      </Button>

      <Button
        type="button"
        className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm shadow-primary/15"
        disabled={isParsing}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="w-4 h-4 mr-2" />
        {isParsing ? "Reading file…" : "Upload spreadsheet"}
      </Button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) reset();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
              Import preview
            </DialogTitle>
            <DialogDescription>
              {fileName ? `File: ${fileName}` : "Review rows before importing."}
            </DialogDescription>
          </DialogHeader>

          {preview && (
            <div className="space-y-3 text-sm">
              <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-1">
                <p className="text-foreground font-medium">
                  {preview.turfs.length} turf
                  {preview.turfs.length === 1 ? "" : "s"} ready to import
                </p>
                {preview.skipped > 0 && (
                  <p className="text-muted-foreground">
                    {preview.skipped} empty row(s) skipped
                  </p>
                )}
              </div>

              {preview.errors.length > 0 && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 max-h-32 overflow-y-auto">
                  <p className="font-medium text-destructive mb-2">
                    {preview.errors.length} issue(s)
                  </p>
                  <ul className="space-y-1 text-destructive/90">
                    {preview.errors.slice(0, 5).map((err) => (
                      <li key={`${err.row}-${err.message}`}>{err.message}</li>
                    ))}
                    {preview.errors.length > 5 && (
                      <li>…and {preview.errors.length - 5} more</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={!preview || preview.turfs.length === 0 || isImporting}
              onClick={() => void handleImport()}
            >
              {isImporting
                ? "Importing…"
                : `Import ${preview?.turfs.length ?? 0} turf${(preview?.turfs.length ?? 0) === 1 ? "" : "s"}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
