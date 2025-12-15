import type { APIRoute } from 'astro';
import Stripe from 'stripe';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY);
const webhookSecret = import.meta.env.STRIPE_WEBHOOK_SECRET;

export const POST: APIRoute = async ({ request }) => {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
        return new Response('Missing signature', { status: 400 });
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
        console.error('Webhook signature verification failed:', err);
        return new Response('Invalid signature', { status: 400 });
    }

    // Handle the event
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            console.log('✅ Payment succeeded:', {
                id: paymentIntent.id,
                amount: paymentIntent.amount / 100,
                currency: paymentIntent.currency,
                email: paymentIntent.receipt_email,
                metadata: paymentIntent.metadata,
            });

            // TODO: Add your custom logic here:
            // - Send confirmation email
            // - Update database
            // - Send WhatsApp notification
            // - etc.

            break;

        case 'payment_intent.payment_failed':
            const failedIntent = event.data.object as Stripe.PaymentIntent;
            console.log('❌ Payment failed:', {
                id: failedIntent.id,
                error: failedIntent.last_payment_error?.message,
                email: failedIntent.receipt_email,
            });
            break;

        case 'checkout.session.completed':
            const session = event.data.object as Stripe.Checkout.Session;
            console.log('✅ Checkout completed:', {
                id: session.id,
                customer_email: session.customer_details?.email,
                amount_total: session.amount_total,
                metadata: session.metadata,
            });
            break;

        default:
            console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
};
