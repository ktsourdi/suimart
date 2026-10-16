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

// Time helpers for the seed data below. Every timestamp is relative to page load,
// so auctions always have a live countdown in the demo.
const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const now = Date.now();

// Mock users. The first address is the demo wallet (MOCK_WALLET_ADDRESS in lib/config.ts),
// so connecting the demo wallet shows its own listings, a live bid, past sales and a purchase.
const ASTER = '0x1234567890abcdef1234567890abcdef12345678';
const KESTREL = '0xabcdef1234567890abcdef1234567890abcdef12';
const VELA = '0x9876543210fedcba9876543210fedcba98765432';
const HALCYON = '0x5c1fa3e09b7d24c68e1f0a9d3b6c7e24f81d0a57';
const MONOLITH = '0x7e2ab14c0d93f58e61a7c94d2be5f03a8293d4b6';

export const mockUsers: MockUser[] = [
  {
    address: ASTER,
    name: 'aster.sui',
    reputation: 4.8,
    listings: ['listing_1', 'listing_3', 'listing_11', 'listing_13', 'listing_14'],
    purchases: ['listing_15']
  },
  {
    address: KESTREL,
    name: 'kestrel.sui',
    reputation: 4.6,
    listings: ['listing_2', 'listing_4', 'listing_10'],
    purchases: []
  },
  {
    address: VELA,
    name: 'vela.sui',
    reputation: 4.9,
    listings: ['listing_5', 'listing_6', 'listing_15'],
    purchases: ['listing_13']
  },
  {
    address: HALCYON,
    name: 'halcyon.sui',
    reputation: 4.7,
    listings: ['listing_7', 'listing_9'],
    purchases: []
  },
  {
    address: MONOLITH,
    name: 'monolith.sui',
    reputation: 4.5,
    listings: ['listing_8', 'listing_12'],
    purchases: []
  }
];

// Mock listings: 12 active across all eight categories, four of them live auctions, plus three
// earlier sales (listing_13..15) that give the demo wallet a trading history. getListings()
// returns active listings only; the profile and detail pages still find the sold ones.
// For auctions, `price` is the starting price and `currentBid` the leading bid.
export const mockListings: MockListing[] = [
  {
    listing_id: 'listing_1',
    price: 18.4,
    seller: ASTER,
    itemType: '0x2::devnet_nft::DevNFT',
    title: 'Meridian #014',
    description: 'From Meridian, a 64-piece generative series of orbital studies. #014 is one of six with a warm satellite on the outer ring. The render seed and parameters are stored on the object.',
    category: 'NFTs',
    createdAt: now - 2 * DAY - 3 * HOUR,
    updatedAt: now - 2 * DAY - 3 * HOUR,
    views: 412,
    favorites: 31,
    isAuction: false,
    status: 'active',
    imageUrl: '/listings/items/meridian-014.svg'
  },
  {
    listing_id: 'listing_2',
    price: 6.25,
    seller: KESTREL,
    itemType: '0x2::devnet_nft::DevNFT',
    title: 'Driftline racer livery: Ember',
    description: 'Season 2 Ember livery for the Driftline racer, one of 250 issued. Cosmetic only and transferable between garages; race stats are unchanged.',
    category: 'Gaming',
    createdAt: now - 5 * DAY - 7 * HOUR,
    updatedAt: now - 5 * DAY - 7 * HOUR,
    views: 236,
    favorites: 14,
    isAuction: false,
    status: 'active',
    imageUrl: '/listings/items/driftline-ember-livery.svg'
  },
  {
    listing_id: 'listing_3',
    price: 24.0,
    seller: ASTER,
    itemType: '0x2::devnet_nft::DevNFT',
    title: 'Tidal Study IV',
    description: 'Fourth in a series of ribbon studies drawn from one lunar month of tide-gauge readings at Piraeus. A 1/1, with the source data and plotting script stored on the object.',
    category: 'Art',
    createdAt: now - 1 * DAY - 6 * HOUR,
    updatedAt: now - 2 * HOUR - 10 * MINUTE,
    views: 688,
    favorites: 57,
    isAuction: true,
    auctionEndTime: now + 2 * DAY + 7 * HOUR,
    currentBid: 31.2,
    highestBidder: VELA,
    status: 'active',
    imageUrl: '/listings/items/tidal-study-iv.svg'
  },
  {
    listing_id: 'listing_4',
    price: 12.8,
    seller: KESTREL,
    itemType: '0x2::devnet_nft::DevNFT',
    title: 'Photo Finish: Lane 4',
    description: 'A slit-scan frame from the line of a 400m final, redrawn as light. Edition 3 of 25; the official split times are written to the object.',
    category: 'Sports',
    createdAt: now - 7 * DAY - 2 * HOUR,
    updatedAt: now - 7 * DAY - 2 * HOUR,
    views: 154,
    favorites: 9,
    isAuction: false,
    status: 'active',
    imageUrl: '/listings/items/photo-finish-lane-4.svg'
  },
  {
    listing_id: 'listing_5',
    price: 42.5,
    seller: VELA,
    itemType: '0x2::devnet_nft::DevNFT',
    title: 'Low Tide (stems edition)',
    description: 'A seven-minute ambient piece with all eleven stems as 24-bit WAV files and a licence for non-commercial remixes. Holders also receive the session notes.',
    category: 'Music',
    createdAt: now - 3 * DAY - 9 * HOUR,
    updatedAt: now - 3 * DAY - 9 * HOUR,
    views: 97,
    favorites: 6,
    isAuction: false,
    status: 'active',
    imageUrl: '/listings/items/low-tide-stems.svg'
  },
  {
    listing_id: 'listing_6',
    price: 140.0,
    seller: VELA,
    itemType: '0x2::devnet_nft::DevNFT',
    title: 'Parcel 7-12, Harbour District',
    description: 'A 16 × 16 corner parcel on the Harbour District waterfront, two blocks from the spawn plaza. Build rights and the parcel’s history transfer with the object.',
    category: 'Virtual Worlds',
    createdAt: now - 10 * DAY - 4 * HOUR,
    updatedAt: now - 5 * HOUR - 20 * MINUTE,
    views: 1240,
    favorites: 96,
    isAuction: true,
    auctionEndTime: now + 19 * HOUR + 15 * MINUTE,
    currentBid: 168.5,
    highestBidder: ASTER,
    status: 'active',
    imageUrl: '/listings/items/harbour-parcel-7-12.svg'
  },
  {
    listing_id: 'listing_7',
    price: 3.9,
    seller: HALCYON,
    itemType: '0x2::devnet_nft::DevNFT',
    title: 'Signal card No. 07, holo',
    description: 'Holographic parallel of card 07 from the Signal set, 1 of 50. Graded 9.5 at issue; the grade and population report are stored on the object.',
    category: 'Collectibles',
    createdAt: now - 12 * DAY - 5 * HOUR,
    updatedAt: now - 12 * DAY - 5 * HOUR,
    views: 318,
    favorites: 22,
    isAuction: false,
    status: 'active',
    imageUrl: '/listings/items/signal-card-07.svg'
  },
  {
    listing_id: 'listing_8',
    price: 300.0,
    seller: MONOLITH,
    itemType: '0x2::devnet_nft::DevNFT',
    title: 'Aperture',
    description: 'A 1/1 eclipse study: 460 rays of corona around the diamond-ring moment. Includes the 8K master file and a licence for one physical print.',
    category: 'Art',
    createdAt: now - 18 * HOUR,
    updatedAt: now - 40 * MINUTE,
    views: 2140,
    favorites: 183,
    isAuction: true,
    auctionEndTime: now + 4 * DAY + 9 * HOUR,
    currentBid: 386.5,
    highestBidder: KESTREL,
    status: 'active',
    imageUrl: '/listings/items/aperture.svg'
  },
  {
    listing_id: 'listing_9',
    price: 0.85,
    seller: HALCYON,
    itemType: '0x2::devnet_nft::DevNFT',
    title: 'Kythera Glyph #201',
    description: 'One of 512 glyphs constructed with compass and rule from a single seed. Gold on oxblood, the rarest of the collection’s four palettes.',
    category: 'NFTs',
    createdAt: now - 13 * DAY - 8 * HOUR,
    updatedAt: now - 13 * DAY - 8 * HOUR,
    views: 76,
    favorites: 4,
    isAuction: false,
    status: 'active',
    imageUrl: '/listings/items/kythera-glyph-201.svg'
  },
  {
    listing_id: 'listing_10',
    price: 27.5,
    seller: KESTREL,
    itemType: '0x2::devnet_nft::DevNFT',
    title: 'Northlight founders pass #042',
    description: 'Membership of the Northlight collective: early access to every drop, the members’ channel and one print a year. Transferable; the pass number is stored on the object.',
    category: 'Other',
    createdAt: now - 6 * DAY - 1 * HOUR,
    updatedAt: now - 6 * DAY - 1 * HOUR,
    views: 201,
    favorites: 18,
    isAuction: false,
    status: 'active',
    imageUrl: '/listings/items/northlight-founders-pass.svg'
  },
  {
    listing_id: 'listing_11',
    price: 9.5,
    seller: ASTER,
    itemType: '0x2::devnet_nft::DevNFT',
    title: 'Observatory interior pack',
    description: 'A furnishing set for domed builds: 46 modular pieces, a working star-map ceiling and three lighting presets. Fits any Harbour District parcel.',
    category: 'Virtual Worlds',
    createdAt: now - 9 * HOUR,
    updatedAt: now - 9 * HOUR,
    views: 63,
    favorites: 5,
    isAuction: false,
    status: 'active',
    imageUrl: '/listings/items/observatory-interior.svg'
  },
  {
    listing_id: 'listing_12',
    price: 45.0,
    seller: MONOLITH,
    itemType: '0x2::devnet_nft::DevNFT',
    title: 'Shardfall champion blade, Season 1',
    description: 'Awarded to the eight Season 1 champions of Shardfall. Cosmetic only; the blade carries its holder’s win record on the object.',
    category: 'Gaming',
    createdAt: now - 2 * DAY - 20 * HOUR,
    updatedAt: now - 25 * MINUTE,
    views: 905,
    favorites: 71,
    isAuction: true,
    auctionEndTime: now + 3 * HOUR + 20 * MINUTE,
    currentBid: 58.75,
    highestBidder: HALCYON,
    status: 'active',
    imageUrl: '/listings/items/shardfall-champion-blade.svg'
  },
  // Past sales. Sold by the demo wallet: a fixed-price piece and a settled auction.
  {
    listing_id: 'listing_13',
    price: 36.0,
    seller: ASTER,
    itemType: '0x2::devnet_nft::DevNFT',
    title: 'Halo Study II',
    description: 'Second of four studies of a single ring of light, drawn as 26 concentric strokes around a dark core. A 1/1; the plotting parameters are stored on the object.',
    category: 'Art',
    createdAt: now - 41 * DAY - 6 * HOUR,
    updatedAt: now - 34 * DAY - 2 * HOUR,
    views: 534,
    favorites: 46,
    isAuction: false,
    status: 'sold',
    imageUrl: '/listings/items/halo-study-ii.svg'
  },
  {
    listing_id: 'listing_14',
    price: 12.0,
    seller: ASTER,
    itemType: '0x2::devnet_nft::DevNFT',
    title: 'Orrery No. 3',
    description: 'A generative orrery: five tilted orbits, four bodies and one ringed giant, with orbital periods taken from the minting block. Third of nine.',
    category: 'NFTs',
    createdAt: now - 23 * DAY - 4 * HOUR,
    updatedAt: now - 18 * DAY - 3 * HOUR,
    views: 389,
    favorites: 27,
    isAuction: true,
    auctionEndTime: now - 18 * DAY - 4 * HOUR,
    currentBid: 21.4,
    highestBidder: HALCYON,
    status: 'sold',
    imageUrl: '/listings/items/orrery-no-3.svg'
  },
  // Bought by the demo wallet.
  {
    listing_id: 'listing_15',
    price: 14.5,
    seller: VELA,
    itemType: '0x2::devnet_nft::DevNFT',
    title: 'Sounding Line (edition 2/10)',
    description: 'A four-minute piece built from a single sonar ping, slowed and layered. Edition 2 of 10, with the lossless master and the waveform artwork.',
    category: 'Music',
    createdAt: now - 16 * DAY - 9 * HOUR,
    updatedAt: now - 9 * DAY - 5 * HOUR,
    views: 148,
    favorites: 12,
    isAuction: false,
    status: 'sold',
    imageUrl: '/listings/items/sounding-line.svg'
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