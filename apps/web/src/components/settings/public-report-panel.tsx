import { Switch } from "@keuangan-alkautsar/ui/components/switch";
import { useRouter } from "@tanstack/react-router";
import { useId, useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { Panel, PanelHeader } from "@/components/panel";
import { setPublicReport } from "@/functions/settings";

/**
 * "Transparansi publik": switch for publishing the cash report summary. Turning it on asks
 * for confirmation first; turning it off applies right away.
 */
export function PublicReportPanel({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const labelId = useId();
  const statusId = useId();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);

  async function apply(next: boolean) {
    setPending(true);
    try {
      await setPublicReport({ data: { enabled: next } });
      setConfirming(false);
      toast.success(next ? "Publikasi laporan diaktifkan." : "Publikasi laporan dinonaktifkan.");
      await router.invalidate();
    } catch (error) {
      toast.error(
        error instanceof Error && error.message ? error.message : "Pengaturan gagal disimpan.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <Panel aria-labelledby="public-report-title" className="gap-[9px] p-5">
      <PanelHeader title="Transparansi publik" titleId="public-report-title" />
      <p className="text-[13px] text-ink-muted">
        Publikasikan ringkasan laporan kas agar dapat diakses warga. Data sensitif dan lampiran
        tidak akan ditampilkan.
      </p>
      <div className="mt-1.5 flex items-center justify-between gap-4 rounded-lg border border-line px-4 py-3.5">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span id={labelId} className="text-[13px] font-bold text-ink-strong">
            Publikasi laporan
          </span>
          <span id={statusId} className="text-xs text-ink-muted" aria-live="polite">
            {enabled ? "Saat ini aktif" : "Saat ini nonaktif"}
          </span>
        </div>
        <Switch
          checked={enabled}
          disabled={pending}
          aria-labelledby={labelId}
          aria-describedby={statusId}
          onCheckedChange={(next) => (next ? setConfirming(true) : apply(false))}
          className="data-[size=default]:h-6 data-[size=default]:w-11 data-checked:bg-income data-unchecked:bg-[#DDE4E0] focus-visible:ring-2 focus-visible:ring-income/40 px-0.5 [&>span]:size-5!"
        />
      </div>

      <ConfirmDialog
        open={confirming}
        onOpenChange={(open) => {
          if (!pending) setConfirming(open);
        }}
        tone="brand"
        title="Aktifkan publikasi laporan?"
        description={
          <>
            Ringkasan laporan kas masjid (total pemasukan, pengeluaran, dan saldo per periode) akan
            dapat dilihat siapa saja tanpa masuk. Data pengguna, riwayat perubahan, lampiran bukti,
            dan rincian internal transaksi tetap tidak ditampilkan. Anda dapat menonaktifkannya
            kapan saja.
          </>
        }
        confirmLabel="Aktifkan publikasi"
        onConfirm={() => apply(true)}
        pending={pending}
      />
    </Panel>
  );
}
