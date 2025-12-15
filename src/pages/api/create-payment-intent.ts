import type { APIRoute } from 'astro';
import Stripe from 'stripe';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY);

// Map product IDs to generic Stripe-safe names (no IPTV references)
const getGenericProductName = (productId: string): { name: string; description: string } => {
    const productMap: Record<string, { name: string; description: string }> = {
        '6months-1device': {
            name: '6 Month Subscription',
            description: 'Premium streaming subscription - 6 months, 1 device'
        },
        '12months-1device': {
            name: '12 Month Subscription',
            description: 'Premium streaming subscription - 12 months, 1 device'
        },
        '12months-2devices': {
            name: '12 Month Subscription Duo',
            description: 'Premium streaming subscription - 12 months, 2 devices'
        }
    };

    return productMap[productId] || {
        name: 'Premium Subscription',
        description: 'Digital streaming subscription'
    };
};

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const { productId, productName, price, customerName, customerEmail, customerPhone } = body;

        if (!productId || !productName || !price || !customerName || !customerEmail) {
            return new Response(JSON.stringify({ error: 'Missing required fields' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Get generic product info for Stripe (no IPTV references)
        const genericProduct = getGenericProductName(productId);

        // Create a PaymentIntent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(price * 100),
            currency: 'eur',
            automatic_payment_methods: {
                enabled: true,
            },
            description: genericProduct.description,
            statement_descriptor_suffix: genericProduct.name.slice(0, 22), // Max 22 chars for suffix
            metadata: {
                productId,
                productName: genericProduct.name,
                customerName,
                customerEmail,
                customerPhone: customerPhone || '',
                price: price.toString(),
            },
            receipt_email: customerEmail,
        });

        return new Response(JSON.stringify({
            clientSecret: paymentIntent.client_secret,
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Stripe payment intent error:', error);
        return new Response(JSON.stringify({ error: 'Failed to create payment intent' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
