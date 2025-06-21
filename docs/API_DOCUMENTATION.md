# RugProofAI API Documentation

## Overview

RugProofAI provides comprehensive blockchain security analysis APIs for detecting honeypots, rug pulls, and other malicious smart contracts across multiple chains. Our advanced AI-powered analysis helps developers and web3 platforms protect their users from scam tokens.

## 🚀 Features

- **Multi-Chain Support**: Ethereum, BSC, Polygon, Base, Avalanche, Solana
- **Real-time Analysis**: Instant honeypot detection and risk assessment
- **Comprehensive Reports**: Token analysis, contract verification, holder analysis
- **High Accuracy**: AI-powered detection with 95%+ accuracy rate
- **Enterprise Grade**: 99.9% uptime SLA with global CDN
- **Developer Friendly**: RESTful APIs with extensive documentation

## 🔐 Authentication

All API requests require authentication using API keys. Include your API key in the header:

```bash
Authorization: Bearer YOUR_API_KEY
```

### Getting Your API Key

1. Sign up at [rugproofai.com/api](https://rugproofai.com/api)
2. Choose your subscription plan
3. Generate your API key from the dashboard
4. Start making requests immediately

## 📊 API Endpoints

### 1. Honeypot Detection API

**Endpoint**: `POST /api/v1/analyze/honeypot`

Detect honeypot tokens and analyze selling restrictions.

**Request:**

```json
{
  "address": "0x1234567890123456789012345678901234567890",
  "chain": "ethereum" // optional, auto-detected if not provided
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "address": "0x1234567890123456789012345678901234567890",
    "chain": "ethereum",
    "token": {
      "name": "Example Token",
      "symbol": "EXAMPLE",
      "decimals": 18,
      "totalHolders": 1234
    },
    "risk": {
      "level": "HIGH", // LOW, MEDIUM, HIGH
      "score": 85,
      "isHoneypot": true,
      "reason": "Cannot sell tokens - honeypot detected"
    },
    "taxes": {
      "buyTax": 5.0,
      "sellTax": 99.0,
      "transferTax": 0.0
    },
    "contract": {
      "isVerified": false,
      "isOpenSource": false,
      "isProxy": true,
      "hasProxyCalls": true
    },
    "liquidity": {
      "dex": "Uniswap V2",
      "pair": "EXAMPLE-ETH",
      "liquidityUsd": 15000,
      "pairAddress": "0x..."
    },
    "holders": {
      "total": 1234,
      "canSell": 10,
      "failed": 1224,
      "topHolderPercent": 45.2
    },
    "flags": [
      "EXTREMELY_HIGH_SELL_TAX",
      "UNVERIFIED_CONTRACT",
      "PROXY_CONTRACT"
    ]
  },
  "credits_used": 1,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 2. Multi-Token Batch Analysis

**Endpoint**: `POST /api/v1/analyze/batch`

Analyze multiple tokens in a single request.

**Request:**

```json
{
  "tokens": [
    {
      "address": "0x1234...",
      "chain": "ethereum"
    },
    {
      "address": "0x5678...",
      "chain": "bsc"
    }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "results": [
      {
        "address": "0x1234...",
        "status": "analyzed",
        "risk": {
          /* ... */
        }
      },
      {
        "address": "0x5678...",
        "status": "analyzed",
        "risk": {
          /* ... */
        }
      }
    ],
    "summary": {
      "total": 2,
      "high_risk": 1,
      "medium_risk": 0,
      "low_risk": 1,
      "failed": 0
    }
  },
  "credits_used": 2
}
```

### 3. Contract Verification API

**Endpoint**: `POST /api/v1/analyze/contract`

Analyze smart contract source code and verification status.

**Request:**

```json
{
  "address": "0x1234567890123456789012345678901234567890",
  "chain": "ethereum"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "address": "0x1234567890123456789012345678901234567890",
    "isVerified": true,
    "isOpenSource": true,
    "compiler": "0.8.19",
    "optimization": true,
    "securityRisks": {
      "hasMintFunction": false,
      "hasBurnFunction": true,
      "hasOwnerPrivileges": true,
      "hasPausableFunction": false,
      "hasUpgradeableProxy": false
    },
    "auditScore": 78,
    "recommendations": [
      "Consider renouncing ownership for better decentralization",
      "Add time locks for critical functions"
    ]
  },
  "credits_used": 1
}
```

### 4. Wallet Risk Assessment

**Endpoint**: `POST /api/v1/analyze/wallet`

Analyze wallet addresses for suspicious activities.

**Request:**

```json
{
  "address": "0x1234567890123456789012345678901234567890",
  "chain": "ethereum"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "address": "0x1234567890123456789012345678901234567890",
    "riskScore": 25,
    "riskLevel": "LOW",
    "activities": {
      "totalTransactions": 1524,
      "suspiciousTransactions": 12,
      "interactedWithScams": 2,
      "rugPullParticipation": 0
    },
    "tokens": {
      "total": 45,
      "suspicious": 3,
      "verified": 42
    },
    "reputation": {
      "isBlacklisted": false,
      "isWhitelisted": false,
      "trustScore": 75
    }
  },
  "credits_used": 2
}
```

### 5. Real-time Monitoring API

**Endpoint**: `POST /api/v1/monitor/subscribe`

Subscribe to real-time alerts for token addresses.

**Request:**

```json
{
  "addresses": ["0x1234...", "0x5678..."],
  "chains": ["ethereum", "bsc"],
  "alertTypes": ["honeypot_detected", "rug_pull", "high_sell_tax"],
  "webhook": "https://your-app.com/webhook"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "subscriptionId": "sub_123456789",
    "status": "active",
    "addresses": 2,
    "estimatedCreditsPerDay": 48
  }
}
```

## 💰 Pricing Plans

### Free Tier

- **Price**: $0/month
- **Credits**: 100/month
- **Rate Limit**: 10 requests/minute
- **Features**: Basic honeypot detection
- **Support**: Community support

### Developer Plan

- **Price**: $29/month
- **Credits**: 5,000/month
- **Rate Limit**: 100 requests/minute
- **Features**: All APIs, batch analysis
- **Support**: Email support
- **SLA**: 99.5% uptime

### Professional Plan

- **Price**: $99/month
- **Credits**: 25,000/month
- **Rate Limit**: 500 requests/minute
- **Features**: All APIs, real-time monitoring, webhooks
- **Support**: Priority email support
- **SLA**: 99.9% uptime

### Enterprise Plan

- **Price**: $499/month
- **Credits**: 150,000/month
- **Rate Limit**: 2000 requests/minute
- **Features**: All APIs, custom integrations, dedicated support
- **Support**: 24/7 phone + email support
- **SLA**: 99.99% uptime
- **Extras**: White-label options, custom endpoints

### Pay-as-you-go

- **Price**: $0.02 per credit
- **Rate Limit**: Based on plan
- **Features**: All APIs available
- **Minimum**: $10 credit purchase

## 🎯 Monetization Strategies

### 1. B2B SaaS Integration

- **DeFi Platforms**: Integrate honeypot detection in DEX frontends
- **Wallet Providers**: Add security warnings before token swaps
- **Portfolio Trackers**: Highlight risky tokens in user portfolios
- **Trading Bots**: Prevent bots from buying honeypot tokens

### 2. White-Label Solutions

- **Custom Branding**: Rebrand API responses with client logos
- **Dedicated Infrastructure**: Private cloud deployment
- **Custom Domains**: api.yourcompany.com
- **Revenue Sharing**: 70/30 split on white-label sales

### 3. Enterprise Services

- **Smart Contract Auditing**: Comprehensive pre-launch analysis
- **Compliance Reporting**: Regulatory compliance documentation
- **Custom Risk Models**: Industry-specific risk assessment
- **Consulting Services**: Security advisory and implementation

### 4. Data Licensing

- **Historical Data**: Access to honeypot and rug pull databases
- **Risk Intelligence**: Curated threat intelligence feeds
- **Market Research**: Token risk trends and analytics
- **Academic Research**: Discounted access for universities

### 5. Partner Program

- **Affiliate Commissions**: 20% recurring commission
- **Integration Bonuses**: $500-$5000 for successful integrations
- **Co-marketing**: Joint marketing campaigns and webinars
- **Technical Support**: Dedicated partner success managers

## 🔧 SDKs and Libraries

### JavaScript/TypeScript

```bash
npm install @rugproofai/sdk
```

```typescript
import { RugProofAI } from "@rugproofai/sdk";

const client = new RugProofAI("your-api-key");

const result = await client.analyzeToken({
  address: "0x1234...",
  chain: "ethereum",
});
```

### Python

```bash
pip install rugproofai
```

```python
from rugproofai import RugProofClient

client = RugProofClient('your-api-key')
result = client.analyze_token('0x1234...', chain='ethereum')
```

### Go

```bash
go get github.com/rugproofai/go-sdk
```

```go
import "github.com/rugproofai/go-sdk"

client := rugproofai.NewClient("your-api-key")
result, err := client.AnalyzeToken("0x1234...", "ethereum")
```

## 📈 Analytics Dashboard

Track your API usage with our comprehensive dashboard:

- **Real-time Usage**: Monitor API calls and credits
- **Success Rates**: Track API response success rates
- **Performance Metrics**: Response times and uptime stats
- **Billing**: Detailed usage and cost breakdown
- **Alerts**: Set up usage and billing alerts

## 🛠️ Integration Examples

### DeFi Frontend Integration

```typescript
// Before token swap, check if token is safe
const checkTokenSafety = async (tokenAddress: string) => {
  const analysis = await rugProofClient.analyzeToken({
    address: tokenAddress,
    chain: "ethereum",
  });

  if (analysis.risk.level === "HIGH") {
    showWarningModal("This token may be a honeypot!");
    return false;
  }

  return true;
};
```

### Wallet Integration

```typescript
// Show risk warnings in wallet interface
const getTokenRiskBadge = async (tokens: string[]) => {
  const batchAnalysis = await rugProofClient.analyzeBatch(tokens);

  return batchAnalysis.results.map((result) => ({
    address: result.address,
    riskLevel: result.risk.level,
    warning: result.risk.level === "HIGH" ? "Potential scam token" : null,
  }));
};
```

## 🔒 Security & Compliance

- **Data Encryption**: All data encrypted in transit and at rest
- **SOC 2 Type II**: Independently audited security controls
- **GDPR Compliant**: European data protection compliance
- **Rate Limiting**: DDoS protection and fair usage policies
- **API Keys**: Secure key management with rotation capabilities

## 📞 Support Channels

- **Documentation**: Comprehensive API docs and tutorials
- **Discord Community**: Join 5000+ developers
- **Email Support**: api-support@rugproofai.com
- **Status Page**: status.rugproofai.com
- **GitHub**: Sample code and SDKs

## 🚀 Getting Started

1. **Sign Up**: Create account at rugproofai.com/api
2. **Choose Plan**: Select the plan that fits your needs
3. **Get API Key**: Generate your authentication key
4. **Make First Call**: Test with our interactive API explorer
5. **Integrate**: Use our SDKs or direct HTTP calls
6. **Monitor**: Track usage in your dashboard

## 📄 Terms of Service

- **Fair Usage**: Reasonable rate limits per plan
- **Data Retention**: 30 days for free, 1 year for paid plans
- **SLA Credits**: Automatic credits for downtime
- **Refund Policy**: 30-day money-back guarantee
- **API Versioning**: 6-month deprecation notice for breaking changes

---

**Ready to get started?** [Sign up for your free API key →](https://rugproofai.com/api/signup)

_Protect your users from crypto scams with RugProofAI's industry-leading detection technology._
