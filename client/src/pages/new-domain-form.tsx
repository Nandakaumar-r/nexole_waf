import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Domain } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { BlockedCountriesField } from "@/components/domains/BlockedCountriesField";
import { useLocation } from "wouter";
import { ArrowLeft, Globe, ShieldAlert, Brain, AlertCircle } from "lucide-react";

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Form schema for domain
const domainFormSchema = z.object({
  name: z.string().min(1, "Domain name is required"),
  url: z.string().url("Invalid URL format").min(1, "URL is required"),
  targetIp: z.string().ip().optional().or(z.literal("")),
  dnsProvider: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  isActive: z.boolean().default(true),
  // Security Settings
  enableGeoBlocking: z.boolean().default(false),
  blockedCountries: z.array(z.string()).optional(),
  applyRules: z.boolean().default(true),
  selectedRules: z.array(z.number()).optional(),
  enableBotProtection: z.boolean().default(false),
  enableSslVerification: z.boolean().default(false),
  // Threat Intelligence Settings
  enableThreatIntel: z.boolean().default(false),
  selectedThreatFeeds: z.array(z.string()).optional(),
  // ML Settings
  enableMlProtection: z.boolean().default(false),
  mlSensitivity: z.enum(["low", "medium", "high"]).default("medium"),
  autoApplyMlRules: z.boolean().default(false),
  // Advanced Settings
  monitorFalsePositives: z.boolean().default(true),
  rateLimiting: z.boolean().default(false),
  requestsPerMinute: z.number().int().min(1).max(1000).default(60),
});

export type DomainFormValues = z.infer<typeof domainFormSchema>;

// Mock threat intelligence feed options
const threatFeedOptions = [
  { id: "1", name: "AlienVault OTX", type: "IP" },
  { id: "2", name: "VirusTotal", type: "Hash" },
  { id: "3", name: "PhishTank", type: "URL" },
];

// Default security rules
const securityRules = [
  { id: 1, name: "XSS Attack Detection", description: "Detects common XSS attack patterns", type: "XSS" },
  { id: 2, name: "SQL Injection Detection", description: "Blocks SQL injection attempts", type: "SQL Injection" },
  { id: 3, name: "Path Traversal Detection", description: "Prevents directory traversal exploits", type: "Path Traversal" },
  { id: 4, name: "Command Injection Detection", description: "Blocks system command injection", type: "Command Injection" },
  { id: 5, name: "File Upload Protection", description: "Blocks dangerous file uploads", type: "File Upload" },
  { id: 6, name: "API Rate Limiting", description: "Prevents API abuse through rate limiting", type: "Rate Limit" },
  { id: 7, name: "Bad Bot Blocking", description: "Blocks known malicious bots", type: "Bot Protection" },
  { id: 8, name: "Bot Signature Detection", description: "Detects bot signatures in requests", type: "Bot Protection" },
  { id: 9, name: "Suspicious User Agent", description: "Flags suspicious user agent strings", type: "Bot Protection" },
  { id: 10, name: "SSL Protocol Enforcement", description: "Enforces secure SSL/TLS protocols", type: "SSL Verification" },
  { id: 11, name: "Weak Cipher Protection", description: "Blocks connections using weak ciphers", type: "SSL Verification" },
];

export default function AddDomainPage() {
  const [activeTab, setActiveTab] = useState("basic");
  const [showDnsDetails, setShowDnsDetails] = useState(false);
  const [_, navigate] = useLocation();
  const { toast } = useToast();

  // Create domain mutation
  const createDomainMutation = useMutation({
    mutationFn: async (values: DomainFormValues) => {
      return await apiRequest<Domain>("/api/domains", {
        method: "POST",
        body: JSON.stringify(values)
      });
    },
    onSuccess: (data: Domain) => {
      toast({
        title: "Domain Added",
        description: `Successfully added domain ${data.name}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/domains"] });
      navigate("/domains");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to add domain: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Form setup
  const form = useForm<DomainFormValues>({
    resolver: zodResolver(domainFormSchema),
    defaultValues: {
      name: "",
      url: "",
      targetIp: "",
      dnsProvider: "",
      description: "",
      isActive: true,
      enableGeoBlocking: false,
      blockedCountries: [],
      applyRules: true,
      selectedRules: [],
      enableBotProtection: false,
      enableSslVerification: false,
      enableThreatIntel: false,
      selectedThreatFeeds: [],
      enableMlProtection: false,
      mlSensitivity: "medium",
      autoApplyMlRules: false,
      monitorFalsePositives: true,
      rateLimiting: false,
      requestsPerMinute: 60,
    },
  });

  // Watch for value changes
  const enableGeoBlocking = form.watch("enableGeoBlocking");
  const enableMlProtection = form.watch("enableMlProtection");
  const enableThreatIntel = form.watch("enableThreatIntel");
  const rateLimiting = form.watch("rateLimiting");

  const handleFormSubmit = (values: DomainFormValues) => {
    createDomainMutation.mutate(values);
  };

  return (
    <div className="container py-6">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/domains")} 
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Domains
        </Button>
        <h1 className="text-3xl font-bold mb-2">Add New Domain</h1>
        <p className="text-muted-foreground">Configure a new domain to protect with WAF</p>
      </div>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
            <TabsList className="grid grid-cols-4 mb-6">
              <TabsTrigger value="basic">
                <Globe className="w-4 h-4 mr-2" />
                Basic
              </TabsTrigger>
              <TabsTrigger value="security">
                <ShieldAlert className="w-4 h-4 mr-2" />
                Security
              </TabsTrigger>
              <TabsTrigger value="ml">
                <Brain className="w-4 h-4 mr-2" />
                ML Protection
              </TabsTrigger>
              <TabsTrigger value="advanced">
                <AlertCircle className="w-4 h-4 mr-2" />
                Advanced
              </TabsTrigger>
            </TabsList>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 mt-4">
                {/* Basic Information Tab */}
                <TabsContent value="basic">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Domain Name</FormLabel>
                          <FormControl>
                            <Input placeholder="My Website" {...field} />
                          </FormControl>
                          <FormDescription>
                            A descriptive name for your domain
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://example.com" {...field} />
                          </FormControl>
                          <FormDescription>
                            The URL of the domain to protect
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="targetIp"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target IP (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="192.168.1.1" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormDescription>
                            The origin server IP address
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dnsProvider"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>DNS Provider</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Cloudflare, AWS Route 53, GoDaddy" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormDescription>
                            Your DNS provider for this domain
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="p-3 bg-gray-50 border rounded-md">
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="text-sm font-medium">DNS Record Guidance</h4>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setShowDnsDetails(!showDnsDetails)}
                          type="button"
                          className="h-7 text-xs"
                        >
                          {showDnsDetails ? "Show less" : "Show more"}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Configure these DNS records after adding this domain
                      </p>
                      
                      {showDnsDetails && (
                        <div className="space-y-2 mt-2 pt-2 border-t">
                          <div className="text-xs bg-background p-2 rounded border flex flex-col space-y-1">
                            <div><span className="font-semibold">Record Type:</span> CNAME</div>
                            <div><span className="font-semibold">Name:</span> www or subdomain</div>
                            <div><span className="font-semibold">Value:</span> [Your WAF proxy domain]</div>
                            <div><span className="font-semibold">TTL:</span> 300 seconds (recommended)</div>
                          </div>
                          <div className="text-xs bg-background p-2 rounded border flex flex-col space-y-1">
                            <div><span className="font-semibold">Record Type:</span> A</div>
                            <div><span className="font-semibold">Name:</span> @ (root domain)</div>
                            <div><span className="font-semibold">Value:</span> [WAF Proxy IP]</div>
                            <div><span className="font-semibold">TTL:</span> 300 seconds (recommended)</div>
                          </div>
                        </div>
                      )}
                    </div>

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter domain description"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Active Protection</FormLabel>
                            <FormDescription>
                              Enable WAF protection for this domain
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
                  </div>
                </TabsContent>

                {/* Security Settings Tab */}
                <TabsContent value="security">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="applyRules"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Apply WAF Rules</FormLabel>
                            <FormDescription>
                              Apply WAF security rules to this domain
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
                    
                    {form.watch("applyRules") && (
                      <FormField
                        control={form.control}
                        name="selectedRules"
                        render={() => (
                          <FormItem>
                            <div className="mb-4">
                              <FormLabel>Select Security Rules</FormLabel>
                              <FormDescription>
                                Choose which security rules to apply to this domain
                              </FormDescription>
                            </div>
                            <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-2">
                              {securityRules.map((rule) => (
                                <FormField
                                  key={rule.id}
                                  control={form.control}
                                  name="selectedRules"
                                  render={({ field }) => {
                                    return (
                                      <FormItem
                                        key={rule.id}
                                        className="flex flex-row items-start space-x-3 space-y-0 p-2 hover:bg-gray-50 rounded-md"
                                      >
                                        <FormControl>
                                          <Checkbox
                                            checked={field.value?.includes(rule.id)}
                                            onCheckedChange={(checked) => {
                                              const currentValue = field.value || [];
                                              return checked
                                                ? field.onChange([...currentValue, rule.id])
                                                : field.onChange(
                                                    currentValue.filter((value) => value !== rule.id)
                                                  );
                                            }}
                                          />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                          <FormLabel className="flex items-center">
                                            {rule.name}
                                            <Badge
                                              variant="outline"
                                              className="ml-2 text-xs"
                                            >
                                              {rule.type}
                                            </Badge>
                                          </FormLabel>
                                          <FormDescription className="text-xs">
                                            {rule.description}
                                          </FormDescription>
                                        </div>
                                      </FormItem>
                                    );
                                  }}
                                />
                              ))}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={form.control}
                      name="enableGeoBlocking"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Geo Blocking</FormLabel>
                            <FormDescription>
                              Block traffic from specific countries
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

                    {enableGeoBlocking && (
                      <BlockedCountriesField
                        control={form.control}
                        isGeoBlockingEnabled={enableGeoBlocking}
                      />
                    )}

                    <FormField
                      control={form.control}
                      name="enableThreatIntel"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Threat Intelligence</FormLabel>
                            <FormDescription>
                              Apply threat intelligence data to identify malicious traffic
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

                    {enableThreatIntel && (
                      <FormField
                        control={form.control}
                        name="selectedThreatFeeds"
                        render={() => (
                          <FormItem>
                            <div className="mb-4">
                              <FormLabel>Select Threat Intelligence Feeds</FormLabel>
                              <FormDescription>
                                Choose which threat feeds to apply to this domain
                              </FormDescription>
                            </div>
                            <div className="space-y-2 border rounded-md p-2">
                              {threatFeedOptions.map((feed) => (
                                <FormField
                                  key={feed.id}
                                  control={form.control}
                                  name="selectedThreatFeeds"
                                  render={({ field }) => {
                                    return (
                                      <FormItem
                                        key={feed.id}
                                        className="flex flex-row items-start space-x-3 space-y-0 p-2 hover:bg-gray-50 rounded-md"
                                      >
                                        <FormControl>
                                          <Checkbox
                                            checked={field.value?.includes(feed.id)}
                                            onCheckedChange={(checked) => {
                                              const currentValue = field.value || [];
                                              return checked
                                                ? field.onChange([...currentValue, feed.id])
                                                : field.onChange(
                                                    currentValue.filter(
                                                      (value) => value !== feed.id
                                                    )
                                                  );
                                            }}
                                          />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                          <FormLabel className="flex items-center">
                                            {feed.name}
                                            <Badge
                                              variant="outline"
                                              className="ml-2 text-xs"
                                            >
                                              {feed.type}
                                            </Badge>
                                          </FormLabel>
                                          <FormDescription className="text-xs">
                                            {feed.type === "IP"
                                              ? "Block known malicious IPs"
                                              : feed.type === "Hash"
                                              ? "Detect malicious file uploads"
                                              : "Block known phishing sites"}
                                          </FormDescription>
                                        </div>
                                      </FormItem>
                                    );
                                  }}
                                />
                              ))}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={form.control}
                      name="enableBotProtection"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Bot Protection</FormLabel>
                            <FormDescription>
                              Enable advanced bot protection features
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

                    <FormField
                      control={form.control}
                      name="enableSslVerification"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>SSL Verification</FormLabel>
                            <FormDescription>
                              Enforce SSL security protocols and cipher requirements
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
                  </div>
                </TabsContent>

                {/* ML Protection Tab */}
                <TabsContent value="ml">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="enableMlProtection"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>ML-based Protection</FormLabel>
                            <FormDescription>
                              Use machine learning to detect and block advanced threats
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

                    {enableMlProtection && (
                      <>
                        <FormField
                          control={form.control}
                          name="mlSensitivity"
                          render={({ field }) => (
                            <FormItem className="space-y-3">
                              <FormLabel>ML Detection Sensitivity</FormLabel>
                              <FormControl>
                                <RadioGroup
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                  className="flex flex-col space-y-1"
                                >
                                  <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl>
                                      <RadioGroupItem value="low" />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      Low (Minimize false positives)
                                    </FormLabel>
                                  </FormItem>
                                  <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl>
                                      <RadioGroupItem value="medium" />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      Medium (Balanced approach)
                                    </FormLabel>
                                  </FormItem>
                                  <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl>
                                      <RadioGroupItem value="high" />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      High (Maximum protection)
                                    </FormLabel>
                                  </FormItem>
                                </RadioGroup>
                              </FormControl>
                              <FormDescription>
                                Adjust how aggressively the ML system should detect threats
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="autoApplyMlRules"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                              <div className="space-y-0.5">
                                <FormLabel>Auto-apply ML-generated rules</FormLabel>
                                <FormDescription>
                                  Automatically apply new rules learned by the ML system
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
                      </>
                    )}
                  </div>
                </TabsContent>

                {/* Advanced Settings Tab */}
                <TabsContent value="advanced">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="monitorFalsePositives"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Monitor False Positives</FormLabel>
                            <FormDescription>
                              Identify and report potential false positive detections
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

                    <FormField
                      control={form.control}
                      name="rateLimiting"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Rate Limiting</FormLabel>
                            <FormDescription>
                              Limit the number of requests from a single source
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

                    {rateLimiting && (
                      <FormField
                        control={form.control}
                        name="requestsPerMinute"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Requests Per Minute</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={1}
                                max={1000}
                                {...field}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value);
                                  if (!isNaN(value) && value >= 1 && value <= 1000) {
                                    field.onChange(value);
                                  }
                                }}
                              />
                            </FormControl>
                            <FormDescription>
                              Maximum number of requests allowed per minute from a single IP
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </TabsContent>

                {/* Form Buttons */}
                <div className="flex justify-end space-x-4 pt-4 mt-6 border-t">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => navigate("/domains")}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createDomainMutation.isPending}
                  >
                    {createDomainMutation.isPending ? "Adding Domain..." : "Add Domain"}
                  </Button>
                </div>
              </form>
            </Form>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}