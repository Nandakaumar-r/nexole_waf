import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardSummary } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Download, Eye } from "lucide-react";
import { TimeRangeSelector, DateRange } from "@/components/reports/TimeRangeSelector";
import { format } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup
} from "react-simple-maps";

const worldGeoUrl = "https://raw.githubusercontent.com/deldersveld/topojson/master/world-countries.json";
const COLORS = ["#D13438", "#0078D4", "#107C10", "#FFB900", "#605E5C"];

export default function Reports() {
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: undefined,
    endDate: undefined
  });
  const [chartType, setChartType] = useState("traffic");

  // Construct query parameters based on date range
  const queryParams = React.useMemo(() => {
    const params: Record<string, string> = {};
    if (dateRange.startDate) {
      params.startDate = dateRange.startDate.toISOString();
    }
    if (dateRange.endDate) {
      params.endDate = dateRange.endDate.toISOString();
    }
    return params;
  }, [dateRange]);

  // Fetch data for reports with date range parameters
  const { data, isLoading, error } = useQuery<DashboardSummary>({
    queryKey: ["/api/dashboard/summary", queryParams],
    queryFn: async ({ queryKey }) => {
      // Extract params from query key
      const [endpoint, params] = queryKey as [string, Record<string, string>];
      
      // Build URL with query parameters
      const queryString = new URLSearchParams(params).toString();
      const url = queryString ? `${endpoint}?${queryString}` : endpoint;
      
      // Make the request
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    }
  });

  // Log when the data is refreshed with a new date range
  useEffect(() => {
    const { startDate, endDate } = dateRange;
    if (startDate && endDate) {
      console.log(`Date range set to: ${format(startDate, "yyyy-MM-dd")} to ${format(endDate, "yyyy-MM-dd")}`);
    }
  }, [dateRange]);

  // Process data for attack type distribution pie chart
  const attackTypeData = data?.attackTypeDistribution.map(item => ({
    name: item.attackType,
    value: item.count
  })) || [];

  // Process data for traffic overview bar chart
  const trafficData = data?.trafficByHour.map(hour => ({
    name: `${hour.hour.toString().padStart(2, '0')}:00`,
    allowed: hour.allowed,
    blocked: hour.blocked
  })) || [];

  // Process data for IP heat map
  const ipMapData = data?.requestsByCountry?.map((item) => ({
    country: item.country,
    requests: item.count,
    intensity: Math.min(4, Math.floor(item.count / 10))
  })) || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
            <CardTitle>Security Reports</CardTitle>
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0">
              {/* New TimeRangeSelector component */}
              <TimeRangeSelector onRangeChange={setDateRange} />
              
              <Button variant="outline" className="ml-2">
                <Download className="mr-2 h-4 w-4" />
                Export Report
              </Button>
            </div>
          </div>
          {/* Display selected date range for user reference */}
          {dateRange.startDate && dateRange.endDate && (
            <div className="text-sm text-muted-foreground mt-2">
              Showing data from {format(dateRange.startDate, "MMMM d, yyyy")} to {format(dateRange.endDate, "MMMM d, yyyy")}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="traffic" value={chartType} onValueChange={setChartType}>
            <TabsList className="mb-4">
              <TabsTrigger value="traffic">Traffic Overview</TabsTrigger>
              <TabsTrigger value="attacks">Attack Distribution</TabsTrigger>
              <TabsTrigger value="response">Response Time</TabsTrigger>
              <TabsTrigger value="ipmap">IP Heatmap</TabsTrigger> {/* Added IP Heatmap tab */}
            </TabsList>

            <TabsContent value="traffic" className="mt-0">
              <div className="h-96">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <p>Loading chart data...</p>
                  </div>
                ) : error ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-error">Error loading chart data</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={trafficData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar name="Allowed Requests" dataKey="allowed" stackId="a" fill="#0078D4" />
                      <Bar name="Blocked Requests" dataKey="blocked" stackId="a" fill="#D13438" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="mt-4">
                <h3 className="font-medium mb-2">Traffic Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-neutral-medium text-sm">Total Requests</div>
                      <div className="text-2xl font-semibold">
                        {data?.totalRequests.toLocaleString() || "0"}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-neutral-medium text-sm">Allowed Requests</div>
                      <div className="text-2xl font-semibold text-primary">
                        {data?.allowedRequests.toLocaleString() || "0"}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-neutral-medium text-sm">Blocked Requests</div>
                      <div className="text-2xl font-semibold text-error">
                        {data?.blockedRequests.toLocaleString() || "0"}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="attacks" className="mt-0">
              <div className="h-96">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <p>Loading chart data...</p>
                  </div>
                ) : error ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-error">Error loading chart data</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={attackTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {attackTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => value.toLocaleString()} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="mt-4">
                <h3 className="font-medium mb-2">Attack Type Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {data?.attackTypeDistribution.map((attack, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="text-neutral-medium text-sm">{attack.attackType}</div>
                        <div className="text-2xl font-semibold text-error">
                          {attack.count.toLocaleString()}
                        </div>
                        <div className="text-neutral-medium text-xs">
                          {data.blockedRequests > 0
                            ? `${((attack.count / data.blockedRequests) * 100).toFixed(1)}% of all attacks`
                            : "0% of all attacks"}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="response" className="mt-0">
              <div className="h-96">
                {isLoading ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data?.trafficByHour || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="responseTime" stroke="#8884d8" name="Response Time (ms)" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </TabsContent>

            <TabsContent value="ipmap" className="mt-0">
              <div className="h-96">
                {isLoading ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposableMap>
                      <ZoomableGroup>
                        <Geographies geography={worldGeoUrl}>
                          {({ geographies }) =>
                            geographies.map((geo) => {
                              const countryData = data?.requestsByCountry?.find(
                                (item) => item.countryCode === geo.properties.ISO_A2
                              );
                              return (
                                <Geography
                                  key={geo.rsmKey}
                                  geography={geo}
                                  fill={countryData ? `rgba(65, 105, 225, ${countryData.count / 100})` : "#F5F4F6"}
                                  stroke="#D6D6DA"
                                />
                              );
                            })
                          }
                        </Geographies>
                      </ZoomableGroup>
                    </ComposableMap>
                  </ResponsiveContainer>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}