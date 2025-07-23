"use client";

import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LoadingSpinner } from "@/components/LoadingSpinner";

import { useDataTable } from "@/hooks/use-data-table";
import type { Column, ColumnDef } from "@tanstack/react-table";

import {
  Smile,
  Frown,
  Meh,
  MoreHorizontal,
  Text,
  CalendarDays,
  Mic,
  Video,
  FileText,
} from "lucide-react";
import { parseAsArrayOf, parseAsString, useQueryState } from "nuqs";
import * as React from "react";
import { useAuth } from "@/context/AuthContext";
import { getEmotionLogs, getJournalEntries, type EmotionLog, type JournalEntry as DBJournalEntry } from "@/lib/dbHelpers";
import { toast } from "sonner";

interface JournalHistoryEntry {
  id: string;
  date: string;
  type: 'emotion' | 'journal';
  entryType?: 'text' | 'voice' | 'video';
  title?: string;
  content?: string;
  mood?: number;
  emotions?: string[];
  triggers?: string[];
  context?: string;
  intensity?: number;
  isDraft?: boolean;
}

// Mock data removed - will be replaced with database fetches

export default function JournalHistoryPage() {
  const { user } = useAuth();
  const [date] = useQueryState("date", parseAsString.withDefault(""));
  const [entryType] = useQueryState(
    "entryType",
    parseAsArrayOf(parseAsString).withDefault([]),
  );
  
  const [data, setData] = React.useState<JournalHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // Fetch data from database
  React.useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [emotionLogs, journalEntries] = await Promise.all([
          getEmotionLogs(user.uid, 100),
          getJournalEntries(user.uid, 100)
        ]);

        // Combine and transform data
        const combinedData: JournalHistoryEntry[] = [
          ...emotionLogs.map((log: EmotionLog) => ({
            id: log.id || '',
            date: log.createdAt.toDate().toISOString().split('T')[0],
            type: 'emotion' as const,
            mood: log.mood,
            emotions: log.emotions,
            triggers: log.triggers,
            context: log.context,
            intensity: log.intensity
          })),
          ...journalEntries.map((entry: DBJournalEntry) => ({
            id: entry.id || '',
            date: entry.date.toDate().toISOString().split('T')[0],
            type: 'journal' as const,
            entryType: entry.entryType,
            title: entry.title,
            content: entry.content,
            mood: entry.mood,
            emotions: entry.emotions,
            isDraft: entry.isDraft
          }))
        ];

        // Sort by date descending
        combinedData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setData(combinedData);
      } catch (error) {
        console.error('Error fetching journal history:', error);
        toast.error('Failed to load journal history');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const filteredData = React.useMemo(() => {
    return data.filter((entry) => {
      const matchesDate =
        date === "" || entry.date.toLowerCase().includes(date.toLowerCase());
      const matchesType =
        entryType.length === 0 || 
        (entry.type === 'journal' && entry.entryType && entryType.includes(entry.entryType)) ||
        (entry.type === 'emotion' && entryType.includes('emotion'));

      return matchesDate && matchesType;
    });
  }, [data, date, entryType]);

  const columns = React.useMemo<ColumnDef<JournalHistoryEntry>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        size: 32,
        enableSorting: false,
        enableHiding: false,
      },
      {
        id: "date",
        accessorKey: "date",
        header: ({ column }: { column: Column<JournalHistoryEntry, unknown> }) => (
          <DataTableColumnHeader column={column} title="Date" />
        ),
        cell: ({ cell }) => <div>{cell.getValue<JournalHistoryEntry["date"]>()}</div>,
        meta: {
          label: "Date",
          placeholder: "Search date...",
          variant: "text",
          icon: CalendarDays,
        },
        enableColumnFilter: true,
      },
      {
        id: "type",
        accessorKey: "type",
        header: ({ column }: { column: Column<JournalHistoryEntry, unknown> }) => (
          <DataTableColumnHeader column={column} title="Type" />
        ),
        cell: ({ row }) => {
          const entry = row.original;
          const Icon = entry.type === 'emotion' 
            ? (entry.mood !== undefined && entry.mood <= 2 ? Frown : entry.mood !== undefined && entry.mood >= 5 ? Smile : Meh)
            : entry.entryType === 'voice' ? Mic
            : entry.entryType === 'video' ? Video
            : FileText;

          const label = entry.type === 'emotion' 
            ? 'Emotion Log'
            : entry.entryType === 'voice' ? 'Voice Journal'
            : entry.entryType === 'video' ? 'Video Journal'
            : 'Text Journal';

          return (
            <Badge variant="outline" className="flex items-center gap-1">
              <Icon className="h-4 w-4" />
              {label}
            </Badge>
          );
        },
        meta: {
          label: "Type",
          variant: "multiSelect",
          options: [
            { label: "Emotion Log", value: "emotion", icon: Meh },
            { label: "Text Journal", value: "text", icon: FileText },
            { label: "Voice Journal", value: "voice", icon: Mic },
            { label: "Video Journal", value: "video", icon: Video },
          ],
        },
        enableColumnFilter: true,
      },
      {
        id: "content",
        accessorKey: "content",
        header: ({ column }: { column: Column<JournalHistoryEntry, unknown> }) => (
          <DataTableColumnHeader column={column} title="Content" />
        ),
        cell: ({ row }) => {
          const entry = row.original;
          let displayContent = '';
          
          if (entry.type === 'emotion') {
            const emotionText = entry.emotions?.join(', ') || '';
            const triggerText = entry.triggers?.length ? ` (${entry.triggers.join(', ')})` : '';
            const contextText = entry.context ? ` - ${entry.context}` : '';
            displayContent = `${emotionText}${triggerText}${contextText}`;
          } else {
            displayContent = entry.title && entry.title !== 'untitled' && entry.title !== 'Untitled Entry'
              ? entry.title
              : entry.content?.substring(0, 100) + (entry.content && entry.content.length > 100 ? '...' : '') || '';
          }
          
          return (
            <div className="line-clamp-2 text-sm text-muted-foreground">
              {displayContent || 'No content'}
              {entry.isDraft && <Badge variant="secondary" className="ml-2">Draft</Badge>}
            </div>
          );
        },
      },
      {
        id: "actions",
        cell: function Cell() {
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Edit</DropdownMenuItem>
                <DropdownMenuItem className="text-red-600 hover:bg-red-50">
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
        size: 32,
      },
    ],
    [],
  );

  const { table } = useDataTable({
    data: filteredData,
    columns,
    pageCount: 1,
    initialState: {
      sorting: [{ id: "date", desc: true }],
      columnPinning: { right: ["actions"] },
    },
    getRowId: (row) => row.id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Please log in to view your journal history.</p>
      </div>
    );
  }

  return (
    <div className="data-table-container">
      <div className="mb-4">
        <p className="text-muted-foreground">View your emotion logs and journal entries over time.</p>
      </div>
      <DataTable table={table}>
        <DataTableToolbar table={table} />
      </DataTable>
    </div>
  );
}
