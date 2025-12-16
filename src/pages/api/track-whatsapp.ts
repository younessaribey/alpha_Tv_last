import type { APIRoute } from 'astro';

// Google Sheets API endpoint for tracking orders and leads
// You'll need to set up a Google Apps Script Web App to receive this data

const GOOGLE_SHEET_WEBHOOK_URL = import.meta.env.GOOGLE_SHEET_WEBHOOK_URL;

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const { action, ...data } = body;

        console.log(`[Track] ${action}:`, data);

        // If Google Sheet webhook is configured, send data there
        if (GOOGLE_SHEET_WEBHOOK_URL) {
            try {
                await fetch(GOOGLE_SHEET_WEBHOOK_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action,
                        ...data,
                        receivedAt: new Date().toISOString(),
                    })
                });
                console.log('[Track] Sent to Google Sheets');
            } catch (err) {
                console.error('[Track] Google Sheets error:', err);
            }
        }

        return new Response(JSON.stringify({ success: true, action }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('[Track] Error:', error);
        return new Response(JSON.stringify({ error: 'Failed to track' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
