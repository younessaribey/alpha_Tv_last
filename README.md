# AlphaTv - Astro Edition

A lightning-fast IPTV subscription shop built with Astro for maximum performance and conversion.

## 🚀 Features

- **⚡ Ultra-fast**: Static-first with Astro, only interactive components use JavaScript
- **💳 Stripe Integration**: Embedded checkout for seamless payments
- **🌍 Bilingual**: French & English support
- **📱 Responsive**: Beautiful on all devices
- **🎨 Modern Design**: Glass morphism, gradients, and smooth animations

## 🛠️ Tech Stack

- **Framework**: [Astro](https://astro.build) v5
- **UI Components**: React (Islands)
- **Styling**: Tailwind CSS v4
- **Payments**: Stripe Embedded Checkout
- **Deployment**: Node.js adapter (SSR)

## 📁 Project Structure

```
alphatv-astro/
├── src/
│   ├── components/     # Astro + React components
│   ├── layouts/        # Page layouts
│   ├── lib/           # Data & utilities
│   ├── pages/         # File-based routing
│   │   ├── api/       # API routes
│   │   ├── checkout/  # Checkout flow
│   │   └── ...
│   └── styles/        # Global CSS
├── public/            # Static assets
└── astro.config.mjs   # Astro config
```

## 🏃 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

```bash
cp .env.example .env
```

Edit `.env`:
```
STRIPE_SECRET_KEY=sk_test_your_key
PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key
PUBLIC_BASE_URL=http://localhost:4321
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:4321](http://localhost:4321)

### 4. Build for Production

```bash
npm run build
npm run preview
```

## 📄 Pages

| Path | Description |
|------|-------------|
| `/` | Homepage |
| `/pricing` | All subscription plans |
| `/checkout/[id]` | Checkout for specific plan |
| `/checkout/success` | Payment success page |
| `/how-it-works` | Installation guide |
| `/faq` | Frequently asked questions |
| `/contact` | Contact form |
| `/cancel` | Subscription cancellation |

## 🔌 API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/create-checkout-session` | POST | Create Stripe checkout session |
| `/api/checkout-session-status` | GET | Get session status |
| `/api/cancel/request` | POST | Request cancellation |
| `/api/cancel/confirm` | POST | Confirm cancellation |

## 🚀 Deployment

### Vercel

```bash
npx astro add vercel
npm run build
vercel deploy
```

### Node.js

```bash
npm run build
node ./dist/server/entry.mjs
```

## 📝 License

MIT
