import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardSummary, AttackTypeDistribution, TrafficHourData } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, TooltipProps } from "recharts";

type TimeRange = "Hourly" | "Daily" | "Weekly";

export function ThreatsDashboard() {
  const [timeRange, setTimeRange] = useState<TimeRange>("Hourly");
  
  const { data, isLoading, error } = useQuery<DashboardSummary>({
    queryKey: ["/api/dashboard/summary"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2">
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-4">
              <Skeleton className="h-5 w-40" />
              <div className="flex space-x-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-4">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-24" />
            </div>
            <div className="space-y-4">
              {[...Array(5)].map((_, index) => (
                <div key={index}>
                  <div className="flex justify-between mb-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                  <Skeleton className="h-2 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2">
          <CardContent className="p-4">
            <p className="text-error">Error loading threat dashboard</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Process data for the traffic chart
  const trafficData = data?.trafficByHour.map(hour => ({
    name: `${hour.hour.toString().padStart(2, '0')}:00`,
    allowed: hour.allowed,
    blocked: hour.blocked
  })) || [];

  // Process data for the threat types chart
  const threatTypesData = data?.attackTypeDistribution || [];
  const totalThreats = threatTypesData.reduce((sum, item) => sum + item.count, 0);
  
  // Calculate percentages
  const threatTypesWithPercentage = threatTypesData.map(item => ({
    ...item,
    percentage: totalThreats > 0 ? Math.round((item.count / totalThreats) * 100) : 0
  }));

  // Format time label based on selected range
  const formatTimeLabel = (hour: string) => {
    if (timeRange === "Hourly") return hour;
    if (timeRange === "Daily") return hour;
    return hour;
  };

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-neutral-light rounded shadow-sm text-xs">
          <p className="font-medium">{label}</p>
          <p className="text-primary">Allowed: {payload[0].value}</p>
          <p className="text-error">Blocked: {payload[1].value}</p>
          <p className="text-neutral-medium">Total: {(payload[0].value as number) + (payload[1].value as number)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      {/* Traffic Overview Chart */}
      <Card className="lg:col-span-2">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Traffic Overview</h3>
            <div className="flex space-x-2">
              <Button
                variant={timeRange === "Hourly" ? "default" : "ghost"}
                size="sm"
                className={timeRange === "Hourly" ? "bg-blue-50 text-primary hover:bg-blue-100" : "text-neutral-medium"}
                onClick={() => setTimeRange("Hourly")}
              >
                Hourly
              </Button>
              <Button
                variant={timeRange === "Daily" ? "default" : "ghost"}
                size="sm"
                className={timeRange === "Daily" ? "bg-blue-50 text-primary hover:bg-blue-100" : "text-neutral-medium"}
                onClick={() => setTimeRange("Daily")}
              >
                Daily
              </Button>
              <Button
                variant={timeRange === "Weekly" ? "default" : "ghost"}
                size="sm"
                className={timeRange === "Weekly" ? "bg-blue-50 text-primary hover:bg-blue-100" : "text-neutral-medium"}
                onClick={() => setTimeRange("Weekly")}
              >
                Weekly
              </Button>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={trafficData}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                barGap={0}
                barSize={20}
              >
                <XAxis dataKey="name" tickFormatter={formatTimeLabel} />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="allowed" name="Allowed" stackId="a" fill="hsl(var(--primary))" />
                <Bar dataKey="blocked" name="Blocked" stackId="a" fill="hsl(var(--destructive))" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-center mt-2 space-x-6">
            <div className="flex items-center">
              <span className="w-3 h-3 bg-primary rounded-sm inline-block mr-1"></span>
              <span className="text-xs text-neutral-medium">Allowed</span>
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 bg-error rounded-sm inline-block mr-1"></span>
              <span className="text-xs text-neutral-medium">Blocked</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Threat Types */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Threat Types</h3>
            <Button variant="link" className="text-primary text-sm p-0 h-auto">View Details</Button>
          </div>

          <div className="space-y-4">
            {threatTypesWithPercentage.map((threat, index) => (
              <div key={index}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">{threat.attackType}</span>
                  <span className="text-sm font-medium">{threat.percentage}%</span>
                </div>
                <div className="w-full bg-neutral-light rounded-full h-2">
                  <div
                    className="bg-error h-2 rounded-full"
                    style={{ width: `${threat.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}

            {threatTypesWithPercentage.length === 0 && (
              <p className="text-neutral-medium text-sm py-4 text-center">No threats detected</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
