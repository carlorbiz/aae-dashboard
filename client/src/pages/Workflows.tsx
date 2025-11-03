import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Play, Pause, RefreshCw, CheckCircle2, XCircle, AlertCircle, Activity } from "lucide-react";

export default function Workflows() {
  const { user, loading: authLoading } = useAuth();
  const utils = trpc.useUtils();
  const { data: workflows, isLoading: workflowsLoading } = trpc.workflows.list.useQuery(undefined, {
    enabled: !!user,
  });
  const { data: stats, isLoading: statsLoading } = trpc.workflows.stats.useQuery(undefined, {
    enabled: !!user,
  });

  if (authLoading) {
    return <DashboardLayout><div className="p-6"><Skeleton className="h-96 w-full" /></div></DashboardLayout>;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />;
      case "error":
        return <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />;
      case "paused":
        return <Pause className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />;
      default:
        return <AlertCircle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30";
      case "error":
        return "bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30";
      case "paused":
        return "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30";
      default:
        return "bg-gray-500/20 text-gray-600 dark:text-gray-400 border-gray-500/30";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "n8n":
        return "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30";
      case "zapier":
        return "bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30";
      case "mcp":
        return "bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30";
      default:
        return "bg-gray-500/20 text-gray-600 dark:text-gray-400 border-gray-500/30";
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workflow Automation Hub</h1>
          <p className="text-muted-foreground mt-2">
            Monitor and manage your n8n, Zapier, and MCP workflows
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Workflows</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats?.totalWorkflows || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.activeWorkflows || 0} active
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Runs</CardTitle>
              <Play className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats?.totalRuns || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    All time
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {stats?.totalRuns 
                      ? Math.round((stats.totalSuccess / stats.totalRuns) * 100)
                      : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.totalSuccess || 0} successful
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Errors</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {stats?.totalErrors || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Failed runs
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Workflows List */}
        <Card>
          <CardHeader>
            <CardTitle>All Workflows</CardTitle>
            <CardDescription>Manage and monitor your automation workflows</CardDescription>
          </CardHeader>
          <CardContent>
            {workflowsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : workflows && workflows.length > 0 ? (
              <div className="space-y-4">
                {workflows.map((workflow) => (
                  <div key={workflow.id} className="p-4 rounded-lg bg-muted/50 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{workflow.name}</h3>
                          {getStatusIcon(workflow.status)}
                        </div>
                        {workflow.description && (
                          <p className="text-sm text-muted-foreground">{workflow.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline" className={getTypeColor(workflow.workflowType)}>
                          {workflow.workflowType.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className={getStatusColor(workflow.status)}>
                          {workflow.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Total Runs</p>
                        <p className="font-medium">{workflow.runCount}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Success</p>
                        <p className="font-medium text-green-600 dark:text-green-400">{workflow.successCount}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Errors</p>
                        <p className="font-medium text-red-600 dark:text-red-400">{workflow.errorCount}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Last Run</p>
                        <p className="font-medium">
                          {workflow.lastRun 
                            ? new Date(workflow.lastRun).toLocaleDateString()
                            : "Never"}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => toast.info("Run workflow feature coming soon")}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Run Now
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => toast.info("View details feature coming soon")}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <Activity className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No workflows configured</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  Your n8n, Zapier, and MCP workflows will appear here once they are configured.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
