"use client";

import { Printer } from "lucide-react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/cn";

/** A button, minus the parts this component owns. */
export type PrintButtonProps = Omit<ButtonProps, "onClick" | "type" | "children">;

/**
 * Opens the browser print dialog.
 *
 * Every print rule lives in `globals.css`, so this button only has to ask. It
 * carries `print-none` because a button that prints itself is noise on paper.
 */
export function PrintButton({
  variant = "outline",
  size = "sm",
  className,
  ...props
}: PrintButtonProps) {
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={() => window.print()}
      className={cn("print-none", className)}
      {...props}
    >
      <Printer aria-hidden />
      Print report
    </Button>
  );
}