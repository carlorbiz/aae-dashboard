import { useState } from "react";
import { useParams, Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { HealthMonitor } from "@/components/HealthMonitor";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  PlayCircle,
  ExternalLink,
  Globe,
  Code,
  Calendar,
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  Database,
  Bot,
} from "lucide-react";
import { toast } from "sonner";

type HealthStatus = "healthy" | "degraded" | "down" | "unknown";

const statusConfig: Record<HealthStatus, { icon: any; color: string }> = {
  healthy: { icon: CheckCircle2, color: "text-green-600" },
  degraded: { icon: AlertCircle, color: "text-yellow-600" },
  down: { icon: AlertCircle, color: "text-red-600" },
  unknown: { icon: Clock, color: "text-gray-600" },
};

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const projectId = parseInt(id || "0");
  const { user, loading: authLoading } = useAuth();
  const [isRunningCheck, setIsRunningCheck] = useState(false);

  const { data: project, isLoading, refetch } = trpc.projects.get.useQuery(
    { id: projectId },
    { enabled: !!user && projectId > 0 }
  );

  const { data: healthChecks } = trpc.projects.getHealthChecks.useQuery(
    { projectId, limit: 50 },
    { enabled: !!user && projectId > 0 }
  );

  const { data: incidents } = trpc.projects.getIncidents.useQuery(
    { projectId },
    { enabled: !!user && projectId > 0 }
  );

  const runHealthCheckMutation = trpc.projects.runHealthCheck.useMutation({
    onSuccess: (data) => {
      toast.success("Health check completed", {
        description: `Overall status: ${data.overallStatus}`,
      });
      setIsRunningCheck(false);
      refetch();
    },
    onError: (error) => {
      toast.error("Health check failed", {
        description: error.message,
      });
      setIsRunningCheck(false);
    },
  });

  const handleRunHealthCheck = () => {
    setIsRunningCheck(true);
    runHealthCheckMutation.mutate({ projectId });
  };

  if (authLoading || isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6 space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-96" />
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Project not found</h3>
              <Button asChild className="mt-4">
                <Link to="/projects">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Projects
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const StatusIcon = statusConfig[project.currentHealthStatus].icon;
  const statusColor = statusConfig[project.currentHealthStatus].color;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/projects">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
                <Badge>{project.type.replace('_', ' ')}</Badge>
                <Badge variant="outline">{project.status}</Badge>
              </div>
              <p className="text-muted-foreground mt-2">{project.description}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleRunHealthCheck}
              disabled={isRunningCheck}
            >
              {isRunningCheck ? (
                <>
                  <Activity className="h-4 w-4 mr-2 animate-spin" />
                  Running Check...
                </>
              ) : (
                <>
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Run Health Check
                </>
              )}
            </Button>
            {project.productionUrl && (
              <Button variant="outline" asChild>
                <a href={project.productionUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Visit Site
                </a>
              </Button>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Health Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <StatusIcon className={`h-6 w-6 ${statusColor}`} />
                <span className={`text-xl font-bold ${statusColor}`}>
                  {project.currentHealthStatus}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Database className="h-4 w-4" />
                Knowledge Lake
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {project.knowledgeLakeEnabled ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Enabled</span>
                  </>
                ) : (
                  <>
                    <Clock className="h-5 w-5 text-gray-600" />
                    <span className="font-medium">Disabled</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Bot className="h-4 w-4" />
                Nera AI
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {project.neraAIEnabled ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-purple-600" />
                    <span className="font-medium">Enabled</span>
                  </>
                ) : (
                  <>
                    <Clock className="h-5 w-5 text-gray-600" />
                    <span className="font-medium">Disabled</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Check Interval
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">
                {Math.floor((project.healthCheckInterval || 300) / 60)} min
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="health" className="space-y-6">
          <TabsList>
            <TabsTrigger value="health">Health Monitor</TabsTrigger>
            <TabsTrigger value="history">Check History</TabsTrigger>
            <TabsTrigger value="incidents">
              Incidents
              {incidents && incidents.filter(i => i.status !== 'resolved' && i.status !== 'closed').length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {incidents.filter(i => i.status !== 'resolved' && i.status !== 'closed').length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="health" className="space-y-6">
            <HealthMonitor projectId={projectId} />
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Health Check History</CardTitle>
                <CardDescription>Last 50 health checks</CardDescription>
              </CardHeader>
              <CardContent>
                {healthChecks && healthChecks.length > 0 ? (
                  <div className="space-y-2">
                    {healthChecks.map((check) => {
                      const StatusIcon = statusConfig[check.status].icon;
                      const statusColor = statusConfig[check.status].color;

                      return (
                        <div
                          key={check.id}
                          className="flex items-center justify-between p-3 rounded-lg border"
                        >
                          <div className="flex items-center gap-3">
                            <StatusIcon className={`h-5 w-5 ${statusColor}`} />
                            <div>
                              <div className="font-medium text-sm">{check.checkType}</div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(check.checkedAt).toLocaleString()}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-sm">
                            {check.responseTime && (
                              <div className="text-muted-foreground">
                                {check.responseTime}ms
                              </div>
                            )}
                            {check.statusCode && (
                              <Badge variant="outline">
                                {check.statusCode}
                              </Badge>
                            )}
                            {check.errorMessage && (
                              <div className="text-xs text-red-600 max-w-xs truncate">
                                {check.errorMessage}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No health checks yet
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="incidents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Incidents</CardTitle>
                <CardDescription>Issues and downtime tracking</CardDescription>
              </CardHeader>
              <CardContent>
                {incidents && incidents.length > 0 ? (
                  <div className="space-y-3">
                    {incidents.map((incident) => (
                      <div
                        key={incident.id}
                        className="border rounded-lg p-4 space-y-2"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{incident.title}</h4>
                              <Badge
                                variant={
                                  incident.severity === 'critical' ? 'destructive' :
                                  incident.severity === 'high' ? 'destructive' :
                                  'secondary'
                                }
                              >
                                {incident.severity}
                              </Badge>
                              <Badge variant="outline">{incident.status}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {incident.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Detected: {new Date(incident.detectedAt).toLocaleString()}
                          </div>
                          {incident.resolvedAt && (
                            <div className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Resolved: {new Date(incident.resolvedAt).toLocaleString()}
                            </div>
                          )}
                        </div>

                        {incident.resolution && (
                          <div className="mt-2 p-3 bg-muted rounded text-sm">
                            <div className="font-medium mb-1">Resolution:</div>
                            <div>{incident.resolution}</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No incidents recorded
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Project Settings</CardTitle>
                <CardDescription>Configuration and deployment details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="text-sm font-medium mb-1">Production URL</div>
                    <div className="text-sm text-muted-foreground">
                      {project.productionUrl || 'Not set'}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium mb-1">Staging URL</div>
                    <div className="text-sm text-muted-foreground">
                      {project.stagingUrl || 'Not set'}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium mb-1">Repository</div>
                    <div className="text-sm text-muted-foreground">
                      {project.repositoryUrl ? (
                        <a href={project.repositoryUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                          <Code className="h-3 w-3" />
                          View on GitHub
                        </a>
                      ) : 'Not set'}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium mb-1">Platform</div>
                    <div className="text-sm text-muted-foreground">
                      {project.platform || 'Not specified'}
                    </div>
                  </div>

                  {project.launchDate && (
                    <div>
                      <div className="text-sm font-medium mb-1">Launch Date</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(project.launchDate).toLocaleDateString()}
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="text-sm font-medium mb-1">Health Check Endpoint</div>
                    <div className="text-sm text-muted-foreground">
                      {project.healthCheckUrl || 'Default (/api/health)'}
                    </div>
                  </div>
                </div>

                {project.techStack && Array.isArray(project.techStack) && project.techStack.length > 0 && (
                  <div>
                    <div className="text-sm font-medium mb-2">Tech Stack</div>
                    <div className="flex flex-wrap gap-2">
                      {project.techStack.map((tech, index) => (
                        <Badge key={index} variant="secondary">{tech}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
