# Suimart - Enhanced Decentralized Marketplace

Suimart is a comprehensive peer-to-peer marketplace dApp built on the **Sui blockchain**. It provides a modern, feature-rich platform for buying, selling, and auctioning digital assets with advanced filtering, user profiles, and reputation systems.

## 🚀 Features

### Core Marketplace Features
- **Fixed Price Listings**: List items at a set price for immediate purchase
- **Auction System**: Create time-limited auctions with bidding functionality
- **Advanced Search & Filtering**: Search by title, description, seller, or category
- **Category System**: Organize items by type (NFTs, Gaming, Art, etc.)
- **Price Range Filtering**: Filter by minimum and maximum price
- **Sorting Options**: Sort by price, date, popularity, or auction end time
- **View Modes**: Grid and list view options

### User Experience
- **Modern UI/UX**: Clean, responsive design with dark/light theme support
- **Real-time Updates**: Live marketplace statistics and listing updates
- **Mobile Responsive**: Optimized for all device sizes
- **Wallet Integration**: Seamless Sui wallet connection
- **User Profiles**: Create and manage your marketplace profile
- **Reputation System**: Build trust through user ratings and activity

### Advanced Features
- **Auction Management**: Create, bid on, and manage auctions
- **Offer System**: Make offers on listings (coming soon)
- **Favorites**: Save and track your favorite listings
- **Market Analytics**: Comprehensive marketplace statistics
- **Social Features**: User interactions and community building

## 🏗️ Project Structure

```
contracts/   # Enhanced Move smart contracts
├── sources/
│   └── Suimart.move  # Advanced marketplace logic
frontend/    # Next.js 14 + TypeScript + Tailwind UI
├── app/     # App router pages
├── components/  # React components
│   ├── ui/   # Reusable UI components
│   ├── HomeClient.tsx      # Enhanced marketplace home
│   ├── SellClient.tsx      # Listing creation
│   ├── ProfileClient.tsx   # User profiles
│   └── MarketStats.tsx     # Analytics dashboard
└── lib/     # Utilities and configuration
```

## 🛠️ Prerequisites

1. **Rust** + `cargo` (for building Move)
2. **Sui CLI** – follow the official docs: <https://docs.sui.io/cli/install-sui>
3. **Node.js** ≥ 18 and **pnpm**/npm/yarn

## 🚀 Getting Started

### 1. Smart Contracts

```bash
cd contracts
# Build & run Move unit tests
sui move test

# Publish to devnet (will print the package ID)
sui client publish --gas-budget 100000000
```

Copy the printed package ID – you'll need it in the frontend.

### 2. Frontend Setup

```bash
cd frontend
pnpm install   # or npm install / yarn

# Start dev server on http://localhost:3000
pnpm dev
```

Create a `.env.local` file under `frontend/` with:

```env
NEXT_PUBLIC_SUI_NETWORK=devnet      # or testnet/mainnet
NEXT_PUBLIC_MARKETPLACE_PACKAGE=<PASTE_PUBLISHED_PACKAGE_ID>
```

### 3. Using the Marketplace

1. **Connect Wallet**: Open the site and connect a Sui wallet (Suiet, Surf, etc.)
2. **Browse Listings**: Use advanced filters to find items
3. **Create Listings**: 
   - Fixed price: Set a price and list immediately
   - Auction: Create time-limited auctions with bidding
4. **Buy Items**: Purchase fixed-price items or bid on auctions
5. **Manage Profile**: Create and customize your user profile

## 📊 Enhanced Smart Contracts

The marketplace now includes:

### Core Functions
- `list_item<T>`: Create fixed-price listings with metadata
- `create_auction<T>`: Create time-limited auctions
- `place_bid<T>`: Bid on auction items
- `buy_item<T>`: Purchase fixed-price items
- `cancel_listing<T>`: Cancel your own listings
- `update_listing<T>`: Update listing details

### User Management
- `create_profile`: Create user profiles
- `update_reputation`: Manage user reputation scores

### Offer System
- `create_offer`: Make offers on listings
- `accept_offer`: Accept offers from buyers
- `reject_offer`: Reject offers

### Advanced Features
- **Metadata Support**: Titles, descriptions, categories
- **Auction Management**: Time limits, minimum bids, current bids
- **User Profiles**: Usernames, bios, reputation tracking
- **Event System**: Comprehensive event tracking for all actions

## 🎨 Frontend Enhancements

### Modern UI Components
- **Responsive Design**: Works on all devices
- **Theme Support**: Light/dark mode with system preference
- **Loading States**: Smooth loading animations
- **Error Handling**: Comprehensive error messages
- **Accessibility**: WCAG compliant components

### Advanced Features
- **Real-time Updates**: Live marketplace data
- **Advanced Filtering**: Multiple filter combinations
- **Search Functionality**: Full-text search across listings
- **View Modes**: Grid and list layouts
- **Statistics Dashboard**: Comprehensive market analytics

### User Experience
- **Intuitive Navigation**: Easy-to-use interface
- **Mobile Optimization**: Touch-friendly design
- **Fast Performance**: Optimized for speed
- **Offline Support**: Graceful degradation

## 🔧 Configuration

### Environment Variables

```env
# Required
NEXT_PUBLIC_SUI_NETWORK=devnet
NEXT_PUBLIC_MARKETPLACE_PACKAGE=0x...

# Optional
NEXT_PUBLIC_APP_NAME=Suimart
NEXT_PUBLIC_APP_DESCRIPTION=Decentralized marketplace on Sui
```

### Customization

The marketplace can be customized through:

1. **Theme Colors**: Modify `tailwind.config.js`
2. **Categories**: Update `CATEGORIES` array in components
3. **UI Components**: Extend components in `components/ui/`
4. **Smart Contracts**: Add new functions to `Suimart.move`

## 🚀 Deployment

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment

```bash
# Build the frontend
cd frontend
pnpm build

# Deploy to your preferred hosting service
pnpm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📝 License

MIT © 2025 Suimart

## 🆘 Support

- **Documentation**: Check the code comments and this README
- **Issues**: Report bugs on GitHub
- **Discussions**: Join community discussions
- **Discord**: Join our Discord server (link coming soon)

## 🔮 Roadmap

### Upcoming Features
- [ ] **Offers System**: Make and manage offers
- [ ] **Favorites**: Save and track favorite listings
- [ ] **Notifications**: Real-time notifications
- [ ] **Social Features**: Comments and reviews
- [ ] **Advanced Analytics**: Detailed market insights
- [ ] **Multi-language Support**: Internationalization
- [ ] **Mobile App**: Native mobile application
- [ ] **API Integration**: Third-party service integration

### Technical Improvements
- [ ] **Performance Optimization**: Faster loading times
- [ ] **Caching**: Smart caching strategies
- [ ] **SEO**: Search engine optimization
- [ ] **Testing**: Comprehensive test coverage
- [ ] **Security**: Enhanced security measures

---

**Built with ❤️ on Sui Blockchain**
