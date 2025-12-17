# 🔐 Stripe Live Mode Setup Guide

**Status**: Switched to LIVE mode  
**Date**: December 17, 2025

---

## ✅ LIVE STRIPE CONFIGURATION

### **Price IDs** (Already Set):
```bash
# 6 Months - 1 Device
STRIPE_PRICE_6M_1D=price_1SerdnF8KEMSXezPwawxvrLD

# 12 Months - 1 Device  
STRIPE_PRICE_12M_1D=price_1Sefm9F8KEMSXezPUQ2ZcWzB

# 12 Months - 2 Devices (Duo)
STRIPE_PRICE_12M_2D=price_1SereTF8KEMSXezP2BaolI8E
```

**These are configured in Vercel environment variables** ✅

---

## 🔧 WEBHOOK SETUP (CRITICAL)

### **Step 1: Create Webhook Endpoint in Stripe**

1. Go to: https://dashboard.stripe.com/webhooks
2. Click **"Add endpoint"**
3. **Endpoint URL**:
   ```
   https://alpha-tv-last.vercel.app/api/stripe-webhook
   ```

4. **Events to send**:
   Select these events:
   - ✅ `checkout.session.completed`
   - ✅ `payment_intent.succeeded`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`

5. Click **"Add endpoint"**

---

### **Step 2: Get Webhook Signing Secret**

After creating the endpoint, Stripe will show:
```
Signing secret: whsec_xxxxxxxxxxxxxxxxxxxxxx
```

**Copy this value!**

---

### **Step 3: Add to Vercel Environment Variables**

1. Go to: https://vercel.com/yourproject/settings/environment-variables
2. Add new variable:
   ```
   Name: STRIPE_WEBHOOK_SECRET
   Value: whsec_xxxxxxxxxxxxxxxxxxxxxx
   ```
3. **Important**: Select **"Production"** environment
4. Click **"Save"**
5. **Redeploy** your application for changes to take effect

---

## 🧪 TESTING WEBHOOK

### **Test with Stripe CLI** (Recommended):

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local
stripe listen --forward-to https://alpha-tv-last.vercel.app/api/stripe-webhook

# Trigger test event
stripe trigger checkout.session.completed
```

### **OR Test with Real Purchase**:

1. Go to: https://alpha-tv-last.vercel.app
2. Select a plan
3. Use test card: `4242 4242 4242 4242`
4. Check Stripe Dashboard → Webhooks → Click on your endpoint
5. Verify: **"Last delivered successfully"** ✅

---

## 📊 VERCEL ENVIRONMENT VARIABLES CHECKLIST

Make sure these are set in Vercel (Production environment):

```bash
# Stripe (LIVE)
STRIPE_SECRET_KEY=sk_live_***                    # ✅ Set
PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_***        # ✅ Set
STRIPE_WEBHOOK_SECRET=whsec_***                  # ⚠️ ADD THIS

# Stripe Price IDs (LIVE)
STRIPE_PRICE_6M_1D=price_1SerdnF8KEMSXezPwawxvrLD   # ✅ Set
STRIPE_PRICE_12M_1D=price_1Sefm9F8KEMSXezPUQ2ZcWzB  # ✅ Set
STRIPE_PRICE_12M_2D=price_1SereTF8KEMSXezP2BaolI8E  # ✅ Set

# Base URL
PUBLIC_BASE_URL=https://alpha-tv-last.vercel.app  # ✅ Set

# TikTok
PUBLIC_TIKTOK_PIXEL_ID=D4VGO13C77U8MKV6P5M0      # ✅ Set
TIKTOK_ACCESS_TOKEN=***                           # ✅ Set (rotate if exposed)

# Meta
PUBLIC_META_PIXEL_ID=880536628051228              # ✅ Set
META_ACCESS_TOKEN=***                             # ✅ Set (rotate if exposed)

# Google Sheets
GOOGLE_SHEET_WEBHOOK_URL=https://script.google.com/***  # ✅ Set
```

---

## 🔐 SECURITY CHECKLIST

### **What's Protected**:
- ✅ Webhook signature verification (prevents fake webhooks)
- ✅ HTTPS only (Vercel automatically)
- ✅ Environment variables (not in code)
- ✅ Payment data never touches your server (Stripe handles it)

### **Important Notes**:
- **Never commit** `.env` file to git
- **Only `.env.example`** should be in repo (with placeholders)
- **Rotate tokens** if they were exposed in chat (TikTok, Meta)
- **Test mode** still works for development (different keys)

---

## 🚀 DEPLOYMENT CHECKLIST

Before going live with real customers:

- [ ] Stripe webhook endpoint created
- [ ] Webhook secret added to Vercel
- [ ] Application redeployed
- [ ] Test purchase completed successfully
- [ ] Webhook delivered successfully in Stripe dashboard
- [ ] Google Sheets receives order data
- [ ] Customer receives MAC/PIN via WhatsApp
- [ ] TikTok/Meta tracking verified

---

## 📞 STRIPE WEBHOOK ENDPOINTS

### **Your Webhook URL**:
```
https://alpha-tv-last.vercel.app/api/stripe-webhook
```

### **What it does**:
1. Receives `checkout.session.completed` event
2. Verifies webhook signature (security)
3. Extracts customer data + MAC/PIN
4. Logs to Google Sheets ("Paid Orders")
5. **Does NOT** fire duplicate TikTok/Meta events (already tracked client-side)

---

## 🐛 TROUBLESHOOTING

### **Issue: Webhook not receiving events**

**Check**:
1. Webhook URL correct: `https://alpha-tv-last.vercel.app/api/stripe-webhook`
2. Events selected: `checkout.session.completed`
3. Endpoint enabled (not disabled)
4. In **Live mode** (not Test mode)

**Verify in Stripe**:
- Dashboard → Webhooks → Click endpoint
- Check "Attempted events" section
- Look for delivery errors

---

### **Issue: Signature verification failed**

**Cause**: `STRIPE_WEBHOOK_SECRET` mismatch

**Fix**:
1. Go to Stripe Dashboard → Webhooks → Your endpoint
2. Click "Reveal" on signing secret
3. Copy the `whsec_***` value
4. Update in Vercel environment variables
5. Redeploy application

---

### **Issue: Orders not appearing in Google Sheets**

**Check**:
1. `GOOGLE_SHEET_WEBHOOK_URL` is set
2. Test the webhook manually:
   ```bash
   curl -X POST YOUR_GOOGLE_SHEET_WEBHOOK_URL \
     -H "Content-Type: application/json" \
     -d '{"action":"test"}'
   ```
3. Check Google Apps Script logs

---

## 📈 MONITORING

### **Daily Checks** (First Week):
1. **Stripe Dashboard** → Payments
   - Verify successful payments
   - Check for failed payments
   - Monitor refunds/disputes

2. **Stripe Dashboard** → Webhooks
   - Delivery success rate should be >99%
   - Check for failed deliveries

3. **Google Sheets** → Paid Orders
   - Verify all orders logged
   - MAC/PIN data present

4. **TikTok Events Manager**
   - CompletePayment events firing
   - Deduplication rate >95%
   - Attribution working

---

## 💰 PRICING SUMMARY

| Plan | Duration | Devices | Price ID | Price |
|------|----------|---------|----------|-------|
| Basic | 6 Months | 1 | `price_1SerdnF8KEMSXezPwawxvrLD` | €40 |
| Popular | 12 Months | 1 | `price_1Sefm9F8KEMSXezPUQ2ZcWzB` | €60 |
| Duo | 12 Months | 2 | `price_1SereTF8KEMSXezP2BaolI8E` | €100 |

**Trial Period**: 24 hours free (all plans)  
**Payment Method**: Credit/Debit card via Stripe

---

## ✅ FINAL STATUS

**Live Mode**: ✅ ACTIVE  
**Price IDs**: ✅ CONFIGURED  
**Webhook**: ⚠️ NEEDS SETUP (follow steps above)  
**Environment Variables**: ✅ MOSTLY SET (add STRIPE_WEBHOOK_SECRET)

**Next Step**: Set up Stripe webhook endpoint and add the secret to Vercel.

---

**Last Updated**: December 17, 2025  
**Mode**: PRODUCTION (LIVE)  
**Ready for**: Real customers & payments 💳
