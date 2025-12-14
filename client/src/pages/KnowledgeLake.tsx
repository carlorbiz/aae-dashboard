import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, FileText, ExternalLink, Database, Filter } from "lucide-react";

export default function KnowledgeLake() {
  const { user, loading: authLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearch, setActiveSearch] = useState("");

  const { data: conversationsData, isLoading: conversationsLoading } = trpc.knowledge.getConversations.useQuery(
    { limit: 50, query: activeSearch },
    { enabled: !!user }
  );

  const { data: stats, isLoading: statsLoading } = trpc.knowledge.getKnowledgeLakeStats.useQuery(
    undefined,
    { enabled: !!user }
  );

  if (authLoading) {
    return <DashboardLayout><div className="p-6"><Skeleton className="h-96 w-full" /></div></DashboardLayout>;
  }

  const conversations = conversationsData?.conversations || [];
  const isLoading = conversationsLoading;

  const handleSearch = () => {
    setActiveSearch(searchTerm);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setActiveSearch("");
  };

  const getSourceColor = (source: string) => {
    const normalizedSource = source.toLowerCase();
    switch (normalizedSource) {
      case "fred":
        return "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30";
      case "claude":
        return "bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30";
      case "colin":
        return "bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30";
      case "penny":
        return "bg-pink-500/20 text-pink-600 dark:text-pink-400 border-pink-500/30";
      case "gemini":
        return "bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30";
      case "grok":
        return "bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border-cyan-500/30";
      case "manus":
        return "bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/30";
      default:
        return "bg-gray-500/20 text-gray-600 dark:text-gray-400 border-gray-500/30";
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Knowledge Lake</h1>
          <p className="text-muted-foreground mt-2">
            Search and access your unified knowledge base across all platforms
          </p>
        </div>

        {/* Search Bar */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search across all your knowledge sources..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleSearch}>
                Search
              </Button>
              {activeSearch && (
                <Button variant="outline" onClick={handleClearSearch}>
                  Clear
                </Button>
              )}
            </div>
            {activeSearch && (
              <p className="text-sm text-muted-foreground mt-2">
                Showing results for: <span className="font-medium">"{activeSearch}"</span>
              </p>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle>
              {activeSearch ? "Search Results" : "Recent Conversations"}
            </CardTitle>
            <CardDescription>
              {activeSearch
                ? `Found ${conversations.length} conversations matching your search`
                : `${stats?.totalConversations || conversations.length} conversations from your Knowledge Lake`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : conversations && conversations.length > 0 ? (
              <div className="space-y-4">
                {conversations.map((conversation: any, idx: number) => (
                  <div key={conversation.id || idx} className="p-4 rounded-lg bg-muted/50 space-y-2 hover:bg-muted/70 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <h3 className="font-semibold">{conversation.topic || "Conversation"}</h3>
                        </div>
                        {conversation.content && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {conversation.content}
                          </p>
                        )}
                        {conversation.entities && conversation.entities.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {conversation.entities.slice(0, 5).map((entity: string, i: number) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {entity}
                              </Badge>
                            ))}
                            {conversation.entities.length > 5 && (
                              <Badge variant="secondary" className="text-xs">
                                +{conversation.entities.length - 5} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 items-start">
                        <Badge variant="outline" className={getSourceColor(conversation.agent || "unknown")}>
                          {conversation.agent || "Unknown"}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="text-xs text-muted-foreground">
                        {conversation.date && (
                          <span>Date: {new Date(conversation.date).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <Database className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {activeSearch ? "No results found" : "No conversations yet"}
                </h3>
                <p className="text-muted-foreground text-center max-w-md">
                  {activeSearch
                    ? "Try adjusting your search terms or clearing the search to see all conversations."
                    : "Your ingested conversations will appear here once they are processed by the Knowledge Lake API."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
