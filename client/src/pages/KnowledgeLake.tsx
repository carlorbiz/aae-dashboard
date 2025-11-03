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

  const { data: allItems, isLoading: allItemsLoading } = trpc.knowledge.list.useQuery(
    { limit: 50 },
    { enabled: !!user && !activeSearch }
  );

  const { data: searchResults, isLoading: searchLoading } = trpc.knowledge.search.useQuery(
    { searchTerm: activeSearch },
    { enabled: !!user && !!activeSearch }
  );

  if (authLoading) {
    return <DashboardLayout><div className="p-6"><Skeleton className="h-96 w-full" /></div></DashboardLayout>;
  }

  const items = activeSearch ? searchResults : allItems;
  const isLoading = activeSearch ? searchLoading : allItemsLoading;

  const handleSearch = () => {
    setActiveSearch(searchTerm);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setActiveSearch("");
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case "notion":
        return "bg-black text-white border-black";
      case "google_drive":
        return "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30";
      case "github":
        return "bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30";
      case "railway":
        return "bg-pink-500/20 text-pink-600 dark:text-pink-400 border-pink-500/30";
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
              {activeSearch ? "Search Results" : "Recent Items"}
            </CardTitle>
            <CardDescription>
              {activeSearch 
                ? `Found ${items?.length || 0} items matching your search`
                : "Latest items from your knowledge sources"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : items && items.length > 0 ? (
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="p-4 rounded-lg bg-muted/50 space-y-2 hover:bg-muted/70 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <h3 className="font-semibold">{item.title}</h3>
                        </div>
                        {item.contentPreview && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {item.contentPreview}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 items-start">
                        <Badge variant="outline" className={getSourceColor(item.source)}>
                          {item.source.replace("_", " ")}
                        </Badge>
                        {item.itemType && (
                          <Badge variant="outline" className="bg-muted">
                            {item.itemType}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="text-xs text-muted-foreground">
                        {item.lastModified && (
                          <span>Modified: {new Date(item.lastModified).toLocaleDateString()}</span>
                        )}
                      </div>
                      {item.url && (
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => window.open(item.url!, "_blank")}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <Database className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {activeSearch ? "No results found" : "No knowledge items yet"}
                </h3>
                <p className="text-muted-foreground text-center max-w-md">
                  {activeSearch 
                    ? "Try adjusting your search terms or clearing the search to see all items."
                    : "Your knowledge base items will appear here once your platforms are synced."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
