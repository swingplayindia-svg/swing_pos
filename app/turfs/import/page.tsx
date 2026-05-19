"use client";

import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TurfExcelImport } from "@/components/turf-excel-import";
import { EXCEL_TEMPLATE_HEADERS } from "@/lib/turf-excel";
import { FileSpreadsheet } from "lucide-react";

export default function TurfsImportPage() {
  const router = useRouter();

  return (
    <div className="max-w-2xl space-y-6">
      <p className="text-sm text-muted-foreground">
        Upload a spreadsheet to add multiple venues in one go. Download the template,
        fill it in, then import.
      </p>

      <Card className="border-border/80 shadow-sm overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-primary via-primary/70 to-primary/30" />
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Excel import
          </CardTitle>
          <CardDescription>
            Supports .xlsx, .xls, and .csv. You will preview rows before saving.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <TurfExcelImport onImported={() => router.push("/turfs")} />
        </CardContent>
      </Card>

      <Card className="border-border/80 bg-muted/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-foreground">
            Column reference
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {EXCEL_TEMPLATE_HEADERS.map((col) => (
              <span
                key={col}
                className="rounded-md border border-border/80 bg-white px-2.5 py-1 text-xs text-muted-foreground"
              >
                {col}
              </span>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Sports: comma-separated. Amenities: yes/no. Open 24 Hours: yes/no. Download the template for all columns.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
