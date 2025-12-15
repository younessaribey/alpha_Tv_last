import type { APIRoute } from 'astro';
import Stripe from 'stripe';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY);

// Map product IDs to Stripe Price IDs (create these in Stripe Dashboard)
// These should be RECURRING prices with the subscription amount
const getPriceConfig = (productId: string): { priceId?: string; name: string; description: string; amount: number } => {
    const productMap: Record<string, { priceId?: string; name: string; description: string; amount: number }> = {
        '6months-1device': {
            priceId: import.meta.env.STRIPE_PRICE_6M_1D, // Set in .env
            name: '6 Month Subscription',
            description: 'Premium streaming - 6 months, 1 device',
            amount: 3900, // €39
        },
        '12months-1device': {
            priceId: import.meta.env.STRIPE_PRICE_12M_1D, // Set in .env
            name: '12 Month Subscription',
            description: 'Premium streaming - 12 months, 1 device',
            amount: 5900, // €59
        },
        '12months-2devices': {
            priceId: import.meta.env.STRIPE_PRICE_12M_2D, // Set in .env
            name: '12 Month Subscription Duo',
            description: 'Premium streaming - 12 months, 2 devices',
            amount: 7900, // €79
        }
    };

    return productMap[productId] || {
        name: 'Premium Subscription',
        description: 'Digital streaming subscription',
        amount: 5900,
    };
};

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const { productId, productName, price, customerName, customerEmail, customerPhone, useSubscription } = body;

        if (!productId || !productName || !price || !customerName || !customerEmail) {
            return new Response(JSON.stringify({ error: 'Missing required fields' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const priceConfig = getPriceConfig(productId);
        const baseUrl = import.meta.env.PUBLIC_BASE_URL || 'http://localhost:4321';

        // If we have a Stripe Price ID, use subscription mode with trial
        if (priceConfig.priceId && useSubscription) {
            const session = await stripe.checkout.sessions.create({
                mode: 'subscription',
                customer_email: customerEmail,
                line_items: [
                    {
                        price: priceConfig.priceId,
                        quantity: 1,
                    },
                ],
                subscription_data: {
                    trial_period_days: 1, // 24h free trial
                    metadata: {
                        productId,
                        productName: priceConfig.name,
                        customerName,
                        customerEmail,
                        customerPhone: customerPhone || '',
                    },
                },
                metadata: {
                    productId,
                    productName: priceConfig.name,
                    customerName,
                    customerEmail,
                    customerPhone: customerPhone || '',
                    price: price.toString(),
                },
                return_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
                ui_mode: 'embedded',
            });

            return new Response(JSON.stringify({
                clientSecret: session.client_secret,
                sessionId: session.id,
                mode: 'subscription',
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Fallback to one-time payment (current behavior)
        const session = await stripe.checkout.sessions.create({
            ui_mode: 'embedded',
            mode: 'payment',
            customer_email: customerEmail,
            line_items: [
                {
                    price_data: {
                        currency: 'eur',
                        product_data: {
                            name: priceConfig.name,
                            description: priceConfig.description,
                        },
                        unit_amount: Math.round(price * 100),
                    },
                    quantity: 1,
                },
            ],
            metadata: {
                productId,
                productName: priceConfig.name,
                customerName,
                customerEmail,
                customerPhone: customerPhone || '',
                price: price.toString(),
            },
            return_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        });

        return new Response(JSON.stringify({
            clientSecret: session.client_secret,
            sessionId: session.id,
            mode: 'payment',
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
