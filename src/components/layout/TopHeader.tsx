import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { Package, LogOut, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

interface Product {
  name: string;
  description?: string;
}

interface TopHeaderProps {
  className?: string;
  product?: Product | null;
  pageTitle?: string;
  pageIcon?: React.ReactNode;
}

export function TopHeader({ 
  className, 
  product, 
  pageTitle, 
  pageIcon
}: TopHeaderProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className={className}>
      <div className="h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-6 gap-4">
        {product ? (
          <div className="flex items-center gap-3">
            <Package className="w-5 h-5 text-primary" />
            <div>
              <h2 className="text-sm font-semibold">{product.name}</h2>
              {product.description && (
                <p className="text-xs text-muted-foreground">
                  {product.description}
                </p>
              )}
            </div>
          </div>
        ) : pageTitle ? (
          <div className="flex items-center gap-3">
            {pageIcon || <LayoutDashboard className="w-5 h-5 text-primary" />}
            <h2 className="text-lg font-semibold">{pageTitle}</h2>
          </div>
        ) : (
          <div />
        )}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="h-9 w-9"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}

