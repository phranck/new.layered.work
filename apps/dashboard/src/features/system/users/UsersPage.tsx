import { TrashIcon } from "@phosphor-icons/react";
import { useState } from "react";

import { ItemCard } from "@/components/ui/Card.tsx";
import {
  CancelActionButton,
  CreateActionButton,
  EditActionButton,
  RemoveActionButton,
} from "@/components/ui/DashboardActionButton.tsx";
import { Dialog } from "@/components/ui/Dialog.tsx";
import { dialogHeaderIconClass } from "@/components/ui/DialogClasses.ts";
import { PageHeader } from "@/components/ui/PageHeader.tsx";
import { PageBody, PageLayout } from "@/components/ui/PageLayout.tsx";
import { useI18n } from "@/context/I18nContext.tsx";
import { useAuth } from "@/features/auth/AuthContext.tsx";
import { useAdminUsers, useDeleteUser } from "@/features/system/hooks/useAdminUsers.ts";

import { UserAvatar } from "./UserAvatar.tsx";
import { UserCreateCard, UserEditCard } from "./UserEditCard.tsx";

export function UsersPage() {
  const { messages } = useI18n();
  const usersMessages = messages.users;
  const { user: me } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const { data: users = [], isLoading } = useAdminUsers();
  const deleteMutation = useDeleteUser();
  const deleteTarget = users.find((user) => user.id === deleteId);

  return (
    <PageLayout>
      <PageHeader title={usersMessages.title}>
        {me?.isOwner && (
          <CreateActionButton
            onClick={() => setShowCreate(true)}
            label={usersMessages.inviteUser}
          />
        )}
      </PageHeader>

      <PageBody>
        {isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 3 }, (_, index) => `sk-${index}`).map((key) => (
              <ItemCard key={key} className="h-16 animate-pulse" />
            ))}
          </div>
        )}

        <div className="space-y-2">
          {users.map((user) => (
            <ItemCard key={user.id} className="px-5 py-4 flex items-center gap-3">
              <UserAvatar username={user.login} avatarUrl={user.avatarUrl} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-[var(--ds-text)]">{user.displayName}</p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      user.role === "owner"
                        ? "bg-amber-900/40 text-amber-400"
                        : user.role === "admin"
                          ? "bg-blue-900/40 text-blue-400"
                          : "bg-gray-800 text-gray-400"
                    }`}
                  >
                    {usersMessages.role[user.role]}
                  </span>
                  {user.id === me?.id && (
                    <span className="text-xs bg-[var(--ds-bg-elevated)] text-[var(--ds-text-muted)] px-2 py-0.5 rounded-full">
                      {usersMessages.you}
                    </span>
                  )}
                </div>
                <p className="text-sm text-[var(--ds-text-subtle)]">{user.email}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {(me?.isOwner || user.id === me?.id) && (
                  <EditActionButton
                    onClick={() => setEditingUserId(user.id)}
                    label={usersMessages.editCard.editTooltip}
                    variant="neutral"
                  />
                )}
                {me?.isOwner && user.id !== me?.id && (
                  <RemoveActionButton
                    onClick={() => setDeleteId(user.id)}
                    label={usersMessages.remove}
                  />
                )}
              </div>
            </ItemCard>
          ))}
        </div>
      </PageBody>

      <Dialog
        open={deleteId !== null && !!deleteTarget}
        title={usersMessages.removeConfirmTitle}
        titleIcon={<TrashIcon weight="duotone" className={dialogHeaderIconClass} />}
        onClose={() => setDeleteId(null)}
      >
        <div className="px-6 py-3">
          <p className="text-sm text-[var(--ds-text-muted)]">
            <span className="font-medium">{deleteTarget?.displayName}</span>{" "}
            {usersMessages.removeConfirmDescription}
          </p>
        </div>
        <Dialog.Footer>
          <CancelActionButton label={messages.common.cancel} onClick={() => setDeleteId(null)} />
          <RemoveActionButton
            disabled={deleteMutation.isPending}
            label={deleteMutation.isPending ? "..." : messages.common.remove}
            onClick={() => {
              if (deleteId) deleteMutation.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
            }}
          />
        </Dialog.Footer>
      </Dialog>

      {showCreate && (
        <UserCreateCard
          onClose={() => setShowCreate(false)}
          onCreated={() => setShowCreate(false)}
        />
      )}

      {editingUserId !== null && (
        <UserEditCard
          userId={editingUserId}
          onClose={() => setEditingUserId(null)}
          onSaved={() => setEditingUserId(null)}
        />
      )}
    </PageLayout>
  );
}
