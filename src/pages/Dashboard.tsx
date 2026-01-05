import { cn } from "@/lib/utils";
import { LeftNavbar } from "@/components/layout/LeftNavbar";
import { TopHeader } from "@/components/layout/TopHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavbar } from "@/hooks/useNavbar";
import { TrendingUp, Package, Search, DollarSign, Users, ShoppingCart, LayoutDashboard } from "lucide-react";

const Dashboard = () => {
  const { isCollapsed } = useNavbar();
  // Temporary mock data for dashboard widgets
  const stats = [
    {
      title: "Total Products",
      value: "24",
      change: "+12%",
      icon: Package,
      description: "Products in gallery",
    },
    {
      title: "Active Searches",
      value: "8",
      change: "+5",
      icon: Search,
      description: "Sourcing searches this week",
    },
    {
      title: "Shortlisted",
      value: "15",
      change: "+3",
      icon: Users,
      description: "Manufacturers shortlisted",
    },
    {
      title: "Calculations",
      value: "32",
      change: "+8",
      icon: DollarSign,
      description: "Price calculations saved",
    },
  ];

  const recentActivity = [
    { action: "New search completed", product: "LED Strips", time: "2 hours ago" },
    { action: "Manufacturer shortlisted", product: "PCB Boards", time: "5 hours ago" },
    { action: "Price calculated", product: "Semiconductors", time: "1 day ago" },
    { action: "Product added", product: "Electronics", time: "2 days ago" },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <LeftNavbar />
      
      <div className={cn("flex-1 flex flex-col transition-all duration-300", isCollapsed ? "ml-16" : "ml-56")}>
        <TopHeader 
          pageTitle="Dashboard"
          pageIcon={<LayoutDashboard className="w-5 h-5 text-primary" />}
        />
        
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto px-6 py-8">

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <Card key={stat.title}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        {stat.title}
                      </CardTitle>
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stat.value}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                          {stat.change}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {stat.description}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Two Column Layout */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Your latest actions across the platform</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivity.map((activity, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between border-b border-border last:border-0 pb-3 last:pb-0"
                      >
                        <div>
                          <p className="text-sm font-medium">{activity.action}</p>
                          <p className="text-xs text-muted-foreground">{activity.product}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {activity.time}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common tasks to get you started</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent cursor-pointer transition-colors">
                      <Package className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium">Add New Product</p>
                        <p className="text-xs text-muted-foreground">Create a product in gallery</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent cursor-pointer transition-colors">
                      <Search className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium">Start Sourcing</p>
                        <p className="text-xs text-muted-foreground">Find manufacturers</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent cursor-pointer transition-colors">
                      <DollarSign className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium">Calculate Pricing</p>
                        <p className="text-xs text-muted-foreground">Price & margin calculator</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent cursor-pointer transition-colors">
                      <ShoppingCart className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium">View Shortlist</p>
                        <p className="text-xs text-muted-foreground">Review saved manufacturers</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
