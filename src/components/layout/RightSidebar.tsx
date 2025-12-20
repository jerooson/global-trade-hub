import { useState } from "react";
import { cn } from "@/lib/utils";
import { 
  Search, 
  Calculator, 
  ChevronLeft, 
  ChevronRight, 
  Globe, 
  Star, 
  ClipboardCheck,
  Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

type TabId = "sourcing" | "calculator" | "shortlist" | "approvals";

interface LeftSidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  shortlistCount?: number;
}

const menuItems = [
  { id: "sourcing" as const, icon: Search, label: "Sourcing" },
  { id: "calculator" as const, icon: Calculator, label: "Pricing & Margin" },
  { id: "shortlist" as const, icon: Star, label: "Shortlist" },
  { id: "approvals" as const, icon: ClipboardCheck, label: "Approvals", comingSoon: true },
];

export function LeftSidebar({ activeTab, onTabChange, shortlistCount = 0 }: LeftSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 z-50",
        isCollapsed ? "w-16" : "w-56"
      )}
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            <span className="font-semibold text-sm">TradeHub</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(!isCollapsed && "ml-auto")}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-2">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          const showBadge = item.id === "shortlist" && shortlistCount > 0;

          if (isCollapsed) {
            return (
              <Tooltip key={item.id} delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    size="icon"
                    onClick={() => !item.comingSoon && onTabChange(item.id)}
                    className={cn(
                      "w-full relative",
                      isActive && "shadow-glow",
                      item.comingSoon && "opacity-50 cursor-not-allowed"
                    )}
                    disabled={item.comingSoon}
                  >
                    <Icon className="w-5 h-5" />
                    {showBadge && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 text-xs rounded-full bg-warning text-warning-foreground flex items-center justify-center">
                        {shortlistCount}
                      </span>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-card border-border">
                  {item.label}
                  {item.comingSoon && " (Coming Soon)"}
                </TooltipContent>
              </Tooltip>
            );
          }

          return (
            <Button
              key={item.id}
              variant={isActive ? "default" : "ghost"}
              onClick={() => !item.comingSoon && onTabChange(item.id)}
              className={cn(
                "w-full justify-start gap-3",
                isActive && "shadow-glow",
                item.comingSoon && "opacity-50 cursor-not-allowed"
              )}
              disabled={item.comingSoon}
            >
              <Icon className="w-5 h-5" />
              <span className="flex-1 text-left">{item.label}</span>
              {showBadge && (
                <Badge variant="secondary" className="bg-warning/20 text-warning text-xs">
                  {shortlistCount}
                </Badge>
              )}
              {item.comingSoon && (
                <Badge variant="secondary" className="text-xs">Soon</Badge>
              )}
            </Button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        {!isCollapsed && (
          <p className="text-xs text-muted-foreground text-center">
            v1.5.0
          </p>
        )}
      </div>
    </aside>
  );
}

export type { TabId };
