import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { serverTemplateService } from "@/config/services";
import PublicTemplateList from "./PublicTemplateList";

export default async function PublicTemplatesPage() {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["public-templates", "mock-user"],
    queryFn: () => serverTemplateService.getTemplates("mock-user"),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="container mx-auto py-10 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Public Templates (SSR Demo)</h1>
          <p className="text-slate-500 mt-2">
            These templates are rendered on the server using a Mock Repository and hydrated on the client.
            The client then uses an API Repository to fetch updates.
          </p>
        </div>
        <PublicTemplateList />
      </div>
    </HydrationBoundary>
  );
}
