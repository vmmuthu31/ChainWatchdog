"use client";

import type * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Token, SpamStatus } from "@/lib/services/goldrush";
import { ShieldCheck, ShieldAlert, Skull, HelpCircle } from "lucide-react";

interface TokenResultProps {
  token: Token | null;
  isLoading: boolean;
  error: string | null;
}

const statusConfig: Record<
  SpamStatus | "unknown",
  { label: string; color: string; icon: React.ElementType }
> = {
  safe: {
    label: "Safe",
    color: "bg-safe text-safe-foreground",
    icon: ShieldCheck,
  },
  spam: {
    label: "Spam",
    color: "bg-destructive text-destructive-foreground",
    icon: Skull,
  },
  suspicious: {
    label: "Suspicious",
    color: "bg-suspicious text-suspicious-foreground",
    icon: ShieldAlert,
  },
  unknown: {
    label: "Unknown",
    color: "bg-muted text-muted-foreground",
    icon: HelpCircle,
  },
};

export function TokenResult({ token, isLoading, error }: TokenResultProps) {
  const getStatusDetails = (status: SpamStatus | undefined) => {
    return status ? statusConfig[status] : statusConfig.unknown;
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <p className="text-center text-muted-foreground">Checking token...</p>
      );
    }

    if (error) {
      return <p className="text-center text-destructive">{error}</p>;
    }

    if (!token) {
      return (
        <p className="text-center text-muted-foreground">
          Enter a token address to check its status.
        </p>
      );
    }

    const { label, color, icon: Icon } = getStatusDetails(token.spamStatus);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            Token Address:
          </span>
          <code className="text-sm break-all">{token.address}</code>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            Status:
          </span>
          <Badge className={cn("text-sm flex items-center gap-1.5", color)}>
            <Icon className="h-4 w-4" />
            {label}
          </Badge>
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Token Status</CardTitle>
      </CardHeader>
      <CardContent>{renderContent()}</CardContent>
    </Card>
  );
}
