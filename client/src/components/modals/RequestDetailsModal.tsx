import React from "react";
import { RequestLog } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface RequestDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: RequestLog;
}

export function RequestDetailsModal({ isOpen, onClose, request }: RequestDetailsModalProps) {
  // Format the headers for display
  const formattedHeaders = Object.entries(request.headers)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");

  // Format the body for display if present
  const formattedBody = request.body ? request.body : "";

  // Identify the matched pattern (simplified implementation)
  const getMatchedPattern = () => {
    // In a real implementation, this would come from the detection rules
    // Here we're just making a simple guess based on the attack type
    if (request.attackType === "SQL Injection") {
      return "'OR 1=1; --";
    } else if (request.attackType === "XSS") {
      return "<script>alert(1)</script>";
    } else if (request.attackType === "Path Traversal") {
      return "../../../etc/passwd";
    }
    return "Unknown pattern";
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request Details</DialogTitle>
        </DialogHeader>
        
        <div className="p-4">
          {/* Request Overview */}
          <div className="mb-4">
            <h4 className="font-medium mb-2">Overview</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-neutral-medium">Time</p>
                <p className="font-medium">
                  {format(new Date(request.timestamp), "yyyy-MM-dd HH:mm:ss")}
                </p>
              </div>
              <div>
                <p className="text-neutral-medium">IP Address</p>
                <p className="font-medium">{request.ipAddress}</p>
              </div>
              <div>
                <p className="text-neutral-medium">User Agent</p>
                <p className="font-medium text-xs">
                  {(request.headers as any)["user-agent"] || "Unknown"}
                </p>
              </div>
              <div>
                <p className="text-neutral-medium">Method</p>
                <p className="font-medium">
                  <Badge method={request.method}>{request.method}</Badge>
                </p>
              </div>
              <div>
                <p className="text-neutral-medium">Path</p>
                <p className="font-medium font-mono text-xs">{request.path}</p>
              </div>
              <div>
                <p className="text-neutral-medium">Threat Type</p>
                <p className="font-medium">
                  {request.attackType ? (
                    <Badge variant="error" className="text-xs">
                      {request.attackType}
                    </Badge>
                  ) : (
                    "None"
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Request Headers */}
          <div className="mb-4">
            <h4 className="font-medium mb-2">Headers</h4>
            <div className="bg-neutral-dark bg-opacity-5 p-3 rounded-md font-mono text-xs overflow-x-auto">
              <pre>{formattedHeaders}</pre>
            </div>
          </div>

          {/* Request Body */}
          {formattedBody && (
            <div className="mb-4">
              <h4 className="font-medium mb-2">Body</h4>
              <div className="bg-neutral-dark bg-opacity-5 p-3 rounded-md font-mono text-xs overflow-x-auto">
                <pre className="whitespace-pre-wrap">{formattedBody}</pre>
              </div>
            </div>
          )}

          {/* Detection Details */}
          {request.attackType && (
            <div className="mb-4">
              <h4 className="font-medium mb-2">Detection Details</h4>
              <div className="bg-red-50 border-l-4 border-error p-3 rounded-r-md">
                <p className="text-sm font-medium text-error mb-1">
                  {request.attackType} detected
                </p>
                <p className="text-sm text-neutral-dark">
                  {request.attackType === "SQL Injection" && "Single quote in password field followed by SQL syntax. Matches rule ID: SQL-INJ-001"}
                  {request.attackType === "XSS" && "Script tag detected in request parameters. Matches rule ID: XSS-001"}
                  {request.attackType === "Path Traversal" && "Directory traversal sequence detected in URL. Matches rule ID: PATH-001"}
                  {request.attackType !== "SQL Injection" && request.attackType !== "XSS" && request.attackType !== "Path Traversal" && 
                    `Suspicious pattern detected. Matches rule ID: ${request.ruleId || "Unknown"}`}
                </p>
                <p className="mt-2 text-sm">
                  <span className="font-medium">Matched pattern:</span>
                  <code className="bg-red-100 px-1 rounded ml-1">
                    {getMatchedPattern()}
                  </code>
                </p>
              </div>
            </div>
          )}

          {/* Action */}
          <div className="flex justify-end space-x-3 mt-6">
            <Button variant="outline" className="text-neutral-medium">
              Add to Allowlist
            </Button>
            <Button className="bg-primary text-white hover:bg-secondary">
              Create Custom Rule
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
