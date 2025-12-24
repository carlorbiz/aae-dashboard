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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Plus,
  Globe,
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  PlayCircle,
  Settings,
  ExternalLink,
  Database,
  Bot,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

type HealthStatus = "healthy" | "degraded" | "down" | "unknown";
type ProjectStatus = "planning" | "development" | "testing" | "production" | "maintenance" | "archived";

const healthStatusConfig: Record<HealthStatus, { icon: any; color: string; bg: string; label: string }> = {
  healthy: {
    icon: CheckCircle2,
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-500/10 border-green-500/30",
    label: "Healthy",
  },
  degraded: {
    icon: AlertCircle,
    color: "text-yellow-600 dark:text-yellow-400",
    bg: "bg-yellow-500/10 border-yellow-500/30",
    label: "Degraded",
  },
  down: {
    icon: AlertCircle,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-500/10 border-red-500/30",
    label: "Down",
  },
  unknown: {
    icon: Clock,
    color: "text-gray-600 dark:text-gray-400",
    bg: "bg-gray-500/10 border-gray-500/30",
    label: "Unknown",
  },
};

const projectTypeLabels: Record<string, string> = {
  pwa_app: "PWA App",
  pwa_course: "PWA Course",
  api_service: "API Service",
  other: "Other",
};

const statusColors: Record<ProjectStatus, string> = {
  planning: "bg-gray-500/20 text-gray-600 dark:text-gray-400",
  development: "bg-blue-500/20 text-blue-600 dark:text-blue-400",
  testing: "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400",
  production: "bg-green-500/20 text-green-600 dark:text-green-400",
  maintenance: "bg-orange-500/20 text-orange-600 dark:text-orange-400",
  archived: "bg-gray-500/20 text-gray-600 dark:text-gray-400",
};

export default function Projects() {
  const { user, loading: authLoading } = useAuth();
  const [runningChecks, setRunningChecks] = useState<Set<number>>(new Set());

  const { data: projects, isLoading, refetch } = trpc.projects.list.useQuery(undefined, {
    enabled: !!user,
  });

  const runHealthCheckMutation = trpc.projects.runHealthCheck.useMutation({
    onSuccess: (data, variables) => {
      toast.success(`Health check completed for project`, {
        description: `Overall status: ${data.overallStatus}`,
      });
      setRunningChecks(prev => {
        const next = new Set(prev);
        next.delete(variables.projectId);
        return next;
      });
      refetch();
    },
    onError: (error, variables) => {
      toast.error("Health check failed", {
        description: error.message,
      });
      setRunningChecks(prev => {
        const next = new Set(prev);
        next.delete(variables.projectId);
        return next;
      });
    },
  });

  const handleRunHealthCheck = (projectId: number) => {
    setRunningChecks(prev => new Set(prev).add(projectId));
    runHealthCheckMutation.mutate({ projectId });
  };

  if (authLoading || isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6 space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const productionProjects = projects?.filter(p => p.status === "production") || [];
  const otherProjects = projects?.filter(p => p.status !== "production") || [];

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
            <p className="text-muted-foreground mt-2">
              Monitor health and status of your PWAs and services
            </p>
          </div>
          <Button asChild>
            <Link to="/projects/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Project
            </Link>
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Projects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projects?.length || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Production
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {productionProjects.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Healthy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {projects?.filter(p => p.currentHealthStatus === "healthy").length || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Issues
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {projects?.filter(p => p.currentHealthStatus === "down" || p.currentHealthStatus === "degraded").length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Production Projects */}
        {productionProjects.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Production</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {productionProjects.map((project) => {
                const healthConfig = healthStatusConfig[project.currentHealthStatus];
                const HealthIcon = healthConfig.icon;
                const isRunningCheck = runningChecks.has(project.id);

                return (
                  <Card key={project.id} className="relative overflow-hidden hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{project.name}</CardTitle>
                          <CardDescription className="mt-1">
                            {projectTypeLabels[project.type]}
                          </CardDescription>
                        </div>
                        <Badge className={statusColors[project.status as ProjectStatus]}>
                          {project.status}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Health Status */}
                      <div className={`flex items-center gap-2 p-3 rounded-lg border ${healthConfig.bg}`}>
                        <HealthIcon className={`h-5 w-5 ${healthConfig.color}`} />
                        <span className={`font-medium ${healthConfig.color}`}>
                          {healthConfig.label}
                        </span>
                      </div>

                      {/* Integration Status */}
                      <div className="space-y-2">
                        {project.knowledgeLakeEnabled && (
                          <div className="flex items-center gap-2 text-sm">
                            <Database className="h-4 w-4 text-blue-500" />
                            <span className="text-muted-foreground">Knowledge Lake</span>
                          </div>
                        )}
                        {project.neraAIEnabled && (
                          <div className="flex items-center gap-2 text-sm">
                            <Bot className="h-4 w-4 text-purple-500" />
                            <span className="text-muted-foreground">Nera AI</span>
                          </div>
                        )}
                      </div>

                      {/* Last Check */}
                      {project.lastHealthCheck && (
                        <div className="text-xs text-muted-foreground">
                          Last checked: {new Date(project.lastHealthCheck).toLocaleString()}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleRunHealthCheck(project.id)}
                          disabled={isRunningCheck}
                        >
                          {isRunningCheck ? (
                            <>
                              <Activity className="h-4 w-4 mr-2 animate-spin" />
                              Checking...
                            </>
                          ) : (
                            <>
                              <PlayCircle className="h-4 w-4 mr-2" />
                              Check Now
                            </>
                          )}
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/projects/${project.id}`}>
                            <Settings className="h-4 w-4" />
                          </Link>
                        </Button>
                        {project.productionUrl && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={project.productionUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Other Projects */}
        {otherProjects.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">In Development</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {otherProjects.map((project) => {
                const healthConfig = healthStatusConfig[project.currentHealthStatus];
                const HealthIcon = healthConfig.icon;

                return (
                  <Card key={project.id} className="relative overflow-hidden opacity-75 hover:opacity-100 transition-opacity">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{project.name}</CardTitle>
                          <CardDescription className="mt-1">
                            {projectTypeLabels[project.type]}
                          </CardDescription>
                        </div>
                        <Badge className={statusColors[project.status as ProjectStatus]}>
                          {project.status}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className={`flex items-center gap-2 p-3 rounded-lg border ${healthConfig.bg}`}>
                        <HealthIcon className={`h-5 w-5 ${healthConfig.color}`} />
                        <span className={`font-medium ${healthConfig.color}`}>
                          {healthConfig.label}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1" asChild>
                          <Link to={`/projects/${project.id}`}>
                            <Settings className="h-4 w-4 mr-2" />
                            Manage
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!projects || projects.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Globe className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
              <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
                Start monitoring your PWAs by adding your first project
              </p>
              <Button asChild>
                <Link to="/projects/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Project
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
