import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { format } from "date-fns";
import { RequestDetail } from "../modals/RequestDetail";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function RequestTable() {
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/blocked-requests'],
  });
  
  const handleViewRequest = (id: number) => {
    setSelectedRequestId(id);
    setIsModalOpen(true);
  };
  
  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="flex justify-between items-center">
          <CardTitle>Recent Blocked Requests</CardTitle>
          <Skeleton className="w-16 h-5" />
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left bg-slate-lighter text-slate text-xs uppercase tracking-wider">
                <th className="py-3 px-6 whitespace-nowrap">Time</th>
                <th className="py-3 px-6 whitespace-nowrap">IP Address</th>
                <th className="py-3 px-6 whitespace-nowrap">Method</th>
                <th className="py-3 px-6 whitespace-nowrap">Path</th>
                <th className="py-3 px-6 whitespace-nowrap">Attack Type</th>
                <th className="py-3 px-6 whitespace-nowrap">Rule ID</th>
                <th className="py-3 px-6 whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-lighter">
              {[...Array(5)].map((_, index) => (
                <tr key={index} className="text-sm hover:bg-slate-lighter/50">
                  <td className="py-3 px-6 whitespace-nowrap text-slate-light">
                    <Skeleton className="h-4 w-16" />
                  </td>
                  <td className="py-3 px-6 whitespace-nowrap font-mono">
                    <Skeleton className="h-4 w-24" />
                  </td>
                  <td className="py-3 px-6 whitespace-nowrap">
                    <Skeleton className="h-6 w-12 rounded" />
                  </td>
                  <td className="py-3 px-6 whitespace-nowrap font-mono text-xs">
                    <Skeleton className="h-4 w-32" />
                  </td>
                  <td className="py-3 px-6 whitespace-nowrap">
                    <Skeleton className="h-6 w-20 rounded" />
                  </td>
                  <td className="py-3 px-6 whitespace-nowrap font-mono text-xs">
                    <Skeleton className="h-4 w-16" />
                  </td>
                  <td className="py-3 px-6 whitespace-nowrap">
                    <Skeleton className="h-5 w-5 rounded" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card>
        <CardHeader className="flex justify-between items-center">
          <CardTitle>Recent Blocked Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-500 p-4">Failed to load blocked requests</div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <>
      <Card className="overflow-hidden mb-6">
        <CardHeader className="flex justify-between items-center">
          <CardTitle>Recent Blocked Requests</CardTitle>
          <button className="text-sm text-primary hover:text-primary-dark">View All</button>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left bg-slate-lighter text-slate text-xs uppercase tracking-wider">
                <th className="py-3 px-6 whitespace-nowrap">Time</th>
                <th className="py-3 px-6 whitespace-nowrap">IP Address</th>
                <th className="py-3 px-6 whitespace-nowrap">Method</th>
                <th className="py-3 px-6 whitespace-nowrap">Path</th>
                <th className="py-3 px-6 whitespace-nowrap">Attack Type</th>
                <th className="py-3 px-6 whitespace-nowrap">Rule ID</th>
                <th className="py-3 px-6 whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-lighter">
              {data && data.length > 0 ? (
                data.slice(0, 5).map((request) => (
                  <tr key={request.id} className="text-sm hover:bg-slate-lighter/50">
                    <td className="py-3 px-6 whitespace-nowrap text-slate-light">
                      <time dateTime={request.timestamp}>
                        {format(new Date(request.timestamp), 'HH:mm:ss')}
                      </time>
                    </td>
                    <td className="py-3 px-6 whitespace-nowrap font-mono">
                      <span className="text-slate">{request.ipAddress}</span>
                    </td>
                    <td className="py-3 px-6 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-xs ${
                        request.method === 'GET' ? 'bg-accent/10 text-accent' :
                        request.method === 'POST' ? 'bg-secondary/10 text-secondary' :
                        request.method === 'PUT' ? 'bg-warning/10 text-warning' :
                        request.method === 'DELETE' ? 'bg-error/10 text-error' :
                        'bg-slate-light/10 text-slate'
                      }`}>
                        {request.method}
                      </span>
                    </td>
                    <td className="py-3 px-6 whitespace-nowrap font-mono text-xs overflow-hidden truncate max-w-[200px]">
                      {request.path}
                    </td>
                    <td className="py-3 px-6 whitespace-nowrap">
                      <span className="bg-error/10 text-error px-2 py-1 rounded text-xs">
                        {request.attackType}
                      </span>
                    </td>
                    <td className="py-3 px-6 whitespace-nowrap font-mono text-xs">
                      {request.ruleId}
                    </td>
                    <td className="py-3 px-6 whitespace-nowrap">
                      <button 
                        className="text-primary hover:text-primary-dark"
                        onClick={() => handleViewRequest(request.id)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-4 px-6 text-center text-slate-light">
                    No blocked requests found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
      
      {isModalOpen && selectedRequestId !== null && (
        <RequestDetail 
          requestId={selectedRequestId} 
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedRequestId(null);
          }}
        />
      )}
    </>
  );
}
