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
        let baseUrl = import.meta.env.PUBLIC_BASE_URL || 'http://localhost:4321';

        // Ensure baseUrl has protocol
        if (!baseUrl.startsWith('http')) {
            baseUrl = `https://${baseUrl}`;
        }

        console.log('Checkout request:', { productId, useSubscription, priceId: priceConfig.priceId, baseUrl });

        // If we have a Stripe Price ID AND subscription is requested, use subscription mode with trial
        if (priceConfig.priceId && useSubscription) {
            console.log('Creating subscription with trial for price:', priceConfig.priceId);
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
                // Embedded mode requires return_url, not success_url/cancel_url
                return_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
                ui_mode: 'embedded',
            });

            console.log('[API] Stripe Checkout Session created');
            console.log('[API] Session client_secret:', session.client_secret);
            console.log('[API] Session client_secret type:', typeof session.client_secret);
            console.log('[API] Session client_secret length:', session.client_secret?.length);

            return new Response(JSON.stringify({
                clientSecret: session.client_secret, // For EmbeddedCheckout
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

        console.log('[API] Payment Checkout Session created');
        console.log('[API] Payment Session client_secret:', session.client_secret);

        return new Response(JSON.stringify({
            clientSecret: session.client_secret,
            sessionId: session.id,
            mode: 'payment',
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error: any) {
        console.error('=== STRIPE CHECKOUT ERROR ===');
        console.error('Error message:', error.message);
        console.error('Error type:', error.type);
        console.error('Error code:', error.code);
        console.error('Error param:', error.param);
        console.error('Environment check:', {
            hasSecretKey: !!import.meta.env.STRIPE_SECRET_KEY,
            secretKeyPrefix: import.meta.env.STRIPE_SECRET_KEY?.substring(0, 8),
            hasPriceIds: {
                '6m': !!import.meta.env.STRIPE_PRICE_6M_1D,
                '12m': !!import.meta.env.STRIPE_PRICE_12M_1D,
                '12m_duo': !!import.meta.env.STRIPE_PRICE_12M_2D,
            },
            priceIds: {
                '6m': import.meta.env.STRIPE_PRICE_6M_1D,
                '12m': import.meta.env.STRIPE_PRICE_12M_1D,
                '12m_duo': import.meta.env.STRIPE_PRICE_12M_2D,
            }
        });
        console.error('=== END ERROR ===');

        return new Response(JSON.stringify({
            error: 'Failed to create checkout session',
            details: error.message,
            type: error.type || 'unknown',
            code: error.code,
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
