import { MosqueIdentity } from "@/components/mosque-identity";
import type { UserRole } from "@/server/mosque";

import { roleLabels, visibleSections } from "./navigation";
import { SidebarNavItem } from "./sidebar-nav-item";
import { UserProfileMenu } from "./user-profile-menu";

export type AppSidebarProps = {
  user: { name: string; email: string };
  mosqueName: string;
  role: UserRole;
  onNavigate?: () => void;
};

export function AppSidebar({ user, mosqueName, role, onNavigate }: AppSidebarProps) {
  const sections = visibleSections(role);

  return (
    <div className="flex h-full flex-col justify-between gap-7 overflow-y-auto bg-brand px-[18px] pt-8 pb-6">
      <div className="flex flex-col gap-7">
        <div className="flex flex-col gap-5 px-1.5">
          <p className="font-display text-[23px] font-bold tracking-[-0.7px] text-canvas">
            ruangmasjid
          </p>
          <MosqueIdentity mosqueName={mosqueName} />
        </div>
        <div className="h-px bg-white/[0.13]" />

        <nav aria-label="Navigasi utama" className="flex flex-col gap-[22px]">
          {sections.map((section) => (
            <div key={section.label} className="flex flex-col gap-1.5">
              <p className="text-[9px] font-bold tracking-[1.4px] text-brand-label uppercase">
                {section.label}
              </p>
              <ul className="flex flex-col gap-0.5">
                {section.items.map((item) => (
                  <li key={item.label}>
                    <SidebarNavItem item={item} onNavigate={onNavigate} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <UserProfileMenu name={user.name} email={user.email} roleLabel={roleLabels[role]} />
    </div>
  );
}
