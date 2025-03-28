import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, ChevronDown, Activity, BarChart2, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { apiRequest } from "@/lib/queryClient";

// Use real anomalies data from API
const useAnomaliesQuery = () => {
  return useQuery({
    queryKey: ['/api/anomalies'],
    // If API returns data property with array, extract it, otherwise provide empty array
    select: (data) => data?.data || []
  });
};

// This would be replaced with domains from the real API
const useDomainsQuery = () => {
  return useQuery({
    queryKey: ["/api/domains"],
  });
};

const AnomalyDetectionPage: React.FC = () => {
  const { data: domainsData, isLoading: domainsLoading } = useDomainsQuery();
  const [selectedDomain, setSelectedDomain] = useState<string>("all");
  const [selectedTab, setSelectedTab] = useState<string>("active");
  const [showRunDetectionDialog, setShowRunDetectionDialog] = useState(false);
  const [detectionRunning, setDetectionRunning] = useState(false);
  const [detectionProgress, setDetectionProgress] = useState(0);
  const [selectedAnomaly, setSelectedAnomaly] = useState<any>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  // Get anomalies data from the API
  const { data: anomaliesData = [], isLoading: anomaliesLoading } = useAnomaliesQuery();
  
  // Filter anomalies based on selected domain and tab
  const filteredAnomalies = anomaliesData.filter((anomaly: any) => {
    const matchesDomain = selectedDomain === "all" || 
                         anomaly.domainId.toString() === selectedDomain;
    
    const matchesTab = selectedTab === "all" || 
                       (selectedTab === "active" && anomaly.status === "Active") ||
                       (selectedTab === "investigating" && anomaly.status === "Under Investigation") ||
                       (selectedTab === "resolved" && anomaly.status === "Resolved");
    
    return matchesDomain && matchesTab;
  });

  // This would be a real API call in production
  const runAnomalyDetection = async () => {
    setDetectionRunning(true);
    setDetectionProgress(0);
    
    // Simulate progress for demo
    const interval = setInterval(() => {
      setDetectionProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setDetectionRunning(false);
          setShowRunDetectionDialog(false);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  // Status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return <Badge className="bg-red-500">{status}</Badge>;
      case "Under Investigation":
        return <Badge className="bg-amber-500">{status}</Badge>;
      case "Resolved":
        return <Badge className="bg-green-500">{status}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Score severity styling
  const getScoreSeverity = (score: number) => {
    if (score >= 90) return "bg-red-500";
    if (score >= 70) return "bg-amber-500";
    return "bg-green-500";
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Anomaly Detection</h1>
          <p className="text-neutral-500 mt-1">
            Machine learning powered detection of suspicious behavior patterns
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Dialog open={showRunDetectionDialog} onOpenChange={setShowRunDetectionDialog}>
            <DialogTrigger asChild>
              <Button className="font-medium">
                Run Anomaly Detection
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Run Anomaly Detection</DialogTitle>
                <DialogDescription>
                  {detectionRunning 
                    ? "Detection in progress. This may take a few minutes..."
                    : "This will analyze recent traffic patterns to detect potential anomalies."}
                </DialogDescription>
              </DialogHeader>
              
              {detectionRunning ? (
                <div className="py-4">
                  <Progress value={detectionProgress} className="mb-2" />
                  <p className="text-sm text-center text-neutral-500">
                    {detectionProgress}% complete
                  </p>
                </div>
              ) : (
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => setShowRunDetectionDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={runAnomalyDetection}>
                    Start Detection
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Anomalies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-amber-500 mr-2" />
              <div className="text-3xl font-bold">{anomaliesLoading ? "-" : anomaliesData.length}</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Threats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-red-500 mr-2" />
              <div className="text-3xl font-bold">
                {anomaliesLoading ? "-" : anomaliesData.filter((a: any) => a.status === "Active").length}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Threat Score Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <BarChart2 className="h-8 w-8 text-primary mr-2" />
              <div className="text-3xl font-bold">+12%</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h2 className="text-lg font-semibold">Anomaly Analysis</h2>
            <p className="text-sm text-neutral-500">All detected abnormal behaviors</p>
          </div>
          
          <div className="flex flex-col md:flex-row gap-3 mt-4 md:mt-0">
            <Select value={selectedDomain} onValueChange={setSelectedDomain}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Domain" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Domains</SelectItem>
                {domainsLoading ? (
                  <SelectItem value="loading" disabled>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Loading...
                  </SelectItem>
                ) : (
                  domainsData?.map((domain: any) => (
                    <SelectItem key={domain.id} value={domain.id.toString()}>
                      {domain.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <div className="px-4 border-b">
            <TabsList className="bg-transparent border-b-0">
              <TabsTrigger value="all" className="data-[state=active]:bg-background">
                All
              </TabsTrigger>
              <TabsTrigger value="active" className="data-[state=active]:bg-background">
                Active
                <Badge variant="outline" className="ml-2 bg-red-100 text-red-800 border-red-200">
                  {anomaliesLoading ? "-" : anomaliesData.filter((a: any) => a.status === "Active").length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="investigating" className="data-[state=active]:bg-background">
                Investigating
                <Badge variant="outline" className="ml-2 bg-amber-100 text-amber-800 border-amber-200">
                  {anomaliesLoading ? "-" : anomaliesData.filter((a: any) => a.status === "Under Investigation").length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="resolved" className="data-[state=active]:bg-background">
                Resolved
                <Badge variant="outline" className="ml-2 bg-green-100 text-green-800 border-green-200">
                  {anomaliesLoading ? "-" : anomaliesData.filter((a: any) => a.status === "Resolved").length}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value={selectedTab} className="mt-0">
            <div className="relative overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Anomaly Type</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Domain</TableHead>
                    <TableHead>Threat Score</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAnomalies.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <AlertCircle className="h-8 w-8 text-neutral-300 mx-auto mb-2" />
                        <p className="text-neutral-500">No anomalies found with the current filters</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAnomalies.map((anomaly) => (
                      <TableRow key={anomaly.id}>
                        <TableCell className="whitespace-nowrap">
                          {new Date(anomaly.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <AlertTriangle className={`h-4 w-4 mr-2 ${anomaly.type === 'Data Exfiltration' ? 'text-red-500' : 'text-amber-500'}`} />
                            {anomaly.type}
                          </div>
                        </TableCell>
                        <TableCell>{anomaly.source}</TableCell>
                        <TableCell>{anomaly.domainName}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <div className={`w-2 h-2 rounded-full ${getScoreSeverity(anomaly.score)} mr-2`}></div>
                            {anomaly.score}%
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(anomaly.status)}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => {
                              setSelectedAnomaly(anomaly);
                              setDetailsDialogOpen(true);
                            }}
                          >
                            Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Machine Learning Model Insights</CardTitle>
          <CardDescription>
            How our anomaly detection AI identifies suspicious patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Anomaly Detection Method</h3>
              <p className="text-sm text-neutral-600 mb-4">
                Our ML model uses unsupervised learning to establish normal behavior patterns 
                and identify deviations from these patterns. The system employs:
              </p>
              <ul className="list-disc pl-5 text-sm text-neutral-600 space-y-1">
                <li>Statistical analysis of traffic patterns</li>
                <li>Time-series anomaly detection</li>
                <li>Request clustering and outlier detection</li>
                <li>Bayesian analysis for probability scoring</li>
                <li>Seasonal pattern adjustment</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">How to Interpret Results</h3>
              <p className="text-sm text-neutral-600 mb-4">
                The anomaly score represents the confidence that the behavior is abnormal:
              </p>
              <div className="space-y-2">
                <div>
                  <div className="flex items-center mb-1">
                    <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                    <span className="text-sm font-medium">90-100: Critical Anomaly</span>
                  </div>
                  <p className="text-xs text-neutral-500 pl-5">
                    Highly unusual pattern that likely indicates an attack
                  </p>
                </div>
                <div>
                  <div className="flex items-center mb-1">
                    <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
                    <span className="text-sm font-medium">70-89: Suspicious Activity</span>
                  </div>
                  <p className="text-xs text-neutral-500 pl-5">
                    Noteworthy deviation that warrants investigation
                  </p>
                </div>
                <div>
                  <div className="flex items-center mb-1">
                    <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                    <span className="text-sm font-medium">0-69: Minor Variation</span>
                  </div>
                  <p className="text-xs text-neutral-500 pl-5">
                    Slight deviation that may be normal variation
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          <div>
            <h3 className="font-semibold mb-2">Auto-Response Options</h3>
            <p className="text-sm text-neutral-600 mb-4">
              Configure automatic responses to detected anomalies based on severity:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-neutral-50">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-medium">Critical Anomalies</CardTitle>
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center mb-3">
                    <Select defaultValue="block">
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select action" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="block">Block Traffic</SelectItem>
                        <SelectItem value="challenge">Challenge Request</SelectItem>
                        <SelectItem value="alert">Alert Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-neutral-500">
                    Immediately blocks traffic from the source
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-neutral-50">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-medium">Suspicious Activity</CardTitle>
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center mb-3">
                    <Select defaultValue="challenge">
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select action" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="block">Block Traffic</SelectItem>
                        <SelectItem value="challenge">Challenge Request</SelectItem>
                        <SelectItem value="alert">Alert Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-neutral-500">
                    Presents a challenge to verify legitimate traffic
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-neutral-50">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-medium">Minor Variations</CardTitle>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center mb-3">
                    <Select defaultValue="alert">
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select action" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="block">Block Traffic</SelectItem>
                        <SelectItem value="challenge">Challenge Request</SelectItem>
                        <SelectItem value="alert">Alert Only</SelectItem>
                        <SelectItem value="ignore">Ignore</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-neutral-500">
                    Records the anomaly without taking action
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Anomaly Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Anomaly Details</DialogTitle>
            <DialogDescription>
              Detailed information about the detected anomaly
            </DialogDescription>
          </DialogHeader>
          
          {selectedAnomaly && (
            <div className="space-y-6">
              {/* Header info */}
              <div className="flex justify-between items-start border-b pb-4">
                <div>
                  <h3 className="text-lg font-semibold flex items-center">
                    <AlertTriangle className={`h-5 w-5 mr-2 ${selectedAnomaly.score >= 90 ? 'text-red-500' : 'text-amber-500'}`} />
                    {selectedAnomaly.type}
                  </h3>
                  <p className="text-sm text-neutral-500 mt-1">
                    Detected on {new Date(selectedAnomaly.timestamp).toLocaleString()}
                  </p>
                </div>
                <div>
                  <div className="flex items-center mb-1">
                    <div className={`w-3 h-3 rounded-full ${getScoreSeverity(selectedAnomaly.score)} mr-2`}></div>
                    <span className="font-semibold">{selectedAnomaly.score}% Confidence</span>
                  </div>
                  <div>{getStatusBadge(selectedAnomaly.status)}</div>
                </div>
              </div>
              
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-neutral-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Domain</CardTitle>
                  </CardHeader>
                  <CardContent className="text-lg font-semibold">
                    {selectedAnomaly.domainName}
                  </CardContent>
                </Card>
                
                <Card className="bg-neutral-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Source IP</CardTitle>
                  </CardHeader>
                  <CardContent className="text-lg font-semibold">
                    {selectedAnomaly.source}
                  </CardContent>
                </Card>
                
                <Card className="bg-neutral-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Detection Method</CardTitle>
                  </CardHeader>
                  <CardContent className="text-lg font-semibold">
                    Machine Learning
                  </CardContent>
                </Card>
              </div>
              
              {/* Analysis & Recommendations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">Analysis</h3>
                  <div className="bg-neutral-50 p-4 rounded-md text-sm space-y-4">
                    <p>
                      This anomaly was detected using ML pattern recognition. Based on historical traffic patterns, 
                      this behavior represents a significant deviation from established baselines.
                    </p>
                    <p>
                      The key contributing factors to this detection:
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Unusual request frequency (180 req/min vs baseline 25 req/min)</li>
                      <li>Deviation in traffic distribution across endpoints</li>
                      <li>Unusual access patterns to sensitive resources</li>
                      <li>Detection of known attack signatures in request payloads</li>
                    </ul>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-3">Recommendations</h3>
                  <div className="bg-neutral-50 p-4 rounded-md text-sm space-y-3">
                    <div className="flex items-start">
                      <div className="bg-amber-100 p-1 rounded mr-2 mt-0.5">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                      </div>
                      <p>Investigate the source IP for potential compromise or malicious intent</p>
                    </div>
                    <div className="flex items-start">
                      <div className="bg-amber-100 p-1 rounded mr-2 mt-0.5">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                      </div>
                      <p>Analyze recent changes to application that may have triggered this behavior</p>
                    </div>
                    <div className="flex items-start">
                      <div className="bg-red-100 p-1 rounded mr-2 mt-0.5">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      </div>
                      <p>Consider temporary rate limiting for this source IP</p>
                    </div>
                    <div className="flex items-start">
                      <div className="bg-green-100 p-1 rounded mr-2 mt-0.5">
                        <AlertTriangle className="h-4 w-4 text-green-600" />
                      </div>
                      <p>Update threat detection rules based on this pattern</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="space-x-2">
                  <Button variant="outline" size="sm">Mark as Resolved</Button>
                  <Button variant="outline" size="sm">Start Investigation</Button>
                </div>
                <div>
                  <Button variant="destructive" size="sm">Block Source IP</Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AnomalyDetectionPage;