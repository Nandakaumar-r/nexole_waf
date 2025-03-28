import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RequestsResponse, RequestLog } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter, Download, Eye, X } from "lucide-react";
import { format } from "date-fns";
import { RequestDetailsModal } from "@/components/modals/RequestDetailsModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

// Filter dialog interface
interface FilterOptions {
  methods: string[];
  attackTypes: string[];
  statusCodes: string[];
  dateRange: {
    start: string;
    end: string;
  };
  countries: string[];
}

export default function Requests() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState("all");
  const limit = 25; // Updated to show 25 alerts per page
  const [selectedRequest, setSelectedRequest] = useState<RequestLog | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  
  // Filter states
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    methods: [],
    attackTypes: [],
    statusCodes: [],
    dateRange: {
      start: "",
      end: ""
    },
    countries: []
  });
  
  // Applied filters
  const [appliedFilters, setAppliedFilters] = useState<FilterOptions>({
    methods: [],
    attackTypes: [],
    statusCodes: [],
    dateRange: {
      start: "",
      end: ""
    },
    countries: []
  });
  
  // Get domain name for header display if domain filter is applied
  const [domainName, setDomainName] = useState<string | null>(null);

  const searchParams = new URLSearchParams(window.location.search);
  const domainId = searchParams.get('domain');

  // Fetch domain info if domainId is provided
  const { data: domainData } = useQuery({
    queryKey: ["/api/domains", domainId],
    queryFn: () => domainId ? apiRequest(`/api/domains/${domainId}`) : null,
    enabled: !!domainId,
  });

  // Set domain name when data is loaded
  React.useEffect(() => {
    if (domainData) {
      setDomainName(domainData.name);
    }
  }, [domainData]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/requests", domainId],
    queryFn: () => apiRequest("/api/requests" + (domainId ? `?domain=${domainId}` : "")),
  });

  const handleViewRequest = (request: RequestLog) => {
    setSelectedRequest(request);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  // Apply filters, including the filter dialog options
  const applyFilters = () => {
    setAppliedFilters({...filterOptions});
    setFilterDialogOpen(false);
  };
  
  // Reset filters
  const resetFilters = () => {
    setFilterOptions({
      methods: [],
      attackTypes: [],
      statusCodes: [],
      dateRange: {
        start: "",
        end: ""
      },
      countries: []
    });
  };
  
  // Generate and download export file
  const exportData = (format: string) => {
    if (!filteredRequests) return;
    
    let content = '';
    
    if (format === 'csv') {
      // Create CSV header
      content = 'ID,Timestamp,IP Address,Method,Path,Status,Threat Type,Response Status,Response Time\n';
      
      // Add rows
      filteredRequests.forEach(req => {
        const row = [
          req.id,
          new Date(req.timestamp).toISOString(),
          req.ipAddress,
          req.method,
          req.path,
          req.isBlocked ? 'Blocked' : 'Allowed',
          req.attackType || 'None',
          req.responseStatus || '-',
          req.responseTime || '-'
        ].map(val => `"${val}"`).join(',');
        content += row + '\n';
      });
    } else if (format === 'json') {
      content = JSON.stringify(filteredRequests, null, 2);
    }
    
    // Create download link
    const blob = new Blob([content], { type: format === 'csv' ? 'text/csv' : 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `request-logs.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setExportDialogOpen(false);
  };
  
  // Filter requests based on search query, selected tab, and applied filters
  const filteredRequests = data?.data ? data.data.filter(req => {
    // Search query filter
    const matchesSearch = 
      req.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.ipAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (req.attackType && req.attackType.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Tab filter
    const matchesTab = tab === "all" || 
      (tab === "blocked" && req.isBlocked) || 
      (tab === "allowed" && !req.isBlocked);
    
    // Applied filters
    const matchesMethods = appliedFilters.methods.length === 0 || 
      appliedFilters.methods.includes(req.method);
      
    const matchesAttackTypes = appliedFilters.attackTypes.length === 0 || 
      (req.attackType && appliedFilters.attackTypes.includes(req.attackType));
      
    const matchesStatusCodes = appliedFilters.statusCodes.length === 0 || 
      (req.responseStatus && appliedFilters.statusCodes.includes(req.responseStatus.toString()));
      
    // Date range filter
    let matchesDateRange = true;
    if (appliedFilters.dateRange.start || appliedFilters.dateRange.end) {
      const reqDate = new Date(req.timestamp);
      
      if (appliedFilters.dateRange.start) {
        const startDate = new Date(appliedFilters.dateRange.start);
        if (reqDate < startDate) matchesDateRange = false;
      }
      
      if (appliedFilters.dateRange.end) {
        const endDate = new Date(appliedFilters.dateRange.end);
        endDate.setHours(23, 59, 59, 999); // End of the day
        if (reqDate > endDate) matchesDateRange = false;
      }
    }
    
    // Country filter
    const matchesCountries = appliedFilters.countries.length === 0 || 
      (req.countryCode && appliedFilters.countries.includes(req.countryCode));
    
    return matchesSearch && matchesTab && matchesMethods && 
      matchesAttackTypes && matchesStatusCodes && matchesDateRange && matchesCountries;
  }) : [];

  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <CardTitle>Request Logs</CardTitle>
              {domainName && (
                <div className="text-sm text-muted-foreground mt-1">
                  Domain: <span className="font-medium text-primary">{domainName}</span>
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search requests..."
                  className="pl-8 pr-3 text-sm w-full sm:w-60"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="absolute left-3 top-3 text-neutral-medium text-sm h-4 w-4" />
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-neutral-medium"
                  onClick={() => setFilterDialogOpen(true)}
                >
                  <Filter className="h-4 w-4 mr-1" /> Filter
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-neutral-medium"
                  onClick={() => setExportDialogOpen(true)}
                >
                  <Download className="h-4 w-4 mr-1" /> Export
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Requests</TabsTrigger>
              <TabsTrigger value="blocked">Blocked</TabsTrigger>
              <TabsTrigger value="allowed">Allowed</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-0">
              {renderRequestsTable()}
            </TabsContent>
            <TabsContent value="blocked" className="mt-0">
              {renderRequestsTable()}
            </TabsContent>
            <TabsContent value="allowed" className="mt-0">
              {renderRequestsTable()}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {selectedRequest && (
        <RequestDetailsModal 
          isOpen={modalOpen} 
          onClose={closeModal} 
          request={selectedRequest} 
        />
      )}
      
      {/* Filter Dialog */}
      <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Filter Requests</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* HTTP Methods */}
            <div className="grid gap-2">
              <Label>HTTP Methods</Label>
              <div className="flex flex-wrap gap-2">
                {["GET", "POST", "PUT", "DELETE", "PATCH"].map(method => (
                  <div key={method} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`method-${method}`} 
                      checked={filterOptions.methods.includes(method)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFilterOptions({
                            ...filterOptions,
                            methods: [...filterOptions.methods, method]
                          });
                        } else {
                          setFilterOptions({
                            ...filterOptions,
                            methods: filterOptions.methods.filter(m => m !== method)
                          });
                        }
                      }}
                    />
                    <label 
                      htmlFor={`method-${method}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {method}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Attack Types */}
            <div className="grid gap-2">
              <Label>Attack Types</Label>
              <div className="flex flex-wrap gap-2">
                {["SQL Injection", "XSS", "Path Traversal", "Command Injection"].map(type => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`type-${type}`} 
                      checked={filterOptions.attackTypes.includes(type)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFilterOptions({
                            ...filterOptions,
                            attackTypes: [...filterOptions.attackTypes, type]
                          });
                        } else {
                          setFilterOptions({
                            ...filterOptions,
                            attackTypes: filterOptions.attackTypes.filter(t => t !== type)
                          });
                        }
                      }}
                    />
                    <label 
                      htmlFor={`type-${type}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {type}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Date Range */}
            <div className="grid gap-2">
              <Label>Date Range</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-1">
                  <Label className="text-xs text-neutral-medium">From</Label>
                  <Input 
                    type="date" 
                    value={filterOptions.dateRange.start} 
                    onChange={(e) => {
                      setFilterOptions({
                        ...filterOptions,
                        dateRange: {
                          ...filterOptions.dateRange,
                          start: e.target.value
                        }
                      });
                    }}
                  />
                </div>
                <div className="grid gap-1">
                  <Label className="text-xs text-neutral-medium">To</Label>
                  <Input 
                    type="date" 
                    value={filterOptions.dateRange.end} 
                    onChange={(e) => {
                      setFilterOptions({
                        ...filterOptions,
                        dateRange: {
                          ...filterOptions.dateRange,
                          end: e.target.value
                        }
                      });
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                resetFilters();
                setFilterDialogOpen(false);
              }}
            >
              Reset
            </Button>
            <Button 
              size="sm" 
              onClick={applyFilters}
            >
              Apply Filters
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Export Dialog */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Export Requests</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <p className="text-sm text-neutral-medium">
              Select a format to export {filteredRequests?.length || 0} request logs.
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                onClick={() => exportData('csv')}
                className="flex flex-col items-center justify-center h-20"
              >
                <span className="text-lg mb-1">CSV</span>
                <span className="text-xs text-neutral-medium">Spreadsheet format</span>
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => exportData('json')}
                className="flex flex-col items-center justify-center h-20"
              >
                <span className="text-lg mb-1">JSON</span>
                <span className="text-xs text-neutral-medium">Raw data format</span>
              </Button>
            </div>
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" size="sm">Cancel</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );

  function renderRequestsTable() {
    if (isLoading) {
      return <p className="text-center py-4">Loading request logs...</p>;
    }

    if (error) {
      return <p className="text-error text-center py-4">Error loading request logs</p>;
    }

    if (!filteredRequests || filteredRequests.length === 0) {
      return <p className="text-neutral-medium text-center py-4">No request logs found</p>;
    }

    const totalPages = Math.ceil((data?.pagination.total || 0) / limit);

    return (
      <>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-neutral-light bg-opacity-50">
                <th className="py-3 px-4 text-left text-xs font-medium text-neutral-medium tracking-wider">Time</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-neutral-medium tracking-wider">IP Address</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-neutral-medium tracking-wider">Method</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-neutral-medium tracking-wider">Path</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-neutral-medium tracking-wider">Status</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-neutral-medium tracking-wider">Threat Type</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-neutral-medium tracking-wider">Response</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-neutral-medium tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-light">
              {filteredRequests.map((request) => (
                <tr key={request.id} className="hover:bg-blue-50">
                  <td className="px-4 py-3 text-sm">
                    {format(new Date(request.timestamp), "yyyy-MM-dd HH:mm:ss")}
                  </td>
                  <td className="px-4 py-3 text-sm">{request.ipAddress}</td>
                  <td className="px-4 py-3 text-sm">
                    <Badge method={request.method}>{request.method}</Badge>
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-xs">{request.path}</td>
                  <td className="px-4 py-3 text-sm">
                    {request.isBlocked ? (
                      <Badge variant="error">Blocked</Badge>
                    ) : (
                      <Badge variant="success">Allowed</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {request.attackType ? (
                      <Badge variant="error" className="text-xs">
                        {request.attackType}
                      </Badge>
                    ) : (
                      <span className="text-xs text-neutral-medium">None</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {request.responseStatus ? request.responseStatus : "-"}
                    {request.responseTime ? ` (${request.responseTime}ms)` : ""}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary hover:text-secondary px-2 h-8"
                      onClick={() => handleViewRequest(request)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pt-4 flex items-center justify-between">
          <div className="text-sm text-neutral-medium">
            Showing {filteredRequests.length ? (page - 1) * limit + 1 : 0}-
            {Math.min(page * limit, data?.pagination.total || 0)} of {data?.pagination.total || 0} requests
          </div>
          <div className="flex space-x-1">
            <Button
              variant="outline"
              size="sm"
              className="px-3 py-1 text-sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            {[...Array(Math.min(5, totalPages))].map((_, index) => {
              const pageNumber = page <= 3
                ? index + 1
                : page + index - 2 > totalPages
                  ? totalPages - 4 + index
                  : page + index - 2;

              if (pageNumber <= 0 || pageNumber > totalPages) return null;

              return (
                <Button
                  key={pageNumber}
                  variant={pageNumber === page ? "default" : "outline"}
                  size="sm"
                  className="px-3 py-1 text-sm"
                  onClick={() => setPage(pageNumber)}
                >
                  {pageNumber}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              className="px-3 py-1 text-sm"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </>
    );
  }
}

