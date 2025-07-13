// Mock data for the marketplace
export interface MockListing {
  listing_id: string;
  price: number;
  seller: string;
  itemType: string;
  title: string;
  description: string;
  category: string;
  createdAt: number;
  updatedAt: number;
  views: number;
  favorites: number;
  isAuction: boolean;
  auctionEndTime?: number;
  currentBid?: number;
  highestBidder?: string;
  imageUrl?: string;
  status: 'active' | 'sold' | 'cancelled' | 'ended';
}

export interface MockUser {
  address: string;
  name: string;
  avatar?: string;
  reputation: number;
  listings: string[];
  purchases: string[];
}

// Mock users
export const mockUsers: MockUser[] = [
  {
    address: '0x1234567890abcdef1234567890abcdef12345678',
    name: 'Alice Crypto',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice',
    reputation: 4.8,
    listings: ['listing_1', 'listing_3'],
    purchases: ['listing_2']
  },
  {
    address: '0xabcdef1234567890abcdef1234567890abcdef12',
    name: 'Bob NFT',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob',
    reputation: 4.6,
    listings: ['listing_2', 'listing_4'],
    purchases: ['listing_1']
  },
  {
    address: '0x9876543210fedcba9876543210fedcba98765432',
    name: 'Carol Artist',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carol',
    reputation: 4.9,
    listings: ['listing_5', 'listing_6'],
    purchases: []
  }
];

// Mock listings
export const mockListings: MockListing[] = [
  {
    listing_id: 'listing_1',
    price: 15.5,
    seller: '0x1234567890abcdef1234567890abcdef12345678',
    itemType: '0x2::devnet_nft::DevNFT',
    title: 'Rare Sui NFT Collection #1',
    description: 'A unique digital artwork created on the Sui blockchain. This NFT represents the first piece in a limited series of 100 collectible items.',
    category: 'NFTs',
    createdAt: Date.now() - 86400000 * 2, // 2 days ago
    updatedAt: Date.now() - 86400000 * 2,
    views: 245,
    favorites: 12,
    isAuction: false,
    status: 'active',
    imageUrl: 'https://picsum.photos/400/300?random=1'
  },
  {
    listing_id: 'listing_2',
    price: 8.75,
    seller: '0xabcdef1234567890abcdef1234567890abcdef12',
    itemType: '0x2::devnet_nft::DevNFT',
    title: 'Gaming Token Bundle',
    description: 'Collection of gaming tokens and in-game items. Perfect for gamers looking to expand their digital assets.',
    category: 'Gaming',
    createdAt: Date.now() - 86400000 * 5, // 5 days ago
    updatedAt: Date.now() - 86400000 * 5,
    views: 189,
    favorites: 8,
    isAuction: false,
    status: 'active',
    imageUrl: 'https://picsum.photos/400/300?random=2'
  },
  {
    listing_id: 'listing_3',
    price: 25.0,
    seller: '0x1234567890abcdef1234567890abcdef12345678',
    itemType: '0x2::devnet_nft::DevNFT',
    title: 'Digital Art Masterpiece',
    description: 'Stunning digital artwork created by a renowned artist. This piece combines traditional art techniques with modern blockchain technology.',
    category: 'Art',
    createdAt: Date.now() - 86400000 * 1, // 1 day ago
    updatedAt: Date.now() - 86400000 * 1,
    views: 567,
    favorites: 34,
    isAuction: true,
    auctionEndTime: Date.now() + 86400000 * 3, // 3 days from now
    currentBid: 28.5,
    highestBidder: '0x9876543210fedcba9876543210fedcba98765432',
    status: 'active',
    imageUrl: 'https://picsum.photos/400/300?random=3'
  },
  {
    listing_id: 'listing_4',
    price: 12.0,
    seller: '0xabcdef1234567890abcdef1234567890abcdef12',
    itemType: '0x2::devnet_nft::DevNFT',
    title: 'Sports Memorabilia NFT',
    description: 'Rare sports memorabilia tokenized on the blockchain. Own a piece of sports history.',
    category: 'Sports',
    createdAt: Date.now() - 86400000 * 7, // 7 days ago
    updatedAt: Date.now() - 86400000 * 7,
    views: 123,
    favorites: 5,
    isAuction: false,
    status: 'active',
    imageUrl: 'https://picsum.photos/400/300?random=4'
  },
  {
    listing_id: 'listing_5',
    price: 45.0,
    seller: '0x9876543210fedcba9876543210fedcba98765432',
    itemType: '0x2::devnet_nft::DevNFT',
    title: 'Music Album Collection',
    description: 'Complete collection of digital music albums from various artists. High-quality audio files with exclusive bonus content.',
    category: 'Music',
    createdAt: Date.now() - 86400000 * 3, // 3 days ago
    updatedAt: Date.now() - 86400000 * 3,
    views: 89,
    favorites: 3,
    isAuction: false,
    status: 'active',
    imageUrl: 'https://picsum.photos/400/300?random=5'
  },
  {
    listing_id: 'listing_6',
    price: 150.0,
    seller: '0x9876543210fedcba9876543210fedcba98765432',
    itemType: '0x2::devnet_nft::DevNFT',
    title: 'Virtual Real Estate Plot',
    description: 'Premium virtual real estate in a popular metaverse. Strategic location with high foot traffic and development potential.',
    category: 'Real Estate',
    createdAt: Date.now() - 86400000 * 10, // 10 days ago
    updatedAt: Date.now() - 86400000 * 10,
    views: 456,
    favorites: 67,
    isAuction: true,
    auctionEndTime: Date.now() + 86400000 * 1, // 1 day from now
    currentBid: 165.0,
    highestBidder: '0x1234567890abcdef1234567890abcdef12345678',
    status: 'active',
    imageUrl: 'https://picsum.photos/400/300?random=6'
  }
];

// Mock functions to simulate smart contract interactions
export class MockMarketplace {
  private listings: MockListing[] = [...mockListings];
  private users: MockUser[] = [...mockUsers];

  // Simulate network delay
  private async delay(ms: number = 1000): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get all active listings
  async getListings(): Promise<MockListing[]> {
    await this.delay(500);
    return this.listings.filter(listing => listing.status === 'active');
  }

  // Create a new listing
  async createListing(listingData: Omit<MockListing, 'listing_id' | 'createdAt' | 'updatedAt' | 'views' | 'favorites' | 'status'>): Promise<string> {
    await this.delay(1000);
    
    const newListing: MockListing = {
      ...listingData,
      listing_id: `listing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      views: 0,
      favorites: 0,
      status: 'active'
    };

    this.listings.push(newListing);
    return newListing.listing_id;
  }

  // Buy an item
  async buyItem(listingId: string, buyerAddress: string): Promise<boolean> {
    await this.delay(1500);
    
    const listing = this.listings.find(l => l.listing_id === listingId);
    if (!listing || listing.status !== 'active') {
      throw new Error('Listing not found or not available');
    }

    if (listing.isAuction) {
      throw new Error('Cannot buy auction items directly. Please place a bid.');
    }

    // Update listing status
    listing.status = 'sold';
    listing.updatedAt = Date.now();

    // Update user data
    const buyer = this.users.find(u => u.address === buyerAddress);
    if (buyer) {
      buyer.purchases.push(listingId);
    }

    return true;
  }

  // Cancel a listing
  async cancelListing(listingId: string, sellerAddress: string): Promise<boolean> {
    await this.delay(1000);
    
    const listing = this.listings.find(l => l.listing_id === listingId);
    if (!listing || listing.seller !== sellerAddress) {
      throw new Error('Listing not found or you are not the seller');
    }

    listing.status = 'cancelled';
    listing.updatedAt = Date.now();

    return true;
  }

  // Place a bid on an auction
  async placeBid(listingId: string, bidAmount: number, bidderAddress: string): Promise<boolean> {
    await this.delay(1200);
    
    const listing = this.listings.find(l => l.listing_id === listingId);
    if (!listing || !listing.isAuction || listing.status !== 'active') {
      throw new Error('Auction not found or not active');
    }

    if (listing.auctionEndTime && Date.now() > listing.auctionEndTime) {
      throw new Error('Auction has ended');
    }

    if (listing.currentBid && bidAmount <= listing.currentBid) {
      throw new Error('Bid must be higher than current bid');
    }

    listing.currentBid = bidAmount;
    listing.highestBidder = bidderAddress;
    listing.updatedAt = Date.now();

    return true;
  }

  // End an auction
  async endAuction(listingId: string): Promise<boolean> {
    await this.delay(800);
    
    const listing = this.listings.find(l => l.listing_id === listingId);
    if (!listing || !listing.isAuction) {
      throw new Error('Auction not found');
    }

    if (listing.auctionEndTime && Date.now() < listing.auctionEndTime) {
      throw new Error('Auction has not ended yet');
    }

    listing.status = listing.currentBid ? 'sold' : 'ended';
    listing.updatedAt = Date.now();

    return true;
  }

  // Get user data
  async getUser(address: string): Promise<MockUser | null> {
    await this.delay(300);
    return this.users.find(u => u.address === address) || null;
  }

  // Update listing views
  async incrementViews(listingId: string): Promise<void> {
    const listing = this.listings.find(l => l.listing_id === listingId);
    if (listing) {
      listing.views++;
    }
  }

  // Toggle favorite
  async toggleFavorite(listingId: string): Promise<void> {
    const listing = this.listings.find(l => l.listing_id === listingId);
    if (listing) {
      // Simulate toggling favorite
      listing.favorites += Math.random() > 0.5 ? 1 : -1;
      if (listing.favorites < 0) listing.favorites = 0;
    }
  }
}

// Create a singleton instance
export const mockMarketplace = new MockMarketplace();