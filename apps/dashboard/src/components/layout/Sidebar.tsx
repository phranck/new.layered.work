import type { AdminRole } from "@layered/contracts";
import { DashboardSection } from "@layered/ui/dashboard-section";
import {
  ArticleIcon,
  CaretCircleDoubleDownIcon,
  CaretCircleDoubleUpIcon,
  CheckCircleIcon,
  CircleIcon,
  CopyIcon,
  EyeSlashIcon,
  FileIcon,
  GearSixIcon,
  HouseSimpleIcon,
  LinkIcon,
  PaintBrushIcon,
  SquaresFourIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react";
import type React from "react";
import { useCallback, useState } from "react";
import { NavLink } from "react-router";

import { CollapsibleSidebarGroup } from "@/components/layout/CollapsibleSidebarGroup.tsx";
import { SidebarFooter } from "@/components/layout/SidebarFooter.tsx";
import { SidebarHeader } from "@/components/layout/SidebarHeader.tsx";
import { sidebarGroupItemClass } from "@/components/layout/sidebarNavClasses.ts";
import { useI18n } from "@/context/I18nContext.tsx";
import { useContentPages } from "@/features/content/hooks/useAdminContent.ts";

interface SidebarProps {
  username?: string;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  role?: AdminRole;
  onLogout: () => void;
  onItemClick?: () => void;
  onEditProfile?: () => void;
  bare?: boolean;
}

const SECTION_KEYS = ["general", "content", "system"] as const;
type SectionKey = (typeof SECTION_KEYS)[number];
const SIDEBAR_GROUP_STORAGE_KEYS = ["sidebar-pages-open"] as const;
type SidebarGroupStorageKey = (typeof SIDEBAR_GROUP_STORAGE_KEYS)[number];

function getStoredSidebarGroupState(): Record<SidebarGroupStorageKey, boolean> {
  return Object.fromEntries(
    SIDEBAR_GROUP_STORAGE_KEYS.map((key) => [key, localStorage.getItem(key) === "true"]),
  ) as Record<SidebarGroupStorageKey, boolean>;
}

function SidebarNavItem({
  end,
  icon,
  label,
  onClick,
  to,
}: {
  end?: boolean;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  to: string;
}) {
  return (
    <NavLink to={to} end={end} onClick={onClick}>
      {({ isActive }) => <DashboardSection.Item icon={icon} label={label} active={isActive} />}
    </NavLink>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === "published") {
    return <CheckCircleIcon weight="duotone" className="size-4 text-green-500 shrink-0" />;
  }
  if (status === "hidden") {
    return <EyeSlashIcon weight="duotone" className="size-4 text-gray-400 shrink-0" />;
  }
  return <CircleIcon weight="duotone" className="size-4 text-amber-500 shrink-0" />;
}

function PagesGroup({
  onItemClick,
  globalOpenState,
  globalOpenVersion,
  onOpenChange,
}: {
  onItemClick?: () => void;
  globalOpenState?: boolean | null;
  globalOpenVersion?: number;
  onOpenChange?: (open: boolean) => void;
}) {
  const { messages } = useI18n();
  const sidebarMessages = messages.layout.sidebar;
  const { data: pages } = useContentPages();

  return (
    <CollapsibleSidebarGroup
      routeMatch="/pages/*"
      storageKey="sidebar-pages-open"
      icon={<CopyIcon weight="duotone" className="size-5" />}
      label={sidebarMessages.pages}
      badge={pages?.length ?? 0}
      globalOpenState={globalOpenState}
      globalOpenVersion={globalOpenVersion}
      onOpenChange={onOpenChange}
    >
      <NavLink to="/pages" end onClick={onItemClick} className={sidebarGroupItemClass}>
        {sidebarMessages.pagesOverview}
      </NavLink>
      {(pages ?? []).map((page) => (
        <NavLink
          key={page.slug}
          to={`/pages/${page.slug}`}
          onClick={onItemClick}
          className={sidebarGroupItemClass}
        >
          <FileIcon weight="duotone" className="size-4 shrink-0 opacity-60" />
          <StatusIcon status={page.status} />
          <span className="flex flex-col min-w-0">
            <span className="truncate">{page.title}</span>
            <span className="truncate text-xs opacity-50">/{page.slug}</span>
          </span>
        </NavLink>
      ))}
    </CollapsibleSidebarGroup>
  );
}

export function Sidebar({
  username,
  firstName,
  lastName,
  avatarUrl,
  role,
  onLogout,
  onItemClick,
  onEditProfile,
  bare = false,
}: SidebarProps) {
  const { messages } = useI18n();
  const s = messages.layout.sidebar;
  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>({
    general: true,
    content: true,
    system: true,
  });
  const [groupOpenVersion, setGroupOpenVersion] = useState(0);
  const [groupOpenState, setGroupOpenState] = useState<boolean | null>(null);
  const [groupStatus, setGroupStatus] = useState<Record<SidebarGroupStorageKey, boolean>>(
    getStoredSidebarGroupState,
  );
  const allExpanded =
    SECTION_KEYS.every((section) => openSections[section]) &&
    SIDEBAR_GROUP_STORAGE_KEYS.every((key) => groupStatus[key]);

  function setAllSections(open: boolean) {
    setOpenSections({ general: open, content: open, system: open });
    setGroupOpenState(open);
    setGroupOpenVersion((version) => version + 1);
    setGroupStatus(
      Object.fromEntries(SIDEBAR_GROUP_STORAGE_KEYS.map((key) => [key, open])) as Record<
        SidebarGroupStorageKey,
        boolean
      >,
    );
  }

  function sectionOpenHandler(section: SectionKey) {
    return (open: boolean) => setOpenSections((current) => ({ ...current, [section]: open }));
  }

  const handlePagesGroupOpenChange = useCallback((open: boolean) => {
    setGroupStatus((current) => ({ ...current, "sidebar-pages-open": open }));
  }, []);

  return (
    <>
      {!bare && <SidebarHeader />}
      <nav className="flex-1 overflow-y-auto px-3 pb-3">
        <div className="sticky top-0 z-10 flex justify-end bg-[var(--ds-card-bg,var(--ds-surface))] py-2">
          <button
            type="button"
            aria-label={allExpanded ? s.collapseAllAria : s.expandAllAria}
            title={allExpanded ? s.collapseAll : s.expandAll}
            onClick={() => setAllSections(!allExpanded)}
            className="size-8 flex items-center justify-center rounded-control text-[var(--ds-text-muted)] hover:bg-[var(--ds-nav-hover-bg)] hover:text-[var(--ds-text)]"
          >
            {allExpanded ? (
              <CaretCircleDoubleUpIcon weight="duotone" className="size-5" />
            ) : (
              <CaretCircleDoubleDownIcon weight="duotone" className="size-5" />
            )}
          </button>
        </div>

        <div className="space-y-3">
          <DashboardSection
            collapsible
            expanded={openSections.general}
            onExpandedChange={sectionOpenHandler("general")}
            className="shadow-sm"
          >
            <DashboardSection.Header
              icon={<HouseSimpleIcon weight="duotone" className="size-5" />}
              title={s.sectionGeneral}
            />
            <DashboardSection.Body>
              <SidebarNavItem
                end
                to="/"
                onClick={onItemClick}
                icon={<HouseSimpleIcon weight="duotone" className="size-5" />}
                label={s.overview}
              />
            </DashboardSection.Body>
          </DashboardSection>

          <DashboardSection
            collapsible
            expanded={openSections.content}
            onExpandedChange={sectionOpenHandler("content")}
            className="shadow-sm"
          >
            <DashboardSection.Header
              icon={<ArticleIcon weight="duotone" className="size-5" />}
              title={s.sectionContent}
            />
            <DashboardSection.Body>
              <SidebarNavItem
                to="/design"
                onClick={onItemClick}
                icon={<PaintBrushIcon weight="duotone" className="size-5" />}
                label={s.design}
              />
              <SidebarNavItem
                to="/projects"
                onClick={onItemClick}
                icon={<SquaresFourIcon weight="duotone" className="size-5" />}
                label={s.projects}
              />
              <SidebarNavItem
                to="/posts"
                onClick={onItemClick}
                icon={<ArticleIcon weight="duotone" className="size-5" />}
                label={s.posts}
              />
              <PagesGroup
                onItemClick={onItemClick}
                globalOpenState={groupOpenState}
                globalOpenVersion={groupOpenVersion}
                onOpenChange={handlePagesGroupOpenChange}
              />
              <SidebarNavItem
                to="/navigations"
                onClick={onItemClick}
                icon={<LinkIcon weight="duotone" className="size-5" />}
                label={s.navigations}
              />
            </DashboardSection.Body>
          </DashboardSection>

          <DashboardSection
            collapsible
            expanded={openSections.system}
            onExpandedChange={sectionOpenHandler("system")}
            className="shadow-sm"
          >
            <DashboardSection.Header
              icon={<GearSixIcon weight="duotone" className="size-5" />}
              title={s.sectionSystem}
            />
            <DashboardSection.Body>
              <SidebarNavItem
                to="/users"
                onClick={onItemClick}
                icon={<UsersThreeIcon weight="duotone" className="size-5" />}
                label={s.users}
              />
              <SidebarNavItem
                to="/settings"
                onClick={onItemClick}
                icon={<GearSixIcon weight="duotone" className="size-5" />}
                label={s.settings}
              />
            </DashboardSection.Body>
          </DashboardSection>
        </div>
      </nav>
      {!bare && (
        <SidebarFooter
          username={username}
          firstName={firstName}
          lastName={lastName}
          avatarUrl={avatarUrl}
          role={role}
          onLogout={onLogout}
          onEditProfile={onEditProfile}
        />
      )}
    </>
  );
}
