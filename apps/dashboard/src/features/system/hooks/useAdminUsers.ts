import type { AdminUser, UserMutation, UserUpdate } from "@layered/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as api from "@/lib/api";

const adminUsersQueryKey = ["admin-users"] as const;

export function useAdminUsers() {
  return useQuery({
    queryKey: adminUsersQueryKey,
    queryFn: api.listUsers,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UserMutation) => api.createUser(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminUsersQueryKey }),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UserUpdate }) => api.updateUser(id, data),
    onSuccess: (user: AdminUser) => {
      queryClient.invalidateQueries({ queryKey: adminUsersQueryKey });
      queryClient.setQueryData<AdminUser[] | undefined>(adminUsersQueryKey, (current) =>
        current?.map((candidate) => (candidate.id === user.id ? user : candidate)),
      );
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteUser(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminUsersQueryKey }),
  });
}
