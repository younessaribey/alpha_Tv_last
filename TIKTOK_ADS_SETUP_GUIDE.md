# 🎯 TikTok Ads Manager Setup - CompletePayment Conversion Configuration

**Estimated Time**: 5 minutes  
**Difficulty**: Easy  
**Status**: REQUIRED for proper tracking

---

## 📋 STEP-BY-STEP GUIDE

### **Step 1: Access TikTok Ads Manager**

1. Go to: https://ads.tiktok.com/
2. Log in to your account
3. Select your **Business Center** if prompted

---

### **Step 2: Navigate to Events Manager**

**Path**: Ads Manager → **Assets** → **Events** → **Web Events**

```
Dashboard
  └─ Left Sidebar
      └─ Assets (puzzle piece icon)
          └─ Events
              └─ Web Events
```

**Or use direct link**: https://ads.tiktok.com/i18n/perf/events

---

### **Step 3: Select Your Pixel**

1. You should see your pixel: **D4VGO13C77U8MKV6P5M0**
2. Click on the pixel name to open details
3. You should see a list of events

**Expected events in your pixel**:
- PageView (automatic)
- ViewContent
- InitiateCheckout
- AddPaymentInfo
- **CompletePayment** ← This is what we're configuring

---

### **Step 4: Locate CompletePayment Event**

**In the Events List**:
1. Look for "CompletePayment" in the events table
2. You should see columns for:
   - Event Name
   - Status
   - Event Type
   - Last Received (date/time)

**Current Status**: Likely shows as "Standard Event" or "Not set as conversion"

---

### **Step 5: Mark as Conversion Event** 🎯

**Option A - Via Event Row**:
1. Find the **CompletePayment** row
2. Click the **three dots (⋯)** or **Settings** icon on the right
3. Select **"Mark as Conversion"** or **"Set as Web Conversion"**

**Option B - Via Event Details**:
1. Click on **CompletePayment** event name
2. Click **"Manage"** or **"Settings"** button
3. Toggle **"Set as Web Conversion"** to ON

---

### **Step 6: Configure Conversion Settings**

After marking as conversion, configure these settings:

#### **A. Primary Conversion** (CRITICAL)
```
☑ Set as Primary Conversion
```
**Why**: TikTok optimizes campaigns toward the primary conversion.

#### **B. Attribution Window**
```
Click-through attribution:  [7 days]   ← Recommended
View-through attribution:   [1 day]    ← Recommended
```

**Explanation**:
- **7-day click**: User clicked your ad, purchased within 7 days → you get credit
- **1-day view**: User saw your ad (didn't click), purchased within 24h → you get credit

#### **C. Conversion Value**
```
☑ Track conversion value
   Source: Event parameter (value)
   Currency: EUR
```

**Why**: This enables ROAS (Return on Ad Spend) tracking.

#### **D. Optimize For**
```
Conversion Event: CompletePayment
Goal: Maximize Conversions
```

---

### **Step 7: Save Configuration**

1. Click **"Save"** or **"Confirm"**
2. You should see a success message
3. CompletePayment should now show a **"Conversion"** label or tag

---

### **Step 8: Verify Configuration**

**Check 1 - Event Status**:
- CompletePayment should show: ✅ **"Set as Web Conversion"**
- Should have a green checkmark or "Primary" badge

**Check 2 - Test Event** (Optional but recommended):

Open your browser:
1. Go to: https://alpha-tv-last.vercel.app/checkout/success?session_id=test
2. Open DevTools → Console
3. Run:
```javascript
ttq.track('CompletePayment', {
  contents: [{
    content_id: 'test-product',
    content_name: '12 Months Test',
    price: 59.99,
  }],
  value: 59.99,
  currency: 'EUR',
}, {
  event_id: 'manual_test_' + Date.now()
});
```

4. Go back to TikTok Events Manager → **Test Events** tab
5. Within 2-3 minutes, you should see the test event appear

---

## 🎯 WHAT SUCCESS LOOKS LIKE

### **In Events Manager**:
```
Event Name        | Status        | Event Type
------------------|---------------|------------------
PageView          | Active        | Automatic
ViewContent       | Active        | Standard Event
InitiateCheckout  | Active        | Standard Event
AddPaymentInfo    | Active        | Standard Event
CompletePayment   | Active ✅      | Web Conversion (Primary) 🎯
```

### **In Campaign Settings**:
When creating/editing campaigns, you should now see:
```
Optimization Goal:
  ☑ Conversion
    Event: CompletePayment ✅
    Attribution: 7-day click, 1-day view
```

---

## 🚀 EXPECTED IMPACT

### **Before Configuration**:
- TikTok shows clicks, impressions
- No conversion data
- Can't optimize for sales
- Manual ROAS calculation

### **After Configuration**:
- ✅ Conversion tracking (purchases)
- ✅ Automated bidding optimization
- ✅ ROAS (Return on Ad Spend) metrics
- ✅ Cost per Conversion
- ✅ Conversion Rate by creative
- ✅ Lookalike audiences based on purchasers

---

## ⚠️ COMMON ISSUES & FIXES

### **Issue 1: CompletePayment doesn't appear in event list**

**Cause**: No purchases have been made yet  
**Fix**: Complete a test purchase on your site first

**Quick Test**:
1. Go to: https://alpha-tv-last.vercel.app/pricing
2. Select any plan → Complete checkout with test card:
   ```
   Card: 4242 4242 4242 4242
   Expiry: Any future date (12/25)
   CVC: Any 3 digits (123)
   ```
3. Wait 2-3 minutes
4. Refresh TikTok Events Manager
5. CompletePayment should now appear

---

### **Issue 2: "Mark as Conversion" option is greyed out**

**Cause**: Insufficient permissions  
**Fix**: 
1. Check your TikTok Ads account role
2. You need "Admin" or "Operator" permissions
3. Contact account owner to grant access

---

### **Issue 3: Event shows but says "No recent activity"**

**Cause**: No purchases in last 7 days  
**Status**: This is OK - event is still configured correctly

**Verify**:
1. Check "Last Received" date
2. If you see a date → configuration is working
3. New purchases will appear automatically

---

### **Issue 4: Event fires but conversion not counted**

**Checklist**:
- [ ] CompletePayment marked as conversion? ✅
- [ ] Primary conversion selected? ✅
- [ ] Attribution window set? ✅
- [ ] Campaign optimizing for conversions? ✅
- [ ] Waited 24-48h for data aggregation? ⏰

**Note**: TikTok has a 24-48h delay for full attribution data.

---

## 📊 AFTER SETUP: MONITORING

### **Daily Checks** (Week 1):
1. TikTok Ads Dashboard → Reporting
2. Check metrics:
   - Conversions (CompletePayment)
   - Cost per Conversion
   - Conversion Rate
   - ROAS

### **Weekly Optimization**:
1. Identify top-performing ads (highest ROAS)
2. Pause low-performing ads (ROAS < 1.5)
3. Duplicate winning creatives
4. Test new audiences based on converters

---

## 🎯 NEXT STEPS AFTER CONFIGURATION

1. **Wait 24-48h** for data to populate
2. **Create Lookalike Audience**:
   - Audience → Create → Lookalike
   - Source: Website visitors (CompletePayment event)
   - Similarity: 1% (narrow) to 5% (broad)
   
3. **Set Up Automated Rules**:
   - Pause ads if ROAS < 1.0 for 3 days
   - Increase budget if ROAS > 3.0 for 2 days
   
4. **Install TikTok Ads Mobile App**:
   - Get push notifications for conversions
   - Monitor performance on the go

---

## 📞 NEED HELP?

### **TikTok Support**:
- Live Chat: Available in Ads Manager (bottom right)
- Email: business-servicing@tiktok.com
- Help Center: https://ads.tiktok.com/help

### **Your Pixel ID** (for support):
```
Pixel ID: D4VGO13C77U8MKV6P5M0
Event: CompletePayment
Issue: Need to mark as conversion
```

---

## ✅ COMPLETION CHECKLIST

After following this guide, verify:

- [ ] CompletePayment visible in event list
- [ ] Marked as "Web Conversion"
- [ ] Set as "Primary Conversion"
- [ ] Attribution window configured (7-day click, 1-day view)
- [ ] Conversion value tracking enabled
- [ ] Test event successfully fired and appeared
- [ ] Campaign optimization goal set to "Conversion"

---

**Setup Time**: 5 minutes  
**Difficulty**: ⭐⭐☆☆☆ (Easy)  
**Impact**: 🚀🚀🚀🚀🚀 (Critical for ad optimization)

**Status after completion**: ✅ READY FOR PROFITABLE SCALING

---

**Last Updated**: December 16, 2025  
**Your Pixel ID**: D4VGO13C77U8MKV6P5M0  
**Your Domain**: https://alpha-tv-last.vercel.app
