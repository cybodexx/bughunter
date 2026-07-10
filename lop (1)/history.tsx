import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Download, Clock, Shield, AlertTriangle } from "lucide-react";
import { type Scan } from "@shared/schema";

export default function History() {
  const { data: scans = [], isLoading } = useQuery<Scan[]>({
    queryKey: ['/api/scans'],
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-600';
      case 'running': return 'bg-blue-600';
      case 'failed': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <Shield size={16} />;
      case 'running': return <Clock size={16} />;
      case 'failed': return <AlertTriangle size={16} />;
      default: return <Clock size={16} />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-primary text-gray-100">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-700 rounded mb-4"></div>
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-24 bg-gray-700 rounded"></div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary text-gray-100">
      <Header />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-6" data-testid="history-main">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white mb-2">Scan History</h1>
            <p className="text-gray-400">View and manage your security scan results</p>
          </div>

          {scans.length === 0 ? (
            <Card className="bg-secondary border-gray-700">
              <CardContent className="p-8 text-center">
                <Shield className="mx-auto text-4xl text-gray-500 mb-4" />
                <p className="text-gray-400 mb-2">No scans found</p>
                <p className="text-sm text-gray-500">Start your first security scan to see results here</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {scans.map((scan: Scan) => (
                <Card key={scan.id} className="bg-secondary border-gray-700" data-testid={`scan-${scan.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-white truncate max-w-md" data-testid={`scan-url-${scan.id}`}>
                            {scan.targetUrl}
                          </h3>
                          <Badge 
                            className={`${getStatusColor(scan.status)} text-white text-xs flex items-center space-x-1`}
                            data-testid={`scan-status-${scan.id}`}
                          >
                            {getStatusIcon(scan.status)}
                            <span>{scan.status}</span>
                          </Badge>
                        </div>
                        
                        <div className="flex items-center space-x-6 text-sm text-gray-400">
                          <span data-testid={`scan-date-${scan.id}`}>
                            Started: {new Date(scan.createdAt).toLocaleString()}
                          </span>
                          <span data-testid={`scan-progress-${scan.id}`}>
                            Progress: {scan.progress}%
                          </span>
                          <span data-testid={`scan-requests-${scan.id}`}>
                            Requests: {scan.requestsSent}
                          </span>
                          <span data-testid={`scan-modules-${scan.id}`}>
                            Modules: {scan.enabledModules.length}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-gray-600 hover:bg-gray-700"
                          data-testid={`button-view-${scan.id}`}
                        >
                          <Eye size={16} className="mr-2" />
                          View
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-gray-600 hover:bg-gray-700"
                          data-testid={`button-export-${scan.id}`}
                        >
                          <Download size={16} className="mr-2" />
                          Export
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
