import { Button } from "@/components/ui/button";
import { StatusCards } from "@/components/dashboard/StatusCards";
import { AttackDistribution } from "@/components/dashboard/AttackDistribution";
import { TrafficChart } from "@/components/dashboard/TrafficChart";
import { RequestTable } from "@/components/dashboard/RequestTable";
import { ActiveRules } from "@/components/dashboard/ActiveRules";
import { TopAttackers } from "@/components/dashboard/TopAttackers";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { toast } = useToast();
  
  const handleExportReport = () => {
    toast({
      title: "Export initiated",
      description: "Your report will be downloaded shortly",
    });
    // In a real application, this would trigger the export process
  };
  
  const handleRefresh = () => {
    window.location.reload();
  };
  
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate">Dashboard</h1>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={handleExportReport}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export Report
          </Button>
          <Button size="sm" onClick={handleRefresh}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <StatusCards />

      {/* Attacks Overview & Graph */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Attack Distribution */}
        <AttackDistribution />

        {/* Traffic Graph */}
        <div className="col-span-1 lg:col-span-2">
          <TrafficChart />
        </div>
      </div>

      {/* Recent Blocked Requests */}
      <RequestTable />
      
      {/* Rules and Top Attackers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Rules */}
        <ActiveRules />
        
        {/* Top Attackers */}
        <TopAttackers />
      </div>
    </div>
  );
}
