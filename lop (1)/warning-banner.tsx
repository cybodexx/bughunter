import { Card, CardContent } from "@/components/ui/card";
import { Gavel } from "lucide-react";

export function WarningBanner() {
  return (
    <Card className="bg-yellow-900 bg-opacity-20 border-yellow-500 rounded-lg mb-6" data-testid="legal-banner">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <Gavel className="text-yellow-400 flex-shrink-0 mt-1" size={20} />
          <div>
            <h3 className="font-semibold text-yellow-400 mb-1" data-testid="legal-title">
              Legal Disclaimer & Ethical Use
            </h3>
            <p className="text-sm text-gray-300 mb-2" data-testid="legal-description">
              This tool is designed for educational purposes and authorized security testing only. Users must:
            </p>
            <ul className="text-xs text-gray-400 space-y-1 ml-4" data-testid="legal-requirements">
              <li>• Only test systems you own or have explicit written permission to test</li>
              <li>• Follow responsible disclosure practices for any vulnerabilities found</li>
              <li>• Comply with all applicable laws and regulations in your jurisdiction</li>
              <li>• Use findings to improve security, not to cause harm</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
