import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { TrendingUp, Clock, Play } from "lucide-react";
import { type Scan } from "@shared/schema";

interface ScanProgressProps {
  scanId: string | null;
}

export function ScanProgress({ scanId }: ScanProgressProps) {
  const { data: scan, isLoading } = useQuery<Scan>({
    queryKey: ['/api/scans', scanId],
    enabled: !!scanId,
    refetchInterval: scanId ? 2000 : false, // Poll every 2 seconds if scan is active
  });

  const formatDuration = (start: string | null, end: string | null) => {
    if (!start) return "--:--";
    
    const startTime = new Date(start);
    const endTime = end ? new Date(end) : new Date();
    const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
    
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getStatusText = (scan?: Scan) => {
    if (!scan) return "Ready to start";
    
    switch (scan.status) {
      case 'pending': return "Preparing to start...";
      case 'running': return `Running: ${scan.currentModule || 'Starting...'}`;
      case 'completed': return "Scan completed";
      case 'failed': return "Scan failed";
      default: return "Unknown status";
    }
  };

  return (
    <Card className="bg-secondary border-gray-700" data-testid="scan-progress">
      <CardHeader>
        <CardTitle className="flex items-center text-white">
          <TrendingUp className="text-accent mr-2" size={20} />
          Live Scan Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-300" data-testid="progress-label">Overall Progress</span>
          <span className="text-gray-300" data-testid="progress-percentage">
            {scan ? `${scan.progress}% (${scan.currentModule ? '1' : '0'}/6 modules)` : '0% (0/6 modules)'}
          </span>
        </div>
        
        <Progress 
          value={scan?.progress || 0} 
          className="w-full bg-gray-700"
          data-testid="progress-bar"
        />
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center space-x-2 text-gray-300">
              <Clock className="text-gray-400" size={16} />
              <span data-testid="scan-status">{getStatusText(scan)}</span>
            </span>
            <span className="text-gray-500" data-testid="scan-duration">
              {formatDuration(scan?.startedAt ? scan.startedAt.toString() : null, scan?.completedAt ? scan.completedAt.toString() : null)}
            </span>
          </div>
          
          <div className="text-xs text-gray-500" data-testid="current-module">
            Current module: {scan?.currentModule || 'None'}
          </div>
          
          <div className="text-xs text-gray-500" data-testid="requests-sent">
            Requests sent: {scan?.requestsSent || 0}
          </div>
        </div>

        {!scanId && (
          <div className="pt-4 border-t border-gray-600">
            <div className="flex justify-between text-xs text-gray-500 mb-2">
              <span>Estimated Time: 15-45 minutes</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Last scan: Never</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
