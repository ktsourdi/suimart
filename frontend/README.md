# Suimart Frontend

A peer-to-peer marketplace built on the Sui blockchain using Next.js.

## Features

- **Connect Wallet**: Integrate with Sui wallets using @mysten/dapp-kit
- **List Items**: Create marketplace listings for your digital assets
- **Buy Items**: Purchase items directly with SUI tokens
- **Responsive Design**: Modern UI built with Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Sui wallet (e.g., Sui Wallet, Ethos Wallet)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory:
   ```
   NEXT_PUBLIC_MARKETPLACE_PACKAGE=YOUR_DEPLOYED_PACKAGE_ID
   NEXT_PUBLIC_SUI_NETWORK=devnet
   ```

### Development

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Building

Build the application:
```bash
npm run build
```

## Deployment

### Vercel Deployment

This project is configured for easy deployment on Vercel:

1. Push your code to a GitHub repository
2. Connect your repository to Vercel
3. Set the following environment variables in your Vercel dashboard:
   - `NEXT_PUBLIC_MARKETPLACE_PACKAGE`: Your deployed Sui package ID
   - `NEXT_PUBLIC_SUI_NETWORK`: The Sui network (devnet, testnet, or mainnet)

The project includes a `vercel.json` configuration file for optimal deployment settings.

### Configuration

#### Environment Variables

- `NEXT_PUBLIC_MARKETPLACE_PACKAGE`: **Required** - The object ID of your deployed Sui marketplace package
- `NEXT_PUBLIC_SUI_NETWORK`: **Optional** - The Sui network to connect to (defaults to "devnet")

#### Sui Package Requirements

This frontend expects a Sui Move package with the following functionality:
- `marketplace::list_item<T>` - Function to list items for sale
- `marketplace::buy_item<T>` - Function to purchase listed items
- `marketplace::ListingCreated` - Event emitted when items are listed

## Architecture

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **Blockchain**: Sui blockchain integration
- **Wallet**: @mysten/dapp-kit for wallet connections
- **Build**: Static export for optimal performance

## Known Issues

- The application now uses `@mysten/dapp-kit` and `@mysten/sui` (latest)
- Consider upgrading to `@mysten/dapp-kit` and `@mysten/sui` for better long-term support

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.