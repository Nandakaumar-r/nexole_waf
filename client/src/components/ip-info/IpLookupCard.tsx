import { useState } from 'react';
import { Search, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { isValidIpAddress } from '@/lib/utils';
import { IpGeolocationInfo } from './IpGeolocationInfo';

export function IpLookupCard() {
  const [ipAddress, setIpAddress] = useState('');
  const [searchedIp, setSearchedIp] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleIpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ipAddress) {
      setError('Please enter an IP address');
      return;
    }
    
    if (!isValidIpAddress(ipAddress)) {
      setError('Please enter a valid IP address (e.g., 8.8.8.8)');
      return;
    }
    
    setError(null);
    setSearchedIp(ipAddress);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">IP Geolocation Lookup</CardTitle>
        <CardDescription>
          Look up detailed information about any IP address
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleIpSubmit} className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Enter IP address (e.g., 8.8.8.8)"
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
                className={error ? 'border-red-500' : ''}
              />
              {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
            </div>
            <Button type="submit" className="shrink-0">
              <Search className="h-4 w-4 mr-2" />
              Lookup
            </Button>
          </div>
        </form>

        {searchedIp && (
          <div className="mt-6">
            <IpGeolocationInfo ipAddress={searchedIp} />
          </div>
        )}

        <div className="mt-8">
          <h3 className="text-sm font-medium mb-3">Why use IP Geolocation?</h3>
          <ul className="space-y-2">
            <li className="flex">
              <ChevronRight className="h-5 w-5 mr-1 shrink-0 text-primary" />
              <span className="text-sm">Identify suspicious login attempts from unusual locations</span>
            </li>
            <li className="flex">
              <ChevronRight className="h-5 w-5 mr-1 shrink-0 text-primary" />
              <span className="text-sm">Detect traffic from known proxy or VPN services</span>
            </li>
            <li className="flex">
              <ChevronRight className="h-5 w-5 mr-1 shrink-0 text-primary" />
              <span className="text-sm">Analyze attack patterns based on geographical origin</span>
            </li>
            <li className="flex">
              <ChevronRight className="h-5 w-5 mr-1 shrink-0 text-primary" />
              <span className="text-sm">Create geographically targeted security rules</span>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}