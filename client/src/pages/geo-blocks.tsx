import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { InsertGeoBlock, insertGeoBlockSchema } from '@shared/schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';

import WorldMap from '@/components/geo-blocking/WorldMap';
import { CountrySelector } from '@/components/geo-blocking/CountrySelector';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Info, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Extended schema for form validation
const geoBlockFormSchema = insertGeoBlockSchema.extend({
  action: z.enum(['allow', 'block']),
});

type GeoBlockFormValues = z.infer<typeof geoBlockFormSchema>;

export default function GeoBlocksPage() {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState('map');
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [domainId, setDomainId] = useState<number | null>(null);

  // Get geo blocks
  const { data: geoBlocks, isLoading: isLoadingGeoBlocks } = useQuery({
    queryKey: ['/api/geo-blocks'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Get domains for the domain selector
  const { data: domains, isLoading: isLoadingDomains } = useQuery({
    queryKey: ['/api/domains'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Create geo block mutation
  const createGeoBlock = useMutation({
    mutationFn: async (geoBlock: InsertGeoBlock) => {
      const response = await fetch('/api/geo-blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(geoBlock),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create geo block');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/geo-blocks'] });
      toast({
        title: 'Success',
        description: 'Geo block rule created successfully',
      });
      setSelectedCountries([]);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete geo block mutation
  const deleteGeoBlock = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/geo-blocks/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete geo block');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/geo-blocks'] });
      toast({
        title: 'Success',
        description: 'Geo block rule deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Form setup
  const form = useForm<GeoBlockFormValues>({
    resolver: zodResolver(geoBlockFormSchema),
    defaultValues: {
      countryCode: '',
      countryName: '',
      domainId: undefined,
      enabled: true,
      action: 'block',
    },
  });

  const handleCountrySelect = (country: { code: string; name: string }) => {
    if (!selectedCountries.includes(country.code)) {
      setSelectedCountries([...selectedCountries, country.code]);
    }
  };

  const handleCountryClick = (countryCode: string) => {
    if (selectedCountries.includes(countryCode)) {
      setSelectedCountries(selectedCountries.filter(code => code !== countryCode));
    } else {
      setSelectedCountries([...selectedCountries, countryCode]);
    }
  };

  const handleSubmit = (values: GeoBlockFormValues) => {
    if (selectedCountries.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one country',
        variant: 'destructive',
      });
      return;
    }

    // Create a geo block for each selected country
    selectedCountries.forEach(countryCode => {
      const country = (countries || []).find(c => c.code === countryCode);
      if (country) {
        createGeoBlock.mutate({
          countryCode,
          countryName: country.name,
          domainId: values.domainId,
          enabled: values.enabled,
          action: values.action as 'allow' | 'block',
        });
      }
    });
  };

  // Filtered list of blocked countries for the map
  const blockedCountryCodes = (geoBlocks || [])
    .filter(block => block.action === 'block' && block.enabled)
    .map(block => block.countryCode);

  // Only use the countries from our CountrySelector component
  // This is needed because not all country codes might be represented in the map data
  const countries = [
    { code: "AF", name: "Afghanistan" },
    { code: "AL", name: "Albania" },
    { code: "DZ", name: "Algeria" },
    { code: "AR", name: "Argentina" },
    { code: "AU", name: "Australia" },
    { code: "AT", name: "Austria" },
    { code: "BE", name: "Belgium" },
    { code: "BR", name: "Brazil" },
    { code: "CA", name: "Canada" },
    { code: "CN", name: "China" },
    { code: "CO", name: "Colombia" },
    { code: "EG", name: "Egypt" },
    { code: "FR", name: "France" },
    { code: "DE", name: "Germany" },
    { code: "IN", name: "India" },
    { code: "ID", name: "Indonesia" },
    { code: "IR", name: "Iran" },
    { code: "IQ", name: "Iraq" },
    { code: "IT", name: "Italy" },
    { code: "JP", name: "Japan" },
    { code: "KP", name: "North Korea" },
    { code: "KR", name: "South Korea" },
    { code: "MX", name: "Mexico" },
    { code: "NL", name: "Netherlands" },
    { code: "PK", name: "Pakistan" },
    { code: "RU", name: "Russia" },
    { code: "SA", name: "Saudi Arabia" },
    { code: "ZA", name: "South Africa" },
    { code: "ES", name: "Spain" },
    { code: "SE", name: "Sweden" },
    { code: "CH", name: "Switzerland" },
    { code: "TR", name: "Turkey" },
    { code: "UA", name: "Ukraine" },
    { code: "AE", name: "United Arab Emirates" },
    { code: "GB", name: "United Kingdom" },
    { code: "US", name: "United States" },
  ];

  if (isLoadingGeoBlocks || isLoadingDomains) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold">Geo Blocking</h1>
        <p className="text-gray-500">Block or allow traffic based on geographic location</p>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid grid-cols-2 w-[300px]">
          <TabsTrigger value="map">World Map</TabsTrigger>
          <TabsTrigger value="list">Block List</TabsTrigger>
        </TabsList>
        
        <TabsContent value="map" className="space-y-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Interactive Map</AlertTitle>
            <AlertDescription>
              Click on countries to select them for blocking. Red countries are currently blocked.
            </AlertDescription>
          </Alert>
          
          <WorldMap 
            blockedCountries={blockedCountryCodes} 
            onCountryClick={handleCountryClick} 
          />
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Selected Countries</CardTitle>
                <CardDescription>
                  Add or remove countries to apply geo-blocking rules
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CountrySelector
                  onSelect={handleCountrySelect}
                  selectedCountries={selectedCountries}
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Configure Blocking Rules</CardTitle>
                <CardDescription>
                  Set blocking options for the selected countries
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="domainId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Domain</FormLabel>
                          <Select 
                            onValueChange={value => {
                              field.onChange(Number(value));
                              setDomainId(Number(value));
                            }}
                            defaultValue={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select domain" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="0">All Domains</SelectItem>
                              {domains?.map(domain => (
                                <SelectItem key={domain.id} value={domain.id.toString()}>
                                  {domain.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="action"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Action</FormLabel>
                          <Select 
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select action" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="block">Block</SelectItem>
                              <SelectItem value="allow">Allow</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="enabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>Enabled</FormLabel>
                            <FormDescription>
                              Turn the rule on or off
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <Alert variant="warning" className="mt-4">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Warning</AlertTitle>
                      <AlertDescription>
                        {selectedCountries.length === 0 
                          ? "Please select at least one country from the map or dropdown." 
                          : `You are about to ${form.getValues('action')} traffic from ${selectedCountries.length} ${selectedCountries.length === 1 ? 'country' : 'countries'}.`}
                      </AlertDescription>
                    </Alert>
                    
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={selectedCountries.length === 0 || createGeoBlock.isPending}
                    >
                      {createGeoBlock.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Apply Geo Rules
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="list" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Geo-Blocking Rules</CardTitle>
              <CardDescription>
                Manage your existing geographical access rules
              </CardDescription>
            </CardHeader>
            <CardContent>
              {geoBlocks?.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-gray-500">No geo-blocking rules configured</p>
                  <Button 
                    variant="link" 
                    onClick={() => setSelectedTab('map')}
                    className="mt-2"
                  >
                    Add your first rule
                  </Button>
                </div>
              ) : (
                <div className="border rounded-md overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Domain</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {geoBlocks?.map((geoBlock) => {
                        const domain = domains?.find(d => d.id === geoBlock.domainId);
                        return (
                          <tr key={geoBlock.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <span className="text-sm font-medium text-gray-900">
                                  {geoBlock.countryName} ({geoBlock.countryCode})
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {domain?.name || 'All Domains'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                geoBlock.action === 'block' 
                                  ? 'bg-red-100 text-red-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {geoBlock.action.toUpperCase()}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                geoBlock.enabled 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {geoBlock.enabled ? 'ACTIVE' : 'INACTIVE'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => deleteGeoBlock.mutate(geoBlock.id)}
                                disabled={deleteGeoBlock.isPending}
                              >
                                {deleteGeoBlock.isPending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                                Delete
                              </Button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}