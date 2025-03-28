import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

interface StatusCardProps {
  title: string;
  value: string | React.ReactNode;
  subText?: string;
  icon: React.ReactNode;
  badge?: React.ReactNode;
}

function StatusCard({ title, value, subText, icon, badge }: StatusCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-slate-light">{title}</h3>
        <div className="h-8 w-8 rounded-full bg-opacity-10 flex items-center justify-center">
          {icon}
        </div>
      </div>
      <div className="flex items-center">
        <div className="text-2xl font-bold text-slate mr-2">{value}</div>
        {badge && badge}
      </div>
      {subText && <div className="text-sm text-slate-light mt-1">{subText}</div>}
    </div>
  );
}

export function StatusCards() {
  const { data = {}, isLoading, error } = useQuery({
    queryKey: ['/api/stats'],
    staleTime: 1000 * 60, // 1 minute
  });
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            <div className="flex items-center">
              <Skeleton className="h-8 w-16 mr-2" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-32 mt-1" />
          </div>
        ))}
      </div>
    );
  }
  
  if (error) {
    return <div className="text-red-500">Error loading status information</div>;
  }
  
  // Safely extract data with proper fallbacks
  const status = data.status || {};
  const requests = data.requests || { total: 0, blocked: 0, allowed: 0 };
  const rules = data.rules || { total: 0, enabled: 0, disabled: 0 };
  
  const formatLastUpdated = () => {
    if (!status.lastUpdated) return "Not available";
    
    const lastUpdated = new Date(status.lastUpdated);
    const now = new Date();
    const diffMs = now.getTime() - lastUpdated.getTime();
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins === 1) return "1 minute ago";
    return `${diffMins} minutes ago`;
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {/* Firewall Status */}
      <StatusCard 
        title="Firewall Status"
        value={status.isActive ? "Active" : "Inactive"}
        subText={`Last updated: ${formatLastUpdated()}`}
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-success" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        }
        badge={
          <span className="text-xs py-1 px-2 bg-success/10 text-success rounded-full">
            {status.isActive ? "Online" : "Offline"}
          </span>
        }
      />
      
      {/* Blocked Requests */}
      <StatusCard 
        title="Blocked Requests"
        value={requests.blocked?.toString() || "0"}
        subText="Total blocked requests"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-error" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
          </svg>
        }
      />
      
      {/* Total Rules */}
      <StatusCard 
        title="Total Rules"
        value={rules.total?.toString() || "0"}
        subText={`${rules.enabled || 0} active, ${rules.disabled || 0} disabled`}
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
          </svg>
        }
      />
      
      {/* Response Time */}
      <StatusCard 
        title="Response Time"
        value={`${status.responseTime || 0}ms`}
        subText="Average latency"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-secondary" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        }
        badge={
          <span className="text-xs py-1 px-2 bg-success/10 text-success rounded-full">
            Optimal
          </span>
        }
      />
    </div>
  );
}
