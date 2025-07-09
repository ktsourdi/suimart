# White Screen Troubleshooting Guide for Suimart

## Current Issue
The application at https://suimart-chi.vercel.app/ shows a white screen despite successful deployment.

## Most Likely Causes and Solutions

### 1. **Environment Variables Not Set in Vercel (MOST LIKELY)**

**Issue**: The application requires `NEXT_PUBLIC_MARKETPLACE_PACKAGE` environment variable to be set in Vercel dashboard.

**Solution**:
1. Go to your Vercel Dashboard: https://vercel.com/dashboard
2. Navigate to your `suimart-chi` project
3. Click on "Settings" tab
4. Click on "Environment Variables" from the left sidebar
5. Add these variables:
   - **Name**: `NEXT_PUBLIC_MARKETPLACE_PACKAGE`
   - **Value**: Your deployed Sui package ID (e.g., `0x1234567890abcdef...`)
   - **Environments**: Select "Production", "Preview", and "Development"
   
   - **Name**: `NEXT_PUBLIC_SUI_NETWORK`
   - **Value**: `devnet` (or your target network)
   - **Environments**: Select "Production", "Preview", and "Development"

6. **Redeploy**: Go to "Deployments" tab and click "Redeploy" on the latest deployment

### 2. **Framework Detection Issue**

**Issue**: Vercel might not have detected this as a Next.js project correctly.

**Solution**:
1. In your Vercel project settings, go to "General" tab
2. Under "Framework Preset", make sure it's set to "Next.js"
3. If it's set to "Other", change it to "Next.js"
4. Save and redeploy

### 3. **Static Export Configuration**

**Issue**: The current `next.config.js` uses static export which might cause issues with dynamic imports.

**Current config**:
```javascript
output: 'export',
```

**Potential Fix**: Try temporarily removing the static export to see if it resolves the issue:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Temporarily comment out static export
  // output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
```

### 4. **Vercel Configuration Issue**

**Issue**: The current `vercel.json` might be interfering with Next.js auto-detection.

**Solution**: Try deleting the `vercel.json` file temporarily:
- Vercel auto-detects Next.js projects and often works better without custom configuration
- If removing it fixes the issue, you can add it back with minimal configuration

### 5. **Check for JavaScript Errors**

**Steps to debug**:
1. Open https://suimart-chi.vercel.app/ in your browser
2. Open Developer Tools (F12)
3. Check the Console tab for JavaScript errors
4. Check the Network tab for failed requests (404 errors for JS/CSS files)

### 6. **Build Directory Issue**

**Issue**: The `vercel.json` specifies `.next` as output directory, but with static export, it should be `out`.

**Solution**: Update `vercel.json`:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "out",
  "framework": "nextjs",
  "installCommand": "npm install"
}
```

## Quick Diagnostic Steps

### Step 1: Check Environment Variables
Visit the deployed site and check browser console:
```javascript
console.log(process.env.NEXT_PUBLIC_MARKETPLACE_PACKAGE)
```
If it shows `undefined` or the fallback value, environment variables aren't set.

### Step 2: Check for Build Errors
1. Go to Vercel dashboard
2. Click on your project
3. Go to "Functions" or "Deployments" tab
4. Check the build logs for errors

### Step 3: Test Local Build
Run locally with production settings:
```bash
cd frontend
npm run build
npm start
```

## Recommended Fix Order

1. **Set environment variables in Vercel dashboard** (most likely fix)
2. **Check framework detection** (set to Next.js)
3. **Try removing vercel.json** (let Vercel auto-detect)
4. **If still failing, try removing static export** from next.config.js
5. **Check browser console** for specific errors

## Alternative: Quick Test Build

To quickly test if the issue is with static export, you can try this temporary fix:

1. Remove `output: 'export'` from `next.config.js`
2. Delete `vercel.json`
3. Commit and push changes
4. Let Vercel auto-detect and build

If this works, you'll know the issue is with the static export configuration.

## Expected Behavior After Fix

Once fixed, you should see:
- The Suimart header and interface
- Either the "Configuration Required" yellow banner (if using fallback package ID)
- Or the actual marketplace listings (if proper package ID is set)
- "Connect Wallet" button that works

## Contact Information

If none of these solutions work, please share:
1. Screenshots of the browser console errors
2. Vercel build logs
3. Current environment variable settings in Vercel dashboard