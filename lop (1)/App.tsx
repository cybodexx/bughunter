import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Scanner from "@/pages/scanner";
import History from "@/pages/history";
import Deploy from "@/pages/deploy";
import AttackGuide from "@/pages/attack-guide";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Scanner} />
      <Route path="/history" component={History} />
      <Route path="/deploy" component={Deploy} />
      <Route path="/attack-guide" component={AttackGuide} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
