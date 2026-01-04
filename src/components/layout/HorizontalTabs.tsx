import { cn } from "@/lib/utils";
import { Search, Calculator, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type TabId = "sourcing" | "calculator" | "approvals";

interface HorizontalTabsProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const tabs = [
  { id: "sourcing" as const, icon: Search, label: "Sourcing" },
  { id: "calculator" as const, icon: Calculator, label: "Pricing & Margin" },
  { id: "approvals" as const, icon: ClipboardCheck, label: "Approvals", comingSoon: true },
];

export function HorizontalTabs({ activeTab, onTabChange }: HorizontalTabsProps) {
  return (
    <div className="border-b bg-background">
      <div className="container px-4">
        <nav className="flex items-center space-x-1 h-12">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <Button
                key={tab.id}
                variant="ghost"
                onClick={() => !tab.comingSoon && onTabChange(tab.id)}
                className={cn(
                  "gap-2 rounded-none border-b-2 border-transparent h-12 px-4",
                  isActive && "border-primary bg-muted/50",
                  tab.comingSoon && "opacity-50 cursor-not-allowed"
                )}
                disabled={tab.comingSoon}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {tab.comingSoon && (
                  <Badge variant="secondary" className="text-xs ml-1">Soon</Badge>
                )}
              </Button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

export type { TabId };

