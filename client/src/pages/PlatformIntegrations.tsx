import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { RefreshCw, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

export default function PlatformIntegrations() {
  const { user, loading: authLoading } = useAuth();
  const utils = trpc.useUtils();
  const { data: platforms, isLoading } = trpc.platforms.list.useQuery(undefined, {
    enabled: !!user,
  });

  const upsertPlatform = trpc.platforms.upsert.useMutation({
    onSuccess: () => {
      utils.platforms.list.invalidate();
      toast.success("Platform status updated");
    },
    onError: (error) => {
      toast.error(`Failed to update platform: ${error.message}`);
    },
  });

  const handleSync = (platformName: string) => {
    toast.info(`Syncing ${platformName}...`);
    // Placeholder for actual sync logic
  };

  if (authLoading) {
    return <DashboardLayout><div className="p-6"><Skeleton className="h-96 w-full" /></div></DashboardLayout>;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
        return <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />;
      case "error":
        return <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />;
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected":
        return "bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30";
      case "error":
        return "bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30";
      default:
        return "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30";
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Platform Integrations</h1>
          <p className="text-muted-foreground mt-2">
            Manage connections to your knowledge sources and automation platforms
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {platforms?.map((platform) => (
              <Card key={platform.id} className="relative overflow-hidden">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="capitalize flex items-center gap-2">
                        {platform.platform.replace("_", " ")}
                        {getStatusIcon(platform.status)}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {platform.lastSynced 
                          ? `Last synced: ${new Date(platform.lastSynced).toLocaleString()}`
                          : "Never synced"}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Badge variant="outline" className={getStatusColor(platform.status)}>
                      {platform.status}
                    </Badge>
                    
                    {platform.errorMessage && (
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {platform.errorMessage}
                      </p>
                    )}
                    
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleSync(platform.platform)}
                        className="flex-1"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Sync Now
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && (!platforms || platforms.length === 0) && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No platforms configured</h3>
              <p className="text-muted-foreground text-center max-w-md">
                Platform integrations will appear here once they are configured in your AAE setup.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
