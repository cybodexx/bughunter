import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Crosshair, Globe, Rocket, FlaskConical } from "lucide-react";
import { type InsertScan } from "@shared/schema";
import { ALL_SCAN_MODULES } from "@/components/scanner/scan-modules";

interface TargetConfigProps {
  onScanStart: (scanId: string) => void;
  selectedModules?: string[];
}

export function TargetConfig({ onScanStart, selectedModules }: TargetConfigProps) {
  const [targetUrl, setTargetUrl] = useState("");
  const [authType, setAuthType] = useState<"none" | "basic" | "form" | "cookie">("none");
  const [intensity, setIntensity] = useState<"low" | "medium" | "high">("medium");
  const [isValidating, setIsValidating] = useState(false);
  const [urlValid, setUrlValid] = useState<boolean | null>(null);

  const { toast } = useToast();

  const defaultModules = ALL_SCAN_MODULES.filter(m => m.enabled).map(m => m.id);

  const validateUrlMutation = useMutation({
    mutationFn: async (url: string) => {
      const res = await fetch("/api/validate-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
        credentials: "include",
      });
      const data = await res.json();
      console.log("[validate-url] response:", data);
      return data;
    },
    onSuccess: (data) => {
      setUrlValid(data.accessible === true);
      toast({
        title: data.accessible ? "URL Validated" : "URL Not Accessible",
        description: data.message,
        variant: data.accessible ? "default" : "destructive",
      });
    },
    onError: (err) => {
      console.error("[validate-url] fetch error:", err);
      setUrlValid(false);
      toast({
        title: "Validation Failed",
        description: "Could not reach the server",
        variant: "destructive",
      });
    },
    onSettled: () => setIsValidating(false)
  });

  const startScanMutation = useMutation({
    mutationFn: async (scanData: InsertScan) => {
      const response = await apiRequest("POST", "/api/scans", scanData);
      return response.json();
    },
    onSuccess: (data) => {
      onScanStart(data.id);
      toast({
        title: "Scan Started",
        description: `Security scan initiated for ${targetUrl}`,
      });
    },
    onError: () => {
      toast({
        title: "Scan Failed",
        description: "Could not start the security scan",
        variant: "destructive",
      });
    }
  });

  const handleValidateUrl = () => {
    if (!targetUrl) {
      toast({ title: "URL Required", description: "Please enter a target URL", variant: "destructive" });
      return;
    }
    setIsValidating(true);
    validateUrlMutation.mutate(targetUrl);
  };

  const handleStartScan = (isQuick = false) => {
    if (!targetUrl) {
      toast({ title: "URL Required", description: "Please enter a target URL", variant: "destructive" });
      return;
    }

    // Honor selectedModules exactly when it is explicitly provided (even if empty).
    // Only fall back to defaultModules when no selectedModules prop was passed at all.
    const modules = isQuick
      ? ["ssl_tls", "xss", "security_headers", "clickjacking"]
      : (selectedModules !== undefined ? selectedModules : defaultModules);

    startScanMutation.mutate({
      targetUrl,
      authType,
      intensity: isQuick ? "low" : intensity,
      enabledModules: modules,
    });
  };

  return (
    <Card className="bg-secondary border-gray-700" data-testid="target-config">
      <CardHeader>
        <CardTitle className="flex items-center text-white">
          <Crosshair className="text-accent mr-2" size={20} />
          Target Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="block text-sm font-medium text-gray-300 mb-2" data-testid="label-target-url">
            Target URL
          </Label>
          <div className="flex space-x-2">
            <Input
              type="url"
              placeholder="https://example.com"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              className="flex-1 bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-accent"
              data-testid="input-target-url"
            />
            <Button
              onClick={handleValidateUrl}
              disabled={isValidating}
              className="bg-accent hover:bg-blue-600"
              data-testid="button-validate-url"
            >
              <Globe size={16} className="mr-2" />
              {isValidating ? "Validating..." : "Validate"}
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-1" data-testid="url-help-text">
            Enter the target website URL you are authorized to test
          </p>
          {urlValid !== null && (
            <p className={`text-xs mt-1 ${urlValid ? 'text-green-400' : 'text-red-400'}`} data-testid="url-validation-result">
              {urlValid ? "✓ URL is accessible" : "✗ URL is not accessible"}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="block text-sm font-medium text-gray-300 mb-2" data-testid="label-authentication">
              Authentication
            </Label>
            <Select value={authType} onValueChange={(v) => setAuthType(v as "none" | "basic" | "form" | "cookie")}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white focus:border-accent" data-testid="select-auth-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="basic">Basic Auth</SelectItem>
                <SelectItem value="form">Form-based</SelectItem>
                <SelectItem value="cookie">Cookie-based</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="block text-sm font-medium text-gray-300 mb-2" data-testid="label-intensity">
              Scan Intensity
            </Label>
            <Select value={intensity} onValueChange={(v) => setIntensity(v as "low" | "medium" | "high")}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white focus:border-accent" data-testid="select-intensity">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                <SelectItem value="low">Low (Safe)</SelectItem>
                <SelectItem value="medium">Medium (Balanced)</SelectItem>
                <SelectItem value="high">High (Comprehensive)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedModules !== undefined && (
          <p className="text-xs text-accent">
            {selectedModules.length} module{selectedModules.length !== 1 ? 's' : ''} selected from the panel below
          </p>
        )}

        <div className="pt-2 space-y-3">
          <Button
            onClick={() => handleStartScan(false)}
            disabled={startScanMutation.isPending}
            className="w-full bg-accent hover:bg-blue-600 text-white py-3"
            data-testid="button-start-full-scan"
          >
            <Rocket size={16} className="mr-2" />
            {startScanMutation.isPending ? "Starting Scan..." : "Start Full Scan"}
          </Button>

          <Button
            onClick={() => handleStartScan(true)}
            disabled={startScanMutation.isPending}
            variant="secondary"
            className="w-full bg-gray-600 hover:bg-gray-500 text-white py-2"
            data-testid="button-quick-test"
          >
            <FlaskConical size={16} className="mr-2" />
            Quick Test (SSL, XSS, Headers, Clickjacking)
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
