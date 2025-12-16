# 📊 AlphaTV Tracking Implementation Report

**Date:** December 16, 2024  
**Website:** https://alpha-tv-last.vercel.app  
**Status:** ✅ FULLY OPERATIONAL

---

## 🎯 Executive Summary

Both **TikTok** and **Meta (Facebook)** tracking are fully implemented with:
- **Browser Pixel** (client-side) - Fires instantly on user actions
- **Server-Side Conversions API** (CAPI) - More reliable, bypasses ad blockers

This dual-tracking approach ensures **maximum attribution accuracy** for ad campaigns.

---

## 📈 TikTok Tracking

### Pixel ID
```
D4VGO13C77U8MKV6P5M0
```

### Events Tracked

| Event | Trigger Page | Parameters |
|-------|--------------|------------|
| **PageView** | All pages | Automatic |
| **ViewContent** | `/pricing` | content_id, content_name, brand, currency, value |
| **InitiateCheckout** | `/checkout/[id]` | content_id, content_name, price, num_items, brand, currency, value, status |
| **AddPaymentInfo** | Checkout form submission | content_id, content_name, currency, value |
| **CompletePayment** | `/checkout/success` | content_id, content_name, price, num_items, brand, currency, value, status |

### Server-Side Events API
- **Endpoint:** `/open_api/v1.3/event/track/`
- **Events Sent:** CompletePayment (Purchase)
- **Deduplication:** Uses shared `event_id` between browser and server
- **User Matching:** Hashed email + phone + IP + User Agent

### EMQ Score
- **Current:** 46/100 (will improve with more events)
- **Primary Source for Purchase:** Server ✅

---

## 📘 Meta (Facebook) Tracking

### Pixel ID
```
880536628051228
```

### Events Tracked

| Event | Trigger Page | Parameters |
|-------|--------------|------------|
| **PageView** | All pages | Automatic |
| **ViewContent** | `/pricing` | content_ids, content_name, content_type |
| **InitiateCheckout** | `/checkout/[id]` | content_ids, content_name, value, currency |
| **Purchase** | `/checkout/success` | content_ids, content_name, value, currency |

### Server-Side Conversions API
- **Endpoint:** `graph.facebook.com/v18.0/{pixel_id}/events`
- **Events Sent:** Purchase
- **Deduplication:** Uses shared `eventID` between browser and server
- **User Matching:** Hashed email + phone + IP + User Agent + FBCLID

### Last Test Result
```
Meta Conversions API response: { events_received: 1 } ✅
```

---

## 🔄 Click Attribution

Both platforms capture click IDs from ad URLs:

| Platform | URL Parameter | Storage | Usage |
|----------|---------------|---------|-------|
| TikTok | `ttclid` | localStorage | Sent with CAPI events |
| Meta | `fbclid` | localStorage | Sent with CAPI events |

**Example ad URL:**
```
https://alpha-tv-last.vercel.app/pricing?ttclid=xxx&fbclid=yyy
```

---

## 🛠 Technical Implementation

### Files Modified

| File | Purpose |
|------|---------|
| `src/layouts/Layout.astro` | Global pixel initialization (TikTok + Meta) |
| `src/pages/pricing.astro` | ViewContent event |
| `src/pages/checkout/[id].astro` | InitiateCheckout event |
| `src/components/CheckoutForm.tsx` | AddPaymentInfo event |
| `src/components/SuccessContent.tsx` | Purchase/CompletePayment event |
| `src/pages/api/track-conversion.ts` | Server-side CAPI for both platforms |

### Environment Variables (Vercel)

| Variable | Purpose |
|----------|---------|
| `PUBLIC_TIKTOK_PIXEL_ID` | TikTok client-side pixel |
| `TIKTOK_ACCESS_TOKEN` | TikTok server-side CAPI |
| `PUBLIC_META_PIXEL_ID` | Meta client-side pixel |
| `META_ACCESS_TOKEN` | Meta server-side CAPI |

---

## 📊 Funnel Tracking Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER JOURNEY                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Landing/Pricing Page                                           │
│  ├── TikTok: ViewContent + PageView                            │
│  └── Meta: ViewContent + PageView                              │
│           ↓                                                     │
│  Checkout Page                                                  │
│  ├── TikTok: InitiateCheckout                                  │
│  └── Meta: InitiateCheckout                                    │
│           ↓                                                     │
│  Payment Form                                                   │
│  └── TikTok: AddPaymentInfo                                    │
│           ↓                                                     │
│  Success Page                                                   │
│  ├── TikTok: CompletePayment (Browser + Server CAPI)           │
│  └── Meta: Purchase (Browser + Server CAPI)                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✅ Recommended Campaign Optimization

### TikTok Ads Manager
- **Optimization Goal:** CompletePayment
- **Attribution Window:** 7-day click, 1-day view
- **Pixel:** D4VGO13C77U8MKV6P5M0

### Meta Ads Manager
- **Optimization Goal:** Purchase
- **Attribution Window:** 7-day click, 1-day view
- **Pixel:** 880536628051228

---

## 🔒 Privacy Compliance

- All user data (email, phone) is **SHA-256 hashed** before sending to APIs
- IP addresses and User Agents are used for matching only
- No plain-text PII is transmitted

---

## 📝 Testing Checklist

- [x] TikTok Pixel fires on all pages
- [x] TikTok Events API returns `code: 0` (success)
- [x] TikTok Purchase has "Server" as primary source
- [x] Meta Pixel fires on all pages
- [x] Meta Conversions API returns `events_received: 1`
- [x] Event deduplication working (shared event_id)
- [x] Click ID capture (ttclid, fbclid) working

---

## 📞 Support

For any issues with tracking, check:
1. Vercel Logs → `/api/track-conversion` endpoint
2. TikTok Events Manager → Test Events
3. Meta Events Manager → Test Events

**Report Generated:** December 16, 2024
