import { useServerFn } from "@tanstack/react-start";
import { ArrowDown } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ActionButton } from "@/components/action-button";
import type { ChangeLogFilters } from "@/components/change-log/filters";
import { exportChangeLog } from "@/functions/change-log";
import { todayIso } from "@/lib/date-range";

/** Downloads the entries matching the current filters as a UTF-8 (BOM) CSV. */
export function ExportButton({
  filters,
  filtered,
}: {
  filters: ChangeLogFilters;
  filtered: boolean;
}) {
  const runExport = useServerFn(exportChangeLog);
  const [pending, setPending] = useState(false);

  async function handleExport() {
    setPending(true);
    try {
      const { csv, count } = await runExport({ data: filters });
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `riwayat-perubahan-${todayIso()}.csv`;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success(`${count} aktivitas diekspor ke CSV.`);
    } catch {
      toast.error("Ekspor gagal. Coba lagi beberapa saat lagi.");
    } finally {
      setPending(false);
    }
  }

  return (
    <ActionButton tone="outline" pending={pending} onClick={handleExport}>
      {pending ? null : <ArrowDown aria-hidden />}
      {filtered ? "Ekspor hasil filter" : "Ekspor CSV"}
    </ActionButton>
  );
}
