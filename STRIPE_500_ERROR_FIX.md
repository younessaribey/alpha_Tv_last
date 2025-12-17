# 🐛 Stripe 500 Error - Troubleshooting Guide

**Error**: `POST /api/create-checkout-session 500 (Internal Server Error)`  
**When**: Creating checkout session  
**Time**: December 17, 2025

---

## 🔍 ROOT CAUSE ANALYSIS

The 500 error when creating a checkout session is typically caused by:

1. **Missing/Invalid Stripe Secret Key** (most likely)
2. **Invalid Price IDs**
3. **Network/API issues**

---

## ✅ IMMEDIATE FIX CHECKLIST

### **Step 1: Verify Vercel Environment Variables**

Go to: https://vercel.com/[your-project]/settings/environment-variables

**Check these are set for PRODUCTION**:

```bash
# CRITICAL - Must be LIVE keys (sk_live_**, pk_live_**)
STRIPE_SECRET_KEY=sk_live_****************
PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_****************

# Price IDs (LIVE mode)
STRIPE_PRICE_6M_1D=price_1SerdnF8KEMSXezPwawxvrLD
STRIPE_PRICE_12M_1D=price_1Sefm9F8KEMSXezPUQ2ZcWzB
STRIPE_PRICE_12M_2D=price_1SereTF8KEMSXezP2BaolI8E

# Base URL
PUBLIC_BASE_URL=https://alpha-tv-last.vercel.app
```

**IF ANY ARE MISSING**:
1. Add them in Vercel
2. **Redeploy** the application (environment variables only apply after redeploy)

---

### **Step 2: Verify Stripe Keys Match Mode**

**CRITICAL**: If you switched to LIVE mode, you MUST use:
- Secret Key starting with: `sk_live_`
- Publishable Key starting with: `pk_live_`

**Test Keys** (`sk_test_`, `pk_test_`) will NOT work with LIVE price IDs!

---

### **Step 3: Verify Price IDs in Stripe Dashboard**

1. Go to: https://dashboard.stripe.com/products
2. Click on each product
3. Verify the **Price IDs match exactly**:
   ```
   price_1SerdnF8KEMSXezPwawxvrLD  (6 Months)
   price_1Sefm9F8KEMSXezPUQ2ZcWzB  (12 Months)
   price_1SereTF8KEMSXezP2BaolI8E  (12 Months Duo)
   ```

4. Ensure prices are:
   - ✅ In **LIVE mode** (not test mode)
   - ✅ Type: **Recurring** (subscription)
   - ✅ Status: **Active**

---

## 🔧 QUICK FIX (If Variables Are Missing)

### **Method 1: Via Vercel Dashboard** (Recommended)

1. Go to Vercel Project Settings → Environment Variables
2. Add each missing variable
3. Set environment to: **Production**
4. Click **Save**
5. Go to Deployments → Select latest
6. Click **Redeploy**

---

### **Method 2: Via Vercel CLI**

```bash
# Install CLI
npm i -g vercel

# Login
vercel login

# Add environment variable
vercel env add STRIPE_SECRET_KEY production
# Paste your sk_live_*** key when prompted

# Repeat for all variables
vercel env add STRIPE_PRICE_6M_1D production
# etc...

# Redeploy
vercel --prod
```

---

## 🧪 TESTING AFTER FIX

### **Test 1: Check Console Logs**

1. Open: https://alpha-tv-last.vercel.app/checkout/12months-1device
2. Open browser DevTools → Console
3. Try to checkout
4. Look for error messages

### **Test 2: Check Vercel Logs**

1. Go to: Vercel Dashboard → Your Project → Logs
2. Look for the API error around the time you tested
3. Should show detailed error message like:
   ```
   Error: Invalid API Key provided
   ```

**Common Errors**:
- `Invalid API Key` → Wrong Stripe secret key
- `No such price` → Price ID doesn't exist in Stripe
- `No such price ID in test mode` → Using test keys with live price IDs

---

## 📋 ENVIRONMENT VARIABLE TEMPLATE

Copy this and update values in Vercel:

```bash
# ===== STRIPE (LIVE MODE) =====
STRIPE_SECRET_KEY=sk_live_YOUR_SECRET_KEY_HERE
PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_PUBLISHABLE_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET

# ===== STRIPE PRICE IDs (LIVE) =====
STRIPE_PRICE_6M_1D=price_1SerdnF8KEMSXezPwawxvrLD
STRIPE_PRICE_12M_1D=price_1Sefm9F8KEMSXezPUQ2ZcWzB
STRIPE_PRICE_12M_2D=price_1SereTF8KEMSXezP2BaolI8E

# ===== BASE URL (PRODUCTION) =====
PUBLIC_BASE_URL=https://alpha-tv-last.vercel.app

# ===== TIKTOK =====
PUBLIC_TIKTOK_PIXEL_ID=D4VGO13C77U8MKV6P5M0
TIKTOK_ACCESS_TOKEN=YOUR_TIKTOK_TOKEN

# ===== META =====
PUBLIC_META_PIXEL_ID=880536628051228
META_ACCESS_TOKEN=YOUR_META_TOKEN

# ===== GOOGLE SHEETS =====
GOOGLE_SHEET_WEBHOOK_URL=https://script.google.com/macros/s/YOUR_SHEET_WEBHOOK
```

---

## 🎯 EXPECTED VS ACTUAL

### **Expected Behavior**:
1. User selects plan
2. Fills form
3. Stripe embedded checkout loads
4. User enters card
5. Payment completes
6. Redirects to success page

### **Current Behavior (Error)**:
1. User selects plan ✅
2. Fills form ✅
3. ❌ 500 Error (Stripe checkout doesn't load)

**Root Cause**: Server can't create Stripe session (wrong/missing keys)

---

## 💡 TEMPORARY WORKAROUND (While Fixing)

If you need to test immediately, you can temporarily switch back to test mode:

1. In Vercel, update:
   ```bash
   STRIPE_SECRET_KEY=sk_test_YOUR_TEST_KEY
   PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_TEST_KEY
   ```

2. Update price IDs to **TEST mode prices** (create in Stripe test mode)

3. Redeploy

**However**, this won't process real payments. Only for testing!

---

## 🚨 CRITICAL ACTIONS

**DO NOW** (in order):

1. ✅ Check Vercel has `STRIPE_SECRET_KEY` starting with `sk_live_`
2. ✅ Check Vercel has all 3 `STRIPE_PRICE_*` variables
3. ✅ **Redeploy** the application
4. ✅ Test checkout again
5. ✅ Check Vercel logs for detailed error

**IF STILL ERRORS**:
- Copy exact error from Vercel logs
- Share with me for deeper investigation

---

## 📞 HOW TO GET VERCEL LOGS

1. Go to: Vercel Dashboard → Your Project
2. Click **Logs** tab (top)
3. Filter by: **Errors** (recommended)
4. Look for timestamp matching your test (e.g., "1 minute ago")
5. Click to expand full error details

**Share this info**:
- Error message
- Error type
- Stack trace (if available)

---

## ✅ SUCCESS INDICATORS

After fixing, you should see:

**In Browser Console**:
```
[API] Stripe Checkout Session created
[API] Session client_secret: cs_live_***
```

**In Vercel Logs**:
```
Checkout request: { productId: '12months-1device', useSubscription: true, priceId: 'price_1Sefm9F8KEMSXezPUQ2ZcWzB' }
Creating subscription with trial for price: price_1Sefm9F8KEMSXezPUQ2ZcWzB
```

**In Browser**:
- Stripe embedded checkout form loads
- Can enter card details
- Payment proceeds normally

---

**Next Step**: Check your Vercel environment variables and redeploy if anything is missing!

---

**Report Created**: December 17, 2025 01:35  
**Priority**: 🔴 CRITICAL (blocking checkouts)  
**Expected Fix Time**: 5-10 minutes (env var update + redeploy)
