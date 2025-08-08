'use client';

import { useState, FormEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '../lib/useWallet';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import Textarea from './ui/Textarea';
import Link from 'next/link';
import { mockMarketplace } from '../lib/mockData';
import { MOCK_MODE } from '../lib/config';
import { useSuiClient } from '../lib/suiClient';

interface ValidationErrors {
  title?: string;
  description?: string;
  price?: string;
  category?: string;
}

export default function SellClient() {
  const sui = useSuiClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  const { signAndExecuteTransactionBlock, currentAccount } = useWallet();
  const router = useRouter();

  const categories = [
    { id: 'nfts', name: 'NFTs' },
    { id: 'gaming', name: 'Gaming' },
    { id: 'art', name: 'Art' },
    { id: 'collectibles', name: 'Collectibles' },
    { id: 'music', name: 'Music' },
    { id: 'sports', name: 'Sports' },
    { id: 'virtual-worlds', name: 'Virtual Worlds' },
    { id: 'other', name: 'Other' },
  ];

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    if (!title.trim()) {
      errors.title = 'Title is required';
    } else if (title.length < 3) {
      errors.title = 'Title must be at least 3 characters';
    }

    if (!description.trim()) {
      errors.description = 'Description is required';
    } else if (description.length < 10) {
      errors.description = 'Description must be at least 10 characters';
    }

    if (!price.trim()) {
      errors.price = 'Price is required';
    } else {
      const priceNum = parseFloat(price);
      if (isNaN(priceNum) || priceNum <= 0) {
        errors.price = 'Price must be a positive number';
      }
    }

    if (!category) {
      errors.category = 'Category is required';
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

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (MOCK_MODE) {
        await mockMarketplace.createListing({
          title: title.trim(),
          description: description.trim(),
          price: parseFloat(price),
          category,
          seller: currentAccount.address,
          itemType: '0x2::devnet_nft::DevNFT',
          isAuction: false
        });
      } else {
        // TODO: Replace with real object selection and on-chain list_item call
        alert('On-chain listing flow requires selecting an item object. Not implemented yet.');
      }

      setSuccessMessage("Item listed successfully! Redirecting to marketplace...");
      
      // Reset form
      setTitle('');
      setDescription('');
      setPrice('');
      setCategory('');
      setValidationErrors({});

      // Redirect after a short delay
      setTimeout(() => {
        router.push('/');
      }, 2000);

    } catch (error) {
      console.error('Failed to create listing:', error);
      setErrorMessage("Failed to create listing. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#f8fafc] to-[#e1f3ff] py-8">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-[#6fbcf0] to-[#0284ad] bg-clip-text text-transparent">
              Sell Your Item
            </span>
          </h1>
          <p className="text-xl text-[#636871] mb-6">
            List your digital assets on Suimart and reach thousands of buyers
          </p>
          {MOCK_MODE && (
            <div className="inline-flex items-center px-4 py-2 bg-[#fff8e2] border border-[#f5cf54] rounded-lg text-[#8d6e15] text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-[#f5cf54] rounded-full mr-2"></span>
              Mock Mode - Demo Environment
            </div>
          )}
          {currentAccount && (
            <div className="inline-flex items-center px-4 py-2 bg-[#e1f3ff] border border-[#6fbcf0] rounded-lg text-[#1f6493] text-sm font-medium">
              <span className="w-2 h-2 bg-[#6fbcf0] rounded-full mr-2"></span>
              Connected: {formatAddress(currentAccount.address)}
            </div>
          )}
        </div>

        {/* Form */}
        <Card variant="elevated" className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Create New Listing</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <Input
                label="Item Title"
                placeholder="Enter a descriptive title for your item"
                value={title}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  setTitle(e.target.value);
                  if (validationErrors.title) {
                    setValidationErrors({ ...validationErrors, title: undefined });
                  }
                }}
                error={validationErrors.title}
                disabled={loading}
                required
              />

              {/* Description */}
              <Textarea
                label="Description"
                placeholder="Describe your item in detail..."
                value={description}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
                  setDescription(e.target.value);
                  if (validationErrors.description) {
                    setValidationErrors({ ...validationErrors, description: undefined });
                  }
                }}
                error={validationErrors.description}
                disabled={loading}
                required
              />

              {/* Price */}
              <Input
                label="Price (SUI)"
                type="number"
                placeholder="0.00"
                step="0.01"
                min="0"
                value={price}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  setPrice(e.target.value);
                  if (validationErrors.price) {
                    setValidationErrors({ ...validationErrors, price: undefined });
                  }
                }}
                error={validationErrors.price}
                disabled={loading}
                required
                helperText="Enter the price in SUI tokens"
              />

              {/* Category */}
              <div className="w-full">
                <label className="block text-sm font-medium text-[#182435] mb-2">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    if (validationErrors.category) {
                      setValidationErrors({ ...validationErrors, category: undefined });
                    }
                  }}
                  disabled={loading}
                  className="w-full px-4 py-3 border-2 border-[#cbd5e1] bg-white text-[#182435] rounded-lg transition-all duration-200 focus:outline-none focus:border-[#6fbcf0] focus:ring-2 focus:ring-[#6fbcf0] focus:ring-opacity-20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {validationErrors.category && (
                  <p className="mt-1 text-sm text-[#ff794b]">{validationErrors.category}</p>
                )}
              </div>

              {/* Error/Success Messages */}
              {errorMessage && (
                <div className="p-4 bg-[#ffece6] border border-[#ff794b] rounded-lg">
                  <p className="text-[#ff794b] text-sm">{errorMessage}</p>
                </div>
              )}

              {successMessage && (
                <div className="p-4 bg-[#d5f7ee] border border-[#2dd7a7] rounded-lg">
                  <p className="text-[#008c65] text-sm">{successMessage}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={loading || !currentAccount}
                  className="flex-1"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating Listing...
                    </>
                  ) : !currentAccount ? (
                    'Connect Wallet to List'
                  ) : (
                    'Create Listing'
                  )}
                </Button>
                <Link href="/" className="flex-1">
                  <Button variant="outline" size="lg" className="w-full">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Tips Section */}
        <Card className="max-w-2xl mx-auto mt-8">
          <CardHeader>
            <CardTitle>Tips for a Successful Listing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm text-[#636871]">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-[#6fbcf0] text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-[#182435] mb-1">Write a Clear Title</h4>
                  <p>Use descriptive, specific titles that help buyers find your item</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-[#6fbcf0] text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-[#182435] mb-1">Detailed Description</h4>
                  <p>Include all relevant details, features, and any special characteristics</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-[#6fbcf0] text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-[#182435] mb-1">Competitive Pricing</h4>
                  <p>Research similar items to set a fair and competitive price</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-[#6fbcf0] text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                  4
                </div>
                <div>
                  <h4 className="font-semibold text-[#182435] mb-1">Choose the Right Category</h4>
                  <p>Select the most appropriate category to help buyers discover your item</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
} 