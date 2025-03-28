import React from "react";
import { Bell, HelpCircle, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConnectionStatus } from "@/components/ui/connection-status";

interface HeaderProps {
  title: string;
  onOpenSidebar: () => void;
}

export function Header({ title, onOpenSidebar }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm z-10">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden mr-4 text-neutral-medium hover:text-neutral-dark"
            onClick={onOpenSidebar}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open menu</span>
          </Button>
          <h2 className="text-xl font-semibold">{title}</h2>
        </div>

        <div className="flex items-center space-x-4">
          {/* Firebase connection status indicator */}
          <ConnectionStatus className="mr-2" />
          
          <Button
            variant="ghost"
            size="icon"
            className="text-neutral-medium hover:text-neutral-dark relative"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 bg-error text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              3
            </span>
            <span className="sr-only">Notifications</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-neutral-medium hover:text-neutral-dark"
          >
            <HelpCircle className="h-5 w-5" />
            <span className="sr-only">Help</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
