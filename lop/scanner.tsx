import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { WarningBanner } from "@/components/ui/warning-banner";
import { TargetConfig } from "@/components/scanner/target-config";
import { ScanModules, ALL_SCAN_MODULES } from "@/components/scanner/scan-modules";
import { ScanProgress } from "@/components/scanner/scan-progress";
import { VulnerabilitySummary } from "@/components/scanner/vulnerability-summary";
import { VulnerabilityDetails } from "@/components/scanner/vulnerability-details";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, GraduationCap } from "lucide-react";

const educationalResources = [
  {
    cweId: "CWE-89",
    title: "SQL Injection",
    description: "Learn about database injection attacks and how parameterized queries prevent them.",
    href: "https://owasp.org/www-community/attacks/SQL_Injection",
    color: "text-red-400"
  },
  {
    cweId: "CWE-79",
    title: "XSS Prevention",
    description: "Understand reflected, stored, and DOM-based XSS — and Content Security Policy.",
    href: "https://owasp.org/www-community/attacks/xss/",
    color: "text-yellow-400"
  },
  {
    cweId: "Security Headers",
    title: "Security Headers",
    description: "Implement CSP, HSTS, X-Frame-Options, and other headers for browser-level defense.",
    href: "https://securityheaders.com",
    color: "text-green-400"
  },
  {
    cweId: "OWASP Top 10",
    title: "OWASP Top 10",
    description: "The ten most critical web application security risks — the industry baseline.",
    href: "https://owasp.org/www-project-top-ten/",
    color: "text-blue-400"
  }
];

export default function Scanner() {
  const [currentScanId, setCurrentScanId] = useState<string | null>(null);
  const [selectedModules, setSelectedModules] = useState<string[]>(
    ALL_SCAN_MODULES.filter(m => m.enabled).map(m => m.id)
  );

  return (
    <div className="min-h-screen bg-primary text-gray-100">
      <Header />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-6" data-testid="main-content">
          {/* Legal Warning Banner */}
          <WarningBanner />

          {/* Target Configuration + Progress */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2">
              <TargetConfig onScanStart={setCurrentScanId} selectedModules={selectedModules} />
            </div>
            <div className="lg:col-span-1">
              <ScanProgress scanId={currentScanId} />
            </div>
          </div>

          {/* Scan Modules — module selection feeds back to target config */}
          <ScanModules
            selectedModules={selectedModules}
            onModulesChange={setSelectedModules}
          />

          {/* Results */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <VulnerabilitySummary scanId={currentScanId} />
          </div>

          <VulnerabilityDetails scanId={currentScanId} />

          {/* Educational Resources */}
          <Card className="mt-6 bg-secondary border-gray-700">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center text-white">
                <GraduationCap className="text-accent mr-2" size={20} />
                Security Learning Resources
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {educationalResources.map((resource, index) => (
                  <div key={index} className="bg-gray-700 rounded-lg p-4" data-testid={`resource-${index}`}>
                    <BookOpen className={`${resource.color} mb-2`} size={18} />
                    <h4 className="font-medium mb-1 text-white text-sm">{resource.title}</h4>
                    <p className="text-xs text-gray-400 mb-3">{resource.description}</p>
                    <a
                      href={resource.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent text-xs hover:underline"
                      data-testid={`link-${resource.title.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      Read Guide →
                    </a>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
