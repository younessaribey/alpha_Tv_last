import type { APIRoute } from 'astro';
import crypto from 'crypto';

// Meta Conversions API
const META_PIXEL_ID = '880536628051228';
const META_ACCESS_TOKEN = import.meta.env.META_ACCESS_TOKEN;

// TikTok Events API
const TIKTOK_PIXEL_ID = import.meta.env.PUBLIC_TIKTOK_PIXEL_ID || 'D4VGO13C77U8MKV6P5M0';
const TIKTOK_ACCESS_TOKEN = import.meta.env.TIKTOK_ACCESS_TOKEN;

// Hash function for user data (required by both APIs)
const hash = (value: string): string => {
    return crypto.createHash('sha256').update(value.toLowerCase().trim()).digest('hex');
};

// Send event to Meta Conversions API
async function sendMetaEvent(eventData: {
    eventName: string;
    eventId: string;
    email?: string;
    phone?: string;
    value?: number;
    currency?: string;
    contentIds?: string[];
    contentName?: string;
    userAgent?: string;
    clientIp?: string;
    eventSourceUrl?: string;
    fbclid?: string;
}) {
    if (!META_ACCESS_TOKEN || META_ACCESS_TOKEN === 'your_meta_access_token') {
        console.log('Meta Conversions API: Token not configured');
        return null;
    }

    const userData: Record<string, any> = {};
    if (eventData.email) userData.em = [hash(eventData.email)];
    if (eventData.phone) userData.ph = [hash(eventData.phone)];
    if (eventData.clientIp) userData.client_ip_address = eventData.clientIp;
    if (eventData.userAgent) userData.client_user_agent = eventData.userAgent;
    if (eventData.fbclid) userData.fbc = eventData.fbclid;

    const eventPayload = {
        data: [{
            event_name: eventData.eventName,
            event_time: Math.floor(Date.now() / 1000), // Unix timestamp (seconds)
            event_id: eventData.eventId, // For deduplication
            action_source: 'website',
            event_source_url: eventData.eventSourceUrl,
            user_data: userData,
            custom_data: {
                currency: eventData.currency || 'EUR',
                value: eventData.value,
                content_ids: eventData.contentIds,
                content_name: eventData.contentName,
            }
        }]
    };

    try {
        const response = await fetch(
            `https://graph.facebook.com/v18.0/${META_PIXEL_ID}/events?access_token=${META_ACCESS_TOKEN}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(eventPayload)
            }
        );
        const result = await response.json();
        console.log('Meta Conversions API response:', result);
        return result;
    } catch (error) {
        console.error('Meta Conversions API error:', error);
        return null;
    }
}

// Send event to TikTok Events API
async function sendTikTokEvent(eventData: {
    eventName: string;
    eventId: string;
    email?: string;
    phone?: string;
    value?: number;
    currency?: string;
    contentId?: string;
    contentName?: string;
    contentCategory?: string;
    userAgent?: string;
    clientIp?: string;
    ttclid?: string;
    url?: string;
}) {
    console.log('TikTok CAPI check:', {
        hasToken: !!TIKTOK_ACCESS_TOKEN,
        hasPixelId: !!TIKTOK_PIXEL_ID,
        pixelId: TIKTOK_PIXEL_ID
    });

    if (!TIKTOK_ACCESS_TOKEN || !TIKTOK_PIXEL_ID || TIKTOK_PIXEL_ID === 'your_tiktok_pixel_id_here') {
        console.log('TikTok Events API: Token or Pixel ID not configured');
        return null;
    }

    // Build user data object
    const userData: Record<string, any> = {};
    if (eventData.email) userData.email = hash(eventData.email);
    if (eventData.phone) userData.phone_number = hash(eventData.phone);

    // Build context object
    const context: Record<string, any> = {
        user_agent: eventData.userAgent,
        ip: eventData.clientIp,
        user: userData,
    };

    // Add TTCLID for attribution if available
    if (eventData.ttclid) {
        context.ad = { callback: eventData.ttclid };
    }

    // Build properties object with all parameters (generic naming)
    const properties: Record<string, any> = {
        currency: eventData.currency || 'EUR',
        value: eventData.value,
        contents: [{
            content_id: eventData.contentId,
            content_type: 'product',
            content_name: eventData.contentName,
            content_category: 'Subscription',
            price: eventData.value,
            num_items: 1,
            brand: 'Alpha',
        }],
    };

    const eventPayload = {
        event: eventData.eventName,
        event_id: eventData.eventId,
        event_time: Math.floor(Date.now() / 1000),
        user: {
            email: eventData.email ? hash(eventData.email) : undefined,
            phone: eventData.phone ? hash(eventData.phone) : undefined,
        },
        properties: properties,
        page: {
            url: eventData.url,
        },
    };

    // Build the full request body with event_source at top level
    const requestBody = {
        event_source: 'web',
        event_source_id: TIKTOK_PIXEL_ID,
        data: [eventPayload],
    };

    try {
        const response = await fetch(
            'https://business-api.tiktok.com/open_api/v1.3/event/track/',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Token': TIKTOK_ACCESS_TOKEN,
                },
                body: JSON.stringify(requestBody)
            }
        );
        const result = await response.json();
        console.log('TikTok Events API response:', result);
        return result;
    } catch (error) {
        console.error('TikTok Events API error:', error);
        return null;
    }
}

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const {
            eventName,
            eventId, // Shared event ID for deduplication
            email,
            phone,
            value,
            currency,
            contentId,
            contentName,
            eventSourceUrl,
            ttclid, // TikTok Click ID (from URL)
            fbclid, // Facebook Click ID (from URL)
        } = body;

        // Get user agent and IP from request
        const userAgent = request.headers.get('user-agent') || '';
        const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] ||
            request.headers.get('x-real-ip') || '';

        // Generate event ID if not provided
        const sharedEventId = eventId || crypto.randomUUID();

        // Send to both platforms in parallel
        const [metaResult, tiktokResult] = await Promise.all([
            sendMetaEvent({
                eventName,
                eventId: sharedEventId,
                email,
                phone,
                value,
                currency,
                contentIds: contentId ? [contentId] : undefined,
                contentName,
                userAgent,
                clientIp,
                eventSourceUrl,
                fbclid,
            }),
            sendTikTokEvent({
                eventName: eventName === 'Purchase' ? 'CompletePayment' : eventName,
                eventId: sharedEventId,
                email,
                phone,
                value,
                currency,
                contentId,
                contentName,
                userAgent,
                clientIp,
                ttclid,
            })
        ]);

        return new Response(JSON.stringify({
            success: true,
            eventId: sharedEventId,
            meta: !!metaResult,
            tiktok: !!tiktokResult,
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Track conversion error:', error);
        return new Response(JSON.stringify({ error: 'Failed to track conversion' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
