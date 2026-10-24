import { createFileRoute, redirect } from "@tanstack/react-router";
import { BookOpen, History, Wallet } from "lucide-react";

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

function RouteComponent() {
  return (
    <main className="grid min-h-svh bg-white lg:grid-cols-[minmax(0,640px)_1fr]">
      <aside className="hidden flex-col bg-[#063B83] px-[78px] pt-[70px] pb-[56px] lg:flex">
        <p className="font-display text-2xl font-bold text-white">ruangmasjid</p>

        <div className="mt-[118px]">
          <p className="text-xs font-bold tracking-[0.13em] text-[#AFCDF0]">
            RUANG KERJA PENGURUS MASJID
          </p>
          <h2 className="mt-6 max-w-[475px] font-display text-5xl leading-[1.1] font-bold text-white">
            Keuangan masjid, lebih tertata.
          </h2>
          <p className="mt-8 max-w-[435px] text-[17px] leading-[1.55] text-[#D6E7F7]">
            Catat pemasukan dan pengeluaran, pantau saldo, dan siapkan laporan dalam satu ruang
            kerja yang jelas.
          </p>
        </div>

        <div className="mt-auto max-w-[450px] border-t border-[#5E86B6] pt-9">
          <ul className="flex flex-col gap-5">
            {features.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3 text-sm text-[#EDF5FD]">
                <Icon className="size-[18px] text-[#A9D5C0]" aria-hidden />
                {label}
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-[110px] text-xs text-[#9DBBDC]">
          Dibuat untuk pengurus, bendahara, dan jamaah.
        </p>
      </aside>

      <section className="flex min-h-svh flex-col px-4 py-10 sm:px-10 lg:py-[56px]">
        <p className="text-center font-display text-2xl font-bold text-[#063B83] lg:hidden">
          ruangmasjid
        </p>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[520px]">
            <p className="text-[11px] font-bold tracking-[0.13em] text-[#176B4D]">AKSES PENGURUS</p>
            <h1 className="mt-7 font-display text-[28px] leading-tight font-bold text-[#13251B] sm:text-[34px]">
              Selamat datang kembali.
            </h1>
            <p className="mt-4 mb-4 text-[15px] text-[#64746B]">
              Masuk untuk melanjutkan pengelolaan keuangan masjid.
            </p>
            <SignInForm />
          </div>
        </div>

        <p className="text-center text-xs text-[#74837A]">
          Akses khusus pengurus · Data masjid Anda tetap terlindungi
        </p>
      </section>
    </main>
  );
}
