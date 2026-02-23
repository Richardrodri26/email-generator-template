import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LocalStorageTemplateRepository } from "@/infrastructure/repositories/LocalStorageTemplateRepository";
import { Template } from "@/domain/models/Template";
import { useAuth } from "@/application/useAuth";
import { v4 as uuidv4 } from "uuid";

const repository = new LocalStorageTemplateRepository();

export function useTemplates() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const templatesQuery = useQuery({
    queryKey: ["templates", user?.id],
    queryFn: async () => {
      if (!user) return [];
      return repository.getTemplatesByAuthor(user.id);
    },
    enabled: !!user,
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!user) throw new Error("Must be logged in to create a template");

      const newTemplate: Template = {
        id: uuidv4(),
        name,
        authorId: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        data: {
          rootNodeId: "root",
          nodes: {
            root: {
              id: "root",
              type: "ROOT",
              props: {
                style: { backgroundColor: "#ffffff", padding: "20px" },
              },
              children: [],
            },
          },
        },
      };

      await repository.saveTemplate(newTemplate);
      return newTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates", user?.id] });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      await repository.deleteTemplate(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates", user?.id] });
    },
  });

  return {
    templates: templatesQuery.data || [],
    isLoading: templatesQuery.isLoading,
    createTemplate: createTemplateMutation.mutateAsync,
    isCreating: createTemplateMutation.isPending,
    deleteTemplate: deleteTemplateMutation.mutateAsync,
    isDeleting: deleteTemplateMutation.isPending,
  };
}
