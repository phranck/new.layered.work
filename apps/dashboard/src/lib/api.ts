import {
  type AdminUser,
  adminUserSchema,
  type ContentMutation,
  contentMutationSchema,
  type LoginInput,
  type PublicSiteData,
  publicSiteDataSchema,
  type SetupInput,
  type SiteSettings,
  siteSettingsSchema,
  type UserMutation,
  type UserUpdate,
  userMutationSchema,
  userUpdateSchema,
} from "@layered/contracts";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4004";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}/api/admin${path}`, {
    ...init,
    credentials: "include",
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message ?? `Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

function normalizeAdminPath(path: string): string {
  const normalized = path.startsWith("/admin/") ? path.slice("/admin".length) : path;
  return normalized.startsWith("/") ? normalized : `/${normalized}`;
}

function jsonInit(method: string, data?: unknown): RequestInit {
  return {
    method,
    ...(data === undefined ? {} : { body: JSON.stringify(data) }),
  };
}

export const api = {
  get: <T>(path: string) => request<T>(normalizeAdminPath(path)),
  post: <T>(path: string, data?: unknown) =>
    request<T>(normalizeAdminPath(path), jsonInit("POST", data)),
  put: <T>(path: string, data?: unknown) =>
    request<T>(normalizeAdminPath(path), jsonInit("PUT", data)),
  patch: <T>(path: string, data?: unknown) =>
    request<T>(normalizeAdminPath(path), jsonInit("PATCH", data)),
  delete: <T>(path: string) => request<T>(normalizeAdminPath(path), { method: "DELETE" }),
};

export async function loadAdminContent(): Promise<PublicSiteData> {
  return publicSiteDataSchema.parse(await request<unknown>("/site-content"));
}

export async function saveSettings(settings: SiteSettings): Promise<SiteSettings> {
  return siteSettingsSchema.parse(
    await request<unknown>("/settings", {
      method: "PUT",
      body: JSON.stringify(siteSettingsSchema.parse(settings)),
    }),
  );
}

export async function saveProject(project: ContentMutation) {
  return request<unknown>("/projects", {
    method: "POST",
    body: JSON.stringify(contentMutationSchema.parse(project)),
  });
}

export async function savePost(post: ContentMutation) {
  return request<unknown>("/posts", {
    method: "POST",
    body: JSON.stringify(contentMutationSchema.parse(post)),
  });
}

export async function authSetupState(): Promise<{ needsSetup: boolean }> {
  return request<{ needsSetup: boolean }>("/setup");
}

export async function login(input: LoginInput): Promise<AdminUser> {
  return adminUserSchema.parse(
    await request<unknown>("/login", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  );
}

export async function setup(input: SetupInput): Promise<AdminUser> {
  return adminUserSchema.parse(
    await request<unknown>("/setup", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  );
}

export async function logout(): Promise<void> {
  await request<unknown>("/logout", { method: "POST" });
}

export async function me(): Promise<AdminUser> {
  return adminUserSchema.parse(await request<unknown>("/me"));
}

export async function listUsers(): Promise<AdminUser[]> {
  return adminUserSchema.array().parse(await request<unknown>("/users"));
}

export async function createUser(input: UserMutation): Promise<AdminUser> {
  return adminUserSchema.parse(
    await request<unknown>("/users", {
      method: "POST",
      body: JSON.stringify(userMutationSchema.parse(input)),
    }),
  );
}

export async function updateUser(id: string, input: UserUpdate): Promise<AdminUser> {
  return adminUserSchema.parse(
    await request<unknown>(`/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(userUpdateSchema.parse(input)),
    }),
  );
}

export async function deleteUser(id: string): Promise<void> {
  await request<unknown>(`/users/${id}`, { method: "DELETE" });
}
