import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Rule } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { FormSwitch } from "@/components/ui/form-switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PlusCircle, Edit, Trash2, Search } from "lucide-react";
import { format } from "date-fns";

// Form schema for rule creation/editing
const ruleFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  pattern: z.string().min(1, "Pattern is required"),
  attackType: z.string().min(1, "Attack type is required"),
  matchLocation: z.string().min(1, "Match location is required"),
  action: z.string().default("block"),
  isEnabled: z.boolean().default(true),
  isGlobal: z.boolean().default(true),
  domainId: z.number().nullable().optional(),
});

type RuleFormValues = z.infer<typeof ruleFormSchema>;

export default function Rules() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<Rule | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch all rules
  const { data: rules, isLoading, error } = useQuery<Rule[]>({
    queryKey: ["/api/rules"],
  });
  
  // Fetch all domains for the domain selector
  const { data: domains } = useQuery({
    queryKey: ["/api/domains"],
  });
  
  // Form for creating/editing rules
  const form = useForm<RuleFormValues>({
    resolver: zodResolver(ruleFormSchema),
    defaultValues: {
      name: "",
      description: "",
      pattern: "",
      attackType: "",
      matchLocation: "query,body,headers",
      action: "block",
      isEnabled: true,
      isGlobal: true,
      domainId: null,
    },
  });
  
  // Create rule mutation
  const createRuleMutation = useMutation({
    mutationFn: (newRule: RuleFormValues) => 
      apiRequest("POST", "/api/rules", newRule),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rules"] });
      toast({
        title: "Success",
        description: "Rule created successfully",
      });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create rule",
        variant: "destructive",
      });
    },
  });
  
  // Update rule mutation
  const updateRuleMutation = useMutation({
    mutationFn: ({ id, rule }: { id: number; rule: RuleFormValues }) => 
      apiRequest("PATCH", `/api/rules/${id}`, rule),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rules"] });
      toast({
        title: "Success",
        description: "Rule updated successfully",
      });
      setIsEditDialogOpen(false);
      setSelectedRule(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update rule",
        variant: "destructive",
      });
    },
  });
  
  // Delete rule mutation
  const deleteRuleMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest("DELETE", `/api/rules/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rules"] });
      toast({
        title: "Success",
        description: "Rule deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      setSelectedRule(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete rule",
        variant: "destructive",
      });
    },
  });
  
  // Toggle rule enabled status
  const toggleRuleEnabledMutation = useMutation({
    mutationFn: ({ id, isEnabled }: { id: number; isEnabled: boolean }) => 
      apiRequest("PATCH", `/api/rules/${id}`, { isEnabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rules"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update rule status",
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission for creating a rule
  const handleCreateRule = (values: RuleFormValues) => {
    createRuleMutation.mutate(values);
  };
  
  // Handle form submission for updating a rule
  const handleUpdateRule = (values: RuleFormValues) => {
    if (selectedRule) {
      updateRuleMutation.mutate({ id: selectedRule.id, rule: values });
    }
  };
  
  // Handle deleting a rule
  const handleDeleteRule = () => {
    if (selectedRule) {
      deleteRuleMutation.mutate(selectedRule.id);
    }
  };
  
  // Open edit dialog with selected rule data
  const openEditDialog = (rule: Rule) => {
    setSelectedRule(rule);
    form.reset({
      name: rule.name,
      description: rule.description || "",
      pattern: rule.pattern,
      attackType: rule.attackType,
      matchLocation: rule.matchLocation,
      action: rule.action,
      isEnabled: rule.isEnabled,
    });
    setIsEditDialogOpen(true);
  };
  
  // Open create dialog with fresh form
  const openCreateDialog = () => {
    form.reset({
      name: "",
      description: "",
      pattern: "",
      attackType: "",
      matchLocation: "query,body,headers",
      action: "block",
      isEnabled: true,
    });
    setIsCreateDialogOpen(true);
  };
  
  // Open delete confirmation dialog
  const openDeleteDialog = (rule: Rule) => {
    setSelectedRule(rule);
    setIsDeleteDialogOpen(true);
  };
  
  // Filter rules based on search query
  const filteredRules = rules?.filter(rule => 
    rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (rule.description && rule.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    rule.attackType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <CardTitle>WAF Rules</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search rules..."
                  className="pl-8 pr-3 text-sm w-full sm:w-60"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="absolute left-3 top-3 text-neutral-medium text-sm h-4 w-4" />
              </div>
              <Button onClick={openCreateDialog}>
                <PlusCircle className="h-4 w-4 mr-1" /> Add New Rule
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-4">Loading rules...</p>
          ) : error ? (
            <p className="text-error text-center py-4">Error loading rules</p>
          ) : !filteredRules || filteredRules.length === 0 ? (
            <p className="text-neutral-medium text-center py-4">No rules found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-neutral-light bg-opacity-50">
                    <th className="py-3 px-4 text-left text-xs font-medium text-neutral-medium tracking-wider">Name</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-neutral-medium tracking-wider">Attack Type</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-neutral-medium tracking-wider">Pattern</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-neutral-medium tracking-wider">Match Location</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-neutral-medium tracking-wider">Action</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-neutral-medium tracking-wider">Enabled</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-neutral-medium tracking-wider">Created</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-neutral-medium tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-light">
                  {filteredRules.map((rule) => (
                    <tr key={rule.id} className="hover:bg-blue-50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-sm">{rule.name}</p>
                          {rule.description && (
                            <p className="text-xs text-neutral-medium">{rule.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="error" className="text-xs">
                          {rule.attackType}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-xs max-w-xs truncate">
                        {rule.pattern}
                      </td>
                      <td className="px-4 py-3 text-xs">{rule.matchLocation}</td>
                      <td className="px-4 py-3 text-xs capitalize">{rule.action}</td>
                      <td className="px-4 py-3">
                        <Switch
                          checked={rule.isEnabled}
                          onCheckedChange={(checked) => 
                            toggleRuleEnabledMutation.mutate({ id: rule.id, isEnabled: checked })
                          }
                        />
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {format(new Date(rule.createdAt), "yyyy-MM-dd")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-primary hover:text-secondary h-8 w-8 p-0"
                            onClick={() => openEditDialog(rule)}
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-error hover:text-error/80 h-8 w-8 p-0"
                            onClick={() => openDeleteDialog(rule)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Rule Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Rule</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateRule)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rule Name</FormLabel>
                    <FormControl>
                      <Input placeholder="SQL Injection Detection" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Detects common SQL injection patterns" 
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
                name="attackType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Attack Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select attack type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="XSS">Cross-site Scripting (XSS)</SelectItem>
                        <SelectItem value="SQL Injection">SQL Injection</SelectItem>
                        <SelectItem value="Path Traversal">Path Traversal</SelectItem>
                        <SelectItem value="Request Flooding">Request Flooding</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="pattern"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pattern (RegEx)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="'\\s*OR\\s*'?\\s*\\d+\\s*=\\s*\\d+" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="matchLocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Match Location</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select locations" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="query,body,headers">All (query, body, headers)</SelectItem>
                        <SelectItem value="query">Query</SelectItem>
                        <SelectItem value="body">Body</SelectItem>
                        <SelectItem value="headers">Headers</SelectItem>
                        <SelectItem value="path">Path</SelectItem>
                        <SelectItem value="query,body">Query and Body</SelectItem>
                        <SelectItem value="path,query">Path and Query</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="action"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Action</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select action" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="block">Block</SelectItem>
                        <SelectItem value="log">Log Only</SelectItem>
                        <SelectItem value="allow">Allow</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="isEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Enabled</FormLabel>
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
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                  disabled={createRuleMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createRuleMutation.isPending}
                >
                  {createRuleMutation.isPending ? "Creating..." : "Create Rule"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Rule Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Rule</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleUpdateRule)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rule Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
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
                name="attackType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Attack Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="XSS">Cross-site Scripting (XSS)</SelectItem>
                        <SelectItem value="SQL Injection">SQL Injection</SelectItem>
                        <SelectItem value="Path Traversal">Path Traversal</SelectItem>
                        <SelectItem value="Request Flooding">Request Flooding</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="pattern"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pattern (RegEx)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="matchLocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Match Location</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="query,body,headers">All (query, body, headers)</SelectItem>
                        <SelectItem value="query">Query</SelectItem>
                        <SelectItem value="body">Body</SelectItem>
                        <SelectItem value="headers">Headers</SelectItem>
                        <SelectItem value="path">Path</SelectItem>
                        <SelectItem value="query,body">Query and Body</SelectItem>
                        <SelectItem value="path,query">Path and Query</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="action"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Action</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="block">Block</SelectItem>
                        <SelectItem value="log">Log Only</SelectItem>
                        <SelectItem value="allow">Allow</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="isEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Enabled</FormLabel>
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
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                  disabled={updateRuleMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={updateRuleMutation.isPending}
                >
                  {updateRuleMutation.isPending ? "Updating..." : "Update Rule"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Rule Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Rule</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to delete the rule "{selectedRule?.name}"? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={deleteRuleMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              type="button"
              variant="destructive"
              onClick={handleDeleteRule}
              disabled={deleteRuleMutation.isPending}
            >
              {deleteRuleMutation.isPending ? "Deleting..." : "Delete Rule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
