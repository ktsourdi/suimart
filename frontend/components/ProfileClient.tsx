'use client';

import { useState, useEffect } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { PACKAGE_ID, SUI_NETWORK } from '../lib/config';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import Link from 'next/link';

interface UserProfile {
  username: string;
  bio: string;
  avatarUrl: string;
  reputationScore: number;
  totalSales: number;
  totalPurchases: number;
  joinDate: number;
  verified: boolean;
}

export default function ProfileClient() {
  const currentAccount = useCurrentAccount();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [provider, setProvider] = useState<SuiClient | null>(null);

  // Form state
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    if (typeof window !== "undefined") {
      const client = new SuiClient({ url: getFullnodeUrl(SUI_NETWORK) });
      setProvider(client);
    }
  }, []);

  const fetchProfile = async () => {
    if (!currentAccount || !provider) return;

    try {
      setLoading(true);
      // This would fetch the user profile from the blockchain
      // For now, we'll create a mock profile
      const mockProfile: UserProfile = {
        username: currentAccount.address.slice(0, 8),
        bio: 'No bio yet',
        avatarUrl: '',
        reputationScore: 0,
        totalSales: 0,
        totalPurchases: 0,
        joinDate: Date.now(),
        verified: false,
      };
      setProfile(mockProfile);
      setUsername(mockProfile.username);
      setBio(mockProfile.bio);
      setAvatarUrl(mockProfile.avatarUrl);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setErrorMessage('Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentAccount) {
      fetchProfile();
    }
  }, [currentAccount]);

  const handleCreateProfile = async () => {
    if (!currentAccount || !PACKAGE_ID) {
      setErrorMessage('Please connect your wallet and configure the package ID');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);

      // This would call the create_profile function on the blockchain
      // For now, we'll just update the local state
      const newProfile: UserProfile = {
        username,
        bio,
        avatarUrl,
        reputationScore: 0,
        totalSales: 0,
        totalPurchases: 0,
        joinDate: Date.now(),
        verified: false,
      };
      setProfile(newProfile);
      setIsEditing(false);
    } catch (error) {
      console.error('Error creating profile:', error);
      setErrorMessage('Failed to create profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!currentAccount || !PACKAGE_ID) {
      setErrorMessage('Please connect your wallet and configure the package ID');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);

      // This would call the update_profile function on the blockchain
      // For now, we'll just update the local state
      const updatedProfile: UserProfile = {
        ...profile!,
        username,
        bio,
        avatarUrl,
      };
      setProfile(updatedProfile);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrorMessage('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!currentAccount) {
    return (
      <main className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Profile</h1>
          <p className="text-muted-foreground mb-6">Please connect your wallet to view your profile</p>
          <Link href="/">
            <Button>Back to Marketplace</Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="text-muted-foreground mt-1">Manage your marketplace profile</p>
        </div>
        <Link href="/">
          <Button variant="outline" size="sm">
            Back to Marketplace
          </Button>
        </Link>
      </div>

      {loading && (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading profile...</p>
          </CardContent>
        </Card>
      )}

      {!loading && !profile && (
        <Card>
          <CardHeader>
            <CardTitle>Create Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Input
                label="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
              />
            </div>
            <div>
              <Input
                label="Bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself"
                type="textarea"
              />
            </div>
            <div>
              <Input
                label="Avatar URL"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
              />
            </div>
            <Button
              onClick={handleCreateProfile}
              loading={loading}
              className="w-full"
            >
              Create Profile
            </Button>
          </CardContent>
        </Card>
      )}

      {!loading && profile && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Profile Information</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? 'Cancel' : 'Edit'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <div>
                    <Input
                      label="Username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter your username"
                    />
                  </div>
                  <div>
                    <Input
                      label="Bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell us about yourself"
                      type="textarea"
                    />
                  </div>
                  <div>
                    <Input
                      label="Avatar URL"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="https://example.com/avatar.jpg"
                    />
                  </div>
                  <Button
                    onClick={handleUpdateProfile}
                    loading={loading}
                    className="w-full"
                  >
                    Update Profile
                  </Button>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Username</p>
                    <p className="font-medium">{profile.username}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Bio</p>
                    <p className="text-sm">{profile.bio || 'No bio yet'}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Reputation Score</p>
                    <p className="font-medium">{profile.reputationScore}/100</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Total Sales</p>
                      <p className="font-medium">{profile.totalSales}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Total Purchases</p>
                      <p className="font-medium">{profile.totalPurchases}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Member Since</p>
                    <p className="text-sm">{new Date(profile.joinDate).toLocaleDateString()}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Wallet Address</p>
                <p className="font-mono text-sm break-all">{currentAccount.address}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {errorMessage && (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <p className="text-destructive text-sm">{errorMessage}</p>
          </CardContent>
        </Card>
      )}
    </main>
  );
}