'use client';

import { useState, FormEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { TransactionBlock } from '@mysten/sui.js';
import { useWalletKit } from '@mysten/wallet-kit';
import { PACKAGE_ID } from '../lib/config';
import Card, { CardContent, CardHeader, CardTitle } from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import Link from 'next/link';

export default function SellClient() {
  const [objectId, setObjectId] = useState('');
  const [itemType, setItemType] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{
    objectId?: string;
    itemType?: string;
    price?: string;
  }>({});
  
  const { signAndExecuteTransactionBlock, currentAccount } = useWalletKit();
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
    
    // Price validation
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

    // Check if PACKAGE_ID is properly configured
    if (!PACKAGE_ID || PACKAGE_ID === "0x0000000000000000000000000000000000000000000000000000000000000000") {
      setErrorMessage("Please configure the NEXT_PUBLIC_MARKETPLACE_PACKAGE environment variable.");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);
      setSuccessMessage(null);
      
      const txb = new TransactionBlock();
      const priceMist = BigInt(Math.round(parseFloat(price) * 1e9));
      
      txb.moveCall({
        target: `${PACKAGE_ID}::marketplace::list_item<${itemType}>`,
        arguments: [txb.object(objectId), txb.pure(priceMist)],
      });
      
      const result = await signAndExecuteTransactionBlock({
        transactionBlock: txb,
        options: { showEffects: true },
      });
      
      console.log('Transaction result:', result);
      setSuccessMessage('Item listed successfully! Redirecting to marketplace...');
      
      // Reset form
      setObjectId('');
      setItemType('');
      setPrice('');
      setValidationErrors({});
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (error) {
      console.error("Error listing item:", error);
      setErrorMessage((error as Error)?.message ?? "Failed to list item. Please try again.");
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

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">List an Item</h1>
          <p className="text-muted-foreground mt-1">Create a new listing on the marketplace</p>
        </div>
        <Link href="/">
          <Button variant="outline" size="sm">
            Back to Marketplace
          </Button>
        </Link>
      </div>

      {PACKAGE_ID === "0x0000000000000000000000000000000000000000000000000000000000000000" && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
          <CardContent className="p-4">
            <p className="font-semibold text-yellow-800 dark:text-yellow-200">Configuration Required</p>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              Please set the NEXT_PUBLIC_MARKETPLACE_PACKAGE environment variable to your deployed package ID.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Listing Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
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
                {loading ? 'Creating Listing...' : 'List Item'}
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