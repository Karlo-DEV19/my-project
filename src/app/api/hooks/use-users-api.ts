import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosApiClient } from '../axiosApiClient';
import type { AdminAccountFormValues, MonthFilter } from '@/lib/validations/admin-account.schema';

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserRecord = {
  id: string;
  name: string;
  email: string;
  created_at: string;
};

export type UsersPagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type GetUsersResponse = {
  success: boolean;
  data: UserRecord[];
  pagination?: UsersPagination;
};

type MutateUserResponse = {
  success: boolean;
  data?: UserRecord;
};

// ─── GET /api/v1/users ────────────────────────────────────────────────────────

export type GetUsersParams = {
  search?: string;
  month?: MonthFilter;
  page?: number;
  limit?: number;
};

export function useGetUsers(params: GetUsersParams = {}) {
  const { search = '', month = 'all', page = 1, limit = 10 } = params;

  const query = useQuery<GetUsersResponse>({
    // All active params are part of the key for correct cache isolation.
    queryKey: ['users', { search, month, page, limit }],
    queryFn: async () => {
      const queryParams: Record<string, string | number> = { page, limit };
      if (search) queryParams.search = search;
      if (month !== 'all') queryParams.month = month;

      const { data } = await axiosApiClient.get<GetUsersResponse>('/users', {
        params: queryParams,
      });
      return data;
    },
    staleTime: 1000 * 60 * 2,   // 2 minutes
    gcTime: 1000 * 60 * 10,     // 10 minutes
    refetchOnWindowFocus: false,
  });

  return {
    users: query.data?.data ?? [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

// ─── POST /api/v1/users ───────────────────────────────────────────────────────

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation<MutateUserResponse, Error, AdminAccountFormValues>({
    mutationFn: async (payload) => {
      const { data } = await axiosApiClient.post<MutateUserResponse>('/users', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

// ─── DELETE /api/v1/users/:id ─────────────────────────────────────────────────

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation<MutateUserResponse, Error, string>({
    mutationFn: async (id) => {
      const { data } = await axiosApiClient.delete<MutateUserResponse>(`/users/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
