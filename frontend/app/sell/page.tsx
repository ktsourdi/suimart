'use client';

import { useState, FormEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { TransactionBlock } from '@mysten/sui.js';
import { useWalletKit } from '@mysten/wallet-kit';
import { PACKAGE_ID } from '../../lib/config';

export default function SellPage() {
  const [objectId, setObjectId] = useState('');
  const [itemType, setItemType] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { signAndExecuteTransactionBlock } = useWalletKit();
  const router = useRouter();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!objectId || !itemType || !price) return;
    
    // Check if PACKAGE_ID is properly configured
    if (!PACKAGE_ID || PACKAGE_ID === "0x0000000000000000000000000000000000000000000000000000000000000000") {
      setErrorMessage("Please configure the NEXT_PUBLIC_MARKETPLACE_PACKAGE environment variable.");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);
      const txb = new TransactionBlock();
      const priceMist = BigInt(Math.round(parseFloat(price) * 1e9));
      txb.moveCall({
        target: `${PACKAGE_ID}::marketplace::list_item<${itemType}>`,
        arguments: [txb.object(objectId), txb.pure(priceMist)],
      });
      await signAndExecuteTransactionBlock({
        transactionBlock: txb,
        options: { showEffects: true },
      });
      router.push('/');
    } catch (error) {
      console.error("Error listing item:", error);
      setErrorMessage((error as Error)?.message ?? "Failed to list item. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-lg mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">List an Item</h1>
      
      {PACKAGE_ID === "0x0000000000000000000000000000000000000000000000000000000000000000" && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <p className="font-semibold">Configuration Required</p>
          <p className="text-sm">
            Please set the NEXT_PUBLIC_MARKETPLACE_PACKAGE environment variable to your deployed package ID.
          </p>
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-medium">Object ID</label>
          <input
            type="text"
            className="w-full border rounded p-2"
            value={objectId}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setObjectId(e.target.value)
            }
            placeholder="0xabc…"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Item Type (e.g. 0x2::devnet_nft::DevNFT)</label>
          <input
            type="text"
            className="w-full border rounded p-2"
            value={itemType}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setItemType(e.target.value)
            }
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Price (SUI)</label>
          <input
            type="number"
            step="0.000001"
            className="w-full border rounded p-2"
            value={price}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setPrice(e.target.value)
            }
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Listing…' : 'List Item'}
        </button>
      </form>
      
      {errorMessage && (
        <p className="text-red-600 text-sm">{errorMessage}</p>
      )}
    </main>
  );
}