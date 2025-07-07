module suimart::marketplace {
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use sui::balance::{Self, Balance};
    use sui::tx_context::{Self, TxContext};
    use sui::event;
    use sui::sui::SUI;
    use sui::coin::{Self, Coin};

    /// Listing for a generic object `T`.
    struct Listing<T: key + store> has key {
        id: UID,
        item: T,
        seller: address,
        price: u64,
    }

    /// Emitted when a new listing is created.
    struct ListingCreated has copy, drop {
        listing_id: ID,
        price: u64,
        seller: address,
    }

    /// Emitted when a listing is purchased.
    struct ListingPurchased has copy, drop {
        listing_id: ID,
        buyer: address,
    }

    /// Emitted when a listing is cancelled by its owner.
    struct ListingCancelled has copy, drop {
        listing_id: ID,
    }

    /// List an item at a fixed `price` (in Mist).
    public entry fun list_item<T: key + store>(item: T, price: u64, ctx: &mut TxContext) {
        let listing = Listing {
            id: object::new(ctx),
            item,
            seller: tx_context::sender(ctx),
            price,
        };
        let listing_id = object::id(&listing);
        event::emit(ListingCreated {
            listing_id,
            price,
            seller: tx_context::sender(ctx),
        });
        transfer::share_object(listing);
    }

    /// Buy a listed item providing the exact `price` as `payment`.
    public entry fun buy_item<T: key + store>(listing: Listing<T>, payment: Coin<SUI>, ctx: &mut TxContext) {
        let Listing { id, item, seller, price } = listing;
        assert!(coin::value(&payment) == price, 0);
        
        transfer::public_transfer(payment, seller);
        event::emit(ListingPurchased {
            listing_id: object::uid_to_inner(&id),
            buyer: tx_context::sender(ctx),
        });
        
        transfer::public_transfer(item, tx_context::sender(ctx));
        object::delete(id);
    }

    /// Cancel a listing and return the item to the seller.
    public entry fun cancel_listing<T: key + store>(listing: Listing<T>, ctx: &mut TxContext) {
        let Listing { id, item, seller, price: _ } = listing;
        assert!(tx_context::sender(ctx) == seller, 1);
        
        event::emit(ListingCancelled { 
            listing_id: object::uid_to_inner(&id) 
        });
        
        transfer::public_transfer(item, seller);
        object::delete(id);
    }
}