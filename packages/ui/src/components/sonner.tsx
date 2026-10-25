"use client";

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  // The app ships a light-only palette; following the OS would render dark toasts on a light page.
  const { theme = "light" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
          // richColors variants mapped onto the app palette instead of sonner's defaults.
          "--success-bg": "var(--color-income-surface)",
          "--success-text": "var(--color-income)",
          "--success-border": "color-mix(in oklab, var(--color-income) 20%, transparent)",
          "--error-bg": "var(--color-expense-surface)",
          "--error-text": "var(--color-expense)",
          "--error-border": "color-mix(in oklab, var(--color-expense) 20%, transparent)",
          "--info-bg": "var(--color-info-surface)",
          "--info-text": "var(--color-info-foreground)",
          "--info-border": "color-mix(in oklab, var(--color-info-foreground) 20%, transparent)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
