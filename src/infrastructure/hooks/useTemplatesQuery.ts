import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TemplateService } from "@/application/services/TemplateService";
import { Template } from "@/domain/models/Template";
import { useTemplateDefaultsStore } from "@/application/useTemplateDefaultsStore";

export function useTemplatesQuery(
  service: TemplateService,
  userId?: string,
  queryKeyPrefix = ["templates"]
) {
  const queryKey = userId ? [...queryKeyPrefix, userId] : queryKeyPrefix;

  return useQuery({
    queryKey,
    queryFn: async () => {
      if (!userId) return [];
      return service.getTemplates(userId);
    },
    enabled: !!userId,
  });
}

export function useCreateTemplateMutation(
  service: TemplateService,
  userId?: string,
  queryKeyPrefix = ["templates"]
) {
  const queryClient = useQueryClient();
  const queryKey = userId ? [...queryKeyPrefix, userId] : queryKeyPrefix;

  return useMutation({
    mutationFn: async (name: string) => {
      if (!userId) throw new Error("User ID is required to create a template");
      const { defaultMaxWidth } = useTemplateDefaultsStore.getState();
      return service.createTemplate(name, userId, { maxWidth: defaultMaxWidth });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

export function useDeleteTemplateMutation(
  service: TemplateService,
  userId?: string,
  queryKeyPrefix = ["templates"]
) {
  const queryClient = useQueryClient();
  const queryKey = userId ? [...queryKeyPrefix, userId] : queryKeyPrefix;

  return useMutation({
    mutationFn: async (id: string) => {
      return service.deleteTemplate(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}
