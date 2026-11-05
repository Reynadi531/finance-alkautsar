import { cn } from "@keuangan-alkautsar/ui/lib/utils";

/** White tile holding the mosque's logo, as used in the sidebar, drawer and settings preview. */
export function MosqueLogo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex size-11 shrink-0 items-center justify-center rounded-md bg-white p-1.5",
        className,
      )}
    >
      <img src="/logo-al-kautsar.png" alt="" className="size-full object-contain" />
    </span>
  );
}

/** Logo tile plus mosque name, for dark green surfaces. */
export function MosqueIdentity({ mosqueName }: { mosqueName: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <MosqueLogo />
      <p className="min-w-0 flex-1 text-xs leading-[19px] font-medium text-canvas">{mosqueName}</p>
    </div>
  );
}
