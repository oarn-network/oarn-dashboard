# OARN Dashboard

A Next.js dashboard application for the OARN decentralized AI compute network with 4 role-based views.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Wallet**: RainbowKit + wagmi v2
- **Styling**: Tailwind CSS (OARN dark theme)
- **Charts**: Recharts
- **Data**: TanStack Query (React Query)
- **Chain**: Arbitrum Sepolia (testnet)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
cd oarn-dashboard
npm install
```

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-project-id-here
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
npm run start
```

## Project Structure

```
oarn-dashboard/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Wallet-required routes
│   │   ├── node-operator/ # Node Operator dashboard
│   │   ├── researcher/    # Researcher dashboard
│   │   ├── crowdfunder/   # Crowdfunder dashboard
│   │   └── investor/      # Investor dashboard
│   ├── layout.tsx         # Root layout with providers
│   └── page.tsx           # Landing/role selection
├── components/
│   ├── ui/                # Base UI components
│   ├── layout/            # Navbar, Sidebar
│   ├── dashboard/         # StatCard, TaskCard, etc.
│   ├── charts/            # Recharts wrappers
│   └── forms/             # Task submission forms
├── hooks/                 # React Query hooks
├── lib/                   # Utilities and config
└── providers/             # Context providers
```

## Role-Based Views

### Node Operator
- View and claim available tasks
- Submit computation results
- Track earnings and statistics

### Researcher
- Submit AI inference tasks
- Upload model and input files
- Track task progress and results

### Crowdfunder
- Browse fundable tasks
- Contribute ETH to research tasks
- Track funded task progress

### Investor
- View network analytics
- Track token metrics
- Participate in governance

## Contract Addresses (Arbitrum Sepolia)

- **OARN Registry**: `0x8DD738DBBD4A8484872F84192D011De766Ba5458`
- **Task Registry**: `0xD15530ce13188EE88E43Ab07EDD9E8729fCc55D0`
- **COMP Token**: `0x24249A523A251E38CB0001daBd54DD44Ea8f1838`
- **GOV Token**: `0xB97eDD49C225d2c43e7203aB9248cAbED2B268d3`

## Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel
```

Set environment variables in Vercel dashboard.
