import { CalendarDays, FilePenLine, History } from "lucide-react";

import { StatCard } from "@/components/stat-card";
import { formatTimestamp } from "@/lib/date-range";

const number = new Intl.NumberFormat("id-ID");

/** Summary row of S08; independent of the list filters. */
export function ChangeLogStats({
  totalRecent,
  dataChanges,
  today,
  lastToday,
}: {
  totalRecent: number;
  dataChanges: number;
  today: number;
  lastToday: Date | null;
}) {
  const lastTime = lastToday ? formatTimestamp(lastToday).split(" · ")[1] : null;
  return (
    <section aria-label="Ringkasan aktivitas" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <StatCard
        label="Total aktivitas"
        value={number.format(totalRecent)}
        caption="30 hari terakhir"
        icon={History}
      />
      <StatCard
        label="Perubahan data"
        value={number.format(dataChanges)}
        caption="Transaksi & kategori"
        icon={FilePenLine}
      />
      <StatCard
        label="Aktivitas hari ini"
        value={number.format(today)}
        icon={CalendarDays}
        caption={lastTime ? `Terakhir pukul ${lastTime}` : "Belum ada aktivitas hari ini"}
      />
    </section>
  );
}
