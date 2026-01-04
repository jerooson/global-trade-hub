import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Globe, LayoutDashboard, Package2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useState } from "react";

export function LeftNavbar() {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  const navItems = [
    { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/", icon: Package2, label: "Product Gallery" },
  ];

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 z-50",
        isCollapsed ? "w-16" : "w-56"
      )}
    >
      {/* Header */}
      <div className={cn(
        "h-14 flex items-center border-b border-sidebar-border",
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
        {navItems.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;

          if (isCollapsed) {
            return (
              <Tooltip key={item.path} delayDuration={0}>
                <TooltipTrigger asChild>
                  <Link to={item.path}>
                    <Button
                      variant={active ? "default" : "ghost"}
                      size="icon"
                      className={cn(
                        "w-full",
                        active && "shadow-glow"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-card border-border">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          }

          return (
            <Link key={item.path} to={item.path}>
              <Button
                variant={active ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3",
                  active && "shadow-glow"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="flex-1 text-left">{item.label}</span>
              </Button>
            </Link>
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

