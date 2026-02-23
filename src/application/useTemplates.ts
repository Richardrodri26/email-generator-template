import { localTemplateService } from "@/config/services";
import { useTemplatesQuery, useCreateTemplateMutation, useDeleteTemplateMutation } from "@/infrastructure/hooks/useTemplatesQuery";
import { useAuth } from "@/application/useAuth";

export function useTemplates() {
  const { user } = useAuth();
  const userId = user?.id;

  const templatesQuery = useTemplatesQuery(localTemplateService, userId);
  const createTemplateMutation = useCreateTemplateMutation(localTemplateService, userId);
  const deleteTemplateMutation = useDeleteTemplateMutation(localTemplateService, userId);

  return {
    templates: templatesQuery.data || [],
    isLoading: templatesQuery.isLoading,
    createTemplate: createTemplateMutation.mutateAsync,
    isCreating: createTemplateMutation.isPending,
    deleteTemplate: deleteTemplateMutation.mutateAsync,
    isDeleting: deleteTemplateMutation.isPending,
  };
}
