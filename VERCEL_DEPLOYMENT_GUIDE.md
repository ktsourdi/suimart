# Vercel Deployment Guide

## Fixing Environment Variable Error

The error "Environment Variable "NEXT_PUBLIC_MARKETPLACE_PACKAGE" references Secret "NEXT_PUBLIC_MARKETPLACE_PACKAGE", which does not exist" occurs because Vercel is trying to reference a secret that hasn't been created.

## Step-by-Step Fix

### 1. Set Environment Variables in Vercel Dashboard

1. **Go to your Vercel Dashboard**
   - Visit [vercel.com](https://vercel.com)
   - Navigate to your project

2. **Access Project Settings**
   - Click on your project name
   - Go to "Settings" tab
   - Select "Environment Variables" from the left sidebar

3. **Add Environment Variables**
   
   **Variable 1:**
   - **Name**: `NEXT_PUBLIC_MARKETPLACE_PACKAGE`
   - **Value**: Your deployed Sui package ID (e.g., `0x1234567890abcdef...`)
   - **Environments**: Select "Production", "Preview", and "Development"
   
   **Variable 2:**
   - **Name**: `NEXT_PUBLIC_SUI_NETWORK`
   - **Value**: `devnet` (or `testnet`/`mainnet` as appropriate)
   - **Environments**: Select "Production", "Preview", and "Development"

4. **Save Changes**
   - Click "Save" for each variable

### 2. Redeploy Your Application

After setting the environment variables:

1. **Trigger a new deployment**
   - Push a new commit to your repository, OR
   - Go to "Deployments" tab in Vercel dashboard
   - Click "Redeploy" on the latest deployment

2. **Monitor the deployment**
   - Check the build logs for any errors
   - Verify that environment variables are being loaded correctly

### 3. Verify Configuration

Once deployed, visit your application and check:
- The yellow configuration warning should disappear
- The marketplace should attempt to load listings (if package ID is correct)
- No console errors related to configuration

## Alternative: Using Vercel CLI

If you prefer using the CLI:

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Set environment variables
vercel env add NEXT_PUBLIC_MARKETPLACE_PACKAGE
# Enter your package ID when prompted

vercel env add NEXT_PUBLIC_SUI_NETWORK
# Enter 'devnet' when prompted

# Deploy
vercel --prod
```

## Important Notes

1. **Package ID Format**: The package ID should be a valid Sui object ID (starts with `0x` followed by 64 hex characters)

2. **Network Selection**: Make sure your package is deployed on the same network you specify in `NEXT_PUBLIC_SUI_NETWORK`

3. **Public Variables**: Variables starting with `NEXT_PUBLIC_` are exposed to the browser, so don't put sensitive information in them

4. **Case Sensitivity**: Environment variable names are case-sensitive

## Testing Your Deployment

1. **Check Environment Variables**
   - Open browser developer tools
   - Go to Console tab
   - Type: `process.env.NEXT_PUBLIC_MARKETPLACE_PACKAGE`
   - Should show your package ID

2. **Test Functionality**
   - Try connecting a wallet
   - Check if listings load (if any exist)
   - Verify no configuration warnings appear

## Common Issues

### Issue: "Configuration Required" still shows
- **Solution**: Double-check that environment variables are set correctly
- **Check**: Variable names match exactly (case-sensitive)
- **Verify**: Variables are set for the correct environment (Production/Preview)

### Issue: Build still fails
- **Solution**: Check build logs for specific error messages
- **Verify**: All dependencies are properly installed
- **Check**: No TypeScript errors in your code

### Issue: Package ID not working
- **Solution**: Verify the package ID is correct and deployed on the specified network
- **Check**: Package exists and has the expected functions (`list_item`, `buy_item`, etc.)

## Support

If you continue to have issues:
1. Check the Vercel build logs for specific error messages
2. Verify your Sui package is deployed and accessible
3. Test locally with the same environment variables

The deployment should now work correctly once the environment variables are properly configured in the Vercel dashboard!