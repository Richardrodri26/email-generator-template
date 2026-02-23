"use client";

import { useTemplatesQuery } from "@/infrastructure/hooks/useTemplatesQuery";
import { apiTemplateService } from "@/config/services";
import { DataTable } from "@/components/features/TemplateTable/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Template } from "@/domain/models/Template";

const columns: ColumnDef<Template>[] = [
  {
    accessorKey: "name",
    header: "Template Name",
    cell: ({ row }) => <div className="font-medium text-slate-900">{row.getValue("name")}</div>,
  },
  {
    accessorKey: "updatedAt",
    header: "Last Updated",
    cell: ({ row }) => {
      const date = new Date(row.getValue("updatedAt"));
      return <div className="text-slate-500">{date.toLocaleDateString()} {date.toLocaleTimeString()}</div>;
    },
  },
  {
    id: "actions",
    header: "Status",
    cell: () => <div className="text-slate-400 italic text-sm">Read Only (Server Fetched)</div>,
  }
];

export default function PublicTemplateList() {
  const { data: templates, isLoading } = useTemplatesQuery(
    apiTemplateService,
    "mock-user",
    ["public-templates"]
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-slate-100 rounded animate-pulse"></div>
        <div className="h-10 bg-slate-100 rounded animate-pulse"></div>
        <div className="h-10 bg-slate-100 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200">
      <DataTable columns={columns} data={templates || []} />
    </div>
  );
}
