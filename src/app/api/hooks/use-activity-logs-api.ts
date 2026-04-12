// src/lib/api/activity-logs/useGetAllActivityLogs.ts

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { axiosApiClient } from "../axiosApiClient";
import { ActivityLog } from "@/lib/types/activity-logs";

export type GetAllActivityLogsResponse = {
  success: boolean;
  data: ActivityLog[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    perPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
};

export type UseGetAllActivityLogsParams = {
  page: number;
  perPage: number;
  search?: string;
  action?: string;
  module?: string;
};

export const useGetAllActivityLogs = ({
  page,
  perPage,
  search,
  action,
  module,
}: UseGetAllActivityLogsParams) => {
  const fetchActivityLogs = async (): Promise<GetAllActivityLogsResponse> => {
    const { data } = await axiosApiClient.get<GetAllActivityLogsResponse>(
      "/activity-logs",
      {
        params: {
          page,
          perPage,
          search: search || undefined,
          action: action || undefined,
          module: module || undefined,
        },
      }
    );

    return data;
  };

  const query = useQuery({
    queryKey: ["activity-logs", { page, perPage, search, action, module }],
    queryFn: fetchActivityLogs,
    placeholderData: keepPreviousData, // Fixed for React Query v5
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes cache
    refetchOnWindowFocus: false,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
  };
};