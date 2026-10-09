/**
 * Excel Export Button component.
 *
 * A reusable button that exports the currently filtered WDN survey data to an Excel file.
 * Visually consistent with the existing project UI/design system.
 */
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { exportToExcel, canExport } from "@/components/report/surveyExport.utils";
import type { CensusDataset } from "@/types/census-records";
import type { ReportScope } from "@/lib/reports";

export interface ExcelExportButtonProps {
  /** The CensusDataset from the Report page */
  dataset?: CensusDataset | null;
  /** The current ReportScope (filters) from the Report page */
  scope?: ReportScope | null;
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
 * When clicked, it downloads an .xlsx file with all 246 WDN columns.
 */
export function ExcelExportButton({
  dataset,
  scope,
  className,
  label = "Excel ထုတ်ယူရန်",
  onExport,
  onError,
}: ExcelExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleClick = () => {
    if (!canExport(dataset || null, scope || null)) {
      const error = new Error("No data available to export");
      onError?.(error);
      return;
    }

    setIsExporting(true);
    try {
      exportToExcel(dataset || null, scope || null);
      onExport?.();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      onError?.(err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={handleClick}
      variant="outline"
      size="sm"
      disabled={isExporting || !canExport(dataset || null, scope || null)}
      className={cn("me-2", className)}
    >
      {isExporting ? "Exporting..." : label}
    </Button>
  );
}