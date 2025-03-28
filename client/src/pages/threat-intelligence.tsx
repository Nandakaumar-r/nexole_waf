import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ThreatFeed } from "@shared/schema";
import { IpLookupCard } from "@/components/ip-info/IpLookupCard";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

import { 
  AlertCircle, 
  Globe, 
  PlusIcon, 
  RefreshCw, 
  Trash, 
  Link as LinkIcon,
  CheckCircle2, 
  XCircle,
  CloudOff,
  ShieldAlert,
  Key
} from "lucide-react";

// Form schema
const threatIntelFormSchema = z.object({
  name: z.string().min(1, "Feed name is required"),
  url: z.string().url("Invalid URL format").min(1, "Feed URL is required"),
  provider: z.string().min(1, "Provider name is required"),
  apiKey: z.string().min(1, "API key is required"),
  feedType: z.enum(["ip", "domain", "hash", "url", "other"]),
  updateInterval: z.enum(["15min", "hourly", "daily", "weekly"]),
  isEnabled: z.boolean().default(true),
  description: z.string().optional(),
});

type ThreatIntelFormValues = z.infer<typeof threatIntelFormSchema>;

// Define threat intelligence feed interface
interface ThreatIntelFeed extends ThreatFeed {
  status?: string;
  entriesToday?: number;
  totalEntries?: number;
}

export default function ThreatIntelligence() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedFeed, setSelectedFeed] = useState<ThreatIntelFeed | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<number | null>(null);

  // Query to fetch threat intelligence feeds
  const { data: feedData, isLoading } = useQuery({
    queryKey: ["/api/threat-feeds"],
    queryFn: async () => {
      const response = await fetch('/api/threat-feeds');
      if (!response.ok) {
        throw new Error('Failed to fetch threat feeds');
      }
      return response.json();
    }
  });
  
  // Process the feed data to match our expected format
  const feeds = {
    data: feedData ? feedData.map((feed: ThreatFeed) => ({
      ...feed,
      status: feed.isEnabled ? 'active' : 'inactive',
      feedType: feed.feedType.toLowerCase().includes('ip') ? 'ip' : 
                feed.feedType.toLowerCase().includes('domain') ? 'domain' : 'other',
      entriesToday: feed.entryCount || 0, // Use actual entry count
      totalEntries: feed.entryCount || 0
    })) : []
  };

  // Form for creating and editing feeds
  const form = useForm<ThreatIntelFormValues>({
    resolver: zodResolver(threatIntelFormSchema),
    defaultValues: {
      name: "",
      url: "",
      provider: "",
      apiKey: "",
      feedType: "ip",
      updateInterval: "daily",
      isEnabled: true,
      description: "",
    },
  });

  // Mutation to create a feed
  const createFeedMutation = useMutation({
    mutationFn: (newFeed: ThreatIntelFormValues) => 
      apiRequest("/api/threat-feeds", {
        method: "POST",
        body: JSON.stringify({
          ...newFeed,
          feedType: newFeed.feedType === "ip" ? "IP Blacklist" : 
                  newFeed.feedType === "domain" ? "Malware Domains" : 
                  "Unknown Feed Type",
          entryCount: 0
        })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/threat-feeds"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Feed Added",
        description: "Threat intelligence feed has been successfully added",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add feed. Please check your input and try again.",
        variant: "destructive",
      });
    },
  });

  // Mutation to delete a feed
  const deleteFeedMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest(`/api/threat-feeds/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/threat-feeds"] });
      setIsDeleteDialogOpen(false);
      setSelectedFeed(null);
      toast({
        title: "Feed Deleted",
        description: "Threat intelligence feed has been successfully removed",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete feed. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateFeed = (values: ThreatIntelFormValues) => {
    createFeedMutation.mutate(values);
  };

  const handleDeleteFeed = () => {
    if (selectedFeed) {
      deleteFeedMutation.mutate(selectedFeed.id);
    }
  };

  // Refresh feed mutation
  const refreshFeedMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest(`/api/threat-feeds/${id}/refresh`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/threat-feeds"] });
      setIsRefreshing(null);
      toast({
        title: "Feed Refreshed",
        description: "Threat intelligence data has been updated",
      });
    },
    onError: () => {
      setIsRefreshing(null);
      toast({
        title: "Error",
        description: "Failed to refresh feed. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleRefreshFeed = (id: number) => {
    setIsRefreshing(id);
    refreshFeedMutation.mutate(id);
  };

  const openDeleteDialog = (feed: ThreatIntelFeed) => {
    setSelectedFeed(feed);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Threat Intelligence</h1>
          <p className="text-neutral-medium">
            Integrate external threat intelligence feeds for enhanced protection
          </p>
        </div>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="flex items-center"
        >
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Feed
        </Button>
      </div>

      <Tabs defaultValue="feeds" className="space-y-4">
        <TabsList>
          <TabsTrigger value="feeds">
            <Globe className="w-4 h-4 mr-2" />
            Threat Feeds
          </TabsTrigger>
          <TabsTrigger value="insights">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Insights
          </TabsTrigger>
          <TabsTrigger value="indicators">
            <ShieldAlert className="w-4 h-4 mr-2" />
            Indicators
          </TabsTrigger>
        </TabsList>

        <TabsContent value="feeds">
          {isLoading ? (
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-1/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>
          ) : feeds?.data && feeds.data.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Configured Threat Intelligence Feeds</CardTitle>
                <CardDescription>
                  External data sources that provide information about potential threats
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Feed Name</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Update Interval</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feeds.data.map((feed: ThreatIntelFeed) => (
                      <TableRow key={feed.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            <div className="mr-2">
                              {feed.feedType === "ip" && <Globe className="h-4 w-4 text-blue-500" />}
                              {feed.feedType === "domain" && <LinkIcon className="h-4 w-4 text-green-500" />}
                              {feed.feedType === "hash" && <AlertCircle className="h-4 w-4 text-red-500" />}
                              {feed.feedType === "url" && <LinkIcon className="h-4 w-4 text-purple-500" />}
                            </div>
                            {feed.name}
                            {!feed.isEnabled && <Badge className="ml-2 bg-neutral-100 text-neutral-800">Disabled</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>{feed.provider}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {feed.feedType}
                          </Badge>
                        </TableCell>
                        <TableCell>{feed.updateInterval}</TableCell>
                        <TableCell>
                          {feed.status === "active" ? (
                            <Badge className="bg-green-100 text-green-800 border-green-300 flex w-min items-center">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          ) : feed.status === "error" ? (
                            <Badge className="bg-red-100 text-red-800 border-red-300 flex w-min items-center">
                              <XCircle className="h-3 w-3 mr-1" />
                              Error
                            </Badge>
                          ) : (
                            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 flex w-min items-center">
                              <CloudOff className="h-3 w-3 mr-1" />
                              Inactive
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {feed.lastUpdated ? new Date(feed.lastUpdated).toLocaleString() : "Never"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRefreshFeed(feed.id)}
                            disabled={isRefreshing === feed.id || !feed.isEnabled}
                            className="mr-1"
                          >
                            {isRefreshing === feed.id ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4" />
                            )}
                            <span className="sr-only">Refresh</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(feed)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="py-8 text-center">
                  <Globe className="mx-auto h-12 w-12 text-neutral-300" />
                  <h3 className="mt-4 text-lg font-semibold">No feeds configured</h3>
                  <p className="text-neutral-medium mt-2">
                    Add threat intelligence feeds to enhance security with real-time threat data
                  </p>
                  <Button
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="mt-4"
                  >
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Add Feed
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="insights">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Threat Summary</CardTitle>
                <CardDescription>
                  Overview of threat intelligence data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-neutral-medium">Total Indicators</div>
                    <div className="text-2xl font-bold">{feedData ? feedData.reduce((sum, feed) => sum + (feed.entryCount || 0), 0) : 0}</div>
                  </div>
                  <div>
                    <div className="text-sm text-neutral-medium">Active Feeds</div>
                    <div className="text-2xl font-bold">{feedData ? feedData.filter(feed => feed.isEnabled).length : 0}</div>
                  </div>
                  <div>
                    <div className="text-sm text-neutral-medium">Global Feeds</div>
                    <div className="text-2xl font-bold">{feedData ? feedData.filter(feed => feed.isGlobal).length : 0}</div>
                  </div>
                  <div>
                    <div className="text-sm text-neutral-medium">Domain-Specific Feeds</div>
                    <div className="text-2xl font-bold">{feedData ? feedData.filter(feed => !feed.isGlobal).length : 0}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Feed Health</CardTitle>
                <CardDescription>
                  Status of threat intelligence sources
                </CardDescription>
              </CardHeader>
              <CardContent>
                {feedData && feedData.length > 0 ? (
                  <div className="space-y-4">
                    {feedData.slice(0, 5).map(feed => (
                      <div key={feed.id}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-neutral-medium">{feed.name}</span>
                          <span className={`text-sm font-medium ${feed.isEnabled ? "text-green-600" : "text-yellow-600"}`}>
                            {feed.isEnabled ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <Progress value={feed.isEnabled ? 100 : 30} className="h-2 bg-gray-200" />
                      </div>
                    ))}
                    <div className="mt-4">
                      <Button variant="outline" className="w-full" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/threat-feeds"] })}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh All Feeds
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="py-4 text-center text-neutral-medium">
                    <p>No feed data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest threats detected
                </CardDescription>
              </CardHeader>
              <CardContent>
                {feedData && feedData.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-start p-2 bg-blue-50 border border-blue-100 rounded-md">
                      <Globe className="h-4 w-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-blue-800">Feed Updated</p>
                        <p className="text-xs text-blue-700">{feedData[0].name} - just now</p>
                      </div>
                    </div>
                    <div className="flex items-start p-2 bg-green-50 border border-green-100 rounded-md">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-green-800">Feed Entries Added</p>
                        <p className="text-xs text-green-700">{feedData[0].entryCount || 0} entries - 5 minutes ago</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-4 text-center text-neutral-medium">
                    <p>No recent activity</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>IP Lookup</CardTitle>
                <CardDescription>
                  Search for information about an IP address
                </CardDescription>
              </CardHeader>
              <CardContent>
                <IpLookupCard />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="indicators">
          <Card>
            <CardHeader>
              <CardTitle>Threat Indicators</CardTitle>
              <CardDescription>
                Search and browse indicators of compromise
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <div className="relative">
                  <Input 
                    placeholder="Search threat indicators (IP, domain, hash, URL)" 
                    className="pl-9"
                  />
                  <div className="absolute left-3 top-3 text-neutral-medium">
                    <SearchIcon className="h-4 w-4" />
                  </div>
                </div>
              </div>

              <div className="text-center py-10">
                <AlertCircle className="mx-auto h-12 w-12 text-neutral-300" />
                <h3 className="mt-4 text-lg font-semibold">No threat indicators found</h3>
                <p className="text-neutral-medium mt-2">
                  Try refreshing your threat feeds to populate threat indicators
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/threat-feeds"] })}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Feeds
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Feed Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Threat Intelligence Feed</DialogTitle>
            <DialogDescription>
              Connect to external threat intelligence sources to enhance your security
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateFeed)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Feed Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="AlienVault OTX" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="provider"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Provider</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="AlienVault" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="feedType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Feed Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select feed type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ip">IP Addresses</SelectItem>
                          <SelectItem value="domain">Domains</SelectItem>
                          <SelectItem value="hash">File Hashes</SelectItem>
                          <SelectItem value="url">URLs</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Feed URL</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://example.com/feed.txt" />
                    </FormControl>
                    <FormDescription>
                      URL to the threat feed data source
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="apiKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API Key</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input {...field} type="password" placeholder="••••••••••••••••" />
                        <Button
                          type="button" 
                          variant="ghost" 
                          size="sm"
                          className="absolute right-2 top-1"
                        >
                          <Key className="h-4 w-4" />
                        </Button>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Leave blank if no API key is required
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="updateInterval"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Update Interval</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Update frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="15min">Every 15 minutes</SelectItem>
                          <SelectItem value="hourly">Hourly</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        How often to refresh the feed
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-end space-x-3 space-y-0 pt-6">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel>Enable Feed</FormLabel>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Brief description of this threat intelligence feed"
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createFeedMutation.isPending}>
                  {createFeedMutation.isPending ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>Add Feed</>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Threat Intelligence Feed</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this feed? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteFeed}
              disabled={deleteFeedMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteFeedMutation.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>Delete</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// This is undefined above, we need to add it
const SearchIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);