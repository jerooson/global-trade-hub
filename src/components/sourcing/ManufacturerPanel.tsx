import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Building2, MapPin, User, Mail, Phone, Package, Factory, Store } from "lucide-react";
import { cn } from "@/lib/utils";

interface ManufacturerResult {
  name: string;
  type: "Factory" | "Trading Company";
  confidence: number;
  address: string;
  contact: string;
  email: string;
  phone: string;
  products: string[];
}

interface ManufacturerPanelProps {
  result: ManufacturerResult | null;
}

export function ManufacturerPanel({ result }: ManufacturerPanelProps) {
  if (!result) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto">
            <Building2 className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-medium text-foreground">No Results Yet</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Upload an image or describe a product to find manufacturers
            </p>
          </div>
        </div>
      </div>
    );
  }

  const confidenceColor =
    result.confidence >= 80
      ? "text-success"
      : result.confidence >= 60
      ? "text-warning"
      : "text-destructive";

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 animate-slide-in-right">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center",
                result.type === "Factory"
                  ? "bg-success/20 text-success"
                  : "bg-warning/20 text-warning"
              )}
            >
              {result.type === "Factory" ? (
                <Factory className="w-6 h-6" />
              ) : (
                <Store className="w-6 h-6" />
              )}
            </div>
            <div>
              <h2 className="font-semibold text-lg">{result.name}</h2>
              <Badge
                variant="secondary"
                className={cn(
                  "mt-1",
                  result.type === "Factory"
                    ? "bg-success/20 text-success border-success/30"
                    : "bg-warning/20 text-warning border-warning/30"
                )}
              >
                {result.type}
              </Badge>
            </div>
          </div>
        </div>

        {/* Confidence Score */}
        <Card className="bg-card/50 border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Confidence Score</span>
              <span className={cn("font-bold text-xl", confidenceColor)}>
                {result.confidence}%
              </span>
            </div>
            <Progress
              value={result.confidence}
              className="h-2"
            />
            <p className="text-xs text-muted-foreground mt-2">
              {result.confidence >= 80
                ? "High confidence - likely a direct manufacturer"
                : result.confidence >= 60
                ? "Medium confidence - may require verification"
                : "Low confidence - additional verification recommended"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Contact Information */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <User className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">{result.contact}</p>
              <p className="text-xs text-muted-foreground">Primary Contact</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div>
              <a
                href={`mailto:${result.email}`}
                className="text-sm font-medium text-primary hover:underline"
              >
                {result.email}
              </a>
              <p className="text-xs text-muted-foreground">Email</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">{result.phone}</p>
              <p className="text-xs text-muted-foreground">Phone</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">{result.address}</p>
              <p className="text-xs text-muted-foreground">Address</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="w-5 h-5" />
            Products
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {result.products.map((product) => (
              <Badge key={product} variant="secondary" className="bg-secondary">
                {product}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
