import React, { useState, useEffect } from 'react';
import { getConnectionStatus } from '@/lib/firebase';
import { Badge } from "@/components/ui/badge";
import { WifiOff, Wifi } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type ConnectionStatusProps = {
  showText?: boolean;
  className?: string;
};

/**
 * Component to display the current Firebase connection status
 */
export function ConnectionStatus({ showText = true, className = "" }: ConnectionStatusProps) {
  const [connectionStatus, setConnectionStatus] = useState<string>('unknown');
  
  useEffect(() => {
    // Initialize with current status
    setConnectionStatus(getConnectionStatus());
    
    // Check status every second
    const intervalId = setInterval(() => {
      const status = getConnectionStatus();
      setConnectionStatus(status);
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  let badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline' = 'outline';
  let icon;
  let statusText = 'Unknown';
  
  switch (connectionStatus) {
    case 'connected':
      badgeVariant = 'default';
      icon = <Wifi className="h-4 w-4 mr-1 text-green-500" />;
      statusText = 'Connected';
      break;
    case 'disconnected':
      badgeVariant = 'destructive';
      icon = <WifiOff className="h-4 w-4 mr-1" />;
      statusText = 'Disconnected';
      break;
    default:
      badgeVariant = 'secondary';
      icon = <Wifi className="h-4 w-4 mr-1 text-yellow-500" />;
      statusText = 'Checking...';
  }
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={badgeVariant} className={`flex items-center ${className}`}>
            {icon}
            {showText && statusText}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>Firebase Realtime Database: {statusText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}