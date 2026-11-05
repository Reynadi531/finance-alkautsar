import { createFileRoute, redirect } from "@tanstack/react-router";
import { BookOpen, History, ShieldCheck, Wallet } from "lucide-react";

import { MosqueLogo } from "@/components/mosque-identity";
import SignInForm from "@/components/sign-in-form";
import { getUser } from "@/functions/get-user";

export const Route = createFileRoute("/login")({
  component: RouteComponent,
  beforeLoad: async () => {
    const session = await getUser();
    if (session) {
      throw redirect({
        to: "/dashboard",
      });
    }
  },
  head: () => ({
    meta: [{ title: "Masuk · ruangmasjid" }],
  }),
});

const features = [
  { icon: Wallet, label: "Pencatatan transaksi harian" },
  { icon: BookOpen, label: "Laporan kas yang mudah ditinjau" },
  { icon: History, label: "Riwayat perubahan yang terlacak" },
] as const;

/**
 * Photo layers, top to bottom: the background configured in settings, then the bundled photo.
 * The first endpoint answers 404 when nothing is configured, and CSS skips an image layer that
 * fails to load, so the bundled photo shows through without any data fetching here.
 */
const backdropImage = "url('/api/login-background'), url('/foto-masjid.png')";

function Backdrop() {
  return (
    <>
      <div
        aria-hidden
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: backdropImage }}
      />
      <div
        aria-hidden
        className="absolute inset-0 z-[1] bg-brand/72 lg:bg-transparent lg:bg-[linear-gradient(180deg,rgb(16_46_41/80%)_0%,rgb(16_46_41/30%)_55%,rgb(16_46_41/90%)_100%)]"
      />
    </>
  );
}

function MosqueHeading({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-4">
      <MosqueLogo
        className={
          compact ? "size-[58px] rounded-lg p-2" : "size-[72px] rounded-[10px] bg-canvas p-2.5"
        }
      />
      <div className="flex flex-col gap-[5px]">
        <p
          className={
            compact ? "text-base font-semibold text-canvas" : "text-lg font-semibold text-canvas"
          }
        >
          Masjid Al-Kautsar
        </p>
        <p className={compact ? "text-[13px] text-brand-muted" : "text-sm text-brand-muted"}>
          Pharmindo
        </p>
      </div>
    </div>
  );
}

function RouteComponent() {
  return (
    <main className="flex min-h-svh flex-col bg-canvas lg:grid lg:grid-cols-[500px_minmax(0,1fr)]">
      {/* Mobile identity header */}
      <header className="relative flex flex-col gap-7 overflow-hidden bg-brand px-7 py-8 lg:hidden">
        <Backdrop />
        <p className="relative z-[2] font-display text-[22px] font-bold tracking-[-0.7px] text-canvas">
          ruangmasjid
        </p>
        <div className="relative z-[3]">
          <MosqueHeading compact />
        </div>
        <div className="relative z-[4] flex flex-col gap-2">
          <h2 className="font-display text-xl font-semibold tracking-[-0.5px] text-canvas">
            Keuangan masjid, lebih tertata.
          </h2>
          <p className="text-xs leading-[19px] text-brand-foreground">
            Satu ruang kerja untuk amanah bersama.
          </p>
        </div>
      </header>

      {/* Desktop identity panel */}
      <aside className="relative hidden flex-col justify-between gap-10 overflow-hidden bg-brand px-[52px] py-12 lg:flex">
        <Backdrop />
        <p className="relative z-[3] font-display text-2xl font-bold tracking-[-0.7px] text-canvas">
          ruangmasjid
        </p>

        <div className="relative z-[4] flex flex-col gap-7">
          <MosqueHeading />
          <div className="flex flex-col gap-[18px]">
            <p className="text-[10px] font-bold tracking-[1.6px] text-brand-muted">
              RUANG KERJA PENGURUS MASJID
            </p>
            <h2 className="font-display text-[40px] leading-[48px] font-semibold tracking-[-1.3px] text-canvas">
              Keuangan masjid,
              <br />
              lebih tertata.
            </h2>
            <p className="text-[15px] leading-[27px] text-brand-foreground">
              Catat pemasukan dan pengeluaran, pantau saldo, dan siapkan laporan dalam satu ruang
              kerja yang jelas.
            </p>
          </div>
        </div>

        <div className="relative z-[5] flex flex-col gap-6">
          <div className="h-px w-full bg-white/20" />
          <ul className="flex flex-col gap-[18px]">
            {features.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3 text-[13px] text-brand-foreground">
                <Icon className="size-4 text-brand-icon" aria-hidden />
                {label}
              </li>
            ))}
          </ul>
          <p className="text-[11px] leading-[18px] text-brand-muted">
            Dibuat untuk pengurus, bendahara, dan jamaah.
          </p>
        </div>
      </aside>

      <section className="flex flex-1 flex-col items-center justify-between gap-10 px-7 pt-[34px] pb-7 lg:px-20 lg:pt-12 lg:pb-9">
        <p className="hidden w-full justify-end text-[10px] font-semibold tracking-[1.4px] text-ink-muted lg:flex">
          PENGELOLAAN KEUANGAN MASJID
        </p>

        <div className="flex w-full max-w-[440px] flex-col gap-[26px] lg:gap-7">
          <div className="flex flex-col gap-3.5">
            <p className="text-[10px] font-bold tracking-[1.6px] text-ink-strong">AKSES PENGURUS</p>
            <h1 className="font-display text-[27px] font-semibold tracking-[-0.8px] text-ink lg:text-[29px] lg:tracking-[-1px]">
              Selamat datang <br className="lg:hidden" />
              kembali.
            </h1>
            <p className="text-[13px] leading-[22px] text-ink-lead lg:text-sm lg:leading-6">
              Masuk untuk melanjutkan pengelolaan keuangan masjid.
            </p>
          </div>
          <SignInForm />
        </div>

        <p className="flex flex-col items-center gap-2.5 text-[10px] text-ink-muted lg:flex-row lg:gap-2">
          <span className="flex items-center gap-[7px]">
            <ShieldCheck className="size-3.5 text-ink-strong" aria-hidden />
            Akses khusus pengurus
          </span>
          <span className="hidden lg:inline" aria-hidden>
            ·
          </span>
          <span>Data masjid Anda tetap terlindungi</span>
        </p>
      </section>
    </main>
  );
}
