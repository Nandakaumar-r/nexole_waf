import { useQuery } from "@tanstack/react-query";
import { DistributionChart, DistributionDataPoint } from "@/components/ui/chart-proxy";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function AttackDistribution() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/stats'],
    staleTime: 1000 * 60, // 1 minute
  });
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex justify-between items-center pb-2">
          <CardTitle className="text-md font-semibold">Attack Distribution</CardTitle>
          <Skeleton className="w-20 h-4" />
        </CardHeader>
        <CardContent className="p-6">
          <Skeleton className="w-full h-[280px]" />
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card>
        <CardHeader className="flex justify-between items-center pb-2">
          <CardTitle className="text-md font-semibold">Attack Distribution</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-red-500">Failed to load attack distribution data</div>
        </CardContent>
      </Card>
    );
  }
  
  // Format data for the distribution chart
  const distribution: DistributionDataPoint[] = [];
  
  if (data?.requests.distribution) {
    const dist = data.requests.distribution;
    
    // Add all non-zero distributions
    if (dist.sqlInjection > 0) {
      distribution.push({ name: "SQL Injection", value: parseFloat(dist.sqlInjection.toFixed(1)) });
    }
    
    if (dist.xss > 0) {
      distribution.push({ name: "XSS Attacks", value: parseFloat(dist.xss.toFixed(1)) });
    }
    
    if (dist.pathTraversal > 0) {
      distribution.push({ name: "Path Traversal", value: parseFloat(dist.pathTraversal.toFixed(1)) });
    }
    
    if (dist.csrf > 0) {
      distribution.push({ name: "CSRF Attempts", value: parseFloat(dist.csrf.toFixed(1)) });
    }
    
    if (dist.other > 0) {
      distribution.push({ name: "Others", value: parseFloat(dist.other.toFixed(1)) });
    }
    
    // If no data, add a placeholder
    if (distribution.length === 0) {
      distribution.push({ name: "No Attacks", value: 100 });
    }
  }
  
  return (
    <Card>
      <CardHeader className="flex justify-between items-center pb-2">
        <CardTitle className="text-md font-semibold">Attack Distribution</CardTitle>
        <button className="text-xs text-primary hover:text-primary-dark">View Details</button>
      </CardHeader>
      <CardContent className="p-6">
        {distribution.length > 0 ? (
          <>
            <DistributionChart data={distribution} />
            <div className="space-y-4 mt-4">
              {distribution.map((item, index) => (
                <div key={index}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">{item.name}</span>
                    <span className="text-sm font-medium">{item.value}%</span>
                  </div>
                  <div className="w-full bg-slate-lighter rounded-full h-2">
                    <div 
                      className={`rounded-full h-2 ${
                        index === 0 ? "bg-primary" :
                        index === 1 ? "bg-accent" :
                        index === 2 ? "bg-secondary" :
                        index === 3 ? "bg-warning" :
                        "bg-slate-light"
                      }`}
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-slate-light">
            No attack data available
          </div>
        )}
      </CardContent>
    </Card>
  );
}
