import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Domain } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { DomainFormValues } from "./new-domain-form";

// Type for domain traffic stats
interface DomainTraffic {
  domainId: number;
  allowed: number;
  blocked: number;
  total: number;
}

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlusIcon, Globe, CheckIcon, XIcon, Pencil, Trash, Eye, Brain, ShieldAlert } from "lucide-react";

export default function Domains() {
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [trafficStats, setTrafficStats] = useState<DomainTraffic[]>([]);

  // Query to fetch domains
  const { data: domains, isLoading } = useQuery<Domain[]>({
    queryKey: ["/api/domains"],
  });
  
  // Not using query for traffic stats
  
  // Effect to update traffic stats when data is fetched
  useEffect(() => {
    const updateTrafficStats = async () => {
      try {
        const response = await fetch('/api/domain-traffic-stats');
        if (response.ok) {
          const data = await response.json();
          setTrafficStats(data || []);
        }
      } catch (error) {
        console.error('Error fetching traffic stats:', error);
        setTrafficStats([]);
      }
    };
    
    updateTrafficStats();
  }, []);

  // Mutation to create a domain
  const createDomainMutation = useMutation({
    mutationFn: (newDomain: DomainFormValues) =>
      apiRequest<Domain>("/api/domains", {
        method: "POST",
        body: JSON.stringify(newDomain),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/domains"] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Domain Added",
        description: "The domain has been successfully added",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create domain. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mutation to update a domain
  const updateDomainMutation = useMutation({
    mutationFn: ({ id, domain }: { id: number; domain: DomainFormValues }) =>
      apiRequest<Domain>(`/api/domains/${id}`, {
        method: "PATCH",
        body: JSON.stringify(domain),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/domains"] });
      setIsEditDialogOpen(false);
      setSelectedDomain(null);
      toast({
        title: "Domain Updated",
        description: "The domain has been successfully updated",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update domain. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mutation to delete a domain
  const deleteDomainMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest<{ success: boolean }>(`/api/domains/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/domains"] });
      setIsDeleteDialogOpen(false);
      setSelectedDomain(null);
      toast({
        title: "Domain Deleted",
        description: "The domain has been successfully deleted",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete domain. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateDomain = (values: DomainFormValues) => {
    createDomainMutation.mutate(values);
  };

  const handleUpdateDomain = (values: DomainFormValues) => {
    if (selectedDomain) {
      updateDomainMutation.mutate({
        id: selectedDomain.id,
        domain: values,
      });
    }
  };

  const handleDeleteDomain = () => {
    if (selectedDomain) {
      deleteDomainMutation.mutate(selectedDomain.id);
    }
  };

  const openEditDialog = (domain: Domain) => {
    setSelectedDomain(domain);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (domain: Domain) => {
    setSelectedDomain(domain);
    setIsDeleteDialogOpen(true);
  };

  // Prepare initial values for edit form
  const getInitialValues = (domain: Domain): Partial<DomainFormValues> => {
    return {
      name: domain.name,
      url: domain.url,
      targetIp: domain.targetIp || "",
      description: domain.description || "",
      isActive: domain.isActive,
      enableGeoBlocking: domain.enableGeoBlocking || false,
      blockedCountries: domain.blockedCountries || [],
      applyRules: domain.applyRules !== undefined ? domain.applyRules : true,
      // New fields with default values since they may not exist in the DB yet
      enableThreatIntel: domain.enableThreatIntel || false,
      selectedThreatFeeds: domain.selectedThreatFeeds || [],
      enableMlProtection: domain.enableMlProtection || false,
      mlSensitivity: domain.mlSensitivity || "medium" as "low" | "medium" | "high",
      autoApplyMlRules: domain.autoApplyMlRules || false,
      monitorFalsePositives: domain.monitorFalsePositives !== undefined ? domain.monitorFalsePositives : true,
      rateLimiting: domain.rateLimiting || false,
      requestsPerMinute: domain.requestsPerMinute || 60,
    };
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Domain Management</h1>
          <p className="text-neutral-medium">
            Manage protected domains and their settings
          </p>
        </div>
        <Button
          onClick={() => navigate("/domains/add")}
          className="flex items-center"
        >
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Domain
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : domains && domains.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Traffic</TableHead>
                <TableHead>Security Features</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {domains.map((domain) => {
                // Find traffic stats for this domain
                const stats = trafficStats.find(stat => stat.domainId === domain.id) || 
                              { allowed: 0, blocked: 0, total: 0 };
                              
                return (
                  <TableRow key={domain.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <Globe className="h-4 w-4 mr-2 text-primary" />
                        {domain.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-blue-600">
                      <a href={domain.url} target="_blank" rel="noopener noreferrer">
                        {domain.url}
                      </a>
                    </TableCell>
                    <TableCell>
                      {domain.isActive ? (
                        <Badge className="bg-green-100 text-green-800 border-green-300 flex w-min items-center">
                          <CheckIcon className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge className="bg-neutral-100 text-neutral-800 border-neutral-300 flex w-min items-center">
                          <XIcon className="h-3 w-3 mr-1" />
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center text-sm">
                          <CheckIcon className="h-3 w-3 mr-1 text-green-600" />
                          <span className="font-semibold mr-1">Allowed:</span> {stats.allowed}
                        </div>
                        <div className="flex items-center text-sm">
                          <XIcon className="h-3 w-3 mr-1 text-red-600" />
                          <span className="font-semibold mr-1">Blocked:</span> {stats.blocked}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {domain.applyRules && (
                          <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                            WAF Rules
                          </Badge>
                        )}
                        {domain.enableGeoBlocking && (
                          <Badge className="bg-purple-100 text-purple-800 border-purple-300">
                            Geo-Blocking
                          </Badge>
                        )}
                        {domain.enableThreatIntel && (
                          <Badge className="bg-red-100 text-red-800 border-red-300 flex items-center">
                            <ShieldAlert className="h-3 w-3 mr-1" />
                            Threat Intel
                          </Badge>
                        )}
                        {domain.enableMlProtection && (
                          <Badge className="bg-amber-100 text-amber-800 border-amber-300 flex items-center">
                            <Brain className="h-3 w-3 mr-1" />
                            ML Protection
                          </Badge>
                        )}
                        {!domain.applyRules && 
                         !domain.enableGeoBlocking && 
                         !domain.enableThreatIntel &&
                         !domain.enableMlProtection && (
                          <span className="text-neutral-400 text-sm">No security features enabled</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {domain.description || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/requests?domain=${domain.id}`)}
                        className="mr-1"
                      >
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">View Logs</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(domain)}
                        className="mr-1"
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDeleteDialog(domain)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Globe className="mx-auto h-12 w-12 text-neutral-300" />
          <h3 className="mt-4 text-lg font-semibold">No domains added yet</h3>
          <p className="text-neutral-medium mt-2">
            Add your first domain to start protecting it with WAF rules
          </p>
          <Button
            onClick={() => navigate("/domains/add")}
            className="mt-6"
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Domain
          </Button>
        </div>
      )}

      {/* Edit functionality will be moved to a separate page later */}

      {/* Delete Domain Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Domain</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this domain? This action cannot be undone.
              {selectedDomain && (
                <div className="mt-4 p-3 bg-gray-50 rounded-md">
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="font-medium">Name:</div>
                    <div className="col-span-2">{selectedDomain.name}</div>
                    <div className="font-medium">URL:</div>
                    <div className="col-span-2">{selectedDomain.url}</div>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDomain}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}