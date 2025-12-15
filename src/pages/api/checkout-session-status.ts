import type { APIRoute } from 'astro';
import Stripe from 'stripe';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY);

export const GET: APIRoute = async ({ url }) => {
    try {
        // Support both session_id (Checkout Sessions) and payment_intent (Payment Intents)
        const sessionId = url.searchParams.get('session_id');
        const paymentIntentId = url.searchParams.get('payment_intent');

        // Handle Payment Intent (current flow)
        if (paymentIntentId) {
            const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

            if (paymentIntent.status === 'succeeded') {
                return new Response(JSON.stringify({
                    status: 'complete',
                    payment_status: 'paid',
                    customer_email: paymentIntent.receipt_email,
                    metadata: paymentIntent.metadata,
                }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            } else {
                return new Response(JSON.stringify({
                    status: paymentIntent.status,
                    payment_status: paymentIntent.status,
                    metadata: paymentIntent.metadata,
                }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        // Handle Checkout Session (legacy flow)
        if (sessionId) {
            const session = await stripe.checkout.sessions.retrieve(sessionId);

            return new Response(JSON.stringify({
                status: session.status,
                customer_email: session.customer_details?.email,
                payment_status: session.payment_status,
                metadata: session.metadata,
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({ error: 'Missing session_id or payment_intent' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Payment status error:', error);
        return new Response(JSON.stringify({ error: 'Failed to retrieve payment status' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
