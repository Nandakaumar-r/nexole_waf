import { useState, useEffect } from 'react';
import { Loader2, MapPin, Globe, Shield, Wifi, Server } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getIpGeolocation, IpGeolocationData, isValidIpAddress } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface IpGeolocationInfoProps {
  ipAddress: string;
  showDetailedView?: boolean;
}

export function IpGeolocationInfo({ ipAddress, showDetailedView = true }: IpGeolocationInfoProps) {
  const [geoData, setGeoData] = useState<IpGeolocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchGeoData = async () => {
      if (!ipAddress || !isValidIpAddress(ipAddress)) {
        setError('Invalid IP address');
        setGeoData(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await getIpGeolocation(ipAddress);
        setGeoData(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch geolocation data';
        setError(errorMessage);
        toast({
          variant: 'destructive',
          title: 'Error fetching IP data',
          description: errorMessage,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchGeoData();
  }, [ipAddress, toast]);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center items-center h-24">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Loading IP data...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="pt-6">
          <div className="text-sm text-red-500">{error}</div>
        </CardContent>
      </Card>
    );
  }

  if (!geoData) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm text-muted-foreground">No geolocation data available</div>
        </CardContent>
      </Card>
    );
  }

  // Simple version shows just basic location info
  if (!showDetailedView) {
    return (
      <div className="flex items-center text-sm">
        <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
        <span>
          {geoData.city}, {geoData.regionName}, {geoData.country}
        </span>
        {(geoData.proxy || geoData.hosting) && (
          <Badge variant="outline" className="ml-2 bg-amber-100 text-amber-800 border-amber-200">
            {geoData.proxy ? 'Proxy' : 'Hosting'}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">IP Information</CardTitle>
        <CardDescription>Geolocation data for {ipAddress}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2 flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              Location
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Country:</span>{' '}
                <span className="font-medium">{geoData.country}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Region:</span>{' '}
                <span className="font-medium">{geoData.regionName}</span>
              </div>
              <div>
                <span className="text-muted-foreground">City:</span>{' '}
                <span className="font-medium">{geoData.city}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Timezone:</span>{' '}
                <span className="font-medium">{geoData.timezone}</span>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-medium mb-2 flex items-center">
              <Globe className="h-4 w-4 mr-1" />
              Network
            </h3>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">ISP:</span>{' '}
                <span className="font-medium">{geoData.isp}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Organization:</span>{' '}
                <span className="font-medium">{geoData.org || 'Not available'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">AS:</span>{' '}
                <span className="font-medium">{geoData.as || 'Not available'}</span>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-medium mb-2 flex items-center">
              <Shield className="h-4 w-4 mr-1" />
              Security Flags
            </h3>
            <div className="flex flex-wrap gap-2">
              {geoData.proxy && (
                <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                  <Wifi className="h-3 w-3 mr-1" />
                  Proxy
                </Badge>
              )}
              {geoData.hosting && (
                <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
                  <Server className="h-3 w-3 mr-1" />
                  Hosting
                </Badge>
              )}
              {geoData.mobile && (
                <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                  Mobile
                </Badge>
              )}
              {!geoData.proxy && !geoData.hosting && !geoData.mobile && (
                <span className="text-sm text-muted-foreground">No security flags detected</span>
              )}
            </div>
          </div>

          <div className="text-xs text-muted-foreground mt-4">
            Data provided by ip-api.com
          </div>
        </div>
      </CardContent>
    </Card>
  );
}