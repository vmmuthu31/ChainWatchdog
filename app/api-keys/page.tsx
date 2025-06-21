"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Copy,
  Key,
  CreditCard,
  Shield,
  Zap,
  Eye,
  EyeOff,
  Trash2,
  Plus,
  Code,
  Globe,
  TrendingUp,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { pixelFont, pixelMonoFont } from "@/lib/font";

interface ApiKey {
  id: string;
  name: string;
  tier: "free" | "developer" | "professional" | "enterprise";
  credits: number;
  maxCredits: number;
  rateLimit: number;
  createdAt: string;
  isActive: boolean;
  lastUsed?: string;
}

const TIER_COLORS = {
  free: "bg-gray-800/50 text-gray-300 border-gray-600",
  developer: "bg-blue-900/30 text-blue-300 border-blue-500/50",
  professional: "bg-purple-900/30 text-purple-300 border-purple-500/50",
  enterprise: "bg-green-900/30 text-[#00ff00] border-[#00ff00]/50",
};

const TIER_FEATURES = {
  free: {
    name: "Free",
    price: "$0/month",
    credits: 100,
    rateLimit: "10 req/min",
    features: ["Basic honeypot detection", "Rate limited", "Community support"],
  },
  developer: {
    name: "Developer",
    price: "$29/month",
    credits: 5000,
    rateLimit: "100 req/min",
    features: [
      "All security APIs",
      "Batch processing",
      "Email support",
      "Webhooks",
    ],
  },
  professional: {
    name: "Professional",
    price: "$99/month",
    credits: 25000,
    rateLimit: "500 req/min",
    features: [
      "Priority analysis",
      "Real-time monitoring",
      "Custom integrations",
      "Phone support",
    ],
  },
  enterprise: {
    name: "Enterprise",
    price: "$499/month",
    credits: 100000,
    rateLimit: "2000 req/min",
    features: [
      "White-label API",
      "Dedicated support",
      "SLA guarantee",
      "Custom features",
    ],
  },
};

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyTier, setNewKeyTier] = useState<string>("free");
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  // Demo data - in production, this would come from an API
  useEffect(() => {
    setApiKeys([
      {
        id: "demo_free_key_123",
        name: "Demo Free Key",
        tier: "free",
        credits: 50,
        maxCredits: 100,
        rateLimit: 10,
        createdAt: "2024-01-15T10:30:00Z",
        isActive: true,
        lastUsed: "2024-01-20T14:22:00Z",
      },
      {
        id: "demo_dev_key_456",
        name: "Demo Developer Key",
        tier: "developer",
        credits: 2500,
        maxCredits: 5000,
        rateLimit: 100,
        createdAt: "2024-01-10T09:15:00Z",
        isActive: true,
        lastUsed: "2024-01-20T16:45:00Z",
      },
    ]);
  }, []);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const toggleKeyVisibility = (keyId: string) => {
    const newVisible = new Set(visibleKeys);
    if (newVisible.has(keyId)) {
      newVisible.delete(keyId);
    } else {
      newVisible.add(keyId);
    }
    setVisibleKeys(newVisible);
  };

  const createApiKey = async () => {
    if (!newKeyName.trim()) {
      toast.error("Please enter a name for your API key");
      return;
    }

    setIsLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const newKey: ApiKey = {
      id: `rp_${Math.random().toString(36).substring(2, 15)}`,
      name: newKeyName,
      tier: newKeyTier as ApiKey["tier"],
      credits: TIER_FEATURES[newKeyTier as keyof typeof TIER_FEATURES].credits,
      maxCredits:
        TIER_FEATURES[newKeyTier as keyof typeof TIER_FEATURES].credits,
      rateLimit: parseInt(
        TIER_FEATURES[newKeyTier as keyof typeof TIER_FEATURES].rateLimit
      ),
      createdAt: new Date().toISOString(),
      isActive: true,
    };

    setApiKeys((prev) => [...prev, newKey]);
    setNewKeyName("");
    setNewKeyTier("free");
    setShowCreateDialog(false);
    setIsLoading(false);

    toast.success("API Key Created!", {
      description: "Your new API key has been generated successfully",
    });
  };

  const deleteApiKey = async (keyId: string) => {
    setApiKeys((prev) => prev.filter((key) => key.id !== keyId));
    toast.success("API Key Deleted", {
      description: "The API key has been permanently deleted",
    });
  };

  const formatKey = (key: string, isVisible: boolean) => {
    if (isVisible) {
      return key;
    }
    return key.slice(0, 8) + "•".repeat(20) + key.slice(-4);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <div className="container mx-auto p-6 max-w-6xl">
        <div className="mb-8 text-center space-y-4">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#00ff00]/10 via-transparent to-transparent blur-3xl"></div>
          <h1
            className={`${pixelFont.className} text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#00ff00] via-[#00ffff] to-[#ff00ff] bg-clip-text text-transparent animate-pulse-slow`}
          >
            API KEYS MANAGEMENT
          </h1>
          <p
            className={`${pixelMonoFont.className} text-lg text-[#00ffff] max-w-2xl mx-auto`}
          >
            Generate and manage your RugProofAI API keys to access our security
            services
          </p>
        </div>

        <Tabs defaultValue="keys" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-black/50 border border-[#00ff00]/30">
            <TabsTrigger
              value="keys"
              className="data-[state=active]:bg-[#00ff00]/20 data-[state=active]:text-[#00ff00] text-gray-400"
            >
              <Key className="h-4 w-4 mr-2" />
              API Keys
            </TabsTrigger>
            <TabsTrigger
              value="pricing"
              className="data-[state=active]:bg-[#00ff00]/20 data-[state=active]:text-[#00ff00] text-gray-400"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Pricing
            </TabsTrigger>
            <TabsTrigger
              value="docs"
              className="data-[state=active]:bg-[#00ff00]/20 data-[state=active]:text-[#00ff00] text-gray-400"
            >
              <Code className="h-4 w-4 mr-2" />
              Documentation
            </TabsTrigger>
          </TabsList>

          <TabsContent value="keys" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2
                className={`${pixelMonoFont.className} text-2xl font-semibold text-[#00ffff]`}
              >
                Your API Keys
              </h2>
              <Dialog
                open={showCreateDialog}
                onOpenChange={setShowCreateDialog}
              >
                <DialogTrigger asChild>
                  <Button className="bg-[#00ff00] hover:bg-[#00ff00]/80 text-black font-semibold">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Key
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-black border border-[#00ff00]/50">
                  <DialogHeader>
                    <DialogTitle className="text-[#00ffff]">
                      Create New API Key
                    </DialogTitle>
                    <DialogDescription className="text-gray-400">
                      Generate a new API key to access RugProofAI services
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="keyName" className="text-[#00ff00]">
                        Key Name
                      </Label>
                      <Input
                        id="keyName"
                        placeholder="e.g., My DeFi App"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        className="bg-black/50 border-[#00ff00]/30 text-[#00ffff] placeholder:text-gray-500"
                      />
                    </div>
                    <div>
                      <Label htmlFor="keyTier" className="text-[#00ff00]">
                        Tier
                      </Label>
                      <Select value={newKeyTier} onValueChange={setNewKeyTier}>
                        <SelectTrigger className="bg-black/50 border-[#00ff00]/30 text-[#00ffff]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-black border-[#00ff00]/50">
                          {Object.entries(TIER_FEATURES).map(([key, tier]) => (
                            <SelectItem
                              key={key}
                              value={key}
                              className="text-[#00ffff] focus:bg-[#00ff00]/20"
                            >
                              {tier.name} - {tier.price}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      onClick={createApiKey}
                      disabled={isLoading}
                      className="w-full bg-[#00ff00] hover:bg-[#00ff00]/80 text-black font-semibold"
                    >
                      {isLoading ? "Creating..." : "Create API Key"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {apiKeys.map((key) => (
                <Card
                  key={key.id}
                  className="bg-black/50 border border-[#00ff00]/30 backdrop-blur-sm"
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle
                          className={`${pixelMonoFont.className} flex items-center gap-2 text-[#00ffff]`}
                        >
                          <Key className="h-5 w-5" />
                          {key.name}
                        </CardTitle>
                        <CardDescription className="text-gray-400">
                          Created {new Date(key.createdAt).toLocaleDateString()}
                          {key.lastUsed &&
                            ` • Last used ${new Date(
                              key.lastUsed
                            ).toLocaleDateString()}`}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={TIER_COLORS[key.tier]}>
                          {TIER_FEATURES[key.tier].name}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteApiKey(key.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-[#00ff00]">API Key</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          readOnly
                          value={formatKey(key.id, visibleKeys.has(key.id))}
                          className="font-mono text-sm bg-black/30 border-[#00ff00]/20 text-[#00ffff]"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleKeyVisibility(key.id)}
                          className="border-[#00ff00]/30 text-[#00ff00] hover:bg-[#00ff00]/10"
                        >
                          {visibleKeys.has(key.id) ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(key.id, "API key")}
                          className="border-[#00ff00]/30 text-[#00ff00] hover:bg-[#00ff00]/10"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-black/30 p-4 rounded-lg border border-[#00ff00]/20">
                        <Label className="text-sm text-gray-400">Credits</Label>
                        <div className="flex items-center gap-2">
                          <div className="text-lg font-semibold text-[#00ffff]">
                            {key.credits.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-500">
                            / {key.maxCredits.toLocaleString()}
                          </div>
                        </div>
                        <div className="w-full bg-gray-800 rounded-full h-2 mt-2">
                          <div
                            className="bg-gradient-to-r from-[#00ff00] to-[#00ffff] h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.min(
                                (key.credits / key.maxCredits) * 100,
                                100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="bg-black/30 p-4 rounded-lg border border-[#00ff00]/20">
                        <Label className="text-sm text-gray-400">
                          Rate Limit
                        </Label>
                        <div className="text-lg font-semibold text-[#00ffff]">
                          {key.rateLimit} req/min
                        </div>
                      </div>

                      <div className="bg-black/30 p-4 rounded-lg border border-[#00ff00]/20">
                        <Label className="text-sm text-gray-400">Status</Label>
                        <div className="flex items-center gap-2">
                          <div
                            className={`h-2 w-2 rounded-full ${
                              key.isActive ? "bg-[#00ff00]" : "bg-red-500"
                            } animate-pulse`}
                          />
                          <span className="text-sm text-[#00ffff]">
                            {key.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="pricing" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {Object.entries(TIER_FEATURES).map(([key, tier]) => (
                <Card
                  key={key}
                  className="relative bg-black/50 border border-[#00ff00]/30 backdrop-blur-sm hover:border-[#00ff00]/50 transition-all duration-300"
                >
                  <CardHeader>
                    <CardTitle
                      className={`${pixelMonoFont.className} flex items-center gap-2 text-[#00ffff]`}
                    >
                      {key === "enterprise" && (
                        <Shield className="h-5 w-5 text-[#00ff00]" />
                      )}
                      {key === "professional" && (
                        <Zap className="h-5 w-5 text-purple-400" />
                      )}
                      {key === "developer" && (
                        <CreditCard className="h-5 w-5 text-blue-400" />
                      )}
                      {key === "free" && (
                        <Key className="h-5 w-5 text-gray-400" />
                      )}
                      {tier.name}
                    </CardTitle>
                    <div className="text-3xl font-bold text-[#00ff00]">
                      {tier.price}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="bg-black/30 p-3 rounded-lg">
                        <div className="text-sm text-gray-400">
                          Credits per month
                        </div>
                        <div className="font-semibold text-[#00ffff]">
                          {tier.credits.toLocaleString()}
                        </div>
                      </div>
                      <div className="bg-black/30 p-3 rounded-lg">
                        <div className="text-sm text-gray-400">Rate Limit</div>
                        <div className="font-semibold text-[#00ffff]">
                          {tier.rateLimit}
                        </div>
                      </div>
                      <div className="pt-2">
                        <div className="text-sm text-gray-400 mb-2">
                          Features
                        </div>
                        <ul className="space-y-1 text-sm">
                          {tier.features.map((feature, index) => (
                            <li
                              key={index}
                              className="flex items-center gap-2 text-gray-300"
                            >
                              <div className="h-1.5 w-1.5 rounded-full bg-[#00ff00]" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="docs" className="space-y-6">
            <Card className="bg-black/50 border border-[#00ff00]/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle
                  className={`${pixelMonoFont.className} text-[#00ffff]`}
                >
                  <Globe className="h-5 w-5 inline mr-2" />
                  Quick Start Guide
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Get started with the RugProofAI API in minutes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-black/30 p-4 rounded-lg border border-[#00ff00]/20">
                  <h3
                    className={`${pixelMonoFont.className} font-semibold mb-2 text-[#00ff00]`}
                  >
                    1. Get your API key
                  </h3>
                  <p className="text-sm text-gray-300">
                    Create an API key from the &quot;API Keys&quot; tab above.
                  </p>
                </div>

                <div className="bg-black/30 p-4 rounded-lg border border-[#00ff00]/20">
                  <h3
                    className={`${pixelMonoFont.className} font-semibold mb-2 text-[#00ff00]`}
                  >
                    2. Make your first request
                  </h3>
                  <div className="bg-black p-4 rounded-lg border border-gray-700 overflow-x-auto">
                    <pre
                      className={`${pixelMonoFont.className} text-sm text-[#00ffff]`}
                    >
                      {`curl -X POST https://api.rugproofai.com/v1/security/honeypot \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "address": "0x1234567890123456789012345678901234567890"
  }'`}
                    </pre>
                  </div>
                </div>

                <div className="bg-black/30 p-4 rounded-lg border border-[#00ff00]/20">
                  <h3
                    className={`${pixelMonoFont.className} font-semibold mb-2 text-[#00ff00]`}
                  >
                    3. Handle the response
                  </h3>
                  <div className="bg-black p-4 rounded-lg border border-gray-700 overflow-x-auto">
                    <pre
                      className={`${pixelMonoFont.className} text-sm text-[#00ffff]`}
                    >
                      {`{
  "success": true,
  "data": {
    "token": {
      "address": "0x1234...",
      "name": "Example Token",
      "symbol": "EXT"
    },
    "security": {
      "isHoneypot": false,
      "riskLevel": "low",
      "riskScore": 25
    }
  },
  "credits_used": 1,
  "credits_remaining": 99
}`}
                    </pre>
                  </div>
                </div>

                <div className="bg-black/30 p-4 rounded-lg border border-[#00ff00]/20">
                  <h3
                    className={`${pixelMonoFont.className} font-semibold mb-2 text-[#00ff00]`}
                  >
                    Available Endpoints
                  </h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2 text-gray-300">
                      <TrendingUp className="h-4 w-4 text-[#00ff00]" />
                      <code className="text-[#00ffff]">
                        POST /v1/security/honeypot
                      </code>{" "}
                      - Honeypot detection
                    </li>
                    <li className="flex items-center gap-2 text-gray-300">
                      <Shield className="h-4 w-4 text-[#00ff00]" />
                      <code className="text-[#00ffff]">
                        POST /v1/security/contract
                      </code>{" "}
                      - Contract verification
                    </li>
                    <li className="flex items-center gap-2 text-gray-300">
                      <Zap className="h-4 w-4 text-[#00ff00]" />
                      <code className="text-[#00ffff]">
                        POST /v1/tokens/analysis
                      </code>{" "}
                      - Comprehensive token analysis
                    </li>
                    <li className="flex items-center gap-2 text-gray-300">
                      <Key className="h-4 w-4 text-[#00ff00]" />
                      <code className="text-[#00ffff]">
                        POST /v1/wallets/analysis
                      </code>{" "}
                      - Wallet security analysis
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
