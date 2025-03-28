import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RequestsResponse, RequestLog } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, Search, Filter } from "lucide-react";
import { RequestDetailsModal } from "@/components/modals/RequestDetailsModal";
import { format } from "date-fns";

export function RecentEvents() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const limit = 5;
  const [selectedRequest, setSelectedRequest] = useState<RequestLog | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading, error } = useQuery<RequestsResponse>({
    queryKey: [`/api/requests?limit=${limit}&offset=${(page - 1) * limit}`],
  });

  const handleViewRequest = (request: RequestLog) => {
    setSelectedRequest(request);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  // Filter requests based on search query
  const filteredRequests = data?.data.filter(req => 
    req.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.ipAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (req.attackType && req.attackType.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (isLoading) {
    return (
      <Card>
        <div className="p-4 border-b border-neutral-light">
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-full p-4">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="mb-4">
                <Skeleton className="h-12 w-full" />
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <p className="text-error">Error loading recent events</p>
        </CardContent>
      </Card>
    );
  }

  const totalPages = Math.ceil((data?.pagination.total || 0) / limit);

  return (
    <>
      <Card>
        <div className="flex justify-between items-center p-4 border-b border-neutral-light">
          <h3 className="font-semibold">Recent Blocked Requests</h3>
          <div className="flex space-x-2">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search requests..."
                className="pl-8 pr-3 py-1 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-3 top-2 text-neutral-medium text-sm h-4 w-4" />
            </div>
            <Button className="bg-primary text-white px-3 py-1 rounded-md text-sm hover:bg-secondary">
              <Filter className="h-4 w-4 mr-1" /> Filter
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-neutral-light bg-opacity-50">
                <th className="py-3 px-4 text-left text-xs font-medium text-neutral-medium tracking-wider">Time</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-neutral-medium tracking-wider">IP Address</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-neutral-medium tracking-wider">Method</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-neutral-medium tracking-wider">Path</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-neutral-medium tracking-wider">Threat Type</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-neutral-medium tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-light">
              {filteredRequests && filteredRequests.length > 0 ? (
                filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-blue-50">
                    <td className="px-4 py-3 text-sm">
                      {format(new Date(request.timestamp), "yyyy-MM-dd HH:mm:ss")}
                    </td>
                    <td className="px-4 py-3 text-sm">{request.ipAddress}</td>
                    <td className="px-4 py-3 text-sm">
                      <Badge method={request.method}>{request.method}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-xs">{request.path}</td>
                    <td className="px-4 py-3">
                      {request.attackType && (
                        <Badge variant="error" className="text-xs">
                          {request.attackType}
                        </Badge>
                      )}
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
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-neutral-medium">
                    No blocked requests found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-neutral-light px-4 py-3 flex items-center justify-between">
          <div className="text-sm text-neutral-medium">
            Showing {data?.data.length ? (page - 1) * limit + 1 : 0}-
            {Math.min(page * limit, data?.pagination.total || 0)} of {data?.pagination.total || 0} blocked requests
          </div>
          <div className="flex space-x-1">
            <Button
              variant="outline"
              size="sm"
              className="px-3 py-1 border border-neutral-light rounded-md text-neutral-medium text-sm hover:bg-neutral-light disabled:opacity-50"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
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
                  className={`px-3 py-1 border border-neutral-light rounded-md text-sm ${
                    pageNumber === page
                      ? "bg-primary text-white"
                      : "text-neutral-medium hover:bg-neutral-light"
                  }`}
                  onClick={() => setPage(pageNumber)}
                >
                  {pageNumber}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              className="px-3 py-1 border border-neutral-light rounded-md text-neutral-medium text-sm hover:bg-neutral-light disabled:opacity-50"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Button>
          </div>
        </div>
      </Card>

      {selectedRequest && (
        <RequestDetailsModal 
          isOpen={modalOpen} 
          onClose={closeModal} 
          request={selectedRequest} 
        />
      )}
    </>
  );
}
