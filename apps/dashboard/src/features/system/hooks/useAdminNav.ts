import type { NavId, NavItem } from "@layered/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api.ts";

export function useAdminNav(navId: NavId) {
  return useQuery({
    queryKey: ["admin-nav", navId],
    queryFn: () => api.get<NavItem[]>(`/admin/nav/${navId}`),
  });
}

export function useSaveNav(navId: NavId) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (
      items: {
        label?: string | null;
        pageSlug?: string | null;
        target?: string;
        url?: string | null;
      }[],
    ) => api.put<NavItem[]>(`/admin/nav/${navId}`, { items }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-nav", navId] });
      qc.invalidateQueries({ queryKey: ["nav", navId] });
    },
  });
}
