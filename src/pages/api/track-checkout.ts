import type { APIRoute } from 'astro';

// Google Sheets API endpoint for tracking checkout events
// This tracks: form submissions, abandoned checkouts, WhatsApp leads

const GOOGLE_SHEET_WEBHOOK_URL = import.meta.env.GOOGLE_SHEET_WEBHOOK_URL;

interface TrackingData {
    action: 'form_started' | 'form_abandoned' | 'checkout_completed' | 'whatsapp_click';
    // Customer info
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    // Product info
    productId?: string;
    productName?: string;
    price?: number;
    // Device info
    macAddress?: string;
    pinKey?: string;
    // Meta
    timestamp?: string;
    url?: string;
    sessionId?: string;
}

export const POST: APIRoute = async ({ request }) => {
    try {
        const body: TrackingData = await request.json();
        const { action, ...data } = body;

        // Get IP and user agent
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
            request.headers.get('x-real-ip') || 'unknown';
        const userAgent = request.headers.get('user-agent') || 'unknown';

        const trackingPayload = {
            action,
            ...data,
            ip,
            userAgent,
            receivedAt: new Date().toISOString(),
        };

        console.log(`[Tracking] ${action}:`, trackingPayload);

        // If Google Sheet webhook is configured, send data there
        if (GOOGLE_SHEET_WEBHOOK_URL) {
            try {
                const response = await fetch(GOOGLE_SHEET_WEBHOOK_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(trackingPayload)
                });

                if (response.ok) {
                    console.log('[Tracking] Successfully sent to Google Sheets');
                } else {
                    console.error('[Tracking] Google Sheets response error:', response.status);
                }
            } catch (err) {
                console.error('[Tracking] Google Sheets error:', err);
            }
        } else {
            console.log('[Tracking] Google Sheets webhook not configured');
        }

        return new Response(JSON.stringify({ success: true, action }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('[Tracking] Error:', error);
        return new Response(JSON.stringify({ error: 'Failed to track' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
