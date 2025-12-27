import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  MapPin,
  User,
  Mail,
  Phone,
  Package,
  Factory,
  Store,
  ChevronDown,
  ChevronUp,
  Star,
  Calculator,
  GitCompare,
  Info,
  Check,
  ExternalLink,
  Building2,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ManufacturerResult } from "./ManufacturerPanel";
import { useShortlist } from "@/hooks/useShortlist";

interface ManufacturerCardProps {
  result: ManufacturerResult;
  rank: number;
  onUseForPricing: (manufacturer: ManufacturerResult) => void;
}

export function ManufacturerCard({ result, rank, onUseForPricing }: ManufacturerCardProps) {
  const [isExpanded, setIsExpanded] = useState(rank === 1);
  const { addToShortlist, isInShortlist } = useShortlist();
  const inShortlist = isInShortlist(result.id);

  const confidenceColor =
    result.confidence >= 80
      ? "text-success"
      : result.confidence >= 60
      ? "text-warning"
      : "text-destructive";

  const confidenceBg =
    result.confidence >= 80
      ? "bg-success/10"
      : result.confidence >= 60
      ? "bg-warning/10"
      : "bg-destructive/10";

  const getConfidenceExplanation = () => {
    if (result.confidence >= 80) {
      return "High confidence based on: direct factory indicators, verified certifications, strong product focus, and consistent historical signals.";
    } else if (result.confidence >= 60) {
      return "Medium confidence based on: mixed signals between factory and trading operations, partial certifications, moderate product specialization.";
    }
    return "Lower confidence due to: limited verification data, broad product range suggesting trading operations, or incomplete company profile.";
  };

  return (
    <Card className={cn("bg-card border-border transition-all duration-200", isExpanded && "shadow-card")}>
      <div onClick={() => setIsExpanded(!isExpanded)} className="w-full text-left cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0",
                  rank === 1 ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                )}
              >
                #{rank}
              </div>
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                  result.type === "Factory" ? "bg-success/20 text-success" : "bg-warning/20 text-warning"
                )}
              >
                {result.type === "Factory" ? <Factory className="w-5 h-5" /> : <Store className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0 overflow-hidden">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <h3 className="font-semibold text-sm truncate cursor-help">{result.name}</h3>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs bg-card border-border">
                    <p className="text-xs">{result.name}</p>
                  </TooltipContent>
                </Tooltip>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-xs flex-shrink-0",
                      result.type === "Factory"
                        ? "bg-success/20 text-success border-success/30"
                        : "bg-warning/20 text-warning border-warning/30"
                    )}
                  >
                    {result.type}
                  </Badge>
                  <span className={cn("text-sm font-bold flex-shrink-0", confidenceColor)}>{result.confidence}%</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                      >
                        <Info className="w-3.5 h-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs bg-card border-border">
                      <p className="text-xs">{getConfidenceExplanation()}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>
            <div className="flex-shrink-0">
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
          </div>
        </CardHeader>
      </div>

      {isExpanded && (
        <CardContent className="pt-0 space-y-4 animate-fade-in">
          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant={inShortlist ? "secondary" : "outline"}
              size="sm"
              className="flex-1"
              onClick={() => addToShortlist(result)}
              disabled={inShortlist}
            >
              {inShortlist ? (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  Shortlisted
                </>
              ) : (
                <>
                  <Star className="w-4 h-4 mr-1" />
                  Add to Shortlist
                </>
              )}
            </Button>
            <Button
              variant="default"
              size="sm"
              className="flex-1"
              onClick={() => onUseForPricing(result)}
            >
              <Calculator className="w-4 h-4 mr-1" />
              Use for Pricing
            </Button>
          </div>

          {/* Confidence Bar */}
          <div className={cn("p-3 rounded-lg", confidenceBg)}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Confidence Score</span>
              <span className={cn("font-bold", confidenceColor)}>{result.confidence}%</span>
            </div>
            <Progress value={result.confidence} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {result.confidence >= 80
                ? "High confidence - likely a direct manufacturer"
                : result.confidence >= 60
                ? "Medium confidence - may require verification"
                : "Low confidence - additional verification recommended"}
            </p>
          </div>

          {/* Contact Information */}
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Contact Information
            </h4>
            <div className="grid gap-3">
              <div className="flex items-start gap-3">
                <User className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">{result.contact}</p>
                  <p className="text-xs text-muted-foreground">Primary Contact</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <a href={`mailto:${result.email}`} className="text-sm font-medium text-primary hover:underline">
                    {result.email}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-muted-foreground mt-0.5" />
                <p className="text-sm font-medium">{result.phone}</p>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                <p className="text-sm">{result.address}</p>
              </div>
            </div>
          </div>

          {/* Products */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Package className="w-4 h-4" />
              Products
            </h4>
            <div className="flex flex-wrap gap-2">
              {result.products.map((product) => (
                <Badge key={product} variant="secondary" className="bg-secondary text-xs">
                  {product}
                </Badge>
              ))}
            </div>
          </div>

          {/* External Links */}
          {result.links && (result.links.productUrl || result.links.companyUrl || result.links.inquiryUrl) && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                Links
              </h4>
              <div className="flex flex-col gap-2">
                {result.links.productUrl && (
                  <a
                    href={result.links.productUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline p-2 rounded-md hover:bg-secondary transition-colors"
                  >
                    <Package className="w-4 h-4" />
                    <span>Product Page</span>
                    <ExternalLink className="w-3 h-3 ml-auto" />
                  </a>
                )}
                {result.links.companyUrl && (
                  <a
                    href={result.links.companyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline p-2 rounded-md hover:bg-secondary transition-colors"
                  >
                    <Building2 className="w-4 h-4" />
                    <span>Company Profile</span>
                    <ExternalLink className="w-3 h-3 ml-auto" />
                  </a>
                )}
                {result.links.inquiryUrl && (
                  <a
                    href={result.links.inquiryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline p-2 rounded-md hover:bg-secondary transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Send Inquiry</span>
                    <ExternalLink className="w-3 h-3 ml-auto" />
                  </a>
                )}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
