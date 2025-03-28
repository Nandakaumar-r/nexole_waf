import React from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardSummary } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, RefreshCw, Shield } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function StatusOverview() {
  const { data, isLoading, error } = useQuery<DashboardSummary>({
    queryKey: ["/api/dashboard/summary"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {[...Array(3)].map((_, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex flex-col space-y-3">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-4 w-5/6" />
                {index > 0 && <Skeleton className="h-2 w-full mt-2" />}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="border-l-4 border-error">
          <CardContent className="p-4">
            <p className="text-error">Error loading status overview</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalRequests = data?.totalRequests || 0;
  const blockedRequests = data?.blockedRequests || 0;
  const allowedRequests = data?.allowedRequests || 0;
  const allowedPercentage = totalRequests > 0 ? Math.round((allowedRequests / totalRequests) * 100) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <Card className="border-l-4 border-success">
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-neutral-medium text-sm">Traffic Status</p>
              <h3 className="text-2xl font-semibold text-success mt-1">Protected</h3>
            </div>
            <div className="text-success text-2xl">
              <CheckCircle className="h-6 w-6" />
            </div>
          </div>
          <p className="text-sm text-neutral-medium mt-2">
            WAF is actively monitoring traffic
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-neutral-medium text-sm">Total Requests (24h)</p>
              <h3 className="text-2xl font-semibold mt-1">{totalRequests.toLocaleString()}</h3>
            </div>
            <div className="text-primary text-2xl">
              <RefreshCw className="h-6 w-6" />
            </div>
          </div>
          <div className="flex items-center mt-2">
            <span className="inline-block h-2 w-full bg-neutral-light rounded-full overflow-hidden">
              <span
                className="h-full bg-primary block rounded-full"
                style={{ width: `${allowedPercentage}%` }}
              ></span>
            </span>
          </div>
          <div className="flex justify-between text-xs text-neutral-medium mt-1">
            <span>{allowedRequests.toLocaleString()} allowed</span>
            <span>{blockedRequests.toLocaleString()} blocked</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-neutral-medium text-sm">Threats Blocked</p>
              <h3 className="text-2xl font-semibold mt-1">{blockedRequests.toLocaleString()}</h3>
            </div>
            <div className="text-error text-2xl">
              <Shield className="h-6 w-6" />
            </div>
          </div>
          <div className="flex justify-between text-xs text-neutral-medium mt-3">
            {data?.attackTypeDistribution.slice(0, 3).map((attack, index) => (
              <div key={index} className="flex flex-col items-center">
                <span>{attack.count.toLocaleString()}</span>
                <span>{attack.attackType}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
