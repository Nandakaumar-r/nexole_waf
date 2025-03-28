import React from "react";
import ThreatMap from "@/components/threat-intelligence/ThreatMap";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ThreatData {
  countryCode: string;
  country: string;
  count: number;
  lat?: number;
  lon?: number;
  threatType?: string;
}

interface ThreatResponse {
  totalFeeds: number;
  globalFeeds: number;
  domainSpecificFeeds: number;
  totalEntries: number;
  activeTypes: { type: string, count: number }[];
  threatsByCountry: ThreatData[];
  threatsByType: { type: string, count: number }[];
  targetedDomains: { domain: string, domainId: number, count: number }[];
  topThreatCountries: ThreatData[];
  timePeriod: string;
}

export default function ThreatMapPage() {
  const [timePeriod, setTimePeriod] = React.useState("24h");
  
  const { data: threatSummary, isLoading: loadingSummary } = useQuery<ThreatResponse>({
    queryKey: ['/api/threat-intelligence/summary', timePeriod],
    staleTime: 60000, // 1 minute
  });

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Threat Map</h1>
          <p className="text-neutral-medium">
            Global visualization of cyber threats and attack origins
          </p>
        </div>
        <Select 
          value={timePeriod} 
          onValueChange={setTimePeriod}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Time period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24 Hours</SelectItem>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <ThreatMap 
          title="Global Threat Map" 
          description="Geographic distribution of threats and attacks" 
        />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Threat Countries</CardTitle>
              <CardDescription>
                Countries with the highest attack counts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSummary ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : threatSummary?.topThreatCountries && threatSummary.topThreatCountries.length > 0 ? (
                <div className="space-y-4">
                  {threatSummary.topThreatCountries.slice(0, 5).map((country: ThreatData, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="font-medium">{country.country}</span>
                        <span className="ml-2 text-xs text-neutral-medium">({country.countryCode})</span>
                      </div>
                      <div className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">
                        {country.count} threats
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-neutral-medium">
                  <p>No threat data available</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Threat Types</CardTitle>
              <CardDescription>
                Distribution by attack category
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSummary ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : threatSummary?.threatsByType && threatSummary.threatsByType.length > 0 ? (
                <div className="space-y-4">
                  {threatSummary.threatsByType.map((type: { type: string, count: number }, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="font-medium">{type.type}</span>
                      <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                        {type.count} incidents
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-neutral-medium">
                  <p>No threat type data available</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Target Analysis</CardTitle>
              <CardDescription>
                Most targeted domains and assets
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSummary ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : threatSummary?.targetedDomains && threatSummary.targetedDomains.length > 0 ? (
                <div className="space-y-4">
                  {threatSummary.targetedDomains.map((domain: { domain: string, domainId: number, count: number }, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="font-medium">{domain.domain}</span>
                      <div className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-medium">
                        {domain.count} attacks
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-neutral-medium">
                  <p>No target data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}