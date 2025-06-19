# RugProof

RugProof is an advanced blockchain security and analytics platform designed to help users identify and protect against crypto scams, spam tokens, and honeypots across multiple blockchains. With a powerful combination of AI and blockchain analytics, it provides real-time scanning and threat detection capabilities.

![RugProof](https://github.com/user-attachments/assets/fa83e72e-ad95-4c72-a250-fbf20d5afaeb)

## Features

- ✅ Detect spam tokens and malicious contracts across 100+ blockchains
- ✅ Advanced Honeypot Detection System
- ✅ AI-powered contract analysis and recommendations
- ✅ Real-time wallet scanning and threat detection
- ✅ Track and display recent spam token activity
- ✅ Multi-chain support (Ethereum, BSC, Polygon, Optimism, Base, Gnosis, etc.)
- ✅ Integration with blockchain explorers
- ✅ Modern retro-futuristic UI design
- ✅ Chrome Extension (Coming Soon)
- ✅ Telegram Bot for on-the-go wallet and contract scanning

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Shadcn UI components
- **Blockchain**: Wagmi, RainbowKit for wallet connection
- **APIs**: Covalent API integration
- **Data**: Goldrush enhanced spam lists for token detection
- **AI**: Integration with advanced AI models for contract analysis

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- Git

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/vmmuthu31/RugProof.git
   cd RugProof
   ```

2. Install dependencies:

   ```bash
   npm install
   # or
   bun install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory and add your API keys:

   ```env
   COVALENT_API_KEY=your_covalent_api_key
   ```

4. Run the development server:

   ```bash
   npm run dev
   # or
   bun dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Project Structure

- `/app` - Next.js app directory containing pages and API routes
- `/components` - Reusable React components
- `/lib` - Utility functions and services
- `/public` - Static assets and spam token lists

## Key Features

### Spam Token Detection

- Real-time scanning of wallet addresses
- Support for 100+ blockchain networks
- Integration with Goldrush enhanced spam lists

### Honeypot Checker

- Advanced contract analysis
- Liquidity pool verification
- Token contract security assessment

### Telegram Bot

- Scan wallets for spam tokens on multiple chains
- Check if token contracts are honeypots
- Analyze contract security and verification
- Multi-chain support
- Easy-to-use command interface

### AI Agent

- Smart contract vulnerability analysis
- Personalized security recommendations
- Natural language interaction for blockchain queries

## Deployment

The application is deployed and available at [https://www.rugproofai.com](https://www.rugproofai.com)

You can also deploy your own instance on Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvmmuthu31%2FRugProof)

## License

[MIT](LICENSE)

## Acknowledgments

- [Covalent](https://www.covalenthq.com/) for blockchain data API
- [Goldrush](https://github.com/covalenthq/goldrush-enhanced-spam-lists) for spam token lists
- Built by ForgeX
