'use client';

import { useState, FormEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '../lib/useWallet';
import Card, { CardContent, CardHeader, CardTitle } from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import Textarea from './ui/Textarea';
import Link from 'next/link';
import { mockMarketplace } from '../lib/mockData';
import { MOCK_MODE } from '../lib/config';

const CATEGORIES = [
  'NFTs',
  'Gaming',
  'Art',
  'Collectibles',
  'Music',
  'Sports',
  'Technology',
  'Fashion',
  'Real Estate',
  'Other'
];

export default function SellClient() {
  const [objectId, setObjectId] = useState('');
  const [itemType, setItemType] = useState('');
  const [price, setPrice] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Other');
  const [isAuction, setIsAuction] = useState(false);
  const [startingPrice, setStartingPrice] = useState('');
  const [minBid, setMinBid] = useState('');
  const [duration, setDuration] = useState('24'); // hours
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{
    objectId?: string;
    itemType?: string;
    price?: string;
    title?: string;
    description?: string;
    startingPrice?: string;
    minBid?: string;
    duration?: string;
  }>({});
  
  const { signAndExecuteTransactionBlock, currentAccount } = useWallet();
  const router = useRouter();

  const validateForm = (): boolean => {
    const errors: typeof validationErrors = {};
    
    // Object ID validation
    if (!objectId) {
      errors.objectId = 'Object ID is required';
    } else if (!objectId.startsWith('0x') || objectId.length < 10) {
      errors.objectId = 'Invalid object ID format';
    }
    
    // Item type validation
    if (!itemType) {
      errors.itemType = 'Item type is required';
    } else if (!itemType.includes('::')) {
      errors.itemType = 'Invalid type format (expected format: 0x...::module::Type)';
    }
    
    // Title validation
    if (!title.trim()) {
      errors.title = 'Title is required';
    } else if (title.length > 100) {
      errors.title = 'Title must be 100 characters or less';
    }
    
    // Description validation
    if (description.length > 500) {
      errors.description = 'Description must be 500 characters or less';
    }
    
    // Price validation
    if (isAuction) {
      if (!startingPrice) {
        errors.startingPrice = 'Starting price is required';
      } else {
        const priceNum = parseFloat(startingPrice);
        if (isNaN(priceNum) || priceNum <= 0) {
          errors.startingPrice = 'Starting price must be a positive number';
        }
      }
      
      if (!minBid) {
        errors.minBid = 'Minimum bid is required';
      } else {
        const bidNum = parseFloat(minBid);
        if (isNaN(bidNum) || bidNum <= 0) {
          errors.minBid = 'Minimum bid must be a positive number';
        }
      }
      
      if (!duration) {
        errors.duration = 'Duration is required';
      } else {
        const durationNum = parseInt(duration);
        if (isNaN(durationNum) || durationNum < 1 || durationNum > 168) {
          errors.duration = 'Duration must be between 1 and 168 hours';
        }
      }
    } else {
      if (!price) {
        errors.price = 'Price is required';
      } else {
        const priceNum = parseFloat(price);
        if (isNaN(priceNum) || priceNum <= 0) {
          errors.price = 'Price must be a positive number';
        } else if (priceNum > 1000000) {
          errors.price = 'Price seems too high. Please double-check';
        }
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!currentAccount) {
      setErrorMessage("Please connect your wallet first.");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);
      setSuccessMessage(null);
      
      if (isAuction) {
        const startingPriceMist = parseFloat(startingPrice);
        const minBidMist = parseFloat(minBid);
        const durationMs = parseInt(duration) * 60 * 60 * 1000; // Convert hours to milliseconds
        
        await mockMarketplace.createListing({
          price: startingPriceMist,
          seller: currentAccount.address,
          itemType,
          title,
          description,
          category,
          isAuction: true,
          auctionEndTime: Date.now() + durationMs,
          currentBid: startingPriceMist,
          highestBidder: currentAccount.address,
        });
      } else {
        const priceMist = parseFloat(price);
        
        await mockMarketplace.createListing({
          price: priceMist,
          seller: currentAccount.address,
          itemType,
          title,
          description,
          category,
          isAuction: false,
        });
      }
      
      setSuccessMessage(`${isAuction ? 'Auction' : 'Item'} created successfully! Redirecting to marketplace...`);
      
      // Reset form
      setObjectId('');
      setItemType('');
      setPrice('');
      setTitle('');
      setDescription('');
      setCategory('Other');
      setIsAuction(false);
      setStartingPrice('');
      setMinBid('');
      setDuration('24');
      setValidationErrors({});
      
      // Redirect to marketplace after a short delay
      setTimeout(() => {
        router.push('/');
      }, 2000);
      
    } catch (error) {
      console.error('Error creating listing:', error);
      setErrorMessage(
        (error as Error)?.message ?? "Failed to create listing. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePriceChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers and decimals
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setPrice(value);
      // Clear price validation error when user types
      if (validationErrors.price) {
        setValidationErrors({ ...validationErrors, price: undefined });
      }
    }
  };

  const handleStartingPriceChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setStartingPrice(value);
      if (validationErrors.startingPrice) {
        setValidationErrors({ ...validationErrors, startingPrice: undefined });
      }
    }
  };

  const handleMinBidChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setMinBid(value);
      if (validationErrors.minBid) {
        setValidationErrors({ ...validationErrors, minBid: undefined });
      }
    }
  };

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">List an Item</h1>
          <p className="text-muted-foreground mt-1">Create a new listing or auction</p>
          {MOCK_MODE && (
            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-full text-sm font-medium">
              <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
              Mock Mode - Demo Data
            </div>
          )}
        </div>
        <Link href="/">
          <Button variant="outline">Back to Marketplace</Button>
        </Link>
      </div>

      {/* Removed PACKAGE_ID check as it's no longer used */}

      <Card>
        <CardHeader>
          <CardTitle>Listing Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Listing Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Listing Type</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={!isAuction}
                    onChange={() => setIsAuction(false)}
                    className="text-primary"
                  />
                  <span>Fixed Price</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={isAuction}
                    onChange={() => setIsAuction(true)}
                    className="text-primary"
                  />
                  <span>Auction</span>
                </label>
              </div>
            </div>

            {/* Basic Information */}
            <div className="space-y-2">
              <Input
                label="Title"
                type="text"
                value={title}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  setTitle(e.target.value);
                  if (validationErrors.title) {
                    setValidationErrors({ ...validationErrors, title: undefined });
                  }
                }}
                placeholder="Enter item title"
                error={validationErrors.title}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Textarea
                label="Description"
                value={description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                  setDescription(e.target.value);
                  if (validationErrors.description) {
                    setValidationErrors({ ...validationErrors, description: undefined });
                  }
                }}
                placeholder="Describe your item..."
                error={validationErrors.description}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                {description.length}/500 characters
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                disabled={loading}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Object Information */}
            <div className="space-y-2">
              <Input
                label="Object ID"
                type="text"
                value={objectId}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  setObjectId(e.target.value);
                  if (validationErrors.objectId) {
                    setValidationErrors({ ...validationErrors, objectId: undefined });
                  }
                }}
                placeholder="0xabc123..."
                error={validationErrors.objectId}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                The unique identifier of the object you want to list
              </p>
            </div>

            <div className="space-y-2">
              <Input
                label="Item Type"
                type="text"
                value={itemType}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  setItemType(e.target.value);
                  if (validationErrors.itemType) {
                    setValidationErrors({ ...validationErrors, itemType: undefined });
                  }
                }}
                placeholder="0x2::devnet_nft::DevNFT"
                error={validationErrors.itemType}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                The full type of your item (e.g., 0x2::devnet_nft::DevNFT)
              </p>
            </div>

            {/* Pricing */}
            {isAuction ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Input
                    label="Starting Price (SUI)"
                    type="text"
                    value={startingPrice}
                    onChange={handleStartingPriceChange}
                    placeholder="10.5"
                    error={validationErrors.startingPrice}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Input
                    label="Minimum Bid (SUI)"
                    type="text"
                    value={minBid}
                    onChange={handleMinBidChange}
                    placeholder="0.1"
                    error={validationErrors.minBid}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Input
                    label="Duration (hours)"
                    type="number"
                    value={duration}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      setDuration(e.target.value);
                      if (validationErrors.duration) {
                        setValidationErrors({ ...validationErrors, duration: undefined });
                      }
                    }}
                    placeholder="24"
                    min="1"
                    max="168"
                    error={validationErrors.duration}
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Auction duration in hours (1-168 hours)
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Input
                  label="Price (SUI)"
                  type="text"
                  value={price}
                  onChange={handlePriceChange}
                  placeholder="10.5"
                  error={validationErrors.price}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Set your asking price in SUI tokens
                </p>
                {price && !validationErrors.price && (
                  <p className="text-xs text-primary">
                    ≈ {parseFloat(price).toLocaleString()} SUI
                  </p>
                )}
              </div>
            )}

            {!currentAccount && (
              <Card className="border-blue-500 bg-blue-50 dark:bg-blue-900/20">
                <CardContent className="p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Please connect your wallet to list an item
                  </p>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={loading || !currentAccount}
                loading={loading}
                className="flex-1"
              >
                {loading ? 'Creating Listing...' : `Create ${isAuction ? 'Auction' : 'Listing'}`}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/')}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>

          {successMessage && (
            <Card className="mt-4 border-green-500 bg-green-50 dark:bg-green-900/20">
              <CardContent className="p-4">
                <p className="text-green-800 dark:text-green-200 text-sm font-medium">
                  {successMessage}
                </p>
              </CardContent>
            </Card>
          )}

          {errorMessage && (
            <Card className="mt-4 border-destructive">
              <CardContent className="p-4">
                <p className="text-destructive text-sm">{errorMessage}</p>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Need Help?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-sm mb-1">How to find your Object ID?</h4>
            <p className="text-sm text-muted-foreground">
              You can find your object IDs in your wallet under the "NFTs" or "Objects" section, 
              or by using the Sui Explorer to browse your address.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-1">What is an Item Type?</h4>
            <p className="text-sm text-muted-foreground">
              The item type is the full Move type of your object. It typically looks like 
              "0x2::devnet_nft::DevNFT" where 0x2 is the package address, devnet_nft is the module, 
              and DevNFT is the type name.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-1">Fixed Price vs Auction</h4>
            <p className="text-sm text-muted-foreground">
              Fixed price listings are sold immediately when someone buys them. Auctions allow 
              multiple people to bid, with the highest bidder winning when the auction ends.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-1">Listing Fees</h4>
            <p className="text-sm text-muted-foreground">
              There are no listing fees. You only pay the standard Sui network gas fees for the transaction.
            </p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
} 