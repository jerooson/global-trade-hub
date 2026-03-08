import { cn } from "@/lib/utils";
import { LeftNavbar } from "@/components/layout/LeftNavbar";
import { TopHeader } from "@/components/layout/TopHeader";
import { useNavbar } from "@/hooks/useNavbar";
import { Package, Search, DollarSign, Users, ShoppingCart, LayoutDashboard, ArrowUpRight, ArrowRight } from "lucide-react";

const stats = [
  {
    label: "Products",
    value: "24",
    change: "+12%",
    icon: Package,
    sub: "In gallery",
    delay: "delay-75",
  },
  {
    label: "Active Searches",
    value: "8",
    change: "+5 this week",
    icon: Search,
    sub: "Sourcing runs",
    delay: "delay-150",
  },
  {
    label: "Shortlisted",
    value: "15",
    change: "+3",
    icon: Users,
    sub: "Manufacturers saved",
    delay: "delay-225",
  },
  {
    label: "Calculations",
    value: "32",
    change: "+8",
    icon: DollarSign,
    sub: "Price models",
    delay: "delay-300",
  },
];

const recentActivity = [
  { action: "Search completed", product: "LED Strips", time: "2h ago" },
  { action: "Manufacturer shortlisted", product: "PCB Boards", time: "5h ago" },
  { action: "Price calculated", product: "Semiconductors", time: "1d ago" },
  { action: "Product added", product: "Electronics", time: "2d ago" },
];

const quickActions = [
  { label: "Add New Product", sub: "Create a product in gallery", icon: Package, href: "/" },
  { label: "Start Sourcing", sub: "Find global manufacturers", icon: Search, href: "/workspace" },
  { label: "Calculate Pricing", sub: "Price & margin calculator", icon: DollarSign, href: "/workspace" },
  { label: "View Shortlist", sub: "Review saved manufacturers", icon: ShoppingCart, href: "/workspace" },
];

const Dashboard = () => {
  const { isCollapsed } = useNavbar();

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <LeftNavbar />

      <div className={cn("flex-1 flex flex-col transition-all duration-300", isCollapsed ? "ml-16" : "ml-56")}>
        <TopHeader
          pageTitle="Dashboard"
          pageIcon={<LayoutDashboard className="w-5 h-5 text-primary" />}
        />

        <main className="flex-1 overflow-auto">
          <div className="px-8 py-8 max-w-6xl mx-auto">

            {/* Page header */}
            <div className="mb-10 animate-fade-up">
              <p className="text-xs font-display tracking-[0.2em] uppercase text-muted-foreground mb-1">{today}</p>
              <h1 className="font-display text-3xl font-700 text-foreground">Overview</h1>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border rounded-lg overflow-hidden mb-8 shadow-card">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    className={cn(
                      "bg-card px-6 py-5 flex flex-col gap-3 group hover:bg-primary/5 transition-colors duration-200 animate-fade-up",
                      stat.delay
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-display tracking-[0.15em] uppercase text-muted-foreground">
                        {stat.label}
                      </span>
                      <Icon className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div className="font-display text-4xl font-700 text-foreground leading-none tabular-nums">
                      {stat.value}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{stat.sub}</span>
                      <span className="text-xs text-primary font-medium flex items-center gap-0.5">
                        <ArrowUpRight className="w-3 h-3" />
                        {stat.change}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Two-column section */}
            <div className="grid gap-6 md:grid-cols-2">

              {/* Recent Activity */}
              <div className="animate-fade-up delay-300">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-sm font-600 tracking-[0.12em] uppercase text-muted-foreground">
                    Recent Activity
                  </h2>
                  <span className="text-xs text-muted-foreground">Last 7 days</span>
                </div>
                <div className="bg-card rounded-lg border border-border overflow-hidden shadow-card">
                  {recentActivity.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between px-5 py-4 border-b border-border last:border-0 hover:bg-primary/5 transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{item.action}</p>
                          <p className="text-xs text-muted-foreground font-display tracking-wide">{item.product}</p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0 ml-4 tabular-nums">{item.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="animate-fade-up delay-400">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-sm font-600 tracking-[0.12em] uppercase text-muted-foreground">
                    Quick Actions
                  </h2>
                </div>
                <div className="bg-card rounded-lg border border-border overflow-hidden shadow-card">
                  {quickActions.map((action, i) => {
                    const Icon = action.icon;
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-4 px-5 py-4 border-b border-border last:border-0 hover:bg-primary/5 transition-colors cursor-pointer group"
                      >
                        <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                          <Icon className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{action.label}</p>
                          <p className="text-xs text-muted-foreground">{action.sub}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
