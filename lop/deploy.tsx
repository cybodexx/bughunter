import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Cloud, Server, Rocket, CheckCircle, ExternalLink, Copy, Terminal,
  Globe, Zap, Database, Shield
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const platforms = [
  {
    id: "render",
    name: "Render",
    logo: "🟣",
    badge: "Recommended",
    badgeColor: "bg-purple-700 text-white",
    description: "One-click deploy to Render. Free tier available, auto-deploys from Git.",
    steps: [
      "Fork this repo on GitHub",
      'Create a Render account at render.com',
      'Click "New Web Service" → connect your GitHub repo',
      "Render auto-detects the build command: npm run build",
      "Start command: npm run start",
      "Set environment variables (PORT=5000 if needed)",
      "Click Deploy!"
    ],
    deployUrl: "https://render.com/deploy",
    envVars: ["PORT=5000", "NODE_ENV=production"],
    time: "~5 min"
  },
  {
    id: "railway",
    name: "Railway",
    logo: "🚂",
    badge: "Easy",
    badgeColor: "bg-blue-700 text-white",
    description: "Deploy in seconds with Railway. Automatic deployments from GitHub.",
    steps: [
      "Create an account at railway.app",
      "Click 'New Project' → 'Deploy from GitHub'",
      "Select your repository",
      "Railway detects Node.js automatically",
      "Add environment variable: PORT=5000",
      "Click Deploy — done!"
    ],
    deployUrl: "https://railway.app",
    envVars: ["PORT=5000", "NODE_ENV=production"],
    time: "~3 min"
  },
  {
    id: "fly",
    name: "Fly.io",
    logo: "🪰",
    badge: "CLI",
    badgeColor: "bg-green-700 text-white",
    description: "Deploy globally with Fly.io's edge network. Minimal config required.",
    steps: [
      "Install flyctl: curl -L https://fly.io/install.sh | sh",
      "Run: flyctl auth login",
      "In your project directory: flyctl launch",
      "Follow the prompts (accept defaults)",
      "Run: flyctl deploy",
      "Your app is live globally!"
    ],
    deployUrl: "https://fly.io",
    envVars: ["PORT=8080", "NODE_ENV=production"],
    time: "~8 min"
  },
  {
    id: "heroku",
    name: "Heroku",
    logo: "🟣",
    badge: "Classic",
    badgeColor: "bg-gray-600 text-white",
    description: "Traditional PaaS deployment with Heroku.",
    steps: [
      "Create an account at heroku.com",
      "Install Heroku CLI: npm install -g heroku",
      "Run: heroku login",
      "Run: heroku create your-app-name",
      "Run: git push heroku main",
      "Run: heroku open"
    ],
    deployUrl: "https://heroku.com",
    envVars: ["NODE_ENV=production"],
    time: "~10 min"
  }
];

const envExample = `# Production Environment Variables
NODE_ENV=production
PORT=5000

# Optional: Add a PostgreSQL database URL for persistent storage
# DATABASE_URL=postgresql://user:password@host:5432/dbname

# Optional: Session secret (generate a random string)
# SESSION_SECRET=your-random-secret-here
`;

const dockerfileContent = `FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
EXPOSE 5000
ENV NODE_ENV=production
CMD ["node", "dist/index.js"]
`;

export default function Deploy() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      toast({ title: "Copied!", description: "Text copied to clipboard" });
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-primary text-gray-100">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
              <Rocket className="text-accent" size={26} />
              One-Click Deployment
            </h1>
            <p className="text-gray-400">
              Deploy SecureScan Pro to the cloud in minutes. Choose a platform below and follow the steps.
            </p>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {[
              { icon: Shield, label: "Production-Ready Build", color: "text-green-400" },
              { icon: Globe, label: "HTTPS Included", color: "text-blue-400" },
              { icon: Zap, label: "Auto-Scaling Support", color: "text-yellow-400" },
              { icon: Database, label: "PostgreSQL-Ready", color: "text-purple-400" }
            ].map((f, i) => (
              <div key={i} className="bg-secondary border border-gray-700 rounded-lg p-3 flex items-center gap-2">
                <f.icon className={f.color} size={18} />
                <span className="text-xs text-gray-300">{f.label}</span>
              </div>
            ))}
          </div>

          {/* Platform cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {platforms.map((platform) => (
              <Card key={platform.id} className="bg-secondary border-gray-700">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-white">
                    <span className="flex items-center gap-2">
                      <span className="text-xl">{platform.logo}</span>
                      {platform.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge className={platform.badgeColor}>{platform.badge}</Badge>
                      <Badge className="bg-gray-700 text-gray-300 text-xs">{platform.time}</Badge>
                    </div>
                  </CardTitle>
                  <p className="text-sm text-gray-400">{platform.description}</p>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-1 mb-4">
                    {platform.steps.map((step, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-accent font-mono text-xs mt-0.5 min-w-[16px]">{i + 1}.</span>
                        <span className="text-gray-300">{step}</span>
                      </li>
                    ))}
                  </ol>

                  <div className="bg-gray-800 rounded p-2 mb-3 text-xs font-mono text-gray-400">
                    <span className="text-gray-500">Required env vars:</span>
                    {platform.envVars.map(v => (
                      <div key={v} className="text-green-400">{v}</div>
                    ))}
                  </div>

                  <Button
                    className="w-full bg-accent hover:bg-blue-600"
                    onClick={() => window.open(platform.deployUrl, '_blank')}
                  >
                    <ExternalLink size={14} className="mr-2" />
                    Open {platform.name}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Docker / Manual deploy */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="bg-secondary border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Server size={18} className="text-accent" />
                  Docker Deployment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-800 rounded p-3 mb-3 text-xs font-mono text-gray-300 relative">
                  <pre className="whitespace-pre-wrap">{dockerfileContent}</pre>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2 h-6 w-6 p-0 text-gray-500 hover:text-white"
                    onClick={() => copyText(dockerfileContent, 'dockerfile')}
                  >
                    {copiedId === 'dockerfile' ? <CheckCircle size={12} className="text-green-400" /> : <Copy size={12} />}
                  </Button>
                </div>
                <div className="space-y-1 text-xs font-mono text-gray-400">
                  <div className="bg-gray-800 rounded p-2">
                    <span className="text-gray-500"># Build</span>
                    <div className="text-green-400">docker build -t securescan .</div>
                  </div>
                  <div className="bg-gray-800 rounded p-2">
                    <span className="text-gray-500"># Run</span>
                    <div className="text-green-400">docker run -p 5000:5000 securescan</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-secondary border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Terminal size={18} className="text-accent" />
                  Environment Variables
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-400 mb-3">
                  Create a <code className="text-accent">.env</code> file in the project root for production configuration:
                </p>
                <div className="bg-gray-800 rounded p-3 text-xs font-mono text-gray-300 relative">
                  <pre className="whitespace-pre-wrap">{envExample}</pre>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2 h-6 w-6 p-0 text-gray-500 hover:text-white"
                    onClick={() => copyText(envExample, 'env')}
                  >
                    {copiedId === 'env' ? <CheckCircle size={12} className="text-green-400" /> : <Copy size={12} />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Build commands */}
          <Card className="bg-secondary border-gray-700 mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Cloud size={18} className="text-accent" />
                Build &amp; Start Commands
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: "Install Dependencies", cmd: "npm install", desc: "Install all packages" },
                  { label: "Build for Production", cmd: "npm run build", desc: "Compiles frontend + backend" },
                  { label: "Start Production Server", cmd: "npm run start", desc: "Runs dist/index.js" }
                ].map((item, i) => (
                  <div key={i} className="bg-gray-800 rounded p-3">
                    <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                    <div className="flex items-center justify-between">
                      <code className="text-green-400 font-mono text-sm">{item.cmd}</code>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-5 w-5 p-0 text-gray-500 hover:text-white"
                        onClick={() => copyText(item.cmd, `cmd-${i}`)}
                      >
                        {copiedId === `cmd-${i}` ? <CheckCircle size={11} className="text-green-400" /> : <Copy size={11} />}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-900 bg-opacity-20 border-green-700">
            <CardContent className="p-4 flex items-start gap-3">
              <CheckCircle className="text-green-400 flex-shrink-0 mt-0.5" size={18} />
              <div>
                <p className="text-green-400 font-semibold text-sm">Production Checklist</p>
                <ul className="text-xs text-gray-300 mt-2 space-y-1">
                  <li>✓ Set NODE_ENV=production to enable static serving and disable dev tools</li>
                  <li>✓ Configure a proper SESSION_SECRET environment variable (use a 32+ character random string)</li>
                  <li>✓ Add a PostgreSQL DATABASE_URL to persist scan results across restarts</li>
                  <li>✓ Ensure HTTPS is enforced (most cloud platforms handle this automatically)</li>
                  <li>✓ Only scan targets you are authorized to test — see the legal disclaimer</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
