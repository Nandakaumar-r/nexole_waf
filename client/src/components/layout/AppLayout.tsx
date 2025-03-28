import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useLocation } from "wouter";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();
  
  // Extract page title from location
  const getPageTitle = () => {
    const path = location.split("/")[1];
    
    switch(path) {
      case "":
      case "dashboard":
        return "Dashboard";
      case "requests":
        return "Requests";
      case "rules":
        return "Rules";
      case "domains":
        return "Domains";
      case "geo-blocks":
        return "Geo Blocking";
      case "anomaly-detection":
        return "Anomaly Detection";
      case "ml-insights":
        return "ML Insights";
      case "threat-intelligence":
        return "Threat Intelligence";
      case "threat-map":
        return "Threat Map";
      case "reports":
        return "Reports";
      case "settings":
        return "Settings";
      default:
        return "Not Found";
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title={getPageTitle()} 
          onOpenSidebar={() => setSidebarOpen(true)} 
        />
        
        <main className="flex-1 overflow-y-auto p-6 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
