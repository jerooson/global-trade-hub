import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Package2, ChevronLeft, ChevronRight, Sparkles, Mail } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useNavbar } from "@/hooks/useNavbar";

const navItems = [
  { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/", icon: Package2, label: "Product Gallery" },
  { path: "/ai-studio", icon: Sparkles, label: "AI Studio" },
  { path: "/email-campaigns", icon: Mail, label: "Email Campaigns" },
];

export function LeftNavbar() {
  const location = useLocation();
  const { isCollapsed, setIsCollapsed } = useNavbar();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 z-50",
        isCollapsed ? "w-16" : "w-56"
      )}
    >
      {/* Brand */}
      <div className={cn(
        "h-14 flex items-center border-b border-sidebar-border shrink-0",
        isCollapsed ? "justify-center px-0" : "px-4 gap-3"
      )}>
        {!isCollapsed && (
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-6 h-6 bg-primary rounded-sm flex items-center justify-center shrink-0">
              <span className="font-display text-[10px] font-800 text-primary-foreground leading-none">G</span>
            </div>
            <div className="min-w-0">
              <p className="font-display text-xs font-700 tracking-[0.1em] uppercase text-foreground leading-none truncate">
                Global Trade
              </p>
              <p className="font-display text-[10px] tracking-[0.15em] uppercase text-muted-foreground leading-none mt-0.5">
                Hub
              </p>
            </div>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors shrink-0",
            isCollapsed && "mx-auto"
          )}
        >
          {isCollapsed
            ? <ChevronRight className="w-3.5 h-3.5" />
            : <ChevronLeft className="w-3.5 h-3.5" />
          }
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-0.5">
        {!isCollapsed && (
          <p className="px-3 pb-2 text-[10px] font-display tracking-[0.2em] uppercase text-muted-foreground">
            Navigation
          </p>
        )}
        {navItems.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;

          if (isCollapsed) {
            return (
              <Tooltip key={item.path} delayDuration={0}>
                <TooltipTrigger asChild>
                  <Link
                    to={item.path}
                    className={cn(
                      "flex items-center justify-center w-full h-9 rounded-md transition-colors",
                      active
                        ? "bg-primary/15 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-card border-border font-display text-xs">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 h-9 rounded-md text-sm transition-colors relative",
                active
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-full" />
              )}
              <Icon className="w-4 h-4 shrink-0" />
              <span className="font-display text-xs tracking-wide truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-sidebar-border">
        {!isCollapsed ? (
          <p className="font-display text-[10px] tracking-[0.15em] uppercase text-muted-foreground">
            v1.5.0
          </p>
        ) : (
          <div className="w-1.5 h-1.5 rounded-full bg-primary/40 mx-auto" />
        )}
      </div>
    </aside>
  );
}

