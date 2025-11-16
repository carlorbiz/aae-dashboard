import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import PlatformIntegrations from "./pages/PlatformIntegrations";
import LLMMetrics from "./pages/LLMMetrics";
import Workflows from "./pages/Workflows";
import KnowledgeLake from "./pages/KnowledgeLake";
import AIChat from "./pages/AIChat";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/platforms"} component={PlatformIntegrations} />
      <Route path={"/llm-metrics"} component={LLMMetrics} />
      <Route path={"/workflows"} component={Workflows} />
      <Route path={"/knowledge"} component={KnowledgeLake} />
      <Route path={"/chat"} component={AIChat} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
