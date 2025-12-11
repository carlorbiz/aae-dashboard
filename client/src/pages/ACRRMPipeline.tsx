import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { AlertCircle, CheckCircle2, Clock, Loader2, ExternalLink, X } from "lucide-react";
import { toast } from "sonner";

const ANALYSIS_STATUSES = [
  "Awaiting Analysis",
  "Claude Analysing",
  "Analysis Complete",
  "Human Review Required",
  "Approved for Output",
  "In Production",
  "Complete",
] as const;

const PRIORITIES = ["Urgent", "High", "Medium", "Low"] as const;

const NTCER_RELEVANCE = [
  "Core NTCER Content",
  "NTCER Adjacent",
  "General PM",
  "Not NTCER Related",
] as const;

const HANDBOOK_PARTS = [
  "Part 1",
  "Part 2",
  "Part 3",
  "Part 4",
  "Part 5",
  "Part 6",
] as const;

type AnalysisStatus = (typeof ANALYSIS_STATUSES)[number];
type Priority = (typeof PRIORITIES)[number];
type NTCERRelevance = (typeof NTCER_RELEVANCE)[number];
type HandbookPart = (typeof HANDBOOK_PARTS)[number];

interface ACRRMEntry {
  id: string;
  content_title: string;
  analysis_status: string;
  production_priority?: string;
  assigned_agent?: string;
  primary_audience?: string;
  output_formats?: string[];
  complexity_level?: string;
  handbook_part?: string;
  ntcer_relevance?: string;
  research_required?: boolean;
  url?: string;
  gamma_url?: string;
  video_url?: string;
  notes?: string;
  regulatory_references?: string;
  version_status?: string;
}

function getStatusBadgeVariant(status: string) {
  switch (status) {
    case "Complete":
      return "default"; // green
    case "In Production":
      return "secondary"; // blue
    case "Approved for Output":
      return "outline"; // neutral
    case "Human Review Required":
      return "destructive"; // red
    case "Analysis Complete":
      return "outline";
    case "Claude Analysing":
      return "secondary";
    case "Awaiting Analysis":
    default:
      return "outline";
  }
}

function getPriorityBadgeColor(priority: string) {
  switch (priority) {
    case "Urgent":
      return "bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/50";
    case "High":
      return "bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/50";
    case "Medium":
      return "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/50";
    case "Low":
      return "bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/50";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "Complete":
      return <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />;
    case "Human Review Required":
      return <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />;
    case "Claude Analysing":
      return <Loader2 className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-spin" />;
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "Complete":
      return "bg-green-500 hover:bg-green-600";
    case "In Production":
      return "bg-blue-500 hover:bg-blue-600";
    case "Approved for Output":
      return "bg-purple-500 hover:bg-purple-600";
    case "Human Review Required":
      return "bg-red-500 hover:bg-red-600";
    case "Analysis Complete":
      return "bg-yellow-500 hover:bg-yellow-600";
    case "Claude Analysing":
      return "bg-indigo-500 hover:bg-indigo-600";
    case "Awaiting Analysis":
    default:
      return "bg-gray-500 hover:bg-gray-600";
  }
}

function PipelineVisualization({
  entries,
  onStatusClick
}: {
  entries: ACRRMEntry[];
  onStatusClick: (status: AnalysisStatus) => void;
}) {
  const statusCounts = ANALYSIS_STATUSES.reduce((acc, status) => {
    acc[status] = entries.filter(e => e.analysis_status === status).length;
    return acc;
  }, {} as Record<string, number>);

  const total = entries.length || 1; // Avoid division by zero

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Pipeline Flow</CardTitle>
        <CardDescription>Click a segment to filter by that status</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex h-12 rounded-lg overflow-hidden border border-border">
          {ANALYSIS_STATUSES.map((status) => {
            const count = statusCounts[status];
            const percentage = (count / total) * 100;

            if (count === 0) return null;

            return (
              <button
                key={status}
                className={`${getStatusColor(status)} relative group transition-all duration-200 flex items-center justify-center text-white font-medium text-xs hover:opacity-90 cursor-pointer`}
                style={{ width: `${percentage}%` }}
                onClick={() => onStatusClick(status)}
                title={`${status}: ${count} entries (${percentage.toFixed(1)}%)`}
              >
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                <div className="relative z-10 px-2 text-center">
                  <div className="font-semibold">{count}</div>
                  {percentage > 8 && (
                    <div className="text-[10px] opacity-90 truncate">{status}</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 mt-4">
          {ANALYSIS_STATUSES.map((status) => {
            const count = statusCounts[status];
            return (
              <div key={status} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded ${getStatusColor(status)}`} />
                <span className="text-xs text-muted-foreground truncate" title={status}>
                  {status} ({count})
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function EntryDetailPanel({
  entry,
  isOpen,
  onClose,
}: {
  entry: ACRRMEntry | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!entry) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-start justify-between gap-2">
            <span className="flex-1">{entry.content_title || "Untitled Entry"}</span>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </SheetTitle>
          <SheetDescription>
            {entry.handbook_part && `${entry.handbook_part} • `}
            {entry.primary_audience || "No audience specified"}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Status and Priority */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Status & Priority</h3>
            <div className="flex gap-2 flex-wrap">
              <Badge variant={getStatusBadgeVariant(entry.analysis_status)}>
                {entry.analysis_status}
              </Badge>
              {entry.production_priority && (
                <Badge
                  variant="outline"
                  className={getPriorityBadgeColor(entry.production_priority)}
                >
                  {entry.production_priority}
                </Badge>
              )}
              {entry.research_required && (
                <Badge variant="secondary">Research Required</Badge>
              )}
            </div>
          </div>

          {/* Assignment */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Assignment</h3>
            <div className="text-sm text-muted-foreground">
              <p><strong>Agent:</strong> {entry.assigned_agent || "Not assigned"}</p>
              <p><strong>Complexity:</strong> {entry.complexity_level || "Not set"}</p>
            </div>
          </div>

          {/* Output Formats */}
          {entry.output_formats && entry.output_formats.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Output Formats</h3>
              <div className="flex flex-wrap gap-2">
                {entry.output_formats.map((format) => (
                  <Badge key={format} variant="secondary">
                    {format}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* NTCER Relevance */}
          {entry.ntcer_relevance && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">NTCER Relevance</h3>
              <p className="text-sm text-muted-foreground">{entry.ntcer_relevance}</p>
            </div>
          )}

          {/* Notes */}
          {entry.notes && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Notes</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{entry.notes}</p>
            </div>
          )}

          {/* Regulatory References */}
          {entry.regulatory_references && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Regulatory References</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {entry.regulatory_references}
              </p>
            </div>
          )}

          {/* Version Status */}
          {entry.version_status && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Version Status</h3>
              <p className="text-sm text-muted-foreground">{entry.version_status}</p>
            </div>
          )}

          {/* Links */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Links</h3>
            <div className="flex flex-col gap-2">
              {entry.url && (
                <a
                  href={entry.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  View in Notion
                </a>
              )}
              {entry.gamma_url && (
                <a
                  href={entry.gamma_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  Gamma Deck
                </a>
              )}
              {entry.video_url && (
                <a
                  href={entry.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  Video
                </a>
              )}
              {!entry.url && !entry.gamma_url && !entry.video_url && (
                <p className="text-sm text-muted-foreground">No links available</p>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function ACRRMPipeline() {
  const { user, loading: authLoading } = useAuth();
  const [statusFilter, setStatusFilter] = useState<AnalysisStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "all">("all");
  const [ntcerFilter, setNtcerFilter] = useState<NTCERRelevance | "all">("all");
  const [handbookPartFilter, setHandbookPartFilter] = useState<HandbookPart | "all">("all");
  const [researchRequiredFilter, setResearchRequiredFilter] = useState<boolean | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<ACRRMEntry | null>(null);

  const {
    data: entriesData,
    isLoading: entriesLoading,
    refetch,
  } = trpc.acrrm.listEntries.useQuery(
    {
      status: statusFilter !== "all" ? statusFilter : undefined,
      priority: priorityFilter !== "all" ? priorityFilter : undefined,
      limit: 100,
    },
    {
      enabled: !!user,
    }
  );

  const { data: stats, isLoading: statsLoading } = trpc.acrrm.getStatistics.useQuery(undefined, {
    enabled: !!user,
  });

  const updateStatusMutation = trpc.acrrm.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status updated successfully in Notion");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update status: ${error.message}`);
    },
  });

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <Skeleton className="h-96 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  // Client-side filtering for fields not supported by backend yet
  let entries = entriesData?.entries || [];
  if (ntcerFilter !== "all") {
    entries = entries.filter(e => e.ntcer_relevance === ntcerFilter);
  }
  if (handbookPartFilter !== "all") {
    entries = entries.filter(e => e.handbook_part === handbookPartFilter);
  }
  if (researchRequiredFilter !== null) {
    entries = entries.filter(e => e.research_required === researchRequiredFilter);
  }

  const handlePipelineStatusClick = (status: AnalysisStatus) => {
    setStatusFilter(status);
  };

  const handleRowClick = (entry: ACRRMEntry) => {
    setSelectedEntry(entry);
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">ACRRM Resource Pipeline</h1>
          <p className="text-muted-foreground mt-2 text-sm md:text-base">
            Content development pipeline for ACRRM educational resources
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats?.totalEntries || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {entries.length} filtered
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Awaiting</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats?.awaitingAnalysis || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Needs attention
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <Loader2 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats?.inProduction || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    In production
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Done</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats?.completed || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.totalEntries ? Math.round(((stats?.completed || 0) / stats.totalEntries) * 100) : 0}% complete
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Pipeline Visualization */}
        {!entriesLoading && entries.length > 0 && (
          <PipelineVisualization entries={entries} onStatusClick={handlePipelineStatusClick} />
        )}

        {/* Filters and Table */}
        <Card>
          <CardHeader>
            <div className="space-y-4">
              <div>
                <CardTitle>Resource Entries</CardTitle>
                <CardDescription>
                  Filter and manage ACRRM educational content development
                </CardDescription>
              </div>

              {/* Filter Controls */}
              <div className="flex flex-col gap-3">
                {/* Row 1: Status and Priority */}
                <div className="flex flex-wrap gap-2">
                  <Select
                    value={statusFilter}
                    onValueChange={(value) => setStatusFilter(value as AnalysisStatus | "all")}
                  >
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      {ANALYSIS_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={priorityFilter}
                    onValueChange={(value) => setPriorityFilter(value as Priority | "all")}
                  >
                    <SelectTrigger className="w-full sm:w-[150px]">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priorities</SelectItem>
                      {PRIORITIES.map((priority) => (
                        <SelectItem key={priority} value={priority}>
                          {priority}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Row 2: NTCER, Handbook Part, Research Required */}
                <div className="flex flex-wrap gap-2">
                  <Select
                    value={ntcerFilter}
                    onValueChange={(value) => setNtcerFilter(value as NTCERRelevance | "all")}
                  >
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue placeholder="NTCER Relevance" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All NTCER Types</SelectItem>
                      {NTCER_RELEVANCE.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={handbookPartFilter}
                    onValueChange={(value) => setHandbookPartFilter(value as HandbookPart | "all")}
                  >
                    <SelectTrigger className="w-full sm:w-[150px]">
                      <SelectValue placeholder="Handbook Part" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Parts</SelectItem>
                      {HANDBOOK_PARTS.map((part) => (
                        <SelectItem key={part} value={part}>
                          {part}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex items-center space-x-2 px-3 py-2 border rounded-md bg-background">
                    <Switch
                      id="research-required"
                      checked={researchRequiredFilter === true}
                      onCheckedChange={(checked) =>
                        setResearchRequiredFilter(checked ? true : null)
                      }
                    />
                    <Label htmlFor="research-required" className="text-sm cursor-pointer">
                      Research Required
                    </Label>
                  </div>

                  {/* Clear Filters Button */}
                  {(statusFilter !== "all" ||
                    priorityFilter !== "all" ||
                    ntcerFilter !== "all" ||
                    handbookPartFilter !== "all" ||
                    researchRequiredFilter !== null) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setStatusFilter("all");
                        setPriorityFilter("all");
                        setNtcerFilter("all");
                        setHandbookPartFilter("all");
                        setResearchRequiredFilter(null);
                      }}
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {entriesLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : entries.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No entries found</p>
                <p className="text-sm">Try adjusting your filters or check Notion connection</p>
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px] md:w-[250px]">Content Title</TableHead>
                      <TableHead className="hidden md:table-cell">Status</TableHead>
                      <TableHead className="hidden lg:table-cell">Priority</TableHead>
                      <TableHead className="hidden xl:table-cell">Agent</TableHead>
                      <TableHead className="hidden xl:table-cell">Audience</TableHead>
                      <TableHead className="hidden 2xl:table-cell">Formats</TableHead>
                      <TableHead className="hidden 2xl:table-cell">Complexity</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((entry) => (
                      <TableRow
                        key={entry.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleRowClick(entry)}
                      >
                        <TableCell className="font-medium max-w-[200px] md:max-w-[250px]">
                          <div className="flex flex-col gap-1">
                            <span className="truncate" title={entry.content_title}>
                              {entry.content_title || "Untitled"}
                            </span>
                            {entry.handbook_part && (
                              <span className="text-xs text-muted-foreground">
                                {entry.handbook_part}
                              </span>
                            )}
                            {/* Mobile: Show status inline */}
                            <div className="md:hidden flex items-center gap-2 mt-1">
                              {getStatusIcon(entry.analysis_status)}
                              <span className="text-xs">{entry.analysis_status}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex items-center gap-2 min-w-[200px]">
                            {getStatusIcon(entry.analysis_status)}
                            <Select
                              value={entry.analysis_status}
                              onValueChange={(newStatus) => {
                                updateStatusMutation.mutate({
                                  id: entry.id,
                                  status: newStatus as AnalysisStatus,
                                });
                              }}
                              disabled={updateStatusMutation.isPending}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {ANALYSIS_STATUSES.map((status) => (
                                  <SelectItem key={status} value={status}>
                                    {status}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {entry.production_priority && (
                            <Badge
                              variant="outline"
                              className={getPriorityBadgeColor(entry.production_priority)}
                            >
                              {entry.production_priority}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="hidden xl:table-cell text-sm text-muted-foreground">
                          {entry.assigned_agent || "-"}
                        </TableCell>
                        <TableCell className="hidden xl:table-cell text-sm text-muted-foreground">
                          {entry.primary_audience || "-"}
                        </TableCell>
                        <TableCell className="hidden 2xl:table-cell">
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {entry.output_formats && entry.output_formats.length > 0 ? (
                              entry.output_formats.map((format) => (
                                <Badge key={format} variant="secondary" className="text-xs">
                                  {format}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden 2xl:table-cell text-sm text-muted-foreground">
                          {entry.complexity_level || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {entry.url && (
                            <a
                              href={entry.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="h-3 w-3" />
                              <span className="hidden sm:inline">Open</span>
                            </a>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail Panel */}
      <EntryDetailPanel
        entry={selectedEntry}
        isOpen={!!selectedEntry}
        onClose={() => setSelectedEntry(null)}
      />
    </DashboardLayout>
  );
}
