import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { Database, Workflow, TrendingUp, Zap, ArrowRight } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useEffect } from "react";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, user, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            {APP_LOGO && <img src={APP_LOGO} alt={APP_TITLE} className="h-8 w-8" />}
            <span className="font-bold text-xl">{APP_TITLE}</span>
          </div>
          <Button asChild>
            <a href={getLoginUrl()}>Sign In</a>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container py-24 space-y-8">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <h1 className="text-5xl font-bold tracking-tight">
            Your AI Automation Ecosystem
            <span className="block text-primary mt-2">Control Center</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Unified dashboard for monitoring platforms, LLMs, workflows, and knowledge across your entire AAE
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Button size="lg" asChild>
              <a href={getLoginUrl()}>
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container py-16">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <Database className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Platform Integrations</CardTitle>
              <CardDescription>
                Monitor connections to Notion, Google Drive, GitHub, Slack, and more
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <TrendingUp className="h-10 w-10 text-primary mb-2" />
              <CardTitle>LLM Performance</CardTitle>
              <CardDescription>
                Track usage, costs, and response times across all your AI models
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <Workflow className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Workflow Hub</CardTitle>
              <CardDescription>
                Manage n8n, Zapier, and MCP workflows from a single interface
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <Zap className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Knowledge Lake</CardTitle>
              <CardDescription>
                Search and access your unified knowledge base across all sources
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-16">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
            <h2 className="text-3xl font-bold text-center">
              Ready to take control of your AAE?
            </h2>
            <p className="text-muted-foreground text-center max-w-md">
              Sign in to access your personalized dashboard and start monitoring your AI automation ecosystem.
            </p>
            <Button size="lg" asChild>
              <a href={getLoginUrl()}>
                Sign In Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 mt-16">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© 2025 {APP_TITLE}. Powered by Manus AI.</p>
        </div>
      </footer>
    </div>
  );
}
