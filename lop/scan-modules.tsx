import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Database, Code, FolderOpen, Key, Edit, Shield, Info, AlertTriangle, Globe, Lock, Eye, Cpu, Server, Zap, Network, ExternalLink } from "lucide-react";

export const ALL_SCAN_MODULES = [
  {
    id: "sql_injection",
    icon: Database,
    color: "text-red-400",
    title: "SQL Injection",
    description: "Tests for database injection vulnerabilities in URL parameters and form fields.",
    attackDescription: "Attacker injects SQL syntax (e.g. ' OR '1'='1) into input fields to manipulate database queries — bypassing login, dumping tables, or deleting data.",
    risk: "High",
    time: "~5 min",
    cwe: "CWE-89",
    enabled: true
  },
  {
    id: "xss",
    icon: Code,
    color: "text-yellow-400",
    title: "XSS Detection",
    description: "Detects reflected and stored cross-site scripting vulnerabilities.",
    attackDescription: "Attacker injects <script> tags into inputs. When the page reflects this back, victims' browsers execute the script — stealing cookies, hijacking sessions, or redirecting to phishing pages.",
    risk: "Medium",
    time: "~3 min",
    cwe: "CWE-79",
    enabled: true
  },
  {
    id: "directory_traversal",
    icon: FolderOpen,
    color: "text-orange-400",
    title: "Directory Traversal",
    description: "Path traversal tests to access files outside the web root.",
    attackDescription: "Attacker uses sequences like ../../etc/passwd in file path parameters to navigate outside the allowed directory and read sensitive system files.",
    risk: "High",
    time: "~4 min",
    cwe: "CWE-22",
    enabled: true
  },
  {
    id: "command_injection",
    icon: Cpu,
    color: "text-red-500",
    title: "Command Injection",
    description: "Detects operating system command injection vulnerabilities.",
    attackDescription: "Attacker appends shell commands (; id, | cat /etc/passwd) to user inputs that are passed to system() calls. If successful, arbitrary OS commands run as the web server user.",
    risk: "Critical",
    time: "~6 min",
    cwe: "CWE-78",
    enabled: true
  },
  {
    id: "auth_bypass",
    icon: Key,
    color: "text-red-400",
    title: "Auth Bypass",
    description: "Tests for admin panels and protected routes accessible without credentials.",
    attackDescription: "Attacker directly navigates to /admin, /dashboard, or /api/users. If the server returns content without checking authentication, the attacker gains full admin access.",
    risk: "Critical",
    time: "~6 min",
    cwe: "CWE-306",
    enabled: true
  },
  {
    id: "parameter_fuzzing",
    icon: Edit,
    color: "text-yellow-400",
    title: "Parameter Fuzzing",
    description: "Sends unexpected inputs to discover hidden bugs and injection points.",
    attackDescription: "Attacker sends oversized strings, special characters, and injection payloads to every input. Crashes or unexpected behavior reveal vulnerabilities that can be further exploited.",
    risk: "Medium",
    time: "~8 min",
    cwe: "CWE-20",
    enabled: true
  },
  {
    id: "ssl_tls",
    icon: Shield,
    color: "text-green-400",
    title: "SSL/TLS Analysis",
    description: "Checks HTTPS configuration and security transport headers.",
    attackDescription: "Without HTTPS/HSTS, an attacker on the same network (man-in-the-middle) intercepts plaintext traffic, capturing passwords and session cookies via SSL stripping.",
    risk: "Medium",
    time: "~2 min",
    cwe: "CWE-319",
    enabled: true
  },
  {
    id: "csrf",
    icon: AlertTriangle,
    color: "text-orange-400",
    title: "CSRF Detection",
    description: "Checks for Cross-Site Request Forgery protection mechanisms.",
    attackDescription: "Attacker hosts a page with a hidden form that auto-submits to the target site. The victim's browser sends their cookies automatically, triggering actions (fund transfer, password change) without their knowledge.",
    risk: "Medium",
    time: "~2 min",
    cwe: "CWE-352",
    enabled: true
  },
  {
    id: "file_inclusion",
    icon: FolderOpen,
    color: "text-red-400",
    title: "File Inclusion (LFI/RFI)",
    description: "Detects local and remote file inclusion vulnerabilities.",
    attackDescription: "Attacker supplies a file path (../../etc/passwd) or remote URL (http://evil.com/shell.php) to a page/include parameter. The server reads/executes that file, exposing secrets or achieving RCE.",
    risk: "Critical",
    time: "~5 min",
    cwe: "CWE-22",
    enabled: false
  },
  {
    id: "ldap_injection",
    icon: Network,
    color: "text-purple-400",
    title: "LDAP Injection",
    description: "Tests for LDAP query manipulation vulnerabilities.",
    attackDescription: "Attacker injects LDAP filter syntax (*)(uid=*) into username fields to bypass directory authentication, enumerate users, or extract all LDAP attributes.",
    risk: "High",
    time: "~4 min",
    cwe: "CWE-90",
    enabled: false
  },
  {
    id: "xml_injection",
    icon: Code,
    color: "text-blue-400",
    title: "XML Injection",
    description: "Tests for XML structure manipulation in XML-accepting endpoints.",
    attackDescription: "Attacker injects XML tags to break the document structure, inject malicious elements, or combine with XXE to read local files.",
    risk: "Medium",
    time: "~3 min",
    cwe: "CWE-91",
    enabled: false
  },
  {
    id: "nosql_injection",
    icon: Database,
    color: "text-green-500",
    title: "NoSQL Injection",
    description: "Detects MongoDB and NoSQL query manipulation vulnerabilities.",
    attackDescription: "Attacker passes JSON operators ({\"$ne\": null}) in parameters processed by MongoDB. This bypasses authentication — logging in without a password — or dumps entire collections.",
    risk: "High",
    time: "~5 min",
    cwe: "CWE-943",
    enabled: false
  },
  {
    id: "ssti",
    icon: Cpu,
    color: "text-red-500",
    title: "Template Injection (SSTI)",
    description: "Detects server-side template engine injection vulnerabilities.",
    attackDescription: "Attacker injects template syntax ({{7*7}}) into inputs rendered by Jinja2, Twig, or FreeMarker. If the result (49) appears in response, the attacker can escalate to RCE using template-level object traversal.",
    risk: "Critical",
    time: "~4 min",
    cwe: "CWE-1336",
    enabled: false
  },
  {
    id: "xxe",
    icon: Code,
    color: "text-red-400",
    title: "XXE Injection",
    description: "Tests XML parsers for external entity processing vulnerabilities.",
    attackDescription: "Attacker posts malicious XML defining an external entity pointing to file:///etc/passwd. If the parser resolves it, the file content is returned in the response, exposing secrets.",
    risk: "High",
    time: "~3 min",
    cwe: "CWE-611",
    enabled: false
  },
  {
    id: "ssrf",
    icon: Globe,
    color: "text-orange-400",
    title: "SSRF Detection",
    description: "Tests for Server-Side Request Forgery in URL-accepting parameters.",
    attackDescription: "Attacker sets a URL parameter to http://169.254.169.254/latest/meta-data/ (AWS metadata). The server fetches it and returns cloud credentials, enabling full infrastructure takeover.",
    risk: "High",
    time: "~5 min",
    cwe: "CWE-918",
    enabled: false
  },
  // New modules
  {
    id: "open_redirect",
    icon: ExternalLink,
    color: "text-yellow-500",
    title: "Open Redirect",
    description: "Detects unvalidated redirect and forward vulnerabilities.",
    attackDescription: "Attacker crafts a URL like yoursite.com/redirect?to=https://evil.com/phishing. The user trusts the domain, clicks the link, and is silently redirected to a phishing page.",
    risk: "Medium",
    time: "~2 min",
    cwe: "CWE-601",
    enabled: true
  },
  {
    id: "cors_misconfiguration",
    icon: Globe,
    color: "text-purple-500",
    title: "CORS Misconfiguration",
    description: "Checks for overly permissive cross-origin resource sharing policies.",
    attackDescription: "Attacker's website makes an AJAX request to your API. If CORS allows any origin with credentials, the response (including private user data) is readable by the attacker's JavaScript.",
    risk: "High",
    time: "~2 min",
    cwe: "CWE-942",
    enabled: true
  },
  {
    id: "security_headers",
    icon: Shield,
    color: "text-blue-400",
    title: "Security Headers",
    description: "Audits all HTTP security response headers (CSP, HSTS, etc.).",
    attackDescription: "Missing headers like CSP, X-Frame-Options, and HSTS remove browser-level defenses. Attackers exploit the absence of these headers to enable XSS, clickjacking, and man-in-the-middle attacks.",
    risk: "Low",
    time: "~1 min",
    cwe: "CWE-693",
    enabled: true
  },
  {
    id: "sensitive_data_exposure",
    icon: Eye,
    color: "text-red-400",
    title: "Sensitive Data Exposure",
    description: "Scans for exposed .env files, config files, backups, and API docs.",
    attackDescription: "Attackers routinely scan for /.env, /wp-config.php, /.git/config, /phpinfo.php. These files often contain database passwords, API keys, and internal architecture details.",
    risk: "Critical",
    time: "~4 min",
    cwe: "CWE-200",
    enabled: true
  },
  {
    id: "http_methods",
    icon: Server,
    color: "text-orange-400",
    title: "HTTP Methods Testing",
    description: "Tests for dangerous HTTP methods (PUT, DELETE, TRACE).",
    attackDescription: "An enabled TRACE method enables Cross-Site Tracing (XST) to steal HttpOnly cookies. Enabled PUT/DELETE may allow unauthorized file uploads or content deletion.",
    risk: "Medium",
    time: "~2 min",
    cwe: "CWE-16",
    enabled: true
  },
  {
    id: "clickjacking",
    icon: Eye,
    color: "text-yellow-500",
    title: "Clickjacking",
    description: "Checks if the page can be embedded in iframes on attacker sites.",
    attackDescription: "Attacker overlays a transparent iframe of your site over a fake page. Victims click fake buttons that actually trigger real actions (payments, setting changes) on your site.",
    risk: "Medium",
    time: "~1 min",
    cwe: "CWE-1021",
    enabled: true
  },
  {
    id: "rate_limiting",
    icon: Zap,
    color: "text-orange-500",
    title: "Rate Limiting Check",
    description: "Tests login and API endpoints for brute-force protection.",
    attackDescription: "Without rate limiting, attackers use automated tools to try thousands of passwords per second (brute-force) or test leaked credential lists (credential stuffing) to take over accounts.",
    risk: "Medium",
    time: "~2 min",
    cwe: "CWE-307",
    enabled: true
  },
  {
    id: "broken_access_control",
    icon: Lock,
    color: "text-red-500",
    title: "Broken Access Control",
    description: "Tests API endpoints for missing authorization checks.",
    attackDescription: "Attacker directly calls /api/admin or /api/users without a session token. If the server returns data, the attacker can read all user records, modify any account, or take admin actions without credentials.",
    risk: "Critical",
    time: "~3 min",
    cwe: "CWE-284",
    enabled: true
  }
];

interface ScanModulesProps {
  selectedModules?: string[];
  onModulesChange?: (modules: string[]) => void;
  readOnly?: boolean;
}

export function ScanModules({ selectedModules, onModulesChange, readOnly = false }: ScanModulesProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [internalSelected, setInternalSelected] = useState<string[]>(
    ALL_SCAN_MODULES.filter(m => m.enabled).map(m => m.id)
  );

  const active = selectedModules ?? internalSelected;

  const toggle = (moduleId: string) => {
    if (readOnly) return;
    const next = active.includes(moduleId)
      ? active.filter(id => id !== moduleId)
      : [...active, moduleId];
    if (selectedModules !== undefined) {
      onModulesChange?.(next);
    } else {
      setInternalSelected(next);
      onModulesChange?.(next);
    }
  };

  const toggleAll = (enable: boolean) => {
    if (readOnly) return;
    const next = enable ? ALL_SCAN_MODULES.map(m => m.id) : [];
    if (selectedModules !== undefined) {
      onModulesChange?.(next);
    } else {
      setInternalSelected(next);
      onModulesChange?.(next);
    }
  };

  const riskColor = (risk: string) => {
    switch (risk) {
      case 'Critical': return 'bg-red-700 text-white';
      case 'High': return 'bg-orange-700 text-white';
      case 'Medium': return 'bg-yellow-700 text-black';
      case 'Low': return 'bg-blue-700 text-white';
      default: return 'bg-gray-700 text-white';
    }
  };

  return (
    <Card className="bg-secondary border-gray-700 mb-6" data-testid="scan-modules">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-white">
            <Settings className="text-accent mr-2" size={20} />
            Security Test Modules
            <Badge className="ml-3 bg-gray-700 text-gray-300">{active.length}/{ALL_SCAN_MODULES.length} enabled</Badge>
          </CardTitle>
          {!readOnly && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-700 text-xs" onClick={() => toggleAll(true)}>
                Enable All
              </Button>
              <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-700 text-xs" onClick={() => toggleAll(false)}>
                Disable All
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {ALL_SCAN_MODULES.map((module) => {
            const isEnabled = active.includes(module.id);
            const isExpanded = expanded === module.id;
            return (
              <div
                key={module.id}
                className={`bg-gray-700 rounded-lg p-3 border transition-colors ${isEnabled ? 'border-accent/40' : 'border-gray-600'}`}
                data-testid={`module-${module.id}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    {!readOnly && (
                      <Checkbox
                        checked={isEnabled}
                        onCheckedChange={() => toggle(module.id)}
                        className="data-[state=checked]:bg-accent data-[state=checked]:border-accent"
                        data-testid={`checkbox-${module.id}`}
                      />
                    )}
                    <module.icon className={module.color} size={14} />
                    <span className="font-medium text-xs text-white leading-tight">{module.title}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge className={`text-xs px-1 py-0 ${riskColor(module.risk)}`}>{module.risk}</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-white h-5 w-5 p-0"
                      onClick={() => setExpanded(isExpanded ? null : module.id)}
                      title="How attackers exploit this"
                      data-testid={`info-${module.id}`}
                    >
                      <Info size={11} />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mb-1">{module.description}</p>
                {isExpanded && (
                  <div className="mt-2 p-2 bg-red-950 border border-red-700 rounded text-xs">
                    <p className="text-red-400 font-semibold mb-1 flex items-center gap-1">
                      <AlertTriangle size={11} /> How Hackers Attack:
                    </p>
                    <p className="text-gray-300 leading-relaxed">{module.attackDescription}</p>
                    <p className="text-gray-500 mt-1">{module.cwe} · {module.time}</p>
                  </div>
                )}
                {!isExpanded && (
                  <div className="text-xs text-gray-500">{module.cwe} · {module.time}</div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
