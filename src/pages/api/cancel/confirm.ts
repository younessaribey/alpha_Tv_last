import type { APIRoute } from 'astro';
import { cancellationTokens } from './request';

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const { token, email, reason } = body;

        if (!token || !email) {
            return new Response(JSON.stringify({ error: 'Invalid request' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const tokenData = cancellationTokens.get(token);

        if (!tokenData) {
            return new Response(JSON.stringify({ error: 'Invalid or expired link' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (tokenData.email !== email) {
            return new Response(JSON.stringify({ error: 'Email mismatch' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (Date.now() > tokenData.expires) {
            cancellationTokens.delete(token);
            return new Response(JSON.stringify({ error: 'Link has expired' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Token is valid - process cancellation
        cancellationTokens.delete(token);

        const cancellationRecord = {
            email,
            reason: reason || 'No reason provided',
            requestedAt: new Date().toISOString(),
        };

        console.log('Cancellation confirmed:', cancellationRecord);

        // TODO: Save to database, send notification to admin

        return new Response(JSON.stringify({
            success: true,
            message: 'Cancellation confirmed',
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Cancel confirm error:', error);
        return new Response(JSON.stringify({ error: 'Failed to confirm cancellation' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
