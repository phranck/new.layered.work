import type { Post, Project, PublicSiteData } from "@layered/contracts";
import {
  ArrowsOutIcon,
  ListDashesIcon,
  ListIcon,
  MagnifyingGlassIcon,
  SquaresFourIcon,
} from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Logo,
  ProjectThumb,
  SectionHeader,
  Stripes,
  Tag,
  TerminalPrompt,
} from "./components/primitives";
import { SocialIcon } from "./components/SocialIcon";
import { tagClass } from "./components/tagClass";
import { loadPublicSiteData } from "./lib/api";
import { MarkdownContent } from "./lib/markdown";
import { formatDate, normalizeTag, previewText } from "./lib/text";

type Route =
  | { key: "home" }
  | { key: "projects" }
  | { key: "project"; slug: string }
  | { key: "blog" }
  | { key: "post"; slug: string }
  | { key: "about" }
  | { key: "topic"; slug: string };

type ViewMode = "grid" | "list";

let modelViewerLoad: Promise<unknown> | null = null;

function loadModelViewer() {
  modelViewerLoad ??= import("@google/model-viewer");
  return modelViewerLoad;
}

export function App() {
  const [data, setData] = useState<PublicSiteData | null>(null);
  const [route, setRoute] = useState<Route>(() => parseRoute());
  const [searchOpen, setSearchOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    loadPublicSiteData()
      .then(setData)
      .catch((error) => console.error(error));
  }, []);

  useEffect(() => {
    const onHash = () => {
      setRoute(parseRoute());
      setSearchOpen(false);
      setDrawerOpen(false);
      window.scrollTo({ top: 0, behavior: "instant" });
      mainRef.current?.focus({ preventScroll: true });
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const typing = ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
      if (event.key === "Escape") {
        setSearchOpen(false);
        setDrawerOpen(false);
      }
      if (!typing && (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!data) return;
    const design = data.settings.design;
    const root = document.documentElement;
    root.style.setProperty("--lw-bg", design.colors.bg);
    root.style.setProperty("--lw-bg-elev", design.colors.bgElev);
    root.style.setProperty("--lw-border", design.colors.border);
    root.style.setProperty("--lw-text", design.colors.text);
    root.style.setProperty("--lw-muted", design.colors.muted);
    root.style.setProperty("--lw-accent", design.colors.accent);
    root.style.setProperty("--lw-accent-dim", design.colors.accentDim);
    root.style.setProperty("--lw-stripe-teal", design.colors.stripeTeal);
    root.style.setProperty("--lw-stripe-olive", design.colors.stripeOlive);
    root.style.setProperty("--lw-stripe-gold", design.colors.stripeGold);
    root.style.setProperty("--lw-stripe-burnt", design.colors.stripeBurnt);
    root.style.setProperty("--lw-radius-card", `${design.radius.card}px`);
    root.style.setProperty("--lw-radius-image", `${design.radius.image}px`);
    root.style.setProperty("--lw-radius-control", `${design.radius.control}px`);
    root.style.setProperty("--lw-terminal-prompt-color", design.terminal.promptColor);
    root.style.setProperty("--lw-terminal-cursor-color", design.terminal.cursorColor);
    root.style.setProperty(
      "--lw-terminal-cursor-display",
      design.terminal.showCursor ? "inline-block" : "none",
    );
  }, [data]);

  if (!data) {
    return (
      <div className="min-h-screen grid-bg flex items-center justify-center mono text-sm text-[var(--lw-muted)]">
        loading layered.work
      </div>
    );
  }

  return (
    <div className="min-h-screen grid-bg flex flex-col">
      <a href="#main" className="skip-link">
        skip to content ↵
      </a>
      <SiteHeader
        route={route}
        data={data}
        searchOpen={() => setSearchOpen(true)}
        drawerOpen={() => setDrawerOpen(true)}
      />
      <MobileDrawer data={data} open={drawerOpen} close={() => setDrawerOpen(false)} />
      <SearchModal
        data={data}
        open={searchOpen}
        close={() => setSearchOpen(false)}
        go={(href) => {
          window.location.hash = href;
          setSearchOpen(false);
        }}
      />
      <main
        id="main"
        ref={mainRef}
        className="max-w-6xl mx-auto px-4 md:px-6 py-10 md:py-16 w-full flex-1"
        tabIndex={-1}
      >
        <RouteView data={data} route={route} />
      </main>
      <SiteFooter data={data} />
    </div>
  );
}

function SiteHeader({
  data,
  route,
  searchOpen,
  drawerOpen,
}: {
  data: PublicSiteData;
  route: Route;
  searchOpen: () => void;
  drawerOpen: () => void;
}) {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-black/70 border-b border-soft">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 flex items-center gap-8">
        <a href="#home" className="flex items-center shrink-0" aria-label="LAYERED.work home">
          <Logo />
        </a>
        <nav
          className="desktop-nav flex items-center gap-8 text-sm mono"
          aria-label="Main navigation"
        >
          {data.settings.navigation.map((item) => (
            <a
              key={item.key}
              href={item.href}
              className={`nav-link ${isNavActive(route, item.key) ? "active" : ""}`}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3 ml-auto">
          <button className="btn search-btn" type="button" onClick={searchOpen}>
            <MagnifyingGlassIcon weight="duotone" size={16} />
            <span className="hidden sm:inline">search</span>
            <span className="kbd kbd-pill hidden md:inline-block">⌘K</span>
          </button>
          <button className="hamburger" type="button" onClick={drawerOpen} aria-label="Open menu">
            <ListIcon weight="duotone" size={22} />
          </button>
        </div>
      </div>
    </header>
  );
}

function MobileDrawer({
  data,
  open,
  close,
}: {
  data: PublicSiteData;
  open: boolean;
  close: () => void;
}) {
  return (
    <div className={`mobile-drawer overlay ${open ? "open" : ""}`} role="dialog" aria-modal="true">
      <div className="flex items-center justify-between mb-8">
        <Logo />
        <button className="btn" type="button" onClick={close}>
          close ✕
        </button>
      </div>
      <nav className="flex flex-col mono" aria-label="Mobile navigation">
        {data.settings.navigation.map((item) => (
          <a key={item.key} href={item.href} className="nav-link">
            {item.label}
          </a>
        ))}
      </nav>
      <div className="mt-auto">
        <Stripes className="stripes-thick mb-4" />
        <div className="text-xs mono text-[var(--lw-muted)]">made with ❤ in Bregenz</div>
      </div>
    </div>
  );
}

function SearchModal({
  data,
  open,
  close,
  go,
}: {
  data: PublicSiteData;
  open: boolean;
  close: () => void;
  go: (href: string) => void;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const results = useMemo(() => buildSearchIndex(data, query), [data, query]);

  useEffect(() => {
    if (open) {
      setQuery("");
      const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 30);
      return () => window.clearTimeout(focusTimer);
    }
    return undefined;
  }, [open]);

  return (
    <div
      className={`search-modal overlay ${open ? "open" : ""}`}
      role="dialog"
      aria-modal="true"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div className="search-box overlay-content">
        <div className="relative flex items-center">
          <MagnifyingGlassIcon
            weight="duotone"
            className="absolute left-6 text-[var(--lw-muted)]"
            size={20}
          />
          <input
            ref={inputRef}
            className="search-input pl-14"
            placeholder="Search projects, posts, topics..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <ul className="search-results">
          {results.map((result, index) => (
            <li key={`${result.type}-${result.title}`}>
              <button
                type="button"
                className={`search-result w-full text-left ${index === 0 ? "active" : ""}`}
                onClick={() => go(result.href)}
              >
                <span className={`search-result-type ${result.type}`}>{result.type}</span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm truncate">{result.title}</span>
                  <span className="block text-xs text-[var(--lw-muted)] truncate">
                    {result.desc}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
        <div className="search-kbd-hint">
          <span>
            <span className="kbd">esc</span> close
          </span>
          <span className="ml-auto text-[var(--lw-stripe-gold)]">powered by fulltext</span>
        </div>
      </div>
    </div>
  );
}

function RouteView({ data, route }: { data: PublicSiteData; route: Route }) {
  if (route.key === "projects") return <ProjectsView data={data} />;
  if (route.key === "project") return <ProjectDetail data={data} slug={route.slug} />;
  if (route.key === "blog") return <BlogView data={data} />;
  if (route.key === "post") return <PostDetail data={data} slug={route.slug} />;
  if (route.key === "about") return <AboutView data={data} />;
  if (route.key === "topic")
    return <TopicView data={data} label={decodeURIComponent(route.slug)} />;
  return <HomeView data={data} />;
}

function HomeView({ data }: { data: PublicSiteData }) {
  const { settings, projects, posts } = data;
  const featured = posts.find((post) => post.slug === settings.home.featuredPostSlug) ?? posts[0];
  return (
    <section>
      <div className="mb-24">
        <TerminalPrompt>{settings.home.heroPrompt}</TerminalPrompt>
        <h1 className="text-4xl sm:text-5xl md:text-7xl leading-[1.05] mb-8 tracking-tight">
          <span className="text-teal">{settings.home.heroNameA}</span>{" "}
          <span className="text-olive">{settings.home.heroNameB}</span>.<br />
          <span className="text-[var(--lw-muted)]">{settings.home.heroLineMutedA}</span>{" "}
          <span className="text-gold">{settings.home.heroLineGold}</span>
          <br />
          <span className="text-[var(--lw-muted)]">{settings.home.heroLineMutedB}</span>{" "}
          <span className="text-burnt">{settings.home.heroLineBurnt}</span>
          <span className="blink accent">_</span>
        </h1>
        <p className="text-lg md:text-xl text-[var(--lw-muted)] max-w-2xl leading-relaxed font-light">
          {settings.home.intro}
        </p>
        <Stripes className="stripes-thick max-w-md mt-10" />
        <div className="flex items-center gap-3 mt-8 mono text-xs">
          <span className="kbd">↵</span>
          <span className="text-[var(--lw-muted)]">{settings.home.pressHint}</span>
        </div>
      </div>

      {featured && <FeaturedPost post={featured} />}

      <div className="mb-24">
        <SectionHeader
          title="// projects"
          addOn={
            <a href="#projects" className="mono text-xs accent hover-line">
              view all →
            </a>
          }
        />
        <div className="grid md:grid-cols-2 gap-6">
          {projects.slice(0, 4).map((project, index) => (
            <ProjectCard key={project.id} project={project} index={index + 1} />
          ))}
        </div>
      </div>

      <div className="mb-24">
        <SectionHeader
          title="// recent posts"
          addOn={
            <a href="#blog" className="mono text-xs accent hover-line">
              all posts →
            </a>
          }
        />
        <div className="group-card">
          <ul className="divide-y divide-[var(--lw-border)]">
            {posts.slice(1, 6).map((post) => (
              <li key={post.id}>
                <a
                  href={`#post/${post.slug}`}
                  className="flex items-baseline gap-6 py-4 px-4 hover-line group"
                >
                  <span className="mono text-xs text-[var(--lw-muted)] w-20 shrink-0">
                    {formatDate(post.date)}
                  </span>
                  <span className="flex-1 group-hover:accent transition-colors">{post.title}</span>
                  <span className="tag">{post.tags[0]}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mb-24">
        <SectionHeader title="// topics" />
        <div className="group-card p-6">
          <div className="flex flex-wrap gap-2">
            {data.topics.map((topic) => (
              <Tag
                key={topic.id}
                className={tagClass(topic.label)}
                onClick={() => goTopic(topic.label)}
              >
                {topic.label}
              </Tag>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturedPost({ post }: { post: Post }) {
  return (
    <div className="mb-24">
      <SectionHeader
        title="// featured"
        addOn={<span className="mono text-xs text-[var(--lw-muted)]">{formatDate(post.date)}</span>}
      />
      <a href={`#post/${post.slug}`} className="block card p-3 group">
        <div className="grid md:grid-cols-5 gap-6 items-center">
          <ProjectThumb
            src={post.imageUrl}
            alt={post.imageAlt}
            className="md:col-span-2 !rounded-[8px]"
          />
          <div className="md:col-span-3">
            <TagRow tags={post.tags} />
            <h3 className="text-2xl md:text-3xl mb-3 group-hover:accent transition-colors">
              {post.title}
            </h3>
            <p className="text-[var(--lw-muted)] leading-relaxed mb-4">{post.description}</p>
            <span className="mono text-sm accent">continue reading →</span>
          </div>
        </div>
      </a>
    </div>
  );
}

function ProjectsView({ data }: { data: PublicSiteData }) {
  const [filter, setFilter] = useState("all");
  const [mode, setMode] = useState<ViewMode>(() =>
    localStorage.getItem("layered:projects:view") === "list" ? "list" : "grid",
  );
  const categories = useMemo(() => projectCategories(data.projects), [data.projects]);
  const shown =
    filter === "all"
      ? data.projects
      : data.projects.filter((project) => project.categories.includes(filter));

  useEffect(() => localStorage.setItem("layered:projects:view", mode), [mode]);

  return (
    <section>
      <div className="mb-8">
        <TerminalPrompt>ls -la ~/projects</TerminalPrompt>
        <h1 className="text-4xl md:text-5xl mb-4">
          Projects<span className="accent">.</span>
        </h1>
        <p className="text-[var(--lw-muted)] max-w-2xl">
          Hardware, software, tinkering. Long-form and one-offs. Everything here is hand-built,
          often with scope creep.
        </p>
      </div>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div className="filter-bar">
          <FilterChip
            label="All"
            count={data.projects.length}
            active={filter === "all"}
            onClick={() => setFilter("all")}
          />
          {categories.map((category) => (
            <FilterChip
              key={category.label}
              label={category.label}
              count={category.count}
              active={filter === category.label}
              onClick={() => setFilter(category.label)}
            />
          ))}
        </div>
        <ViewToggle mode={mode} setMode={setMode} />
      </div>
      <div
        className={
          mode === "grid"
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            : "grid grid-cols-1 gap-3"
        }
      >
        {shown.map((project, index) => (
          <ProjectCard
            key={project.id}
            project={project}
            index={index + 1}
            list={mode === "list"}
          />
        ))}
      </div>
      {shown.length === 0 && (
        <div className="mt-8 text-center text-[var(--lw-muted)] mono text-sm">
          no projects in this category yet.
        </div>
      )}
    </section>
  );
}

function BlogView({ data }: { data: PublicSiteData }) {
  const [mode, setMode] = useState<ViewMode>(() =>
    localStorage.getItem("layered:blog:view") === "list" ? "list" : "grid",
  );
  const [page, setPage] = useState(1);
  const pageSize = data.settings.blog.pageSize;
  const totalPages = Math.max(1, Math.ceil(data.posts.length / pageSize));
  const posts = data.posts.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => localStorage.setItem("layered:blog:view", mode), [mode]);

  return (
    <section>
      <div className="mb-8">
        <TerminalPrompt>cat ~/blog/*.md | sort -r</TerminalPrompt>
        <h1 className="text-4xl md:text-5xl mb-4">
          Writing<span className="accent">.</span>
        </h1>
        <p className="text-[var(--lw-muted)] max-w-2xl">
          Occasional notes on things I can't stop thinking about. No schedule, no newsletter.
        </p>
      </div>
      <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
        <div className="mono text-xs text-[var(--lw-muted)]">
          {data.posts.length} posts · page {page}/{totalPages}
        </div>
        <ViewToggle mode={mode} setMode={setMode} />
      </div>
      <div
        className={
          mode === "grid" ? "grid sm:grid-cols-2 lg:grid-cols-3 gap-6" : "grid grid-cols-1 gap-3"
        }
      >
        {posts.map((post) =>
          mode === "grid" ? (
            <PostCard key={post.id} post={post} />
          ) : (
            <PostListItem key={post.id} post={post} />
          ),
        )}
      </div>
      <nav className="pagination" aria-label="Pagination">
        <button
          className="page-btn"
          type="button"
          disabled={page === 1}
          onClick={() => setPage((current) => current - 1)}
        >
          ←
        </button>
        {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
          <button
            key={pageNumber}
            className={`page-btn ${pageNumber === page ? "active" : ""}`}
            type="button"
            onClick={() => setPage(pageNumber)}
          >
            {pageNumber}
          </button>
        ))}
        <button
          className="page-btn"
          type="button"
          disabled={page === totalPages}
          onClick={() => setPage((current) => current + 1)}
        >
          →
        </button>
      </nav>
    </section>
  );
}

function ProjectDetail({ data, slug }: { data: PublicSiteData; slug: string }) {
  const project = data.projects.find((item) => item.slug === slug) ?? data.projects[0];
  return (
    <section>
      <div className="mb-8">
        <a href="#projects" className="mono text-xs text-[var(--lw-muted)] hover:text-white">
          ← all projects
        </a>
      </div>
      <div className="mb-12">
        <TagRow tags={project.tags} />
        <h1 className="text-4xl md:text-6xl mb-6">{project.title}</h1>
        <p className="text-xl text-[var(--lw-muted)] max-w-2xl leading-relaxed">
          {project.description}
        </p>
        <div className="group-card inline-flex items-center gap-6 mt-6 px-5 py-3 mono text-xs text-[var(--lw-muted)]">
          <span>
            STATUS{" "}
            <span className="accent">
              {project.status === "published" ? "active" : project.status}
            </span>
          </span>
          <span className="opacity-40">·</span>
          <span>
            STACK <span className="accent">{project.tags.join(", ")}</span>
          </span>
        </div>
      </div>
      <div className="mb-12">
        <ProjectMedia project={project} />
      </div>
      <div className="max-w-2xl">
        <MarkdownContent markdown={project.markdown} />
      </div>
    </section>
  );
}

function PostDetail({ data, slug }: { data: PublicSiteData; slug: string }) {
  const post = data.posts.find((item) => item.slug === slug) ?? data.posts[0];
  return (
    <section>
      <div className="mb-8">
        <a href="#blog" className="mono text-xs text-[var(--lw-muted)] hover:text-white">
          ← all posts
        </a>
      </div>
      <article className="max-w-2xl">
        <div className="mb-8">
          <TagRow tags={post.tags} />
          <h1 className="text-4xl md:text-5xl mb-4 leading-tight">{post.title}</h1>
          <div className="flex items-center gap-4 mono text-xs text-[var(--lw-muted)]">
            <span>{formatDate(post.date)}</span>
            <span>·</span>
            <span>{post.readTimeMinutes ?? 1} min read</span>
            <span>·</span>
            <span>Frank Gregor</span>
          </div>
        </div>
        <MarkdownContent markdown={post.markdown} />
      </article>
    </section>
  );
}

function TopicView({ data, label }: { data: PublicSiteData; label: string }) {
  const key = normalizeTag(label);
  const projects = data.projects.filter((project) =>
    project.tags.some((tag) => normalizeTag(tag) === key),
  );
  const posts = data.posts.filter((post) => post.tags.some((tag) => normalizeTag(tag) === key));
  return (
    <section>
      <div className="mb-10">
        <div className="mono text-xs text-[var(--lw-muted)] mb-2">// topic</div>
        <h1 className="text-4xl md:text-6xl mb-4">
          <span className="accent">#</span>
          {label}
        </h1>
        <p className="text-[var(--lw-muted)] max-w-2xl">
          Everything tagged <code className="mono text-[var(--lw-stripe-gold)]">{label}</code>{" "}
          across projects and writing.
        </p>
        <div className="mt-4 flex gap-4 mono text-xs text-[var(--lw-muted)]">
          <span>
            <span className="accent">{projects.length}</span> projects
          </span>
          <span>·</span>
          <span>
            <span className="accent">{posts.length}</span> posts
          </span>
        </div>
      </div>
      {projects.length > 0 && (
        <div className="mb-16">
          <SectionHeader title="// projects" />
          <div className="grid md:grid-cols-2 gap-6">
            {projects.map((project, index) => (
              <ProjectCard key={project.id} project={project} index={index + 1} />
            ))}
          </div>
        </div>
      )}
      {posts.length > 0 && (
        <div className="mb-16">
          <SectionHeader title="// blog" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      )}
      {projects.length + posts.length === 0 && (
        <p className="text-[var(--lw-muted)]">Nothing here yet. Try another topic.</p>
      )}
    </section>
  );
}

function AboutView({ data }: { data: PublicSiteData }) {
  const about = data.settings.about;
  return (
    <section>
      <div className="mb-16">
        <TerminalPrompt>{about.prompt}</TerminalPrompt>
        <h1 className="text-4xl md:text-5xl mb-6">
          About<span className="accent">.</span>
        </h1>
      </div>
      <div className="grid md:grid-cols-3 gap-12 max-w-4xl">
        <div className="md:col-span-2 prose-content">
          {about.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <aside>
          <div className="card p-6 mb-6">
            <div className="mono text-xs uppercase tracking-widest text-[var(--lw-muted)] mb-3">
              // stack
            </div>
            <ul className="text-sm space-y-2">
              {about.stack.map((item) => (
                <li key={item.label} className="flex justify-between">
                  <span>{item.label}</span>
                  <span className="mono text-xs accent">{item.value}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="card p-6">
            <div className="mono text-xs uppercase tracking-widest text-[var(--lw-muted)] mb-4">
              // elsewhere
            </div>
            <ul className="text-sm space-y-1">
              {about.socials.map((social) => (
                <li key={social.href}>
                  <a href={social.href} rel="noopener" className="inline-flex py-1">
                    {social.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </section>
  );
}

function ProjectCard({
  project,
  index,
  list = false,
}: {
  project: Project;
  index: number;
  list?: boolean;
}) {
  return (
    <a
      href={`#project/${project.slug}`}
      className={`card overflow-hidden group ${list ? "flex flex-col sm:flex-row" : ""}`}
    >
      <ProjectThumb
        src={project.imageUrl}
        alt={project.imageAlt}
        className={list ? "sm:w-[260px] shrink-0" : ""}
      />
      <div className="p-6">
        <div
          className={`mono text-xs ${index % 4 === 1 ? "text-teal" : index % 4 === 2 ? "text-olive" : index % 4 === 3 ? "text-gold" : "text-burnt"} mb-2`}
        >
          {String(index).padStart(2, "0")} — {project.categories[0] ?? project.tags[0]}
        </div>
        <h3 className="text-xl mb-2 group-hover:text-gold transition-colors">{project.title}</h3>
        <p className="text-sm text-[var(--lw-muted)]">{previewText(project, 140)}</p>
      </div>
    </a>
  );
}

function PostCard({ post }: { post: Post }) {
  return (
    <a href={`#post/${post.slug}`} className="card overflow-hidden group">
      <ProjectThumb src={post.imageUrl} alt={post.imageAlt} />
      <div className="p-5">
        <div className="mono text-xs text-[var(--lw-muted)] mb-2">
          {formatDate(post.date)} · {post.readTimeMinutes ?? 1} min
        </div>
        <h3 className="text-lg mb-2 group-hover:text-gold transition-colors">{post.title}</h3>
        <p className="text-sm text-[var(--lw-muted)]">{previewText(post, 140)}</p>
        <TagRow tags={post.tags.slice(0, 3)} className="mt-3" />
      </div>
    </a>
  );
}

function PostListItem({ post }: { post: Post }) {
  return (
    <a href={`#post/${post.slug}`} className="blog-list-item group">
      <div className="thumb-wrap">
        {post.imageUrl && <img src={post.imageUrl} alt={post.imageAlt ?? ""} loading="lazy" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="mono text-xs text-[var(--lw-muted)] mb-2">
          {formatDate(post.date)} · {post.readTimeMinutes ?? 1} min
        </div>
        <h3 className="text-xl mb-2 transition-colors">{post.title}</h3>
        <p className="text-sm text-[var(--lw-muted)] mb-3">{previewText(post, 280)}</p>
        <TagRow tags={post.tags} />
      </div>
    </a>
  );
}

function TagRow({ tags, className = "mb-3" }: { tags: string[]; className?: string }) {
  return (
    <div className={`flex gap-2 flex-wrap ${className}`}>
      {tags.map((tag) => (
        <Tag key={tag} className={tagClass(tag)} onClick={() => goTopic(tag)}>
          {tag}
        </Tag>
      ))}
    </div>
  );
}

function ProjectMedia({ project }: { project: Project }) {
  const [open, setOpen] = useState(false);
  const [modelReady, setModelReady] = useState(false);

  useEffect(() => {
    if (!project.model) return;

    let mounted = true;
    loadModelViewer()
      .then(() => {
        if (mounted) setModelReady(true);
      })
      .catch((error) => console.error(error));

    return () => {
      mounted = false;
    };
  }, [project.model]);

  if (project.model) {
    return (
      <>
        <div className="model-viewer-wrap" style={{ aspectRatio: project.model.aspect }}>
          {modelReady ? (
            <model-viewer
              src={project.model.src}
              alt={`3D model of ${project.title}`}
              camera-controls
              auto-rotate
              shadow-intensity="1"
              touch-action="none"
              interaction-prompt="none"
            />
          ) : (
            <div className="flex h-full items-center justify-center mono text-xs text-[var(--lw-muted)]">
              loading 3d viewer
            </div>
          )}
          <div className="model-badge">3D · interactive</div>
          <button
            className="model-fs-btn absolute top-3.5 right-3.5 w-10 h-10 rounded-12px bg-black/60 border border-[var(--lw-border)] flex items-center justify-center"
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open fullscreen"
          >
            <ArrowsOutIcon weight="duotone" size={20} />
          </button>
        </div>
        {open && (
          <div
            className="fixed inset-0 z-80 bg-black/92 backdrop-blur-xl p-4 md:p-10 flex"
            role="dialog"
            aria-modal="true"
            aria-label={`${project.title} fullscreen model`}
          >
            <button
              type="button"
              className="absolute inset-0"
              aria-label="Close fullscreen model"
              onClick={() => setOpen(false)}
            />
            {modelReady && (
              <model-viewer
                className="relative z-10 flex-1 rounded-[20px]"
                src={project.model.src}
                alt={`3D model of ${project.title}`}
                camera-controls
                auto-rotate
                shadow-intensity="1"
              />
            )}
          </div>
        )}
      </>
    );
  }
  return (
    <ProjectThumb
      src={project.imageUrl}
      alt={project.imageAlt}
      className="!aspect-[21/9] !rounded-[20px]"
    />
  );
}

function FilterChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button className={`filter-chip ${active ? "active" : ""}`} type="button" onClick={onClick}>
      <span className="dot" />
      {label} <span className="count">{count}</span>
    </button>
  );
}

function ViewToggle({ mode, setMode }: { mode: ViewMode; setMode: (mode: ViewMode) => void }) {
  return (
    <fieldset className="view-toggle" aria-label="View mode">
      <button
        className={mode === "grid" ? "active" : ""}
        type="button"
        onClick={() => setMode("grid")}
        aria-label="Grid view"
      >
        <SquaresFourIcon weight="duotone" size={18} />
      </button>
      <button
        className={mode === "list" ? "active" : ""}
        type="button"
        onClick={() => setMode("list")}
        aria-label="List view"
      >
        <ListDashesIcon weight="duotone" size={18} />
      </button>
    </fieldset>
  );
}

function SiteFooter({ data }: { data: PublicSiteData }) {
  return (
    <footer className="border-t border-soft mt-24 py-12 bg-[#111110]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="mono text-xs text-[var(--lw-muted)] mb-3">
              {data.settings.footer.eofLabel}
            </div>
            <Stripes className="stripes-thick max-w-[140px]" />
            <div className="text-xs text-[var(--lw-muted)] mt-4 mono">
              {data.settings.footer.locationText}
            </div>
          </div>
          <div className="flex gap-3">
            {data.settings.about.socials.map((social) => (
              <a
                key={social.href}
                href={social.href}
                className="social inline-flex items-center justify-center w-11 h-11 rounded-12px border border-[var(--lw-border)] bg-[var(--lw-bg-elev)]"
                aria-label={social.label}
              >
                <SocialIcon name={social.icon} title={social.label} />
              </a>
            ))}
          </div>
        </div>
        <div className="mt-8 text-xs mono text-[var(--lw-muted)]">
          {data.settings.footer.copyright}
        </div>
      </div>
    </footer>
  );
}

function parseRoute(): Route {
  const hash = (window.location.hash || "#home").slice(1);
  const [key, slug] = hash.split("/");
  if (key === "projects") return { key: "projects" };
  if (key === "project" && slug) return { key: "project", slug };
  if (key === "blog") return { key: "blog" };
  if (key === "post" && slug) return { key: "post", slug };
  if (key === "about") return { key: "about" };
  if (key === "topic" && slug) return { key: "topic", slug };
  return { key: "home" };
}

function isNavActive(route: Route, key: string): boolean {
  return (
    route.key === key ||
    (route.key === "project" && key === "projects") ||
    (route.key === "post" && key === "blog")
  );
}

function buildSearchIndex(data: PublicSiteData, query: string) {
  const items = [
    ...data.projects.map((project) => ({
      type: "project",
      title: project.title,
      desc: project.description,
      href: `project/${project.slug}`,
      hay: `${project.title} ${project.description} ${project.tags.join(" ")}`.toLowerCase(),
    })),
    ...data.posts.map((post) => ({
      type: "post",
      title: post.title,
      desc: post.description,
      href: `post/${post.slug}`,
      hay: `${post.title} ${post.description} ${post.tags.join(" ")}`.toLowerCase(),
    })),
    ...data.topics.map((topic) => ({
      type: "tag",
      title: topic.label,
      desc: `Browse posts tagged ${topic.label}`,
      href: `topic/${encodeURIComponent(topic.label)}`,
      hay: topic.label.toLowerCase(),
    })),
  ];
  const q = query.trim().toLowerCase();
  return (
    q ? items.filter((item) => item.hay.includes(q)) : items.filter((item) => item.type !== "tag")
  ).slice(0, 20);
}

function projectCategories(projects: Project[]) {
  const counts = new Map<string, number>();
  for (const project of projects) {
    for (const category of project.categories)
      counts.set(category, (counts.get(category) ?? 0) + 1);
  }
  return [...counts.entries()].map(([label, count]) => ({ label, count }));
}

function goTopic(label: string) {
  window.location.hash = `topic/${encodeURIComponent(label)}`;
}
