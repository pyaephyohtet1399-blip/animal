/**
 * Excel Export Button component.
 *
 * A single button that, when pressed, exports every survey the current
 * officer can see (server-side role scope: township officer → own township,
 * district officer → all townships) as one WDN sheet. The page filters are
 * ignored — the officer filters inside Excel via the sheet's autofilter.
 */
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { exportToExcel, canExport } from "@/components/report/surveyExport.utils";
import type { CensusDataset } from "@/types/census-records";

export interface ExcelExportButtonProps {
  /** The CensusDataset from the Report page */
  dataset?: CensusDataset | null;
  /** Optional className override */
  className?: string;
  /** Optional custom button label */
  label?: string;
  /** Optional callback after successful export */
  onExport?: () => void;
  /** Optional callback on error */
  onError?: (error: Error) => void;
}

/**
 * ExcelExportButton - A button that exports survey data to Excel.
 * Pressing it exports every visible record in one sheet — no menu, no filters.
 */
export function ExcelExportButton({
  dataset,
  className,
  label = "Excel ထုတ်ယူရန်",
  onExport,
  onError,
}: ExcelExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    if (!canExport(dataset || null)) {
      onError?.(new Error("No data available to export"));
      return;
    }
    setIsExporting(true);
    try {
      exportToExcel(dataset || null);
      onExport?.();
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error(String(error)));
    } finally {
      setIsExporting(false);
    }
  };

  const disabled = isExporting || !canExport(dataset || null);

  return (
    <Button
      onClick={handleExport}
      variant="outline"
      size="sm"
      disabled={disabled}
      className={cn("me-2", className)}
    >
      {isExporting ? "Exporting..." : label}
    </Button>
  );
}
