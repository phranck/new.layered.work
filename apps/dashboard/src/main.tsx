import type {
  ContentMutation,
  Post,
  Project,
  PublicSiteData,
  SiteSettings,
} from "@layered/contracts";
import { DashboardSection } from "@layered/ui/dashboard-section";
import { FloppyDiskIcon, PaintBrushIcon, SquaresFourIcon, TextTIcon } from "@phosphor-icons/react";
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { StrictMode, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";

import { AdminLayout } from "@/components/layout/AdminLayout.tsx";
import { DashboardButton } from "@/components/ui/DashboardButton.tsx";
import { DashboardInput, DashboardTextarea } from "@/components/ui/DashboardControls.tsx";
import { PageHeader } from "@/components/ui/PageHeader.tsx";
import { PageBody, PageLayout, PageSplitLayout } from "@/components/ui/PageLayout.tsx";
import { I18nProvider } from "@/context/I18nContext.tsx";
import { AuthProvider, useAuth } from "@/features/auth/AuthContext.tsx";
import { LoginPage } from "@/features/auth/LoginPage.tsx";
import { SetupPage } from "@/features/auth/SetupPage.tsx";
import { ContentEditorPage } from "@/features/content/pages/ContentEditorPage.tsx";
import { PagesListPage } from "@/features/content/pages/PagesListPage.tsx";
import { NavManagerPage } from "@/features/system/NavManagerPage.tsx";
import { UsersPage } from "@/features/system/users/UsersPage.tsx";
import { loadAdminContent, savePost, saveProject, saveSettings } from "@/lib/api.ts";
import { KeyboardSaveProvider } from "@/lib/hooks/useKeyboardSave.ts";
import "virtual:uno.css";
import "./styles/index.css";

const queryClient = new QueryClient();
const contentQueryKey = ["admin-content"] as const;

function AuthGate() {
  const { user, isLoading, needsSetup, error } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--ds-bg)] flex items-center justify-center text-sm text-[var(--ds-text-muted)]">
        Loading dashboard
      </div>
    );
  }

  if (needsSetup) return <SetupPage />;
  if (!user) return <LoginPage />;

  return (
    <>
      {error && (
        <div className="fixed left-4 bottom-4 z-50 rounded-control border border-[var(--ds-danger-border)] bg-[var(--ds-danger-bg)] px-3 py-2 text-sm text-[var(--ds-danger-text)]">
          {error}
        </div>
      )}
      <Routes>
        <Route element={<AdminLayout />}>
          <Route index element={<OverviewPage />} />
          <Route path="design" element={<DesignPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="projects" element={<ContentPage kind="project" />} />
          <Route path="posts" element={<ContentPage kind="post" />} />
          <Route path="pages" element={<PagesListPage />} />
          <Route path="pages/:slug" element={<ContentEditorPage />} />
          <Route path="navigations" element={<NavManagerPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </>
  );
}

function useAdminContent() {
  return useQuery({
    queryKey: contentQueryKey,
    queryFn: loadAdminContent,
  });
}

function LoadingPage({ title }: { title: string }) {
  return (
    <PageLayout>
      <PageHeader title={title} />
      <PageBody className="items-center justify-center text-sm text-[var(--ds-text-muted)]">
        Loading
      </PageBody>
    </PageLayout>
  );
}

function OverviewPage() {
  const { data, isLoading } = useAdminContent();
  if (isLoading || !data) return <LoadingPage title="Site overview" />;

  return (
    <PageLayout>
      <PageHeader title="Site overview" />
      <PageBody>
        <DashboardSection>
          <DashboardSection.Header
            icon={<SquaresFourIcon weight="duotone" className="size-5" />}
            title="Site overview"
            subtitle="Current published content loaded from PostgreSQL"
          />
          <DashboardSection.Body className="grid md:grid-cols-3 gap-3">
            <Kpi label="Projects" value={data.projects.length} />
            <Kpi label="Posts" value={data.posts.length} />
            <Kpi label="Topics" value={data.topics.length} />
          </DashboardSection.Body>
        </DashboardSection>
      </PageBody>
    </PageLayout>
  );
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[var(--ds-border-subtle)] bg-[var(--ds-surface)] p-4">
      <div className="text-xs uppercase tracking-wide text-[var(--ds-text-muted)]">{label}</div>
      <div className="mt-2 text-3xl font-serif">{value}</div>
    </div>
  );
}

function DesignPage() {
  const { data, isLoading } = useAdminContent();
  if (isLoading || !data) return <LoadingPage title="Design tokens" />;
  return <DesignEditor data={data} />;
}

function DesignEditor({ data }: { data: PublicSiteData }) {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState(data.settings);
  const mutation = useMutation({
    mutationFn: saveSettings,
    onSuccess: (saved) => {
      queryClient.setQueryData<PublicSiteData>(contentQueryKey, { ...data, settings: saved });
    },
  });

  return (
    <PageLayout>
      <PageHeader title="Design tokens">
        <DashboardButton
          variant="accent"
          leadingIcon={<FloppyDiskIcon weight="duotone" className="size-3.5" />}
          disabled={mutation.isPending}
          onClick={() => mutation.mutate(settings)}
        >
          Save
        </DashboardButton>
      </PageHeader>
      <PageBody>
        <DashboardSection>
          <DashboardSection.Header
            icon={<PaintBrushIcon weight="duotone" className="size-5" />}
            title="Design tokens"
            subtitle="Website colors, radii and terminal cursor settings"
          />
          <DashboardSection.Body>
            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
              {Object.entries(settings.design.colors).map(([key, value]) => (
                <DashboardInput
                  key={key}
                  label={key}
                  type="color"
                  value={value}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      design: {
                        ...settings.design,
                        colors: { ...settings.design.colors, [key]: event.target.value },
                      },
                    })
                  }
                />
              ))}
            </div>
            <div className="grid md:grid-cols-3 gap-3">
              {(["card", "image", "control"] as const).map((key) => (
                <DashboardInput
                  key={key}
                  label={`${key} radius`}
                  type="number"
                  value={settings.design.radius[key]}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      design: {
                        ...settings.design,
                        radius: { ...settings.design.radius, [key]: Number(event.target.value) },
                      },
                    })
                  }
                />
              ))}
            </div>
          </DashboardSection.Body>
        </DashboardSection>
      </PageBody>
    </PageLayout>
  );
}

function SettingsPage() {
  const { data, isLoading } = useAdminContent();
  if (isLoading || !data) return <LoadingPage title="Website settings" />;
  return <SettingsEditor data={data} />;
}

function SettingsEditor({ data }: { data: PublicSiteData }) {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<SiteSettings>(data.settings);
  const mutation = useMutation({
    mutationFn: saveSettings,
    onSuccess: (saved) => {
      queryClient.setQueryData<PublicSiteData>(contentQueryKey, { ...data, settings: saved });
    },
  });

  return (
    <PageLayout>
      <PageHeader title="Website settings">
        <DashboardButton
          variant="accent"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate(settings)}
        >
          Save
        </DashboardButton>
      </PageHeader>
      <PageBody>
        <DashboardSection>
          <DashboardSection.Header
            icon={<TextTIcon weight="duotone" className="size-5" />}
            title="Website settings"
            subtitle="Hero, listing and footer text"
          />
          <DashboardSection.Body>
            <div className="grid md:grid-cols-2 gap-3">
              <DashboardInput
                label="Hero prompt"
                value={settings.home.heroPrompt}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    home: { ...settings.home, heroPrompt: event.target.value },
                  })
                }
              />
              <DashboardInput
                label="Featured post slug"
                value={settings.home.featuredPostSlug}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    home: { ...settings.home, featuredPostSlug: event.target.value },
                  })
                }
              />
            </div>
            <DashboardTextarea
              label="Intro"
              rows={4}
              value={settings.home.intro}
              onChange={(event) =>
                setSettings({ ...settings, home: { ...settings.home, intro: event.target.value } })
              }
            />
            <DashboardInput
              label="Footer"
              value={settings.footer.copyright}
              onChange={(event) =>
                setSettings({
                  ...settings,
                  footer: { ...settings.footer, copyright: event.target.value },
                })
              }
            />
          </DashboardSection.Body>
        </DashboardSection>
      </PageBody>
    </PageLayout>
  );
}

function ContentPage({ kind }: { kind: "project" | "post" }) {
  const { data, isLoading } = useAdminContent();
  if (isLoading || !data) return <LoadingPage title={kind === "project" ? "Projects" : "Posts"} />;

  return <ContentEditor kind={kind} items={kind === "project" ? data.projects : data.posts} />;
}

function ContentEditor({
  kind,
  items,
}: {
  kind: "project" | "post";
  items: Array<Project | Post>;
}) {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState(items[0]?.id ?? "");
  const selected = useMemo(
    () => items.find((item) => item.id === selectedId) ?? items[0],
    [items, selectedId],
  );
  const [draft, setDraft] = useState(() => toMutation(selected));
  const mutation = useMutation({
    mutationFn: (input: ContentMutation) =>
      kind === "project" ? saveProject(input) : savePost(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: contentQueryKey }),
  });

  useEffect(() => setDraft(toMutation(selected)), [selected]);

  if (!selected) {
    return (
      <PageLayout>
        <PageHeader title={kind === "project" ? "Projects" : "Posts"} />
        <PageBody>No content yet.</PageBody>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader title={kind === "project" ? "Projects" : "Posts"}>
        <DashboardButton
          variant="accent"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate(draft)}
        >
          Save
        </DashboardButton>
      </PageHeader>
      <PageBody>
        <PageSplitLayout columnsClassName="xl:grid-cols-[18rem_minmax(0,1fr)]">
          <DashboardSection>
            <DashboardSection.Header
              icon={<SquaresFourIcon weight="duotone" className="size-5" />}
              title={kind === "project" ? "Projects" : "Posts"}
            />
            <DashboardSection.Body>
              {items.map((item) => (
                <DashboardSection.Item
                  key={item.id}
                  icon={<SquaresFourIcon weight="duotone" className="size-4" />}
                  label={item.title}
                  active={item.id === selected.id}
                  onClick={() => setSelectedId(item.id)}
                />
              ))}
            </DashboardSection.Body>
          </DashboardSection>
          <DashboardSection>
            <DashboardSection.Header
              icon={<TextTIcon weight="duotone" className="size-5" />}
              title={draft.title || "Untitled"}
              subtitle={`/${draft.slug}`}
            />
            <DashboardSection.Body>
              <div className="grid md:grid-cols-2 gap-3">
                <DashboardInput
                  label="Title"
                  value={draft.title}
                  onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                />
                <DashboardInput
                  label="Slug"
                  value={draft.slug}
                  onChange={(event) => setDraft({ ...draft, slug: event.target.value })}
                />
              </div>
              <DashboardTextarea
                label="Description"
                rows={3}
                value={draft.description}
                onChange={(event) => setDraft({ ...draft, description: event.target.value })}
              />
              <div className="grid md:grid-cols-2 gap-3">
                <DashboardInput
                  label="Image URL"
                  value={draft.imageUrl ?? ""}
                  onChange={(event) => setDraft({ ...draft, imageUrl: event.target.value })}
                />
                <DashboardInput
                  label="Tags comma-separated"
                  value={draft.tags.join(", ")}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      tags: event.target.value
                        .split(",")
                        .map((tag) => tag.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </div>
              {kind === "project" && (
                <DashboardInput
                  label="Categories comma-separated"
                  value={(draft.categories ?? []).join(", ")}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      categories: event.target.value
                        .split(",")
                        .map((tag) => tag.trim())
                        .filter(Boolean),
                    })
                  }
                />
              )}
              <DashboardTextarea
                label="Markdown"
                rows={12}
                value={draft.markdown}
                onChange={(event) => setDraft({ ...draft, markdown: event.target.value })}
              />
            </DashboardSection.Body>
          </DashboardSection>
        </PageSplitLayout>
      </PageBody>
    </PageLayout>
  );
}

function toMutation(item: Project | Post | undefined): ContentMutation {
  if (!item) {
    return {
      slug: "",
      title: "",
      description: "",
      tags: [],
      status: "draft",
      markdown: "",
    };
  }

  return {
    slug: item.slug,
    title: item.title,
    description: item.description,
    previewText: item.previewText,
    imageUrl: item.imageUrl,
    imageAlt: item.imageAlt,
    tags: item.tags,
    categories: "categories" in item ? item.categories : undefined,
    status: item.status,
    date: "date" in item ? item.date : (item.publishedAt ?? new Date().toISOString()),
    publishedAt: item.publishedAt,
    readTimeMinutes: "readTimeMinutes" in item ? item.readTimeMinutes : undefined,
    markdown: item.markdown,
    terminalPrompt: item.terminalPrompt,
    model: "model" in item ? item.model : undefined,
  };
}

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <KeyboardSaveProvider>
          <AuthProvider>
            <BrowserRouter>
              <AuthGate />
            </BrowserRouter>
          </AuthProvider>
        </KeyboardSaveProvider>
      </I18nProvider>
    </QueryClientProvider>
  </StrictMode>,
);
