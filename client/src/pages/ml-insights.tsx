import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { Rule, RequestLog } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import { 
  Brain, 
  Play, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle, 
  Code,
  Plus,
  RotateCw,
  Lightbulb,
  Filter,
  FileCheck,
  XCircle
} from "lucide-react";

// Form schemas
const trainingFormSchema = z.object({
  learningRate: z.number().min(0.001).max(0.1).default(0.01),
  epochs: z.number().int().min(1).max(100).default(20),
  modelComplexity: z.number().int().min(1).max(5).default(3),
  useHistoricalData: z.boolean().default(true),
});

type TrainingFormValues = z.infer<typeof trainingFormSchema>;

export default function MLInsights() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [suggestedRules, setSuggestedRules] = useState<any[]>([]);
  const [selectedTab, setSelectedTab] = useState("training");
  const [modelTrained, setModelTrained] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedRule, setSelectedRule] = useState<any | null>(null);

  // Query to fetch request logs for analysis
  const { data: requestLogs, isLoading: logsLoading } = useQuery({
    queryKey: ["/api/requests"],
  });

  // Query to fetch ML metrics
  const { data: mlMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["/api/ml-insights/metrics"],
    enabled: false, // Disabled until implemented on the backend
  });

  // Form for training settings
  const form = useForm<TrainingFormValues>({
    resolver: zodResolver(trainingFormSchema),
    defaultValues: {
      learningRate: 0.01,
      epochs: 20,
      modelComplexity: 3,
      useHistoricalData: true,
    },
  });

  // Mock the training process
  const handleTrainModel = (values: TrainingFormValues) => {
    setIsTraining(true);
    setTrainingProgress(0);

    // Simulate training progress
    const interval = setInterval(() => {
      setTrainingProgress((prev) => {
        const newProgress = prev + Math.random() * 10;
        if (newProgress >= 100) {
          clearInterval(interval);
          setIsTraining(false);
          
          // Set mock performance metrics
          setPerformanceMetrics({
            accuracy: 0.92,
            precision: 0.89,
            recall: 0.94,
            f1Score: 0.91,
            falsePositiveRate: 0.07,
            trainingTime: 142, // seconds
            datasetSize: requestLogs?.data?.length || 0,
            trainingParameters: values
          });
          
          // Set model trained state
          setModelTrained(true);
          
          // Set suggested rules
          setSuggestedRules([
            {
              id: 1,
              name: "Detected SQL Injection Pattern",
              pattern: "'(\\s)*(OR|AND)(\\s)+[0-9]+(\\s)*=",
              confidence: 0.94,
              matchLocation: "queryParams",
              action: "block",
              attackType: "sqli"
            },
            {
              id: 2,
              name: "Possible XSS Vector",
              pattern: "<script>(.*?)</script>",
              confidence: 0.87,
              matchLocation: "body",
              action: "block",
              attackType: "xss"
            },
            {
              id: 3,
              name: "Suspicious User-Agent",
              pattern: "(scanner|nikto|burp|sqlmap)",
              confidence: 0.72,
              matchLocation: "headers",
              action: "alert",
              attackType: "reconnaissance"
            },
            {
              id: 4,
              name: "False Positive Detection Pattern",
              pattern: "ORDER\\s+BY\\s+[a-zA-Z0-9_]+",
              confidence: 0.63,
              matchLocation: "body",
              action: "alert",
              attackType: "sqli",
              isFalsePositive: true
            }
          ]);
          
          setSelectedTab("rules");
          toast({
            title: "Training Complete",
            description: "ML model has finished training and generated new rule suggestions.",
          });
          return 100;
        }
        return newProgress;
      });
    }, 500);
  };

  // Mutation to add a suggested rule
  const addRuleMutation = useMutation({
    mutationFn: (rule: any) =>
      apiRequest<Rule>("/api/rules", {
        method: "POST",
        body: JSON.stringify({
          name: rule.name,
          description: `ML generated rule - ${rule.attackType}`,
          pattern: rule.pattern,
          attackType: rule.attackType,
          matchLocation: rule.matchLocation,
          action: rule.action,
          isEnabled: true,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rules"] });
      setShowAddDialog(false);
      toast({
        title: "Rule Added",
        description: "The ML-generated rule has been added to your ruleset.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add the rule. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAddRule = (rule: any) => {
    setSelectedRule(rule);
    setShowAddDialog(true);
  };

  const handleConfirmAddRule = () => {
    if (selectedRule) {
      addRuleMutation.mutate(selectedRule);
    }
  };

  const handleShowDetails = (rule: any) => {
    setSelectedRule(rule);
    setShowDetailsDialog(true);
  };

  // Format confidence as percentage
  const formatConfidence = (confidence: number) => {
    return `${Math.round(confidence * 100)}%`;
  };

  // Render the confidence bar with appropriate colors
  const renderConfidenceBar = (confidence: number) => {
    let color = "bg-red-500";
    if (confidence >= 0.8) {
      color = "bg-green-500";
    } else if (confidence >= 0.6) {
      color = "bg-yellow-500";
    }

    return (
      <div className="flex items-center">
        <div className="w-24 h-2 bg-gray-200 rounded-full mr-2">
          <div
            className={`h-2 rounded-full ${color}`}
            style={{ width: `${confidence * 100}%` }}
          ></div>
        </div>
        <span>{formatConfidence(confidence)}</span>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">ML Insights</h1>
        <p className="text-neutral-medium">
          Train machine learning models on your traffic data to detect patterns and generate rules
        </p>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="training">
            <Brain className="w-4 h-4 mr-2" />
            Model Training
          </TabsTrigger>
          <TabsTrigger value="rules">
            <Lightbulb className="w-4 h-4 mr-2" />
            Suggested Rules
          </TabsTrigger>
          <TabsTrigger value="metrics">
            <BarChart className="w-4 h-4 mr-2" />
            Performance Metrics
          </TabsTrigger>
          <TabsTrigger value="false-positives">
            <XCircle className="w-4 h-4 mr-2" />
            False Positives
          </TabsTrigger>
        </TabsList>

        {/* Training Tab */}
        <TabsContent value="training" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="mr-2 h-5 w-5 text-primary" />
                  Model Training
                </CardTitle>
                <CardDescription>
                  Configure and train the ML model on your traffic data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleTrainModel)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="learningRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Learning Rate ({field.value})</FormLabel>
                          <FormControl>
                            <Slider
                              min={0.001}
                              max={0.1}
                              step={0.001}
                              value={[field.value]}
                              onValueChange={(vals) => field.onChange(vals[0])}
                            />
                          </FormControl>
                          <FormDescription>
                            Controls how quickly the model adapts to patterns
                          </FormDescription>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="epochs"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Training Epochs ({field.value})</FormLabel>
                          <FormControl>
                            <Slider
                              min={1}
                              max={100}
                              step={1}
                              value={[field.value]}
                              onValueChange={(vals) => field.onChange(vals[0])}
                            />
                          </FormControl>
                          <FormDescription>
                            Number of training cycles through the dataset
                          </FormDescription>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="modelComplexity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Model Complexity ({field.value})</FormLabel>
                          <FormControl>
                            <Slider
                              min={1}
                              max={5}
                              step={1}
                              value={[field.value]}
                              onValueChange={(vals) => field.onChange(vals[0])}
                            />
                          </FormControl>
                          <FormDescription>
                            Higher values increase model complexity but require more data
                          </FormDescription>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="useHistoricalData"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Use Historical Data</FormLabel>
                            <FormDescription>
                              Include older logs for better pattern detection
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

                    {isTraining ? (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-neutral-medium">Training Progress</span>
                          <span className="text-sm font-medium">{Math.round(trainingProgress)}%</span>
                        </div>
                        <Progress value={trainingProgress} className="h-2" />
                      </div>
                    ) : (
                      <Button type="submit" className="w-full" disabled={isTraining}>
                        <Play className="mr-2 h-4 w-4" />
                        Start Training
                      </Button>
                    )}
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileCheck className="mr-2 h-5 w-5 text-primary" />
                  Training Data Overview
                </CardTitle>
                <CardDescription>
                  Statistics about data available for training
                </CardDescription>
              </CardHeader>
              <CardContent>
                {logsLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-neutral-medium">Total Requests</div>
                      <div className="text-2xl font-bold">{requestLogs?.data?.length || 0}</div>
                    </div>
                    <div>
                      <div className="text-sm text-neutral-medium">Blocked Requests</div>
                      <div className="text-2xl font-bold">
                        {requestLogs?.data?.filter((log: RequestLog) => log.isBlocked).length || 0}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-neutral-medium">Attack Types</div>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <Badge className="bg-red-100 text-red-800 border-red-300">SQL Injection</Badge>
                        <Badge className="bg-orange-100 text-orange-800 border-orange-300">XSS</Badge>
                        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Path Traversal</Badge>
                        <Badge className="bg-blue-100 text-blue-800 border-blue-300">Others</Badge>
                      </div>
                    </div>
                    <div className="pt-2">
                      <div className="text-sm text-neutral-medium mb-1">Data Quality</div>
                      <div className="flex items-center">
                        <div className="w-full h-2 bg-gray-200 rounded-full">
                          <div className="h-2 rounded-full bg-green-500" style={{ width: "75%" }}></div>
                        </div>
                        <span className="ml-2 text-sm font-medium">75%</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  <RotateCw className="mr-2 h-4 w-4" />
                  Refresh Data
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        {/* Suggested Rules Tab */}
        <TabsContent value="rules">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lightbulb className="mr-2 h-5 w-5 text-primary" />
                ML-Suggested Rules
              </CardTitle>
              <CardDescription>
                Rules generated from pattern analysis of your traffic data
              </CardDescription>
            </CardHeader>
            <CardContent>
              {suggestedRules.length === 0 ? (
                <div className="py-8 text-center">
                  <Brain className="mx-auto h-12 w-12 text-neutral-300" />
                  <h3 className="mt-4 text-lg font-semibold">No rule suggestions yet</h3>
                  <p className="text-neutral-medium mt-2">
                    Train your ML model to generate rule suggestions based on traffic patterns
                  </p>
                  <Button
                    onClick={() => setSelectedTab("training")}
                    className="mt-4"
                  >
                    Go to Training
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rule Name</TableHead>
                      <TableHead>Attack Type</TableHead>
                      <TableHead>Match Location</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {suggestedRules.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            {rule.isFalsePositive && (
                              <Badge className="mr-2 bg-red-100 text-red-800 border-red-300">
                                False Positive
                              </Badge>
                            )}
                            {rule.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {rule.attackType}
                          </Badge>
                        </TableCell>
                        <TableCell>{rule.matchLocation}</TableCell>
                        <TableCell>{renderConfidenceBar(rule.confidence)}</TableCell>
                        <TableCell>
                          <Badge className={rule.action === "block" ? "bg-red-100 text-red-800 border-red-300" : "bg-blue-100 text-blue-800 border-blue-300"}>
                            {rule.action}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleShowDetails(rule)}
                              className="mr-2"
                            >
                              <Code className="h-4 w-4" />
                              <span className="sr-only">View Pattern</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAddRule(rule)}
                              className="text-green-500 hover:text-green-700 hover:bg-green-50"
                              disabled={rule.isFalsePositive}
                            >
                              <Plus className="h-4 w-4" />
                              <span className="sr-only">Add Rule</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart className="mr-2 h-5 w-5 text-primary" />
                Model Performance Metrics
              </CardTitle>
              <CardDescription>
                Accuracy and performance metrics for the ML model
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!modelTrained ? (
                <div className="py-8 text-center">
                  <BarChart className="mx-auto h-12 w-12 text-neutral-300" />
                  <h3 className="mt-4 text-lg font-semibold">Model metrics not available</h3>
                  <p className="text-neutral-medium mt-2">
                    Train your ML model first to generate performance metrics
                  </p>
                  <Button
                    onClick={() => setSelectedTab("training")}
                    className="mt-4"
                  >
                    Go to Training
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border rounded-lg p-4 shadow-sm">
                      <div className="text-sm text-neutral-medium">Accuracy</div>
                      <div className="text-2xl font-bold text-green-600">
                        {(performanceMetrics.accuracy * 100).toFixed(1)}%
                      </div>
                      <div className="mt-1 text-xs text-neutral-medium">
                        Overall model prediction accuracy
                      </div>
                    </div>
                    <div className="border rounded-lg p-4 shadow-sm">
                      <div className="text-sm text-neutral-medium">Precision</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {(performanceMetrics.precision * 100).toFixed(1)}%
                      </div>
                      <div className="mt-1 text-xs text-neutral-medium">
                        True positives / (True positives + False positives)
                      </div>
                    </div>
                    <div className="border rounded-lg p-4 shadow-sm">
                      <div className="text-sm text-neutral-medium">Recall</div>
                      <div className="text-2xl font-bold text-purple-600">
                        {(performanceMetrics.recall * 100).toFixed(1)}%
                      </div>
                      <div className="mt-1 text-xs text-neutral-medium">
                        True positives / (True positives + False negatives)
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <h3 className="text-lg font-medium mb-2">Performance Breakdown</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">F1 Score</span>
                          <span className="text-sm font-medium">{(performanceMetrics.f1Score * 100).toFixed(1)}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full">
                          <div 
                            className="h-2 rounded-full bg-teal-500" 
                            style={{ width: `${performanceMetrics.f1Score * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">False Positive Rate</span>
                          <span className="text-sm font-medium">{(performanceMetrics.falsePositiveRate * 100).toFixed(1)}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full">
                          <div 
                            className="h-2 rounded-full bg-yellow-500" 
                            style={{ width: `${performanceMetrics.falsePositiveRate * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="border rounded-lg p-4">
                      <h3 className="text-sm font-medium mb-2">Training Parameters</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-neutral-medium">Learning Rate:</span>
                          <span>{performanceMetrics.trainingParameters.learningRate}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-medium">Epochs:</span>
                          <span>{performanceMetrics.trainingParameters.epochs}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-medium">Model Complexity:</span>
                          <span>{performanceMetrics.trainingParameters.modelComplexity}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-medium">Used Historical Data:</span>
                          <span>{performanceMetrics.trainingParameters.useHistoricalData ? "Yes" : "No"}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <h3 className="text-sm font-medium mb-2">Dataset Information</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-neutral-medium">Dataset Size:</span>
                          <span>{performanceMetrics.datasetSize} requests</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-medium">Training Time:</span>
                          <span>{performanceMetrics.trainingTime} seconds</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-medium">Last Trained:</span>
                          <span>{new Date().toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex justify-center">
                    <Button 
                      onClick={() => setSelectedTab("rules")} 
                      className="mr-2"
                    >
                      <Lightbulb className="mr-2 h-4 w-4" />
                      View Suggested Rules
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedTab("training")}
                    >
                      <Brain className="mr-2 h-4 w-4" />
                      Retrain Model
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* False Positives Tab */}
        <TabsContent value="false-positives">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <XCircle className="mr-2 h-5 w-5 text-primary" />
                False Positive Analysis
              </CardTitle>
              <CardDescription>
                Analyze and manage false positive detections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-amber-800">False Positive Training</h4>
                      <p className="text-sm text-amber-700 mt-1">
                        The system has identified potential false positives in your rules. 
                        Review and mark these incidents to improve your ML model's accuracy.
                      </p>
                    </div>
                  </div>
                </div>

                {suggestedRules.filter(r => r.isFalsePositive).length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pattern</TableHead>
                        <TableHead>Attack Type</TableHead>
                        <TableHead>False Positive Reason</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {suggestedRules.filter(r => r.isFalsePositive).map((rule) => (
                        <TableRow key={rule.id}>
                          <TableCell className="font-mono text-sm">
                            {rule.pattern}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {rule.attackType}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            Common in legitimate business queries
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm" className="mr-2">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Confirm
                            </Button>
                            <Button variant="outline" size="sm">
                              <Filter className="h-4 w-4 mr-1" />
                              Adjust
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="py-8 text-center">
                    <XCircle className="mx-auto h-12 w-12 text-neutral-300" />
                    <h3 className="mt-4 text-lg font-semibold">No false positives detected</h3>
                    <p className="text-neutral-medium mt-2">
                      The system will automatically detect and list potential false positives here
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Rule Dialog */}
      <AlertDialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add ML-Generated Rule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to add this rule to your active ruleset?
              {selectedRule && (
                <div className="mt-4 p-3 bg-gray-50 rounded-md">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="font-medium">Name:</div>
                    <div>{selectedRule.name}</div>
                    <div className="font-medium">Pattern:</div>
                    <div className="font-mono">{selectedRule.pattern}</div>
                    <div className="font-medium">Attack Type:</div>
                    <div className="capitalize">{selectedRule.attackType}</div>
                    <div className="font-medium">Confidence:</div>
                    <div>{formatConfidence(selectedRule.confidence)}</div>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAddRule}>
              Add Rule
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Pattern Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pattern Details</DialogTitle>
            <DialogDescription>
              Technical details about the ML-generated rule pattern
            </DialogDescription>
          </DialogHeader>
          {selectedRule && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-1">Regular Expression Pattern</h4>
                <div className="font-mono bg-gray-50 p-3 rounded-md text-sm">
                  {selectedRule.pattern}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">Pattern Analysis</h4>
                <p className="text-sm">
                  This pattern will match requests where {selectedRule.matchLocation} contains
                  {selectedRule.attackType === "sqli" ? " SQL syntax that could be used for injection attacks." : 
                   selectedRule.attackType === "xss" ? " JavaScript that might execute in the browser." :
                   " potentially malicious patterns."} 
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">Confidence Analysis</h4>
                <div className="flex items-center">
                  <div className="w-full h-2 bg-gray-200 rounded-full">
                    <div 
                      className={`h-2 rounded-full ${
                        selectedRule.confidence >= 0.8 ? "bg-green-500" :
                        selectedRule.confidence >= 0.6 ? "bg-yellow-500" : "bg-red-500"
                      }`} 
                      style={{ width: `${selectedRule.confidence * 100}%` }}
                    ></div>
                  </div>
                  <span className="ml-2 text-sm font-medium">
                    {formatConfidence(selectedRule.confidence)}
                  </span>
                </div>
                <p className="text-sm mt-2">
                  {selectedRule.confidence >= 0.8 ? 
                    "High confidence suggests this pattern accurately identifies real attacks with minimal false positives." :
                    selectedRule.confidence >= 0.6 ?
                    "Medium confidence - this pattern may need fine-tuning to reduce false positives." :
                    "Low confidence - consider using alert action instead of block to avoid disrupting legitimate traffic."}
                </p>
              </div>
              {selectedRule.isFalsePositive && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <div className="flex">
                    <XCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-red-800">Potential False Positive</h4>
                      <p className="text-sm text-red-700 mt-1">
                        This pattern has been identified as a potential false positive because it matches common legitimate traffic patterns.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            {selectedRule && !selectedRule.isFalsePositive && (
              <Button onClick={() => {
                setShowDetailsDialog(false);
                setShowAddDialog(true);
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Add to Rules
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Internal component for chart
const BarChart = ({ className, ...props }: React.SVGAttributes<SVGElement>) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("w-4 h-4", className)}
      {...props}
    >
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M8 17.2V12" />
      <path d="M12 17.2V6.8" />
      <path d="M16 17.2V10" />
    </svg>
  );
};