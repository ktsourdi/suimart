module suimart::marketplace {
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use sui::balance::{Self, Balance};
    use sui::tx_context::{Self, TxContext};
    use sui::event;
    use sui::sui::SUI;
    use sui::coin::{Self, Coin};
    use sui::table::{Self, Table};
    use sui::vec_set::{Self, VecSet};
    use std::string::{Self, String};
    use std::option::{Self, Option};

    // ===== CONSTANTS =====
    const MAX_CATEGORY_LENGTH: u64 = 50;
    const MAX_DESCRIPTION_LENGTH: u64 = 500;
    const MAX_TITLE_LENGTH: u64 = 100;
    const MIN_PRICE: u64 = 1000; // 0.001 SUI
    const MAX_PRICE: u64 = 1000000000000; // 1000 SUI
    const OFFER_EXPIRY_DAYS: u64 = 7;
    const AUCTION_MIN_DURATION: u64 = 3600000; // 1 hour in milliseconds
    const AUCTION_MAX_DURATION: u64 = 604800000; // 7 days in milliseconds

    // ===== ERRORS =====
    const EInvalidPrice: u64 = 0;
    const EInvalidCategory: u64 = 1;
    const EInvalidDescription: u64 = 2;
    const EInvalidTitle: u64 = 3;
    const EInsufficientPayment: u64 = 4;
    const ENotSeller: u64 = 5;
    const EOfferExpired: u64 = 6;
    const EInvalidAuctionDuration: u64 = 7;
    const EAuctionNotEnded: u64 = 8;
    const EAuctionEnded: u64 = 9;
    const EInvalidReputation: u64 = 10;

    // ===== STRUCTURES =====

    /// Enhanced listing with metadata
    struct Listing<T: key + store> has key {
        id: UID,
        item: T,
        seller: address,
        price: u64,
        title: String,
        description: String,
        category: String,
        created_at: u64,
        updated_at: u64,
        views: u64,
        favorites: u64,
        is_auction: bool,
        auction_end_time: Option<u64>,
        min_bid: Option<u64>,
        current_bid: Option<u64>,
        highest_bidder: Option<address>,
    }

    /// User profile with reputation
    struct UserProfile has key {
        id: UID,
        user: address,
        username: String,
        bio: String,
        avatar_url: String,
        reputation_score: u64,
        total_sales: u64,
        total_purchases: u64,
        join_date: u64,
        verified: bool,
    }

    /// Offer structure
    struct Offer has key {
        id: UID,
        listing_id: ID,
        buyer: address,
        amount: u64,
        message: String,
        created_at: u64,
        expires_at: u64,
        status: u8, // 0: pending, 1: accepted, 2: rejected, 3: expired
    }

    /// Marketplace statistics
    struct MarketplaceStats has key {
        id: UID,
        total_listings: u64,
        total_sales: u64,
        total_volume: u64,
        active_users: u64,
        categories: VecSet<String>,
    }

    // ===== EVENTS =====

    struct ListingCreated has copy, drop {
        listing_id: ID,
        price: u64,
        seller: address,
        title: String,
        category: String,
        is_auction: bool,
    }

    struct ListingPurchased has copy, drop {
        listing_id: ID,
        buyer: address,
        price: u64,
    }

    struct ListingCancelled has copy, drop {
        listing_id: ID,
    }

    struct ListingUpdated has copy, drop {
        listing_id: ID,
        new_price: u64,
        new_title: String,
        new_description: String,
    }

    struct OfferCreated has copy, drop {
        offer_id: ID,
        listing_id: ID,
        buyer: address,
        amount: u64,
    }

    struct OfferAccepted has copy, drop {
        offer_id: ID,
        listing_id: ID,
        buyer: address,
        amount: u64,
    }

    struct OfferRejected has copy, drop {
        offer_id: ID,
        listing_id: ID,
        buyer: address,
    }

    struct BidPlaced has copy, drop {
        listing_id: ID,
        bidder: address,
        amount: u64,
    }

    struct AuctionEnded has copy, drop {
        listing_id: ID,
        winner: address,
        final_price: u64,
    }

    struct UserProfileCreated has copy, drop {
        user: address,
        username: String,
    }

    struct ReputationUpdated has copy, drop {
        user: address,
        new_score: u64,
    }

    // ===== INITIALIZATION =====

    fun init(ctx: &mut TxContext) {
        let stats = MarketplaceStats {
            id: object::new(ctx),
            total_listings: 0,
            total_sales: 0,
            total_volume: 0,
            active_users: 0,
            categories: vec_set::empty(),
        };
        transfer::share_object(stats);
    }

    // ===== LISTING FUNCTIONS =====

    /// Create a new listing with enhanced metadata
    public entry fun list_item<T: key + store>(
        item: T,
        price: u64,
        title: String,
        description: String,
        category: String,
        ctx: &mut TxContext
    ) {
        // Validate inputs
        assert!(price >= MIN_PRICE && price <= MAX_PRICE, EInvalidPrice);
        assert!(string::length(&title) <= MAX_TITLE_LENGTH, EInvalidTitle);
        assert!(string::length(&description) <= MAX_DESCRIPTION_LENGTH, EInvalidDescription);
        assert!(string::length(&category) <= MAX_CATEGORY_LENGTH, EInvalidCategory);

        let current_time = tx_context::epoch(ctx);
        
        let listing = Listing {
            id: object::new(ctx),
            item,
            seller: tx_context::sender(ctx),
            price,
            title,
            description,
            category,
            created_at: current_time,
            updated_at: current_time,
            views: 0,
            favorites: 0,
            is_auction: false,
            auction_end_time: option::none(),
            min_bid: option::none(),
            current_bid: option::none(),
            highest_bidder: option::none(),
        };

        let listing_id = object::id(&listing);
        
        event::emit(ListingCreated {
            listing_id,
            price,
            seller: tx_context::sender(ctx),
            title,
            category,
            is_auction: false,
        });

        transfer::share_object(listing);
    }

    /// Create an auction listing
    public entry fun create_auction<T: key + store>(
        item: T,
        starting_price: u64,
        min_bid: u64,
        duration_ms: u64,
        title: String,
        description: String,
        category: String,
        ctx: &mut TxContext
    ) {
        // Validate inputs
        assert!(starting_price >= MIN_PRICE && starting_price <= MAX_PRICE, EInvalidPrice);
        assert!(min_bid >= MIN_PRICE, EInvalidPrice);
        assert!(duration_ms >= AUCTION_MIN_DURATION && duration_ms <= AUCTION_MAX_DURATION, EInvalidAuctionDuration);
        assert!(string::length(&title) <= MAX_TITLE_LENGTH, EInvalidTitle);
        assert!(string::length(&description) <= MAX_DESCRIPTION_LENGTH, EInvalidDescription);
        assert!(string::length(&category) <= MAX_CATEGORY_LENGTH, EInvalidCategory);

        let current_time = tx_context::epoch(ctx);
        let end_time = current_time + (duration_ms / 1000); // Convert to seconds
        
        let listing = Listing {
            id: object::new(ctx),
            item,
            seller: tx_context::sender(ctx),
            price: starting_price,
            title,
            description,
            category,
            created_at: current_time,
            updated_at: current_time,
            views: 0,
            favorites: 0,
            is_auction: true,
            auction_end_time: option::some(end_time),
            min_bid: option::some(min_bid),
            current_bid: option::some(starting_price),
            highest_bidder: option::none(),
        };

        let listing_id = object::id(&listing);
        
        event::emit(ListingCreated {
            listing_id,
            price: starting_price,
            seller: tx_context::sender(ctx),
            title,
            category,
            is_auction: true,
        });

        transfer::share_object(listing);
    }

    /// Place a bid on an auction
    public entry fun place_bid<T: key + store>(
        listing: &mut Listing<T>,
        payment: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        assert!(listing.is_auction, EAuctionNotEnded);
        
        let current_time = tx_context::epoch(ctx);
        let end_time = option::borrow(&listing.auction_end_time);
        assert!(current_time < *end_time, EAuctionEnded);

        let bid_amount = coin::value(&payment);
        let min_bid = option::borrow(&listing.min_bid);
        let current_bid = option::borrow(&listing.current_bid);
        
        assert!(bid_amount >= *min_bid, EInsufficientPayment);
        assert!(bid_amount > *current_bid, EInsufficientPayment);

        // Return previous bid if exists
        if (option::is_some(&listing.highest_bidder)) {
            let previous_bidder = option::borrow(&listing.highest_bidder);
            let previous_bid = option::borrow(&listing.current_bid);
            let refund_coin = coin::split(&mut coin::from_balance(coin::into_balance(payment), ctx), *previous_bid, ctx);
            transfer::public_transfer(refund_coin, *previous_bidder);
        };

        // Update auction state
        listing.current_bid = option::some(bid_amount);
        listing.highest_bidder = option::some(tx_context::sender(ctx));
        listing.updated_at = current_time;

        event::emit(BidPlaced {
            listing_id: object::id(listing),
            bidder: tx_context::sender(ctx),
            amount: bid_amount,
        });

        // Transfer payment to seller
        transfer::public_transfer(payment, listing.seller);
    }

    /// End an auction and transfer item to winner
    public entry fun end_auction<T: key + store>(
        listing: Listing<T>,
        ctx: &mut TxContext
    ) {
        assert!(listing.is_auction, EAuctionNotEnded);
        
        let current_time = tx_context::epoch(ctx);
        let end_time = option::borrow(&listing.auction_end_time);
        assert!(current_time >= *end_time, EAuctionNotEnded);

        let winner = option::borrow(&listing.highest_bidder);
        let final_price = option::borrow(&listing.current_bid);

        event::emit(AuctionEnded {
            listing_id: object::id(&listing),
            winner: *winner,
            final_price: *final_price,
        });

        // Transfer item to winner
        let Listing { id, item, seller: _, price: _, title: _, description: _, category: _, created_at: _, updated_at: _, views: _, favorites: _, is_auction: _, auction_end_time: _, min_bid: _, current_bid: _, highest_bidder: _ } = listing;
        transfer::public_transfer(item, *winner);
        object::delete(id);
    }

    /// Buy a listed item providing the exact `price` as `payment`
    public entry fun buy_item<T: key + store>(
        listing: Listing<T>,
        payment: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        assert!(!listing.is_auction, EAuctionNotEnded);
        assert!(coin::value(&payment) == listing.price, EInsufficientPayment);
        
        let Listing { id, item, seller, price, title: _, description: _, category: _, created_at: _, updated_at: _, views: _, favorites: _, is_auction: _, auction_end_time: _, min_bid: _, current_bid: _, highest_bidder: _ } = listing;
        
        transfer::public_transfer(payment, seller);
        event::emit(ListingPurchased {
            listing_id: object::uid_to_inner(&id),
            buyer: tx_context::sender(ctx),
            price,
        });
        
        transfer::public_transfer(item, tx_context::sender(ctx));
        object::delete(id);
    }

    /// Cancel a listing and return the item to the seller
    public entry fun cancel_listing<T: key + store>(
        listing: Listing<T>,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == listing.seller, ENotSeller);
        
        event::emit(ListingCancelled { 
            listing_id: object::id(&listing) 
        });
        
        let Listing { id, item, seller, price: _, title: _, description: _, category: _, created_at: _, updated_at: _, views: _, favorites: _, is_auction: _, auction_end_time: _, min_bid: _, current_bid: _, highest_bidder: _ } = listing;
        transfer::public_transfer(item, seller);
        object::delete(id);
    }

    /// Update listing details
    public entry fun update_listing<T: key + store>(
        listing: &mut Listing<T>,
        new_price: u64,
        new_title: String,
        new_description: String,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == listing.seller, ENotSeller);
        assert!(!listing.is_auction, EAuctionNotEnded);
        assert!(new_price >= MIN_PRICE && new_price <= MAX_PRICE, EInvalidPrice);
        assert!(string::length(&new_title) <= MAX_TITLE_LENGTH, EInvalidTitle);
        assert!(string::length(&new_description) <= MAX_DESCRIPTION_LENGTH, EInvalidDescription);

        listing.price = new_price;
        listing.title = new_title;
        listing.description = new_description;
        listing.updated_at = tx_context::epoch(ctx);

        event::emit(ListingUpdated {
            listing_id: object::id(listing),
            new_price,
            new_title,
            new_description,
        });
    }

    // ===== OFFER FUNCTIONS =====

    /// Create an offer for a listing
    public entry fun create_offer(
        listing_id: ID,
        amount: u64,
        message: String,
        ctx: &mut TxContext
    ) {
        assert!(amount >= MIN_PRICE && amount <= MAX_PRICE, EInvalidPrice);
        
        let current_time = tx_context::epoch(ctx);
        let expiry_time = current_time + (OFFER_EXPIRY_DAYS * 24 * 3600); // Convert days to seconds
        
        let offer = Offer {
            id: object::new(ctx),
            listing_id,
            buyer: tx_context::sender(ctx),
            amount,
            message,
            created_at: current_time,
            expires_at: expiry_time,
            status: 0, // pending
        };

        event::emit(OfferCreated {
            offer_id: object::id(&offer),
            listing_id,
            buyer: tx_context::sender(ctx),
            amount,
        });

        transfer::share_object(offer);
    }

    /// Accept an offer
    public entry fun accept_offer(
        offer: Offer,
        payment: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        let current_time = tx_context::epoch(ctx);
        assert!(current_time < offer.expires_at, EOfferExpired);
        assert!(coin::value(&payment) == offer.amount, EInsufficientPayment);

        event::emit(OfferAccepted {
            offer_id: object::id(&offer),
            listing_id: offer.listing_id,
            buyer: offer.buyer,
            amount: offer.amount,
        });

        // Transfer payment to seller
        transfer::public_transfer(payment, tx_context::sender(ctx));
        
        // Delete the offer
        let Offer { id, listing_id: _, buyer: _, amount: _, message: _, created_at: _, expires_at: _, status: _ } = offer;
        object::delete(id);
    }

    /// Reject an offer
    public entry fun reject_offer(offer: Offer, ctx: &mut TxContext) {
        event::emit(OfferRejected {
            offer_id: object::id(&offer),
            listing_id: offer.listing_id,
            buyer: offer.buyer,
        });

        let Offer { id, listing_id: _, buyer: _, amount: _, message: _, created_at: _, expires_at: _, status: _ } = offer;
        object::delete(id);
    }

    // ===== USER PROFILE FUNCTIONS =====

    /// Create a user profile
    public entry fun create_profile(
        username: String,
        bio: String,
        avatar_url: String,
        ctx: &mut TxContext
    ) {
        let profile = UserProfile {
            id: object::new(ctx),
            user: tx_context::sender(ctx),
            username,
            bio,
            avatar_url,
            reputation_score: 0,
            total_sales: 0,
            total_purchases: 0,
            join_date: tx_context::epoch(ctx),
            verified: false,
        };

        event::emit(UserProfileCreated {
            user: tx_context::sender(ctx),
            username: profile.username,
        });

        transfer::share_object(profile);
    }

    /// Update user reputation
    public entry fun update_reputation(
        profile: &mut UserProfile,
        new_score: u64,
        ctx: &mut TxContext
    ) {
        assert!(new_score <= 100, EInvalidReputation);
        profile.reputation_score = new_score;
        
        event::emit(ReputationUpdated {
            user: profile.user,
            new_score,
        });
    }

    // ===== UTILITY FUNCTIONS =====

    /// Get listing details
    public fun get_listing_details<T>(listing: &Listing<T>): (address, u64, String, String, String, u64, u64, bool) {
        (
            listing.seller,
            listing.price,
            listing.title,
            listing.description,
            listing.category,
            listing.created_at,
            listing.updated_at,
            listing.is_auction,
        )
    }

    /// Get user profile details
    public fun get_profile_details(profile: &UserProfile): (String, String, u64, u64, u64, bool) {
        (
            profile.username,
            profile.bio,
            profile.reputation_score,
            profile.total_sales,
            profile.total_purchases,
            profile.verified,
        )
    }

    /// Check if auction has ended
    public fun is_auction_ended<T>(listing: &Listing<T>): bool {
        if (!listing.is_auction) {
            return false
        };
        let current_time = tx_context::epoch(tx_context::dummy_context());
        let end_time = option::borrow(&listing.auction_end_time);
        current_time >= *end_time
    }
}