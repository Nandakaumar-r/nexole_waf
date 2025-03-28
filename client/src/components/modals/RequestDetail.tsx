import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

interface RequestDetailProps {
  requestId: number;
  isOpen: boolean;
  onClose: () => void;
}

export function RequestDetail({ requestId, isOpen, onClose }: RequestDetailProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/blocked-requests', requestId],
    queryFn: async () => {
      const response = await fetch(`/api/blocked-requests/${requestId}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch request details');
      }
      return response.json();
    },
    enabled: isOpen && requestId !== null
  });
  
  // Helper to render JSON prettily
  const renderJson = (obj: any) => {
    try {
      return JSON.stringify(obj, null, 2);
    } catch (e) {
      return String(obj);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Request Details</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="p-6 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(2)].map((_, index) => (
                <div key={index} className="mb-6">
                  <Skeleton className="h-5 w-40 mb-2" />
                  <Skeleton className="h-32 w-full rounded" />
                </div>
              ))}
            </div>
            <Skeleton className="h-5 w-40 mb-2" />
            <Skeleton className="h-32 w-full rounded mb-4" />
            <Skeleton className="h-5 w-40 mb-2" />
            <Skeleton className="h-32 w-full rounded" />
          </div>
        ) : error ? (
          <div className="p-6 text-red-500">
            Failed to load request details
          </div>
        ) : data ? (
          <div className="overflow-y-auto flex-grow p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="text-sm font-medium text-slate-light mb-2">Basic Information</h4>
                <div className="bg-slate-lighter/50 rounded-lg p-4">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="font-medium">IP Address:</div>
                    <div className="col-span-2 font-mono">{data.ipAddress}</div>
                    
                    <div className="font-medium">Time:</div>
                    <div className="col-span-2">
                      {format(new Date(data.timestamp), 'PPpp')}
                    </div>
                    
                    <div className="font-medium">Method:</div>
                    <div className="col-span-2">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        data.method === 'GET' ? 'bg-accent/10 text-accent' :
                        data.method === 'POST' ? 'bg-secondary/10 text-secondary' :
                        data.method === 'PUT' ? 'bg-warning/10 text-warning' :
                        data.method === 'DELETE' ? 'bg-error/10 text-error' :
                        'bg-slate-light/10 text-slate'
                      }`}>
                        {data.method}
                      </span>
                    </div>
                    
                    <div className="font-medium">Path:</div>
                    <div className="col-span-2 font-mono text-xs break-all">{data.path}</div>
                    
                    <div className="font-medium">Attack Type:</div>
                    <div className="col-span-2">
                      <span className="bg-error/10 text-error px-2 py-0.5 rounded text-xs">
                        {data.attackType}
                      </span>
                    </div>
                    
                    <div className="font-medium">Rule ID:</div>
                    <div className="col-span-2 font-mono">{data.ruleId}</div>
                    
                    <div className="font-medium">Action Taken:</div>
                    <div className="col-span-2">
                      <span className="bg-error/10 text-error px-2 py-0.5 rounded text-xs">
                        Blocked
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-slate-light mb-2">Attack Context</h4>
                <div className="bg-slate-lighter/50 rounded-lg p-4">
                  <div className="text-sm">
                    <div className="font-medium mb-2">Matched Pattern:</div>
                    <div className="font-mono text-xs bg-slate-lighter p-2 rounded mb-4 whitespace-pre-wrap">
                      {data.matchedPattern}
                    </div>
                    
                    <div className="font-medium mb-2">Threat Level:</div>
                    <div className="flex items-center">
                      <span className="text-error font-medium mr-2">High</span>
                      <div className="w-full max-w-[120px] bg-slate-lighter rounded-full h-2">
                        <div className="bg-error rounded-full h-2" style={{ width: "85%" }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <h4 className="text-sm font-medium text-slate-light mb-2">Request Headers</h4>
              <div className="bg-slate-lighter/50 rounded-lg p-4 font-mono text-xs whitespace-pre-wrap overflow-x-auto">
                {renderJson(data.headers)}
              </div>
            </div>
            
            {data.payload && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-slate-light mb-2">Request Payload</h4>
                <div className="bg-slate-lighter/50 rounded-lg p-4 font-mono text-xs whitespace-pre-wrap overflow-x-auto">
                  {renderJson(data.payload)}
                </div>
              </div>
            )}
          </div>
        ) : null}
        
        <DialogFooter className="px-6 py-4 border-t bg-slate-lighter/50">
          <Button variant="outline" className="mr-auto">
            Add to Whitelist
          </Button>
          <Button variant="outline" className="mr-2">
            Export Details
          </Button>
          <Button onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
