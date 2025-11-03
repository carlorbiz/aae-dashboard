import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, DollarSign, Clock, TrendingUp, Zap } from "lucide-react";

export default function LLMMetrics() {
  const { user, loading: authLoading } = useAuth();
  const { data: metrics, isLoading: metricsLoading } = trpc.llm.metrics.useQuery(
    { days: 30 },
    { enabled: !!user }
  );
  const { data: summary, isLoading: summaryLoading } = trpc.llm.summary.useQuery(undefined, {
    enabled: !!user,
  });

  if (authLoading) {
    return <DashboardLayout><div className="p-6"><Skeleton className="h-96 w-full" /></div></DashboardLayout>;
  }

  const totalRequests = summary?.totalRequests || 0;
  const totalTokens = summary?.totalTokens || 0;
  const totalCost = summary?.totalCost ? (summary.totalCost / 100).toFixed(2) : "0.00";
  const avgResponseTime = summary?.avgResponseTime || 0;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">LLM Performance Metrics</h1>
          <p className="text-muted-foreground mt-2">
            Monitor your AI model usage, performance, and costs
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {summaryLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{totalRequests.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    Last 30 days
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {summaryLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{(totalTokens / 1000).toFixed(1)}K</div>
                  <p className="text-xs text-muted-foreground">
                    Tokens processed
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {summaryLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">${totalCost}</div>
                  <p className="text-xs text-muted-foreground">
                    Cumulative spend
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {summaryLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{avgResponseTime}ms</div>
                  <p className="text-xs text-muted-foreground">
                    Average latency
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Detailed Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>LLM Usage by Provider</CardTitle>
            <CardDescription>Breakdown of requests, tokens, and costs by provider and model</CardDescription>
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : metrics && metrics.length > 0 ? (
              <div className="space-y-4">
                {metrics.map((metric) => (
                  <div key={metric.id} className="p-4 rounded-lg bg-muted/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{metric.llmProvider}</h3>
                        <p className="text-sm text-muted-foreground">{metric.modelName}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${(metric.totalCost / 100).toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">{metric.requestCount} requests</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Success Rate</p>
                        <p className="font-medium">
                          {metric.requestCount > 0 
                            ? Math.round((metric.successCount / metric.requestCount) * 100)
                            : 0}%
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Tokens</p>
                        <p className="font-medium">{(metric.totalTokens / 1000).toFixed(1)}K</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Avg Time</p>
                        <p className="font-medium">{metric.avgResponseTime}ms</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No metrics available</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  LLM usage metrics will appear here once your AI agents start processing requests.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
