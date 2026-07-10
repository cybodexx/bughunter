import { Button } from "@/components/ui/button";
import { Shield, HelpCircle, Settings } from "lucide-react";

export function Header() {
  return (
    <header className="bg-secondary border-b border-gray-700 px-6 py-4" data-testid="header">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Shield className="text-accent text-2xl" data-testid="logo" />
          <h1 className="text-xl font-bold text-white" data-testid="app-title">SecureScan Pro</h1>
          <span className="text-xs bg-accent px-2 py-1 rounded-full text-white" data-testid="version">v2.1.0</span>
        </div>
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-gray-400 hover:text-white"
            data-testid="button-help"
          >
            <HelpCircle size={20} />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-gray-400 hover:text-white"
            data-testid="button-settings"
          >
            <Settings size={20} />
          </Button>
          <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center" data-testid="user-avatar">
            <span className="text-sm font-medium text-white">U</span>
          </div>
        </div>
      </div>
    </header>
  );
}
