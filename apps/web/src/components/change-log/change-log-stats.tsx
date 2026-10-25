import { formatTimestamp } from "@/lib/date-range";

const number = new Intl.NumberFormat("id-ID");

function Stat({ label, value, caption }: { label: string; value: number; caption: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5 rounded-lg border border-line bg-white px-[17px] py-3.5">
      <p className="text-[11px] text-ink-muted">{label}</p>
      <p className="font-display text-[22px] font-bold text-ink tabular-nums">
        {number.format(value)}
      </p>
      <p className="truncate text-[10px] text-ink-muted">{caption}</p>
    </div>
  );
}

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
    <section aria-label="Ringkasan aktivitas" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <Stat label="Total aktivitas" value={totalRecent} caption="30 hari terakhir" />
      <Stat label="Perubahan data" value={dataChanges} caption="Transaksi & kategori" />
      <Stat
        label="Aktivitas hari ini"
        value={today}
        caption={lastTime ? `Terakhir pukul ${lastTime}` : "Belum ada aktivitas hari ini"}
      />
    </section>
  );
}
