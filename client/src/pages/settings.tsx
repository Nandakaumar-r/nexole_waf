import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save, RefreshCw, ShieldAlert } from "lucide-react";

// Form schema for WAF settings
const wafSettingsSchema = z.object({
  targetUrl: z.string().url("Please enter a valid URL").optional(),
  proxyEnabled: z.boolean().default(false),
  logRequests: z.boolean().default(true),
  logResponse: z.boolean().default(true),
  logBody: z.boolean().default(true),
  blockThreshold: z.string().default("1"),
  notificationEmail: z.string().email("Please enter a valid email").optional(),
  retentionPeriod: z.string().default("30"),
});

// Form schema for authentication settings
const authSettingsSchema = z.object({
  username: z.string().min(4, "Username must be at least 4 characters"),
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters").optional(),
  confirmPassword: z.string().optional(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type WAFSettingsFormValues = z.infer<typeof wafSettingsSchema>;
type AuthSettingsFormValues = z.infer<typeof authSettingsSchema>;

export default function Settings() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("general");
  
  // Form for WAF settings
  const wafForm = useForm<WAFSettingsFormValues>({
    resolver: zodResolver(wafSettingsSchema),
    defaultValues: {
      targetUrl: "http://localhost:8000",
      proxyEnabled: false,
      logRequests: true,
      logResponse: true,
      logBody: true,
      blockThreshold: "1",
      notificationEmail: "",
      retentionPeriod: "30",
    },
  });
  
  // Form for authentication settings
  const authForm = useForm<AuthSettingsFormValues>({
    resolver: zodResolver(authSettingsSchema),
    defaultValues: {
      username: "admin",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  
  // Handle WAF settings form submission
  const handleWAFSettingsSubmit = (values: WAFSettingsFormValues) => {
    toast({
      title: "Settings Saved",
      description: "Your WAF settings have been updated successfully.",
    });
  };
  
  // Handle authentication settings form submission
  const handleAuthSettingsSubmit = (values: AuthSettingsFormValues) => {
    toast({
      title: "Authentication Updated",
      description: "Your authentication details have been updated successfully.",
    });
  };
  
  // Test WAF configuration
  const handleTestWAF = () => {
    toast({
      title: "WAF Test Successful",
      description: "Your WAF configuration is working correctly.",
    });
  };
  
  // Clear logs
  const handleClearLogs = () => {
    toast({
      title: "Confirmation",
      description: "This action cannot be undone. Are you sure you want to clear all logs?",
      variant: "destructive",
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 animate-in">
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="auth">Authentication</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>
            
            {/* General Settings */}
            <TabsContent value="general" className="mt-0 space-y-6">
              <Form {...wafForm}>
                <form onSubmit={wafForm.handleSubmit(handleWAFSettingsSubmit)} className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">WAF Configuration</h3>
                    <Separator />
                    
                    <FormField
                      control={wafForm.control}
                      name="targetUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target URL</FormLabel>
                          <FormControl>
                            <Input placeholder="http://your-application.com" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormDescription>
                            The URL of the application you want to protect with the WAF
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={wafForm.control}
                      name="proxyEnabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Enable Proxy Mode</FormLabel>
                            <FormDescription>
                              Route traffic through WAF to the target application
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
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Logging Settings</h3>
                    <Separator />
                    
                    <FormField
                      control={wafForm.control}
                      name="logRequests"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Log All Requests</FormLabel>
                            <FormDescription>
                              Keep records of all incoming HTTP requests
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
                      control={wafForm.control}
                      name="logResponse"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Log Response Status</FormLabel>
                            <FormDescription>
                              Record response status codes and timing
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
                      control={wafForm.control}
                      name="logBody"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Log Request Body</FormLabel>
                            <FormDescription>
                              Store request body content in logs (may contain sensitive data)
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
                      control={wafForm.control}
                      name="retentionPeriod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Log Retention Period (days)</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select retention period" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="7">7 days</SelectItem>
                              <SelectItem value="14">14 days</SelectItem>
                              <SelectItem value="30">30 days</SelectItem>
                              <SelectItem value="60">60 days</SelectItem>
                              <SelectItem value="90">90 days</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            How long to keep request logs before automatically purging
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Notification Settings</h3>
                    <Separator />
                    
                    <FormField
                      control={wafForm.control}
                      name="notificationEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Alert Email</FormLabel>
                          <FormControl>
                            <Input placeholder="admin@example.com" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormDescription>
                            Email address to receive security alerts (leave blank to disable)
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={wafForm.control}
                      name="blockThreshold"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Alert Threshold</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select threshold" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="1">Every blocked request</SelectItem>
                              <SelectItem value="5">5+ blocked requests</SelectItem>
                              <SelectItem value="10">10+ blocked requests</SelectItem>
                              <SelectItem value="50">50+ blocked requests</SelectItem>
                              <SelectItem value="100">100+ blocked requests</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Number of blocked requests before sending an alert
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={handleTestWAF}>
                      <ShieldAlert className="mr-2 h-4 w-4" />
                      Test WAF
                    </Button>
                    <Button type="submit">
                      <Save className="mr-2 h-4 w-4" />
                      Save Settings
                    </Button>
                  </div>
                </form>
              </Form>
            </TabsContent>
            
            {/* Authentication Settings */}
            <TabsContent value="auth" className="mt-0 space-y-6">
              <Form {...authForm}>
                <form onSubmit={authForm.handleSubmit(handleAuthSettingsSubmit)} className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Update Credentials</h3>
                    <Separator />
                    
                    <FormField
                      control={authForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={authForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={authForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormDescription>
                            Leave blank to keep current password
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={authForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} value={field.value || ""} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="flex justify-end">
                    <Button type="submit">
                      <Save className="mr-2 h-4 w-4" />
                      Update Credentials
                    </Button>
                  </div>
                </form>
              </Form>
            </TabsContent>
            
            {/* Advanced Settings */}
            <TabsContent value="advanced" className="mt-0 space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Maintenance</h3>
                <Separator />
                
                <div className="rounded-lg border p-4">
                  <h4 className="font-medium mb-2">Clear Logs</h4>
                  <p className="text-sm text-neutral-medium mb-4">
                    Remove all request logs from the system. This action cannot be undone.
                  </p>
                  <Button variant="destructive" onClick={handleClearLogs}>
                    Clear All Logs
                  </Button>
                </div>
                
                <div className="rounded-lg border p-4">
                  <h4 className="font-medium mb-2">Reset Rule Configurations</h4>
                  <p className="text-sm text-neutral-medium mb-4">
                    Restore all WAF rules to default settings. Custom rules will be removed.
                  </p>
                  <Button variant="outline" className="border-error text-error hover:bg-error/10">
                    Reset to Default
                  </Button>
                </div>
                
                <div className="rounded-lg border p-4">
                  <h4 className="font-medium mb-2">Restart WAF Service</h4>
                  <p className="text-sm text-neutral-medium mb-4">
                    Restart the WAF service to apply configuration changes.
                  </p>
                  <Button variant="outline">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Restart Service
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
