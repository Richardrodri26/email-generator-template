"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Template } from "@/domain/models/Template";
import { Button } from "@/components/ui/button";
import { Copy, Edit2, MoreHorizontal, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useTemplates } from "@/application/useTemplates";

export const getColumns = (): ColumnDef<Template>[] => [
  {
    accessorKey: "name",
    header: "Template Name",
    cell: ({ row }) => (
      <div className="font-medium text-slate-900">{row.getValue("name")}</div>
    ),
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
    cell: ({ row }) => {
      const template = row.original;
      // We cannot call a hook directly inside the column def.
      // So we use a tiny ActionsComponent to wrap the delete hook.
      return <ActionsComponent template={template} />;
    },
  },
];

function ActionsComponent({ template }: { template: Template }) {
  const { deleteTemplate, isDeleting } = useTemplates();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        
        <Link href={`/editor/${template.id}`}>
          <DropdownMenuItem className="cursor-pointer font-medium text-blue-600">
            <Edit2 className="mr-2 h-4 w-4" />
            Edit Template
          </DropdownMenuItem>
        </Link>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-red-600"
          disabled={isDeleting}
          onClick={() => {
            if (confirm("Are you sure you want to delete this template?")) {
              deleteTemplate(template.id);
            }
          }}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
