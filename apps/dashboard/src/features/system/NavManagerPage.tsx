import { closestCenter, DndContext, type DragEndEvent } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { NavId } from "@layered/contracts";
import { DashboardSection } from "@layered/ui/dashboard-section";
import { BrowsersIcon, FileIcon, SquareHalfBottomIcon } from "@phosphor-icons/react";
import {
  type Ref,
  useCallback,
  useEffect,
  useImperativeHandle,
  useReducer,
  useRef,
  useState,
} from "react";

import {
  CreateActionButton,
  RemoveActionButton,
  SaveActionButton,
} from "@/components/ui/DashboardActionButton.tsx";
import { DashboardDragHandle, DashboardInput } from "@/components/ui/DashboardControls.tsx";
import { Dropdown, type DropdownOption } from "@/components/ui/Dropdown.tsx";
import { PageHeader } from "@/components/ui/PageHeader.tsx";
import { PageBody, PageLayout } from "@/components/ui/PageLayout.tsx";
import { SaveNotification, useSaveNotification } from "@/components/ui/SaveNotification.tsx";
import { SegmentSwitch } from "@/components/ui/SegmentSwitch.tsx";
import { useDashboardSortableSensors } from "@/components/ui/useDashboardSortableSensors.ts";
import { useI18n } from "@/context/I18nContext.tsx";
import { useContentPages } from "@/features/content/hooks/useAdminContent.ts";
import { useAdminNav, useSaveNav } from "@/features/system/hooks/useAdminNav.ts";

const NAV_TEXT = {
  de: {
    add: "Hinzufügen",
    choosePage: "Seite wählen…",
    dragTitle: "Verschieben",
    errorSaving: "Fehler beim Speichern",
    footerNav: "Footer-Navigation",
    headerNav: "Header-Navigation",
    labelOverrideTitle: "Label-Override (leer = Standard)",
    load: "Lade…",
    noEntries: "Keine Einträge",
    pageTitle: "Navigationen",
    remove: "Entfernen",
    staticRoutes: [
      { label: "Home", url: "#home" },
      { label: "Projekte", url: "#projects" },
      { label: "Blog", url: "#blog" },
      { label: "Über", url: "#about" },
    ],
    typePage: "Seite",
    typeUrl: "URL",
    urlPlaceholder: "https://… /pfad oder #anker",
    labelPlaceholder: "Label",
  },
  en: {
    add: "Add",
    choosePage: "Select page…",
    dragTitle: "Drag",
    errorSaving: "Error while saving",
    footerNav: "Footer navigation",
    headerNav: "Header navigation",
    labelOverrideTitle: "Label override (empty = default)",
    load: "Loading…",
    noEntries: "No entries",
    pageTitle: "Navigations",
    remove: "Remove",
    staticRoutes: [
      { label: "Home", url: "#home" },
      { label: "Projects", url: "#projects" },
      { label: "Blog", url: "#blog" },
      { label: "About", url: "#about" },
    ],
    typePage: "Page",
    typeUrl: "URL",
    urlPlaceholder: "https://… /path or #anchor",
    labelPlaceholder: "Label",
  },
} as const;

type NavText = (typeof NAV_TEXT)[keyof typeof NAV_TEXT];

interface NavItemState {
  id: string;
  pageSlug: string | null;
  pageTitle: string | null;
  url: string | null;
  target: "_self" | "_blank";
  label: string;
}

function SortableNavItem({
  item,
  onLabelChange,
  onRemove,
  text,
}: {
  item: NavItemState;
  onLabelChange: (id: string, label: string) => void;
  onRemove: (id: string) => void;
  text: NavText;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style = {
    opacity: isDragging ? 0.5 : 1,
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const displayUrl = item.url ?? (item.pageSlug ? `/${item.pageSlug}` : "");

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="grid grid-cols-[auto_minmax(0,1fr)_minmax(10rem,11rem)_auto] items-center gap-3 rounded-control border border-[var(--ds-border)] bg-[var(--ds-surface)] p-3"
    >
      <DashboardDragHandle
        {...attributes}
        {...listeners}
        aria-label={text.dragTitle}
        title={text.dragTitle}
      />

      <div className="min-w-0 overflow-hidden">
        <div className="truncate text-sm font-medium text-[var(--ds-text)]">
          {item.pageTitle ?? item.url}
        </div>
        <div className="truncate font-mono text-xs text-[var(--ds-text-muted)]">{displayUrl}</div>
      </div>

      <DashboardInput
        type="text"
        value={item.label}
        onChange={(event) => onLabelChange(item.id, event.target.value)}
        placeholder={item.pageTitle ?? item.url ?? ""}
        className="w-44 min-w-0 text-xs"
        title={text.labelOverrideTitle}
      />

      <RemoveActionButton
        onClick={() => onRemove(item.id)}
        title={text.remove}
        label={text.remove}
        iconOnly
      />
    </div>
  );
}

export interface NavColumnHandle {
  hasDirty: () => boolean;
  save: () => Promise<boolean>;
}

interface NavColumnProps {
  navId: NavId;
  onDirtyChange?: (dirty: boolean) => void;
  ref?: Ref<NavColumnHandle>;
}

function NavColumn({ navId, onDirtyChange, ref }: NavColumnProps) {
  const { locale } = useI18n();
  const text = NAV_TEXT[locale];
  const staticRoutes = text.staticRoutes;
  const { data: serverItems = [], isLoading } = useAdminNav(navId);
  const { data: allPages = [] } = useContentPages();
  const saveNav = useSaveNav(navId);

  interface NavColumnState {
    addLabel: string;
    addPageSlug: string;
    addType: "page" | "url";
    addUrl: string;
    dirty: boolean;
    items: NavItemState[];
  }

  const [state, dispatch] = useReducer(
    (prev: NavColumnState, action: Partial<NavColumnState>): NavColumnState => ({
      ...prev,
      ...action,
    }),
    {
      addLabel: "",
      addPageSlug: "",
      addType: "page",
      addUrl: "",
      dirty: false,
      items: [],
    },
  );
  const { addLabel, addPageSlug, addType, addUrl, dirty, items } = state;

  const setItems = (updater: NavItemState[] | ((prev: NavItemState[]) => NavItemState[])) => {
    dispatch({ items: typeof updater === "function" ? updater(items) : updater });
  };

  const setDirty = useCallback(
    (nextDirty: boolean) => {
      dispatch({ dirty: nextDirty });
      onDirtyChange?.(nextDirty);
    },
    [onDirtyChange],
  );

  useEffect(() => {
    dispatch({
      dirty: false,
      items: serverItems.map((item) => ({
        id: item.id,
        label: item.label ?? "",
        pageSlug: item.pageSlug,
        pageTitle: item.pageTitle,
        target: item.target,
        url: item.url,
      })),
    });
  }, [serverItems]);

  const sensors = useDashboardSortableSensors();

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setItems((prev) => {
      const oldIndex = prev.findIndex((item) => item.id === active.id);
      const newIndex = prev.findIndex((item) => item.id === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
    setDirty(true);
  }

  function handleRemove(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
    setDirty(true);
  }

  function handleLabelChange(id: string, label: string) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, label } : item)));
    setDirty(true);
  }

  function handleAddPage() {
    if (!addPageSlug) return;

    const page = allPages.find((candidate) => candidate.slug === addPageSlug);
    if (!page || items.some((item) => item.pageSlug === addPageSlug)) return;

    setItems((prev) => [
      ...prev,
      {
        id: `draft_${Date.now()}`,
        label: "",
        pageSlug: page.slug,
        pageTitle: page.title,
        target: "_self",
        url: null,
      },
    ]);
    dispatch({ addPageSlug: "" });
    setDirty(true);
  }

  function handleAddUrl() {
    const trimmed = addUrl.trim();
    if (!trimmed) return;

    const staticRoute = staticRoutes.find((route) => route.url === trimmed);
    const derivedLabel = addLabel.trim() || staticRoute?.label || "";

    setItems((prev) => [
      ...prev,
      {
        id: `draft_${Date.now()}`,
        label: derivedLabel,
        pageSlug: null,
        pageTitle: derivedLabel || trimmed,
        target: "_self",
        url: trimmed,
      },
    ]);
    dispatch({ addLabel: "", addUrl: "" });
    setDirty(true);
  }

  function handleAddStatic(route: { label: string; url: string }) {
    if (items.some((item) => item.url === route.url)) return;

    setItems((prev) => [
      ...prev,
      {
        id: `draft_${Date.now()}`,
        label: "",
        pageSlug: null,
        pageTitle: route.label,
        target: "_self",
        url: route.url,
      },
    ]);
    setDirty(true);
  }

  const handleSave = useCallback(async (): Promise<boolean> => {
    if (!dirty) return true;

    try {
      await saveNav.mutateAsync(
        items.map((item) => ({
          label: item.label || null,
          pageSlug: item.pageSlug ?? undefined,
          target: item.target,
          url: item.url ?? undefined,
        })),
      );
      setDirty(false);
      return true;
    } catch {
      return false;
    }
  }, [dirty, items, saveNav, setDirty]);

  useImperativeHandle(
    ref,
    () => ({
      hasDirty: () => dirty,
      save: handleSave,
    }),
    [dirty, handleSave],
  );

  const usedPageSlugs = new Set<string>();
  const usedUrls = new Set<string>();

  for (const item of items) {
    if (item.pageSlug) usedPageSlugs.add(item.pageSlug);
    if (item.url) usedUrls.add(item.url);
  }

  const availablePages = allPages.filter((page) => !usedPageSlugs.has(page.slug));
  const availableStatics = staticRoutes.filter((route) => !usedUrls.has(route.url));

  return (
    <div className="flex flex-col gap-4">
      {isLoading ? (
        <div className="text-xs text-[var(--ds-text-muted)]">{text.load}</div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={items.map((item) => item.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {items.length === 0 && (
                <div className="rounded-control border border-dashed border-[var(--ds-border)] py-4 text-center text-xs text-[var(--ds-text-muted)]">
                  {text.noEntries}
                </div>
              )}
              {items.map((item) => (
                <SortableNavItem
                  key={item.id}
                  item={item}
                  onLabelChange={handleLabelChange}
                  onRemove={handleRemove}
                  text={text}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <NavColumnAddSection
        addLabel={addLabel}
        addPageSlug={addPageSlug}
        addType={addType}
        addUrl={addUrl}
        availablePages={availablePages}
        availableStatics={availableStatics}
        text={text}
        onAddPage={handleAddPage}
        onAddStatic={handleAddStatic}
        onAddUrl={handleAddUrl}
        onLabelChange={(label) => dispatch({ addLabel: label })}
        onPageSlugChange={(slug) => dispatch({ addPageSlug: slug })}
        onTypeChange={(type) => dispatch({ addType: type })}
        onUrlChange={(url) => dispatch({ addUrl: url })}
      />
    </div>
  );
}

interface NavColumnAddSectionProps {
  addLabel: string;
  addPageSlug: string;
  addType: "page" | "url";
  addUrl: string;
  availablePages: { slug: string; title: string }[];
  availableStatics: { label: string; url: string }[];
  text: NavText;
  onAddPage: () => void;
  onAddStatic: (route: { label: string; url: string }) => void;
  onAddUrl: () => void;
  onLabelChange: (label: string) => void;
  onPageSlugChange: (slug: string) => void;
  onTypeChange: (type: "page" | "url") => void;
  onUrlChange: (url: string) => void;
}

function NavColumnAddSection({
  addLabel,
  addPageSlug,
  addType,
  addUrl,
  availablePages,
  availableStatics,
  text,
  onAddPage,
  onAddStatic,
  onAddUrl,
  onLabelChange,
  onPageSlugChange,
  onTypeChange,
  onUrlChange,
}: NavColumnAddSectionProps) {
  return (
    <div className="border-t border-[var(--ds-border)] pt-4">
      <SegmentSwitch
        aria-label={text.choosePage}
        value={addType}
        onChange={onTypeChange}
        options={[
          { value: "page", label: text.typePage },
          { value: "url", label: text.typeUrl },
        ]}
        size="sm"
      />

      <div className="mt-4">
        {addType === "page" ? (
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <Dropdown
                value={addPageSlug}
                onChange={onPageSlugChange}
                searchable
                searchPlaceholder={text.choosePage}
                options={[
                  { value: "", label: text.choosePage },
                  ...availablePages.map(
                    (page): DropdownOption => ({
                      value: page.slug,
                      label: `${page.title} (/${page.slug})`,
                      icon: <FileIcon weight="duotone" className="size-3.5" />,
                    }),
                  ),
                ]}
              />
            </div>
            <CreateActionButton
              onClick={onAddPage}
              disabled={!addPageSlug}
              title={text.add}
              label={text.add}
              iconOnly
            />
          </div>
        ) : (
          <div className="space-y-3">
            {availableStatics.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {availableStatics.map((route) => (
                  <button
                    key={route.url}
                    type="button"
                    onClick={() => onAddStatic(route)}
                    className="rounded border border-[var(--ds-border)] bg-[var(--ds-surface-hover)] px-2 py-1 font-mono text-xs text-[var(--ds-text-muted)] hover:bg-[var(--ds-nav-hover-bg)] hover:text-[var(--ds-text)]"
                  >
                    {route.url}
                  </button>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2">
              <DashboardInput
                type="text"
                value={addUrl}
                onChange={(event) => onUrlChange(event.target.value)}
                placeholder={text.urlPlaceholder}
                className="min-w-0 flex-1 font-mono text-xs"
              />
              <DashboardInput
                type="text"
                value={addLabel}
                onChange={(event) => onLabelChange(event.target.value)}
                placeholder={text.labelPlaceholder}
                className="w-24 text-xs"
              />
              <CreateActionButton
                onClick={onAddUrl}
                disabled={!addUrl.trim()}
                title={text.add}
                label={text.add}
                iconOnly
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function NavManagerPage() {
  const { locale, messages } = useI18n();
  const common = messages.common;
  const text = NAV_TEXT[locale];
  const headerRef = useRef<NavColumnHandle>(null);
  const footerRef = useRef<NavColumnHandle>(null);
  const [footerDirty, setFooterDirty] = useState(false);
  const [headerDirty, setHeaderDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { phase: savedPhase, show: showSaved } = useSaveNotification();

  const isDirty = headerDirty || footerDirty;

  async function handleSave() {
    if (!isDirty || isSaving) return;

    setIsSaving(true);
    const [headerOk, footerOk] = await Promise.all([
      headerRef.current?.save() ?? Promise.resolve(true),
      footerRef.current?.save() ?? Promise.resolve(true),
    ]);
    setIsSaving(false);

    if (headerOk && footerOk) showSaved();
  }

  return (
    <PageLayout>
      <PageHeader title={text.pageTitle}>
        <SaveNotification phase={savedPhase} label={common.saved} />
        <SaveActionButton
          onClick={handleSave}
          disabled={!isDirty || isSaving}
          busy={isSaving}
          label={isSaving ? common.saving : common.save}
        />
      </PageHeader>

      <PageBody>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <DashboardSection>
            <DashboardSection.Header
              icon={<BrowsersIcon weight="duotone" className="size-5" />}
              title={text.headerNav}
            />
            <DashboardSection.Body>
              <NavColumn ref={headerRef} navId="header" onDirtyChange={setHeaderDirty} />
            </DashboardSection.Body>
          </DashboardSection>
          <DashboardSection>
            <DashboardSection.Header
              icon={<SquareHalfBottomIcon weight="duotone" className="size-5" />}
              title={text.footerNav}
            />
            <DashboardSection.Body>
              <NavColumn ref={footerRef} navId="footer" onDirtyChange={setFooterDirty} />
            </DashboardSection.Body>
          </DashboardSection>
        </div>
      </PageBody>
    </PageLayout>
  );
}
