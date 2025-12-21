import { useState } from "react";
import { cn } from "@/lib/utils";
import { 
  Search, 
  Calculator, 
  ChevronLeft, 
  ChevronRight, 
  Globe, 
  ClipboardCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

type TabId = "sourcing" | "calculator" | "approvals";

interface LeftSidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  isCollapsed?: boolean;
  onCollapseChange?: (collapsed: boolean) => void;
}

const menuItems = [
  { id: "sourcing" as const, icon: Search, label: "Sourcing" },
  { id: "calculator" as const, icon: Calculator, label: "Pricing & Margin" },
  { id: "approvals" as const, icon: ClipboardCheck, label: "Approvals", comingSoon: true },
];

export function LeftSidebar({ 
  activeTab, 
  onTabChange, 
  isCollapsed: externalIsCollapsed,
  onCollapseChange
}: LeftSidebarProps) {
  const [internalIsCollapsed, setInternalIsCollapsed] = useState(false);
  const isCollapsed = externalIsCollapsed !== undefined ? externalIsCollapsed : internalIsCollapsed;
  
  const setIsCollapsed = (collapsed: boolean) => {
    if (onCollapseChange) {
      onCollapseChange(collapsed);
    } else {
      setInternalIsCollapsed(collapsed);
    }
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 z-50",
        isCollapsed ? "w-16" : "w-56"
      )}
    >
      {/* Header */}
      <div className={cn(
        "h-16 flex items-center border-b border-sidebar-border",
        isCollapsed ? "justify-center px-0" : "justify-between px-4"
      )}>
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
          className={cn(
            isCollapsed ? "mx-auto" : "ml-auto"
          )}
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
