import type { AdminRole, AdminUser } from "@layered/contracts";
import { UserCircleIcon } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";

import { CancelActionButton, SaveActionButton } from "@/components/ui/DashboardActionButton.tsx";
import { DashboardInput, DashboardSelect } from "@/components/ui/DashboardControls.tsx";
import { dialogHeaderIconClass } from "@/components/ui/DialogClasses.ts";
import { OverlayCard } from "@/components/ui/OverlayCard.tsx";
import { useI18n } from "@/context/I18nContext.tsx";
import { useAuth } from "@/features/auth/AuthContext.tsx";
import {
  useAdminUsers,
  useCreateUser,
  useUpdateUser,
} from "@/features/system/hooks/useAdminUsers.ts";

import { UserAvatar } from "./UserAvatar.tsx";

type DraftRole = Extract<AdminRole, "admin" | "editor">;

interface UserFormState {
  email: string;
  login: string;
  displayName: string;
  locale: string;
  role: DraftRole;
  password: string;
}

interface UserEditCardProps {
  userId: string;
  onClose: () => void;
  onSaved: () => void;
}

interface UserCreateCardProps {
  onClose: () => void;
  onCreated: () => void;
}

const roleOptions = [
  { value: "admin", label: "Admin" },
  { value: "editor", label: "Editor" },
];

function draftFromUser(user?: AdminUser): UserFormState {
  return {
    email: user?.email ?? "",
    login: user?.login ?? "",
    displayName: user?.displayName ?? "",
    locale: user?.locale ?? "en",
    role: user?.role === "editor" ? "editor" : "admin",
    password: "",
  };
}

function UserFields({
  canChangeRole,
  draft,
  mode,
  onChange,
  user,
}: {
  canChangeRole: boolean;
  draft: UserFormState;
  mode: "create" | "edit";
  onChange: (next: UserFormState) => void;
  user?: AdminUser;
}) {
  return (
    <div className="flex gap-6 items-start">
      <UserAvatar username={draft.login || "U"} avatarUrl={user?.avatarUrl} size="lg" />
      <div className="grid flex-1 gap-4">
        <DashboardInput
          label="Username"
          required
          value={draft.login}
          onChange={(event) => onChange({ ...draft, login: event.target.value })}
        />
        <DashboardInput
          label="Email"
          required
          type="email"
          value={draft.email}
          onChange={(event) => onChange({ ...draft, email: event.target.value })}
        />
        <DashboardInput
          label="Display name"
          required
          value={draft.displayName}
          onChange={(event) => onChange({ ...draft, displayName: event.target.value })}
        />
        <div className="grid grid-cols-2 gap-3">
          <DashboardSelect
            label="Role"
            disabled={!canChangeRole}
            value={draft.role}
            options={roleOptions}
            onChange={(event) => onChange({ ...draft, role: event.target.value as DraftRole })}
          />
          <DashboardSelect
            label="Locale"
            value={draft.locale}
            options={[
              { value: "en", label: "English" },
              { value: "de", label: "Deutsch" },
            ]}
            onChange={(event) => onChange({ ...draft, locale: event.target.value })}
          />
        </div>
        <DashboardInput
          label={mode === "create" ? "Password" : "New password"}
          type="password"
          value={draft.password}
          onChange={(event) => onChange({ ...draft, password: event.target.value })}
          hint={mode === "edit" ? "Leave empty to keep the current password." : undefined}
        />
      </div>
    </div>
  );
}

export function UserEditCard({ userId, onClose, onSaved }: UserEditCardProps) {
  const { messages } = useI18n();
  const { user: me, refresh } = useAuth();
  const { data: users = [] } = useAdminUsers();
  const updateUser = useUpdateUser();
  const user = users.find((candidate) => candidate.id === userId);
  const [draft, setDraft] = useState<UserFormState>(() => draftFromUser(user));

  useEffect(() => {
    setDraft(draftFromUser(user));
  }, [user]);

  const hasChanges = useMemo(() => {
    if (!user) return false;
    return (
      draft.email !== user.email ||
      draft.login !== user.login ||
      draft.displayName !== user.displayName ||
      draft.locale !== user.locale ||
      (user.role !== "owner" && draft.role !== user.role) ||
      draft.password.trim() !== ""
    );
  }, [draft, user]);

  async function handleSave() {
    if (!user) return;
    await updateUser.mutateAsync({
      id: user.id,
      data: {
        email: draft.email,
        login: draft.login,
        displayName: draft.displayName,
        locale: draft.locale,
        role: draft.role,
        password: draft.password,
      },
    });
    if (me?.id === user.id) await refresh();
    onSaved();
  }

  return (
    <OverlayCard
      open
      onClose={onClose}
      size={{ storageKey: "users:edit-card-size", defaultWidth: 512 }}
      aria-label={messages.users.editCard.title}
    >
      <OverlayCard.Header className="flex items-center gap-3">
        <UserCircleIcon weight="duotone" className={dialogHeaderIconClass} />
        <h2 className="text-base font-semibold text-[var(--ds-text)]">
          {messages.users.editCard.title}
        </h2>
      </OverlayCard.Header>
      <OverlayCard.Body>
        {user ? (
          <UserFields
            canChangeRole={Boolean(me?.isOwner) && user.id !== me?.id && user.role !== "owner"}
            draft={draft}
            mode="edit"
            onChange={setDraft}
            user={user}
          />
        ) : (
          <p className="text-sm text-[var(--ds-text-muted)]">{messages.common.loading}</p>
        )}
        {updateUser.isError && (
          <p role="alert" className="mt-3 text-sm text-red-500">
            {updateUser.error instanceof Error
              ? updateUser.error.message
              : messages.users.editCard.errorSaving}
          </p>
        )}
      </OverlayCard.Body>
      <OverlayCard.Footer className="flex justify-end gap-2">
        <CancelActionButton label={messages.common.cancel} onClick={onClose} />
        <SaveActionButton
          busy={updateUser.isPending}
          disabled={!user || !hasChanges || updateUser.isPending}
          onClick={() => void handleSave()}
          label={updateUser.isPending ? messages.common.saving : messages.common.save}
        />
      </OverlayCard.Footer>
    </OverlayCard>
  );
}

export function UserCreateCard({ onClose, onCreated }: UserCreateCardProps) {
  const { messages } = useI18n();
  const createUser = useCreateUser();
  const [draft, setDraft] = useState<UserFormState>(() => draftFromUser());

  async function handleCreate() {
    await createUser.mutateAsync(draft);
    onCreated();
  }

  return (
    <OverlayCard
      open
      onClose={onClose}
      size={{ storageKey: "users:create-card-size", defaultWidth: 512 }}
      aria-label={messages.users.editCard.createTitle}
    >
      <OverlayCard.Header className="flex items-center gap-3">
        <UserCircleIcon weight="duotone" className={dialogHeaderIconClass} />
        <h2 className="text-base font-semibold text-[var(--ds-text)]">
          {messages.users.editCard.createTitle}
        </h2>
      </OverlayCard.Header>
      <OverlayCard.Body>
        <UserFields canChangeRole draft={draft} mode="create" onChange={setDraft} />
        {createUser.isError && (
          <p role="alert" className="mt-3 text-sm text-red-500">
            {createUser.error instanceof Error
              ? createUser.error.message
              : messages.users.editCard.errorSaving}
          </p>
        )}
      </OverlayCard.Body>
      <OverlayCard.Footer className="flex justify-end gap-2">
        <CancelActionButton label={messages.common.cancel} onClick={onClose} />
        <SaveActionButton
          busy={createUser.isPending}
          disabled={
            createUser.isPending ||
            !draft.email ||
            !draft.login ||
            !draft.displayName ||
            draft.password.length < 10
          }
          onClick={() => void handleCreate()}
          label={createUser.isPending ? messages.common.saving : messages.common.save}
        />
      </OverlayCard.Footer>
    </OverlayCard>
  );
}
