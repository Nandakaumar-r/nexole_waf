import { useQuery } from "@tanstack/react-query";
import { TrafficChart as Chart } from "@/components/ui/chart-proxy";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { Domain } from "@/lib/types";

type TimeRange = "24h" | "7d" | "30d";

export function TrafficChart() {
  const [timeRange, setTimeRange] = useState<TimeRange>("24h");
  const [selectedDomainId, setSelectedDomainId] = useState<string>("all");
  
  // Fetch all domains for the domain selector
  const { data: domains } = useQuery({
    queryKey: ['/api/domains'],
  });
  
  // Fetch traffic data with domain filtering and time range
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/traffic', selectedDomainId, timeRange],
    queryFn: async () => {
      let url = '/api/traffic?timeRange=' + timeRange;
      
      if (selectedDomainId !== "all") {
        url += `&domainId=${selectedDomainId}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch traffic data');
      }
      return response.json();
    },
    staleTime: 1000 * 60, // 1 minute
  });
  
  // Refetch when domain selection or time range changes
  useEffect(() => {
    refetch();
  }, [selectedDomainId, timeRange, refetch]);
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex justify-between items-center pb-2">
          <CardTitle className="text-md font-semibold">Traffic Overview</CardTitle>
          <Skeleton className="w-28 h-8" />
        </CardHeader>
        <CardContent className="p-6">
          <Skeleton className="w-full h-[280px]" />
        </CardContent>
      </Card>
    );
  }
  
  if (error || !data) {
    return (
      <Card>
        <CardHeader className="flex justify-between items-center pb-2">
          <CardTitle className="text-md font-semibold">Traffic Overview</CardTitle>
          <div className="flex space-x-2">
            <button 
              className={`px-3 py-1 text-xs rounded-md ${timeRange === "24h" ? "bg-primary text-white" : "text-slate bg-slate-lighter hover:bg-slate-light"}`}
              onClick={() => setTimeRange("24h")}
            >
              24h
            </button>
            <button 
              className={`px-3 py-1 text-xs rounded-md ${timeRange === "7d" ? "bg-primary text-white" : "text-slate bg-slate-lighter hover:bg-slate-light"}`}
              onClick={() => setTimeRange("7d")}
            >
              7d
            </button>
            <button 
              className={`px-3 py-1 text-xs rounded-md ${timeRange === "30d" ? "bg-primary text-white" : "text-slate bg-slate-lighter hover:bg-slate-light"}`}
              onClick={() => setTimeRange("30d")}
            >
              30d
            </button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-64 flex items-center justify-center text-slate-light">
            Failed to load traffic data
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Format the data correctly for display
  const chartData = data?.map((item: any) => {
    // For backend data, time will come in as a number (0-23 representing hours)
    let formattedTime = item.time;
    
    // If time is a number, format it as "hour:00"
    if (typeof item.time === 'number') {
      formattedTime = `${item.time}:00`;
    }
    
    return {
      ...item,
      time: formattedTime
    };
  });

  return (
    <Card>
      <CardHeader className="flex flex-col space-y-2 pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-md font-semibold">Traffic Overview</CardTitle>
          <div className="flex space-x-2">
            <button 
              className={`px-3 py-1 text-xs rounded-md ${timeRange === "24h" ? "bg-primary text-white" : "text-slate bg-slate-lighter hover:bg-slate-light"}`}
              onClick={() => setTimeRange("24h")}
            >
              24h
            </button>
            <button 
              className={`px-3 py-1 text-xs rounded-md ${timeRange === "7d" ? "bg-primary text-white" : "text-slate bg-slate-lighter hover:bg-slate-light"}`}
              onClick={() => setTimeRange("7d")}
            >
              7d
            </button>
            <button 
              className={`px-3 py-1 text-xs rounded-md ${timeRange === "30d" ? "bg-primary text-white" : "text-slate bg-slate-lighter hover:bg-slate-light"}`}
              onClick={() => setTimeRange("30d")}
            >
              30d
            </button>
          </div>
        </div>
        
        {/* Domain Selector */}
        <div className="w-full flex justify-end">
          <Select
            value={selectedDomainId}
            onValueChange={setSelectedDomainId}
          >
            <SelectTrigger className="w-[200px] h-8 text-xs">
              <SelectValue placeholder="Select Domain" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Domains</SelectItem>
              {domains && Array.isArray(domains) && domains.map((domain: Domain) => (
                <SelectItem key={domain.id} value={domain.id.toString()}>
                  {domain.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <Chart data={chartData} height={260} />
        
        <div className="flex justify-between mt-4 text-xs">
          <div className="flex items-center">
            <div className="flex items-center mr-4">
              <div className="w-3 h-3 rounded-full bg-primary mr-1"></div>
              <span>Blocked Requests</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-success mr-1"></div>
              <span>Allowed Requests</span>
            </div>
          </div>
          
          {/* Show total requests */}
          <div className="text-slate">
            Total: {chartData?.reduce((sum: number, item: any) => sum + (item.total || 0), 0) || 0} requests
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
