import { ThemeToggle } from "@/components/ui/theme-toggle";
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
      <div className="h-14 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-6 gap-4 shrink-0">
        {product ? (
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
              <Package className="w-3.5 h-3.5 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-sm font-600 tracking-wide text-foreground leading-none">
                {product.name}
              </h2>
              {product.description && (
                <p className="text-xs text-muted-foreground mt-0.5">{product.description}</p>
              )}
            </div>
          </div>
        ) : pageTitle ? (
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
              {pageIcon || <LayoutDashboard className="w-3.5 h-3.5 text-primary" />}
            </div>
            <h2 className="font-display text-sm font-600 tracking-[0.06em] uppercase text-foreground">
              {pageTitle}
            </h2>
          </div>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <button
            onClick={handleLogout}
            title="Logout"
            className="w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}

