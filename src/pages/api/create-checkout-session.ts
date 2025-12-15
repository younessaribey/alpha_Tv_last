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

        const session = await stripe.checkout.sessions.create({
            ui_mode: 'embedded',
            // Let Stripe automatically show all available payment methods (Apple Pay, Google Pay, etc.)
            // payment_method_types: ['card'], // Removed to enable automatic payment method detection
            mode: 'payment',
            customer_email: customerEmail,
            line_items: [
                {
                    price_data: {
                        currency: 'eur',
                        product_data: {
                            name: genericProduct.name,
                            description: genericProduct.description,
                        },
                        unit_amount: Math.round(price * 100),
                    },
                    quantity: 1,
                },
            ],
            metadata: {
                productId,
                productName: genericProduct.name, // Use generic name in metadata too
                customerName,
                customerEmail,
                customerPhone: customerPhone || '',
                price: price.toString(),
            },
            return_url: `${import.meta.env.PUBLIC_BASE_URL || 'http://localhost:4321'}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        });

        return new Response(JSON.stringify({
            clientSecret: session.client_secret,
            sessionId: session.id,
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Stripe checkout error:', error);
        return new Response(JSON.stringify({ error: 'Failed to create checkout session' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
