import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

export function TopAttackers() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/attackers'],
    queryFn: async () => {
      const response = await fetch('/api/attackers?limit=4', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch attackers');
      }
      return response.json();
    }
  });
  
  const blockAttackerMutation = useMutation({
    mutationFn: async (ipAddress: string) => {
      return await apiRequest('POST', `/api/attackers/${ipAddress}/block`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/attackers'] });
      toast({
        title: "IP Blocked",
        description: "The IP address has been blocked successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to block IP address",
        variant: "destructive",
      });
      console.error("Error blocking IP:", error);
    }
  });
  
  const handleBlockIP = (ipAddress: string) => {
    blockAttackerMutation.mutate(ipAddress);
  };
  
  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="flex justify-between items-center">
          <CardTitle>Top Attacking IPs</CardTitle>
          <Skeleton className="w-28 h-5" />
        </CardHeader>
        <CardContent>
          {[...Array(4)].map((_, index) => (
            <div key={index} className="flex justify-between items-center mb-4 pb-4 border-b border-slate-lighter last:border-0 last:pb-0 last:mb-0">
              <div className="flex items-center">
                <Skeleton className="h-8 w-8 rounded-full mr-3" />
                <div>
                  <Skeleton className="h-5 w-28 mb-1" />
                  <Skeleton className="h-4 w-36" />
                </div>
              </div>
              <div className="flex items-center">
                <Skeleton className="h-6 w-8 mr-3" />
                <Skeleton className="h-8 w-16 rounded" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card>
        <CardHeader className="flex justify-between items-center">
          <CardTitle>Top Attacking IPs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-500 p-4">Failed to load attackers data</div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex justify-between items-center">
        <CardTitle>Top Attacking IPs</CardTitle>
        <button className="text-sm text-primary hover:text-primary-dark">Manage Blocklist</button>
      </CardHeader>
      <CardContent>
        {data && data.length > 0 ? (
          data.map((attacker) => (
            <div key={attacker.id} className="flex justify-between items-center mb-4 pb-4 border-b border-slate-lighter last:border-0 last:pb-0 last:mb-0">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-error/10 flex items-center justify-center text-error mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <div className="font-mono text-sm">{attacker.ipAddress}</div>
                  <div className="text-xs text-slate-light mt-1">
                    Last seen: {formatDistanceToNow(new Date(attacker.lastSeen), { addSuffix: true })}
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                <div className="text-xl font-semibold mr-3">{attacker.attackCount}</div>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => handleBlockIP(attacker.ipAddress)}
                  disabled={attacker.blocked || blockAttackerMutation.isPending}
                >
                  {attacker.blocked ? "Blocked" : "Block"}
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-4 text-slate-light">
            No attacker data available
          </div>
        )}
      </CardContent>
    </Card>
  );
}
