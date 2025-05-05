# RugProof

RugProof is a blockchain security tool designed to detect spam tokens and security threats across multiple blockchain networks. It helps users identify potentially malicious tokens in their wallets before they can cause harm.

![RugProof](https://placeholder-for-your-screenshot.com/screenshot.png)

## Features

- ✅ Detect spam tokens across 70+ supported blockchains
- ✅ Real-time wallet scanning and analysis
- ✅ Track and display recent spam token activity
- ✅ Multi-chain support (Ethereum, BSC, Polygon, Optimism, Gnosis, Base, etc.)
- ✅ Integration with blockchain explorers
- ✅ Modern cyberpunk/retro pixel UI aesthetic

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Shadcn UI components
- **Blockchain**: Wagmi, RainbowKit for wallet connection
- **APIs**: Covalent API integration
- **Data**: Goldrush enhanced spam lists for token detection

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

   ```
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

## API Endpoints

- `GET /api/spam-tokens` - Retrieve spam tokens based on network or wallet address

## Deployment

The application can be easily deployed on Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyourusername%2FRugProof)

## License

[MIT](LICENSE)

## Acknowledgments

- [Covalent](https://www.covalenthq.com/) for blockchain data API
- [Goldrush](https://github.com/covalenthq/goldrush-enhanced-spam-lists) for spam token lists
