import type { Membership } from "@/server/mosque-access";

import { MosqueSwitcher } from "./mosque-switcher";
import { roleLabels, visibleSections } from "./navigation";
import { SidebarNavItem } from "./sidebar-nav-item";
import { UserProfileMenu } from "./user-profile-menu";

export type AppSidebarProps = {
  user: { name: string; email: string };
  memberships: Membership[];
  active: Membership;
  onNavigate?: () => void;
};

export function AppSidebar({ user, memberships, active, onNavigate }: AppSidebarProps) {
  const sections = visibleSections(active.role);

  return (
    <div className="flex h-full flex-col gap-2.5 bg-brand px-4 py-7">
      <div className="flex flex-col gap-[5px] px-2.5 pb-6">
        <p className="font-display text-xl font-bold text-white">ruangmasjid</p>
        <MosqueSwitcher memberships={memberships} activeId={active.mosqueId} />
      </div>
      <div className="h-px bg-white/20" />

      <nav aria-label="Navigasi utama" className="flex flex-col gap-2.5 overflow-y-auto">
        {sections.map((section) => (
          <div key={section.label} className="flex flex-col pt-2.5">
            <p className="text-[10px] font-bold tracking-[0.13em] text-brand-label uppercase">
              {section.label}
            </p>
            <ul className="flex flex-col gap-1 py-3">
              {section.items.map((item) => (
                <li key={item.label}>
                  <SidebarNavItem item={item} size={section.size} onNavigate={onNavigate} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="mt-auto">
        <UserProfileMenu name={user.name} email={user.email} roleLabel={roleLabels[active.role]} />
      </div>
    </div>
  );
}
