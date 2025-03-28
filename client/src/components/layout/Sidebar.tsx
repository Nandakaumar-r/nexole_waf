import React from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { 
  LayoutDashboard, 
  RefreshCw, 
  Filter, 
  BarChart, 
  Settings, 
  Shield, 
  User,
  Globe,
  GlobeIcon,
  Brain,
  AlertCircle,
  LineChart,
  LogOut
} from "lucide-react";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const [location] = useLocation();
  const { logoutMutation, user } = useAuth();
  
  const navItems = [
    { href: "/dashboard", icon: <LayoutDashboard className="w-5 h-5" />, label: "Dashboard" },
    { href: "/requests", icon: <RefreshCw className="w-5 h-5" />, label: "Requests" },
    { href: "/rules", icon: <Filter className="w-5 h-5" />, label: "Rules" },
    { href: "/domains", icon: <Globe className="w-5 h-5" />, label: "Domains" },
    { href: "/geo-blocks", icon: <GlobeIcon className="w-5 h-5" />, label: "Geo Blocking" },
    { href: "/anomaly-detection", icon: <LineChart className="w-5 h-5" />, label: "Anomaly Detection" },
    { href: "/ml-insights", icon: <Brain className="w-5 h-5" />, label: "ML Insights" },
    { href: "/threat-intelligence", icon: <AlertCircle className="w-5 h-5" />, label: "Threat Intelligence" },
    { href: "/threat-map", icon: <Globe className="w-5 h-5" />, label: "Threat Map" },
    { href: "/reports", icon: <BarChart className="w-5 h-5" />, label: "Reports" },
    { href: "/settings", icon: <Settings className="w-5 h-5" />, label: "Settings" }
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-white shadow-md z-10 transition-all duration-300 transform hidden md:block">
        <div className="flex items-center justify-between px-4 py-5 border-b border-neutral-light">
          <div className="flex items-center">
            <div className="bg-primary rounded p-1 mr-2">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-xl font-semibold">Nexole WAF</h1>
          </div>
        </div>

        <nav className="py-4">
          <ul>
            {navItems.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>
                  <div
                    className={cn(
                      "flex items-center px-6 py-3 text-neutral-medium hover:text-primary hover:bg-blue-50 cursor-pointer",
                      location === item.href || 
                      (location === "/" && item.href === "/dashboard") &&
                        "text-primary bg-blue-50 border-l-4 border-primary"
                    )}
                  >
                    {item.icon}
                    <span className="ml-2">{item.label}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="absolute bottom-0 w-full border-t border-neutral-light p-4">
          <div className="flex flex-col space-y-3">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
                <User className="h-4 w-4" />
              </div>
              <div className="ml-2">
                <p className="text-sm font-medium">{user?.fullName || "Admin User"}</p>
                <p className="text-xs text-neutral-medium">{user?.email || "admin@nexole.com"}</p>
              </div>
            </div>
            <button 
              onClick={() => logoutMutation.mutate()}
              className="w-full flex items-center justify-center p-2 text-sm text-red-500 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar (overlay) */}
      {open && (
        <aside className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={onClose} />
          
          <div className="absolute inset-y-0 left-0 w-64 bg-white shadow-md transition-transform transform">
            <div className="flex items-center justify-between px-4 py-5 border-b border-neutral-light">
              <div className="flex items-center">
                <div className="bg-primary rounded p-1 mr-2">
                  <Shield className="h-4 w-4 text-white" />
                </div>
                <h1 className="text-xl font-semibold">Nexole WAF</h1>
              </div>
              <button
                className="text-neutral-medium hover:text-neutral-dark"
                onClick={onClose}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <nav className="py-4">
              <ul>
                {navItems.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href}>
                      <div
                        className={cn(
                          "flex items-center px-6 py-3 text-neutral-medium hover:text-primary hover:bg-blue-50 cursor-pointer",
                          (location === item.href || 
                          (location === "/" && item.href === "/dashboard")) &&
                            "text-primary bg-blue-50 border-l-4 border-primary"
                        )}
                        onClick={onClose}
                      >
                        {item.icon}
                        <span className="ml-2">{item.label}</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="absolute bottom-0 w-full border-t border-neutral-light p-4">
              <div className="flex flex-col space-y-3">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="ml-2">
                    <p className="text-sm font-medium">{user?.fullName || "Admin User"}</p>
                    <p className="text-xs text-neutral-medium">{user?.email || "admin@nexole.com"}</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    logoutMutation.mutate();
                    onClose();
                  }}
                  className="w-full flex items-center justify-center p-2 text-sm text-red-500 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </aside>
      )}
    </>
  );
}
