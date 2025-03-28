import React, { memo, useEffect, useState } from 'react';
import { 
  ComposableMap, 
  Geographies, 
  Geography, 
  ZoomableGroup,
  Marker
} from 'react-simple-maps';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, ShieldAlert, AlertCircle, Globe } from 'lucide-react';
import { ResponsiveContainer } from 'recharts';

// World map topography data
const geoUrl = "https://raw.githubusercontent.com/deldersveld/topojson/master/world-countries.json";

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

interface ThreatMapProps {
  title?: string;
  description?: string;
}

const ThreatMap = ({ title = "Global Threat Map", description = "Visualize cyber threats from around the world" }: ThreatMapProps) => {
  const [threatData, setThreatData] = useState<ThreatData[]>([]);
  const [viewMode, setViewMode] = useState<'heat' | 'markers'>('heat');

  // Fetch threat data
  const { data, isLoading, error } = useQuery<ThreatResponse>({
    queryKey: ['/api/threat-intelligence/summary'],
    staleTime: 60000, // 1 minute
  });

  useEffect(() => {
    if (data && data.threatsByCountry) {
      setThreatData(data.threatsByCountry);
    }
  }, [data]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="h-96 w-full">
            <Skeleton className="h-full w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <p className="text-lg font-medium text-red-700">Failed to load threat data</p>
            <p className="text-sm text-neutral-medium mt-2">
              Please try again later or check your connection
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'heat' | 'markers')}>
            <TabsList className="grid w-[200px] grid-cols-2">
              <TabsTrigger value="heat">
                <Globe className="h-4 w-4 mr-2" />
                Heat Map
              </TabsTrigger>
              <TabsTrigger value="markers">
                <ShieldAlert className="h-4 w-4 mr-2" />
                Threat Points
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <div className="w-full h-[450px] rounded-md overflow-hidden border border-neutral-100">
          <ResponsiveContainer width="100%" height="100%">
            <ComposableMap
              projection="geoMercator"
              projectionConfig={{
                scale: 150,
              }}
            >
              <ZoomableGroup center={[0, 15]} zoom={1}>
                <Geographies geography={geoUrl}>
                  {({ geographies }) =>
                    geographies.map(geo => {
                      const countryCode = geo.properties.iso_a2;
                      const country = threatData.find(d => d.countryCode === countryCode);
                      const intensity = country ? Math.min((country.count / 10), 100) : 0;
                      
                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          style={{
                            default: {
                              fill: viewMode === 'heat' 
                                ? (intensity > 0 ? getColorScale(intensity) : "#EEF2F6") 
                                : "#EEF2F6",
                              outline: 'none',
                              stroke: '#FFFFFF',
                              strokeWidth: 0.5,
                            },
                            hover: {
                              fill: viewMode === 'heat' 
                                ? (intensity > 0 ? getColorScale(intensity + 10) : "#D6D6DA")
                                : "#D6D6DA",
                              outline: 'none',
                              stroke: '#FFFFFF',
                              strokeWidth: 0.5,
                              cursor: 'pointer'
                            },
                            pressed: {
                              fill: "#CBD5E1",
                              outline: 'none',
                              stroke: '#FFFFFF',
                              strokeWidth: 0.5,
                            },
                          }}
                        />
                      );
                    })
                  }
                </Geographies>
                
                {viewMode === 'markers' && threatData && threatData
                  .filter(threat => threat.lat && threat.lon)
                  .map((threat, index) => (
                    <Marker 
                      key={`threat-${index}`} 
                      coordinates={[threat.lon || 0, threat.lat || 0]}
                    >
                      <circle 
                        r={Math.max(4, Math.min(threat.count / 5, 12))} 
                        fill="#DC2626" 
                        fillOpacity={0.8} 
                        stroke="#FFFFFF"
                        strokeWidth={0.5}
                      />
                    </Marker>
                  ))
                }
              </ZoomableGroup>
            </ComposableMap>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 flex justify-center items-center">
          <div className="flex items-center">
            <span className="text-xs text-neutral-medium mr-2">Threat Level:</span>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-[#FDE68A] rounded-sm mr-1"></div>
              <span className="text-xs mr-3">Low</span>
              
              <div className="w-4 h-4 bg-[#FB923C] rounded-sm mr-1"></div>
              <span className="text-xs mr-3">Medium</span>
              
              <div className="w-4 h-4 bg-[#DC2626] rounded-sm mr-1"></div>
              <span className="text-xs">High</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Helper function to get color based on intensity
const getColorScale = (value: number): string => {
  if (value < 25) return "#FDE68A"; // Yellow for low threats
  if (value < 60) return "#FB923C"; // Orange for medium threats
  return "#DC2626"; // Red for high threats
};

export default memo(ThreatMap);