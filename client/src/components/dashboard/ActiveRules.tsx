import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";

export function ActiveRules() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/rules'],
  });
  
  const updateRuleMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: number, enabled: boolean }) => {
      return await apiRequest('PATCH', `/api/rules/${id}`, { isEnabled: enabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rules'] });
      toast({
        title: "Rule Updated",
        description: "The rule has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update rule",
        variant: "destructive",
      });
      console.error("Error updating rule:", error);
    }
  });
  
  const handleToggleRule = (id: number, currentEnabled: boolean) => {
    updateRuleMutation.mutate({ id, enabled: !currentEnabled });
  };
  
  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="flex justify-between items-center">
          <CardTitle>Active Security Rules</CardTitle>
          <Skeleton className="w-24 h-5" />
        </CardHeader>
        <CardContent>
          {[...Array(4)].map((_, index) => (
            <div key={index} className="flex justify-between items-center mb-4 pb-4 border-b border-slate-lighter last:border-0 last:pb-0 last:mb-0">
              <div>
                <Skeleton className="h-5 w-40 mb-2" />
                <Skeleton className="h-4 w-64" />
              </div>
              <div className="flex items-center space-x-3">
                <Skeleton className="h-6 w-16 rounded" />
                <Skeleton className="h-5 w-10 rounded-full" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card>
        <CardHeader className="flex justify-between items-center">
          <CardTitle>Active Security Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-500 p-4">Failed to load rules</div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex justify-between items-center">
        <CardTitle>Active Security Rules</CardTitle>
        <button className="text-sm text-primary hover:text-primary-dark">Manage Rules</button>
      </CardHeader>
      <CardContent>
        {data && data.length > 0 ? (
          data.slice(0, 5).map((rule) => (
            <div key={rule.id} className="flex justify-between items-center mb-4 pb-4 border-b border-slate-lighter last:border-0 last:pb-0 last:mb-0">
              <div>
                <h4 className="font-medium text-sm">{rule.name}</h4>
                <p className="text-xs text-slate-light mt-1">{rule.description}</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">{rule.ruleIdentifier}</div>
                <Switch 
                  checked={rule.isEnabled}
                  onCheckedChange={() => handleToggleRule(rule.id, rule.isEnabled)}
                  disabled={updateRuleMutation.isPending}
                />
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-4 text-slate-light">
            No security rules found
          </div>
        )}
      </CardContent>
    </Card>
  );
}
