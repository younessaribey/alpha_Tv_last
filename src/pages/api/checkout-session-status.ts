import type { APIRoute } from 'astro';
import Stripe from 'stripe';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY);

export const GET: APIRoute = async ({ url }) => {
    try {
        const sessionId = url.searchParams.get('session_id');

        if (!sessionId) {
            return new Response(JSON.stringify({ error: 'Missing session_id' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

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
    } catch (error) {
        console.error('Session status error:', error);
        return new Response(JSON.stringify({ error: 'Failed to retrieve session' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
