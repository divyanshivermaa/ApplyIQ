import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getDashboardOverview } from "../api/dashboard";
import {
  getPlatformPerf,
  getResumePerf,
  getWeeklyTrend,
} from "../api/analytics";
import { listApplications } from "../api/applications";
import {
  fetchPendingExpanded,
  confirmSuggestion,
  dismissSuggestion,
} from "../api/suggestions";

export const queryKeys = {
  dashboardOverview: ["dashboard", "overview"],
  applications: (sort) => ["applications", sort],
  analyticsPage: ["analytics", "page"],
  suggestions: (limit = 50) => ["suggestions", "pending", limit],
};

export function useDashboardOverview() {
  return useQuery({
    queryKey: queryKeys.dashboardOverview,
    queryFn: getDashboardOverview,
  });
}

export function useApplications(sort = "recent") {
  return useQuery({
    queryKey: queryKeys.applications(sort),
    queryFn: () => listApplications(sort),
  });
}

export function useAnalyticsPage() {
  return useQuery({
    queryKey: queryKeys.analyticsPage,
    queryFn: async () => {
      const [platform, resume, weekly] = await Promise.all([
        getPlatformPerf(),
        getResumePerf(),
        getWeeklyTrend(),
      ]);
      return {
        platform: Array.isArray(platform) ? platform : [],
        resume: Array.isArray(resume) ? resume : [],
        weekly: Array.isArray(weekly) ? weekly : [],
      };
    },
  });
}

export function useSuggestions(limit = 50) {
  return useQuery({
    queryKey: queryKeys.suggestions(limit),
    queryFn: () => fetchPendingExpanded(limit),
  });
}

export function useSuggestionActions() {
  const queryClient = useQueryClient();

  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["suggestions"] }),
      queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      queryClient.invalidateQueries({ queryKey: ["applications"] }),
    ]);

  const confirm = useMutation({
    mutationFn: confirmSuggestion,
    onSuccess: invalidate,
  });

  const dismiss = useMutation({
    mutationFn: dismissSuggestion,
    onSuccess: invalidate,
  });

  return { confirm, dismiss };
}

export function useInvalidateApplications() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["applications"] }),
      queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      queryClient.invalidateQueries({ queryKey: ["analytics"] }),
    ]);
}
