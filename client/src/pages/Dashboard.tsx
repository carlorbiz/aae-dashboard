import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Activity, Database, Workflow, Zap, TrendingUp, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const { data: platforms, isLoading: platformsLoading } = trpc.platforms.list.useQuery(undefined, {
    enabled: !!user,
  });
  const { data: workflowStats, isLoading: workflowsLoading } = trpc.workflows.stats.useQuery(undefined, {
    enabled: !!user,
  });
  const { data: llmSummary, isLoading: llmLoading } = trpc.llm.summary.useQuery(undefined, {
    enabled: !!user,
  });
  const { data: unreadCount, isLoading: notificationsLoading } = trpc.notifications.unreadCount.useQuery(undefined, {
    enabled: !!user,
  });

  if (authLoading) {
    return <DashboardLayout><div className="p-6"><Skeleton className="h-96 w-full" /></div></DashboardLayout>;
  }

  const connectedPlatforms = platforms?.filter(p => p.status === "connected").length || 0;
  const totalPlatforms = platforms?.length || 0;
  const activeWorkflows = workflowStats?.activeWorkflows || 0;
  const totalWorkflows = workflowStats?.totalWorkflows || 0;
  const totalLLMRequests = llmSummary?.totalRequests || 0;
  const totalLLMCost = llmSummary?.totalCost ? (llmSummary.totalCost / 100).toFixed(2) : "0.00";

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome to your AI Automation Ecosystem control center
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Platform Integrations</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {platformsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{connectedPlatforms}/{totalPlatforms}</div>
                  <p className="text-xs text-muted-foreground">
                    {connectedPlatforms === totalPlatforms ? "All connected" : `${totalPlatforms - connectedPlatforms} disconnected`}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
              <Workflow className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {workflowsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{activeWorkflows}/{totalWorkflows}</div>
                  <p className="text-xs text-muted-foreground">
                    {workflowStats?.totalRuns || 0} total runs
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">LLM Requests</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {llmLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{totalLLMRequests.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    ${totalLLMCost} total cost
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Notifications</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {notificationsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{unreadCount || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {unreadCount === 0 ? "All caught up" : "Unread messages"}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Platform Status</CardTitle>
              <CardDescription>Monitor your connected platforms</CardDescription>
            </CardHeader>
            <CardContent>
              {platformsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <div className="space-y-2">
                  {platforms?.slice(0, 5).map((platform) => (
                    <div key={platform.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <span className="font-medium capitalize">{platform.platform}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        platform.status === "connected" 
                          ? "bg-green-500/20 text-green-600 dark:text-green-400" 
                          : platform.status === "error"
                          ? "bg-red-500/20 text-red-600 dark:text-red-400"
                          : "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400"
                      }`}>
                        {platform.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest workflow executions</CardDescription>
            </CardHeader>
            <CardContent>
              {workflowsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">Total Runs</p>
                      <p className="text-xs text-muted-foreground">All workflows</p>
                    </div>
                    <span className="text-2xl font-bold">{workflowStats?.totalRuns || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">Success Rate</p>
                      <p className="text-xs text-muted-foreground">Overall performance</p>
                    </div>
                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {workflowStats?.totalRuns 
                        ? Math.round((workflowStats.totalSuccess / workflowStats.totalRuns) * 100)
                        : 0}%
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
