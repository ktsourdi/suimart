module suimart::marketplace {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::balance::{Self, Balance};
    use sui::tx_context::{Self, TxContext};
    use sui::event;

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
    public fun list_item<T: key + store>(item: T, price: u64, ctx: &mut TxContext): Listing<T> {
        let listing = Listing {
            id: object::new(ctx),
            item,
            seller: tx_context::sender(ctx),
            price,
        };
        event::emit<ListingCreated>(ListingCreated {
            listing_id: object::id(&listing.id),
            price,
            seller: tx_context::sender(ctx),
        });
        listing
    }

    /// Buy a listed item providing the exact `price` as `payment`.
    public fun buy_item<T: key + store>(listing: &mut Listing<T>, payment: Balance<SUI>, ctx: &mut TxContext): T {
        assert!(payment.value == listing.price, 0);
        balance::transfer(payment, listing.seller);
        event::emit<ListingPurchased>(ListingPurchased {
            listing_id: object::id(&listing.id),
            buyer: tx_context::sender(ctx),
        });
        let item = listing.item;
        // Destroy the listing object – it's no longer needed
        transfer::public_destroy_object<Listing<T>>(listing, ctx);
        item
    }

    /// Cancel a listing and return the item to the seller.
    public fun cancel_listing<T: key + store>(listing: &mut Listing<T>, ctx: &mut TxContext): T {
        assert!(tx_context::sender(ctx) == listing.seller, 1);
        event::emit<ListingCancelled>(ListingCancelled { listing_id: object::id(&listing.id) });
        let item = listing.item;
        transfer::public_destroy_object<Listing<T>>(listing, ctx);
        item
    }
}