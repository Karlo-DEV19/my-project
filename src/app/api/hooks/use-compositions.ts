import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosApiClient } from '../axiosApiClient';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CompositionOption {
  id: string;
  label: string;
  value: string;
  createdAt: string;
}

interface GetCompositionsResponse {
  success: boolean;
  data: CompositionOption[];
}

interface CreateCompositionResponse {
  success: boolean;
  data: CompositionOption;
}

// ─── GET /api/v1/compositions ─────────────────────────────────────────────────

export function useGetCompositions() {
  return useQuery({
    queryKey: ['compositions'],
    queryFn: async (): Promise<CompositionOption[]> => {
      const { data } = await axiosApiClient.get<GetCompositionsResponse>('/compositions');
      return data.data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ─── POST /api/v1/compositions ────────────────────────────────────────────────

export function useCreateComposition() {
  const queryClient = useQueryClient();

  return useMutation<CompositionOption, Error, { label: string }>({
    mutationFn: async ({ label }) => {
      const { data } = await axiosApiClient.post<CreateCompositionResponse>(
        '/compositions',
        { label }
      );
      return data.data;
    },
    // Optimistic update: inject into cache immediately
    onMutate: async ({ label }) => {
      await queryClient.cancelQueries({ queryKey: ['compositions'] });
      const previous = queryClient.getQueryData<CompositionOption[]>(['compositions']);

      const optimistic: CompositionOption = {
        id: `optimistic-${Date.now()}`,
        label,
        value: label.toLowerCase().replace(/\s+/g, '-'),
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData<CompositionOption[]>(['compositions'], (old = []) => [
        ...old,
        optimistic,
      ]);

      return { previous, optimistic };
    },
    onError: (_err, _vars, context: any) => {
      // Rollback on failure
      if (context?.previous) {
        queryClient.setQueryData(['compositions'], context.previous);
      }
    },
    onSuccess: (serverData, _vars, context: any) => {
      // Replace the optimistic entry with the real server data
      queryClient.setQueryData<CompositionOption[]>(['compositions'], (old = []) =>
        old.map((item) =>
          item.id === context?.optimistic?.id ? serverData : item
        )
      );
    },
  });
}

// ─── DELETE /api/v1/compositions/:id ─────────────────────────────────────────

export function useDeleteComposition() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { id: string }>({
    mutationFn: async ({ id }) => {
      await axiosApiClient.delete(`/compositions/${id}`);
    },
    // Optimistic removal
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: ['compositions'] });
      const previous = queryClient.getQueryData<CompositionOption[]>(['compositions']);

      queryClient.setQueryData<CompositionOption[]>(['compositions'], (old = []) =>
        old.filter((item) => item.id !== id)
      );

      return { previous };
    },
    onError: (_err, _vars, context: any) => {
      if (context?.previous) {
        queryClient.setQueryData(['compositions'], context.previous);
      }
    },
  });
}
