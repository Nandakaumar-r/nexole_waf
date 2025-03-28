import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/ui/theme";
import { AppLayout } from "@/components/layout/AppLayout";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Requests from "@/pages/requests";
import Rules from "@/pages/rules";
import Domains from "@/pages/domains";
import AddDomainPage from "@/pages/new-domain-form";
import GeoBlocks from "@/pages/geo-blocks";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import MLInsights from "@/pages/ml-insights";
import ThreatIntelligence from "@/pages/threat-intelligence";
import ThreatMap from "@/pages/threat-map";
import AnomalyDetection from "@/pages/anomaly-detection";
import AuthPage from "@/pages/auth-page";
import { useEffect, useState } from "react";
import { initializeFirebase } from "./lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";

function AppRoutes() {
  return (
    <Switch>
      <Route path="/auth">
        <AuthPage />
      </Route>
      <ProtectedRoute path="/">
        <AppLayout>
          <Dashboard />
        </AppLayout>
      </ProtectedRoute>
      <ProtectedRoute path="/dashboard">
        <AppLayout>
          <Dashboard />
        </AppLayout>
      </ProtectedRoute>
      <ProtectedRoute path="/requests">
        <AppLayout>
          <Requests />
        </AppLayout>
      </ProtectedRoute>
      <ProtectedRoute path="/rules">
        <AppLayout>
          <Rules />
        </AppLayout>
      </ProtectedRoute>
      <ProtectedRoute path="/domains">
        <AppLayout>
          <Domains />
        </AppLayout>
      </ProtectedRoute>
      <ProtectedRoute path="/domains/add">
        <AppLayout>
          <AddDomainPage />
        </AppLayout>
      </ProtectedRoute>
      <ProtectedRoute path="/geo-blocks">
        <AppLayout>
          <GeoBlocks />
        </AppLayout>
      </ProtectedRoute>
      <ProtectedRoute path="/anomaly-detection">
        <AppLayout>
          <AnomalyDetection />
        </AppLayout>
      </ProtectedRoute>
      <ProtectedRoute path="/ml-insights">
        <AppLayout>
          <MLInsights />
        </AppLayout>
      </ProtectedRoute>
      <ProtectedRoute path="/threat-intelligence">
        <AppLayout>
          <ThreatIntelligence />
        </AppLayout>
      </ProtectedRoute>
      <ProtectedRoute path="/threat-map">
        <AppLayout>
          <ThreatMap />
        </AppLayout>
      </ProtectedRoute>
      <ProtectedRoute path="/reports">
        <AppLayout>
          <Reports />
        </AppLayout>
      </ProtectedRoute>
      <ProtectedRoute path="/settings">
        <AppLayout>
          <Settings />
        </AppLayout>
      </ProtectedRoute>
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

function App() {
  const [firebaseInitialized, setFirebaseInitialized] = useState(false);
  const [initializingFirebase, setInitializingFirebase] = useState(true);
  const { toast } = useToast();

  // Initialize Firebase when the app loads
  useEffect(() => {
    const initFirebase = async () => {
      try {
        setInitializingFirebase(true);
        const success = await initializeFirebase();
        setFirebaseInitialized(success);
        
        if (success) {
          toast({
            title: "Firebase connection established",
            description: "Real-time monitoring is now active",
            variant: "default",
          });
        } else {
          toast({
            title: "Firebase configuration needs attention",
            description: "Real-time features will be simulated until Firebase is properly configured",
            variant: "default",
          });
        }
      } catch (error) {
        console.error("Firebase initialization error:", error);
        toast({
          title: "Using simulated real-time data",
          description: "The application will use local data instead of Firebase for now",
          variant: "default",
        });
      } finally {
        setInitializingFirebase(false);
      }
    };

    initFirebase();
  }, [toast]);

  return (
    <ThemeProvider defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppRoutes />
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
