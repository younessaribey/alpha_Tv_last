import type { APIRoute } from 'astro';
import Stripe from 'stripe';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY);

// In-memory store for tokens (use a database in production)
export const cancellationTokens = new Map<string, { email: string; expires: number }>();

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const { email } = body;

        if (!email) {
            return new Response(JSON.stringify({ error: 'Email is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Verify customer exists in Stripe
        const sessions = await stripe.checkout.sessions.list({
            customer_details: { email },
            limit: 100,
        });

        const completedPayments = sessions.data.filter(
            session => session.payment_status === 'paid' && session.status === 'complete'
        );

        if (completedPayments.length === 0) {
            return new Response(JSON.stringify({
                error: email.includes('@') ? 'No subscription found for this email' : 'Invalid email'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Generate secure token
        const token = crypto.randomUUID();
        const expires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

        cancellationTokens.set(token, { email, expires });

        // Create cancellation link
        const baseUrl = import.meta.env.PUBLIC_BASE_URL || 'http://localhost:4321';
        const cancelLink = `${baseUrl}/cancel?token=${token}&email=${encodeURIComponent(email)}`;

        // TODO: Send email with the link
        console.log('Cancellation link:', cancelLink);

        return new Response(JSON.stringify({
            success: true,
            message: 'Cancellation email sent',
            // Remove in production:
            _debug_link: cancelLink
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Cancel request error:', error);
        return new Response(JSON.stringify({ error: 'Failed to process request' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
