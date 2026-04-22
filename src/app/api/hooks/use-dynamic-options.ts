/**
 * useDynamicOptions — generic CRUD hook for any dropdown type.
 *
 * Usage:
 *   const { options, addOption, deleteOption, isLoading } = useDynamicOptions('fabric-widths')
 *
 * Hits:
 *   GET    /api/v1/{type}
 *   POST   /api/v1/{type}        body: { label }
 *   DELETE /api/v1/{type}/:id
 *
 * All mutations are optimistic — no refetch needed.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosApiClient } from '../axiosApiClient';
import type { SearchableComboboxOption } from '@/components/ui/combobox';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DynamicOption {
  id: string;
  label: string;
  value: string;
  createdAt?: string;
}

interface ApiListResponse {
  success: boolean;
  data: DynamicOption[];
}

interface ApiItemResponse {
  success: boolean;
  data: DynamicOption;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDynamicOptions(type: string) {
  const queryClient = useQueryClient();
  const queryKey = ['dynamic-options', type] as const;

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<DynamicOption[]> => {
      const { data } = await axiosApiClient.get<ApiListResponse>(`/${type}`);
      return data.data ?? [];
    },
    staleTime: 5 * 60 * 1000, // 5 min — avoid refetch spam
  });

  // ── Add ────────────────────────────────────────────────────────────────────
  const addMutation = useMutation<DynamicOption, Error, string>({
    mutationFn: async (label: string) => {
      const { data } = await axiosApiClient.post<ApiItemResponse>(`/${type}`, { label });
      return data.data;
    },
    onMutate: async (label) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<DynamicOption[]>(queryKey);

      const optimistic: DynamicOption = {
        id: `optimistic-${Date.now()}`,
        label,
        value: label.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-'),
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData<DynamicOption[]>(queryKey, (old = []) => [...old, optimistic]);
      return { previous, optimistic };
    },
    onError: (_err, _label, context: any) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
    onSuccess: (serverData, _label, context: any) => {
      // Swap the optimistic entry with the real server data
      queryClient.setQueryData<DynamicOption[]>(queryKey, (old = []) =>
        old.map((item) => (item.id === context?.optimistic?.id ? serverData : item))
      );
    },
  });

  // ── Delete ─────────────────────────────────────────────────────────────────
  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: async (id: string) => {
      // Optimistic-only entries were never saved to the DB — skip API call
      if (id.startsWith('optimistic-')) return;
      await axiosApiClient.delete(`/${type}/${id}`);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<DynamicOption[]>(queryKey);
      // Remove immediately from UI regardless of ID type
      queryClient.setQueryData<DynamicOption[]>(queryKey, (old = []) =>
        old.filter((item) => item.id !== id)
      );
      return { previous };
    },
    onError: (_err, _id, context: any) => {
      // Backend failed — silently restore the previous list
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
  });

  // ── Derived: SearchableCombobox-ready options ──────────────────────────────
  const options: SearchableComboboxOption[] = (query.data ?? []).map((o) => ({
    id: o.id,
    label: o.label,
    value: o.value,
  }));

  return {
    options,
    isLoading: query.isLoading,
    /** Call with the raw label string — handles POST + optimistic update */
    addOption: (label: string) => addMutation.mutateAsync(label),
    /** Call with the option id — handles DELETE + optimistic update */
    deleteOption: (id: string) => deleteMutation.mutateAsync(id),
    isAdding: addMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
