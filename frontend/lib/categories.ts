// Listing categories and their artwork.
// Listings store either the category id ("nfts") or its display name ("NFTs"),
// so everything compares through categoryKey().

export const LISTING_CATEGORIES = [
  { id: 'nfts', name: 'NFTs' },
  { id: 'gaming', name: 'Gaming' },
  { id: 'art', name: 'Art' },
  { id: 'collectibles', name: 'Collectibles' },
  { id: 'music', name: 'Music' },
  { id: 'sports', name: 'Sports' },
  { id: 'virtual-worlds', name: 'Virtual Worlds' },
  { id: 'other', name: 'Other' },
] as const;

export function categoryKey(category?: string): string {
  return (category || '').trim().toLowerCase().replace(/\s+/g, '-');
}

export function categoryName(category?: string): string {
  const key = categoryKey(category);
  return LISTING_CATEGORIES.find((c) => c.id === key)?.name ?? (category || '');
}

// Self-hosted illustration for a listing: its own image when it has one,
// otherwise the artwork for its category (public/listings/<category>.svg).
export function listingImage(listing: { imageUrl?: string; category?: string }): string {
  if (listing.imageUrl) return listing.imageUrl;
  const key = categoryKey(listing.category);
  const known = LISTING_CATEGORIES.some((c) => c.id === key);
  return `/listings/${known ? key : 'other'}.svg`;
}
