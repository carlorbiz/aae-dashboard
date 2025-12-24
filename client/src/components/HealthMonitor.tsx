import { trpc } from "@/lib/trpc";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  Database,
  Bot,
  Wifi,
  Zap,
  Activity,
} from "lucide-react";

type HealthStatus = "healthy" | "degraded" | "down" | "unknown";

interface HealthMonitorProps {
  projectId: number;
  compact?: boolean;
}

const statusConfig: Record<HealthStatus, { icon: any; color: string; label: string }> = {
  healthy: {
    icon: CheckCircle2,
    color: "text-green-600 dark:text-green-400",
    label: "Healthy",
  },
  degraded: {
    icon: AlertCircle,
    color: "text-yellow-600 dark:text-yellow-400",
    label: "Degraded",
  },
  down: {
    icon: XCircle,
    color: "text-red-600 dark:text-red-400",
    label: "Down",
  },
  unknown: {
    icon: Clock,
    color: "text-gray-600 dark:text-gray-400",
    label: "Unknown",
  },
};

const checkTypeIcons: Record<string, any> = {
  uptime: Wifi,
  knowledge_lake_read: Database,
  knowledge_lake_write: Database,
  nera_ai_availability: Bot,
  nera_ai_quality: Bot,
  api_latency: Zap,
  full_integration: Activity,
};

const checkTypeLabels: Record<string, string> = {
  uptime: "Uptime",
  knowledge_lake_read: "Knowledge Lake (Read)",
  knowledge_lake_write: "Knowledge Lake (Write)",
  nera_ai_availability: "Nera AI (Availability)",
  nera_ai_quality: "Nera AI (Quality)",
  authentication: "Authentication",
  api_latency: "API Latency",
  database_connection: "Database",
  full_integration: "Full Integration",
};

export function HealthMonitor({ projectId, compact = false }: HealthMonitorProps) {
  const { data: latestChecks, isLoading } = trpc.projects.getLatestHealth.useQuery(
    { projectId },
    {
      refetchInterval: 30000, // Refresh every 30 seconds
    }
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!latestChecks || latestChecks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Health Status</CardTitle>
          <CardDescription>No health checks yet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Clock className="h-5 w-5 mr-2" />
            <span>Run your first health check to see status</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group by check type, keeping only the latest of each
  const latestByType = latestChecks.reduce((acc, check) => {
    if (!acc[check.checkType] || new Date(check.checkedAt) > new Date(acc[check.checkType].checkedAt)) {
      acc[check.checkType] = check;
    }
    return acc;
  }, {} as Record<string, typeof latestChecks[0]>);

  const checks = Object.values(latestByType);

  // Calculate overall status
  const hasDown = checks.some(c => c.status === "down");
  const hasDegraded = checks.some(c => c.status === "degraded");
  const overallStatus: HealthStatus = hasDown ? "down" : hasDegraded ? "degraded" : "healthy";
  const overallConfig = statusConfig[overallStatus];
  const OverallIcon = overallConfig.icon;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <OverallIcon className={`h-5 w-5 ${overallConfig.color}`} />
        <span className={`text-sm font-medium ${overallConfig.color}`}>
          {overallConfig.label}
        </span>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Health Status</CardTitle>
          <div className="flex items-center gap-2">
            <OverallIcon className={`h-5 w-5 ${overallConfig.color}`} />
            <Badge variant={overallStatus === "healthy" ? "default" : "destructive"}>
              {overallConfig.label}
            </Badge>
          </div>
        </div>
        <CardDescription>
          Last checked: {new Date(checks[0].checkedAt).toLocaleString()}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {checks.map((check) => {
            const config = statusConfig[check.status];
            const StatusIcon = config.icon;
            const CheckIcon = checkTypeIcons[check.checkType] || Activity;

            return (
              <div
                key={check.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <CheckIcon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium text-sm">
                      {checkTypeLabels[check.checkType] || check.checkType}
                    </div>
                    {check.responseTime && (
                      <div className="text-xs text-muted-foreground">
                        {check.responseTime}ms
                      </div>
                    )}
                    {check.errorMessage && (
                      <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                        {check.errorMessage}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <StatusIcon className={`h-5 w-5 ${config.color}`} />
                  <span className={`text-sm font-medium ${config.color}`}>
                    {config.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Critical Integrations Highlight */}
        <div className="mt-6 pt-6 border-t">
          <h4 className="text-sm font-medium mb-3">Critical Integrations</h4>
          <div className="grid grid-cols-2 gap-4">
            {checks.filter(c => c.checkType.includes('knowledge_lake')).length > 0 && (
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-blue-500" />
                <div>
                  <div className="text-sm font-medium">Knowledge Lake</div>
                  <div className="text-xs text-muted-foreground">
                    {checks.filter(c => c.checkType.includes('knowledge_lake') && c.status === 'healthy').length}/
                    {checks.filter(c => c.checkType.includes('knowledge_lake')).length} healthy
                  </div>
                </div>
              </div>
            )}

            {checks.filter(c => c.checkType.includes('nera_ai')).length > 0 && (
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-purple-500" />
                <div>
                  <div className="text-sm font-medium">Nera AI</div>
                  <div className="text-xs text-muted-foreground">
                    {checks.filter(c => c.checkType.includes('nera_ai') && c.status === 'healthy').length}/
                    {checks.filter(c => c.checkType.includes('nera_ai')).length} healthy
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
