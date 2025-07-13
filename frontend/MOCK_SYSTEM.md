# Mock System Documentation

## Overview

The Suimart marketplace now includes a comprehensive mock system that allows you to run the application without real smart contracts or blockchain interactions. This is perfect for development, testing, and demonstrations.

## Features

### Mock Data
- **Sample Listings**: 6 pre-configured marketplace listings with realistic data
- **Mock Users**: 3 sample users with different profiles and transaction histories
- **Categories**: Full marketplace categories (NFTs, Gaming, Art, etc.)
- **Auction Support**: Both fixed-price listings and auctions with bidding functionality

### Mock Functions
- **Marketplace Operations**: Create, buy, cancel listings and place bids
- **Wallet Simulation**: Mock wallet connection and transaction signing
- **Realistic Delays**: Simulated network delays for authentic user experience
- **Error Handling**: Proper error simulation for edge cases

## Configuration

### Environment Variables

The mock system is controlled by environment variables in `.env.local`:

```bash
# Enable mock mode (default: true in development)
NEXT_PUBLIC_MOCK_MODE=true

# Network configuration (not used in mock mode)
NEXT_PUBLIC_SUI_NETWORK=devnet

# Package ID (not used in mock mode)
NEXT_PUBLIC_MARKETPLACE_PACKAGE=0x0000000000000000000000000000000000000000000000000000000000000000
```

### Mock Mode Detection

The system automatically enables mock mode when:
1. `NEXT_PUBLIC_MOCK_MODE=true` is set
2. Running in development mode without a configured package ID

## Mock Data Structure

### Sample Listings

The mock system includes 6 realistic marketplace listings:

1. **Rare Sui NFT Collection #1** - Fixed price listing
2. **Gaming Token Bundle** - Fixed price listing  
3. **Digital Art Masterpiece** - Active auction with bids
4. **Sports Memorabilia NFT** - Fixed price listing
5. **Music Album Collection** - Fixed price listing
6. **Virtual Real Estate Plot** - Active auction with bids

### Sample Users

1. **Alice Crypto** - Active seller with multiple listings
2. **Bob NFT** - Mixed seller/buyer profile
3. **Carol Artist** - Premium seller with high-value items

## Usage

### Running in Mock Mode

1. Ensure `NEXT_PUBLIC_MOCK_MODE=true` in your `.env.local`
2. Start the development server: `npm run dev`
3. The app will show a "Mock Mode - Demo Data" indicator
4. All wallet interactions will use the mock wallet
5. All marketplace operations will use mock data

### Switching to Real Mode

1. Set `NEXT_PUBLIC_MOCK_MODE=false` in `.env.local`
2. Configure a real package ID: `NEXT_PUBLIC_MARKETPLACE_PACKAGE=your_package_id`
3. Restart the development server
4. The app will use real blockchain interactions

## Mock Wallet

The mock wallet provides the same interface as the real Sui wallet:

- **Address**: `0x1234567890abcdef1234567890abcdef12345678`
- **Connection**: Simulated 1-second delay
- **Transactions**: Simulated 2-second execution time
- **Signing**: Mock signatures and transaction data

## Mock Marketplace Operations

### Creating Listings
- Fixed price listings with title, description, price, category
- Auction listings with starting price, minimum bid, duration
- Automatic listing ID generation
- Realistic validation and error handling

### Buying Items
- Fixed price items can be purchased directly
- Auction items require bidding (cannot buy directly)
- Automatic status updates (sold/cancelled)
- User purchase history tracking

### Auctions
- Active auctions with current bid tracking
- Time-based auction ending
- Bid validation (must be higher than current bid)
- Winner determination and status updates

### Cancelling Listings
- Only sellers can cancel their own listings
- Proper authorization checks
- Status updates to cancelled

## Development Benefits

1. **No Blockchain Setup**: No need for Sui devnet/testnet setup
2. **Fast Development**: No network delays or gas costs
3. **Consistent Data**: Predictable sample data for testing
4. **Error Testing**: Easy to simulate various error conditions
5. **UI Development**: Full UI/UX development without blockchain dependencies

## File Structure

```
frontend/
├── lib/
│   ├── mockData.ts          # Mock data and marketplace class
│   ├── mockWallet.ts        # Mock wallet implementation
│   ├── useWallet.ts         # Wallet hook with mock/real switching
│   └── config.ts           # Configuration with mock mode detection
├── components/
│   ├── HomeClient.tsx      # Updated to use mock data
│   └── SellClient.tsx      # Updated to use mock functions
└── .env.local              # Environment configuration
```

## Testing Scenarios

The mock system supports testing of:

- ✅ Wallet connection/disconnection
- ✅ Creating fixed-price listings
- ✅ Creating auction listings
- ✅ Buying items
- ✅ Placing bids on auctions
- ✅ Cancelling listings
- ✅ Search and filtering
- ✅ Category filtering
- ✅ Price range filtering
- ✅ Sorting options
- ✅ Error handling
- ✅ Loading states
- ✅ Success/error messages

## Future Enhancements

Potential improvements to the mock system:

1. **More Sample Data**: Additional listings and user profiles
2. **Advanced Filtering**: More sophisticated search and filter options
3. **User Profiles**: Mock user profile pages and statistics
4. **Transaction History**: Detailed transaction logs
5. **Notifications**: Mock notification system
6. **Analytics**: Mock analytics and statistics

## Troubleshooting

### Common Issues

1. **Mock mode not working**: Check `NEXT_PUBLIC_MOCK_MODE=true` in `.env.local`
2. **Build errors**: Ensure all dependencies are installed (`npm install`)
3. **TypeScript errors**: Check that `@types/node` is installed
4. **Wallet not connecting**: Mock wallet has a 1-second connection delay

### Debug Mode

To enable debug logging for mock operations, add to your component:

```typescript
console.log('Mock operation:', operation, data);
```

This will help track mock function calls and data flow.