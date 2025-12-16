import { useEffect, useState } from 'react';

interface SuccessContentProps {
    lang: 'en' | 'fr';
}

// TikTok Pixel tracking helper
const trackTikTokEvent = (event: string, data?: Record<string, any>) => {
    if (typeof window !== 'undefined' && (window as any).ttq) {
        (window as any).ttq.track(event, data);
    }
};

// Meta Pixel tracking helper
const trackMetaEvent = (event: string, data?: Record<string, any>) => {
    if (typeof window !== 'undefined' && (window as any).fbq) {
        (window as any).fbq('track', event, data);
    }
};

// Auto-format MAC address (adds colons and uppercase)
const formatMacAddress = (value: string): string => {
    // Remove all non-hex characters
    const hex = value.replace(/[^a-fA-F0-9]/g, '').toUpperCase();
    // Add colons every 2 characters
    const formatted = hex.match(/.{1,2}/g)?.join(':') || hex;
    // Limit to 17 characters (XX:XX:XX:XX:XX:XX)
    return formatted.slice(0, 17);
};

export default function SuccessContent({ lang }: SuccessContentProps) {
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [step, setStep] = useState<'device' | 'complete'>('device'); // Skip thankyou, go straight to device form
    const [customerEmail, setCustomerEmail] = useState('');
    const [metadata, setMetadata] = useState<Record<string, string> | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Device info for activation
    const [deviceInfo, setDeviceInfo] = useState({
        macAddress: '',
        pinKey: '',
    });

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const sessionId = params.get('session_id');
        const paymentIntentId = params.get('payment_intent');

        // Need either session_id or payment_intent
        if (!sessionId && !paymentIntentId) {
            setStatus('error');
            return;
        }

        // Build the API URL with whichever param we have
        const apiUrl = paymentIntentId
            ? `/api/checkout-session-status?payment_intent=${paymentIntentId}`
            : `/api/checkout-session-status?session_id=${sessionId}`;

        fetch(apiUrl)
            .then(res => res.json())
            .then(data => {
                if (data.status === 'complete' && data.payment_status === 'paid') {
                    setStatus('success');
                    setCustomerEmail(data.customer_email || '');
                    setMetadata(data.metadata);

                    // Generate shared event ID for deduplication
                    const eventId = `purchase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

                    // Get click IDs from URL or localStorage for attribution
                    const urlParams = new URLSearchParams(window.location.search);
                    const ttclid = urlParams.get('ttclid') || localStorage.getItem('ttclid') || '';
                    const fbclid = urlParams.get('fbclid') || localStorage.getItem('fbclid') || '';

                    // Track TikTok Pixel CompletePayment (full parameters)
                    if ((window as any).ttq) {
                        (window as any).ttq.track('CompletePayment', {
                            contents: [{
                                content_id: data.metadata?.productId,
                                content_type: 'product',
                                content_name: data.metadata?.productName,
                                content_category: 'Subscription',
                                price: parseFloat(data.metadata?.price || '0'),
                                num_items: 1,
                                brand: 'AlphaTV',
                            }],
                            value: parseFloat(data.metadata?.price || '0'),
                            currency: 'EUR',
                            description: 'Subscription purchase completed',
                            status: 'completed',
                        }, {
                            event_id: eventId
                        });
                    }

                    // Track Meta Pixel Purchase event (client-side with same event_id)
                    if ((window as any).fbq) {
                        (window as any).fbq('track', 'Purchase', {
                            content_ids: [data.metadata?.productId],
                            content_name: data.metadata?.productName,
                            currency: 'EUR',
                            value: parseFloat(data.metadata?.price || '0'),
                        }, { eventID: eventId }); // For deduplication
                    }

                    // SERVER-SIDE Conversions API (more reliable, same eventId)
                    fetch('/api/track-conversion', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            eventName: 'Purchase',
                            eventId: eventId, // Same ID for deduplication
                            email: data.customer_email,
                            phone: data.metadata?.customerPhone,
                            value: parseFloat(data.metadata?.price || '0'),
                            currency: 'EUR',
                            contentId: data.metadata?.productId,
                            contentName: data.metadata?.productName,
                            eventSourceUrl: window.location.href,
                            ttclid: ttclid, // TikTok Click ID for attribution
                            fbclid: fbclid, // Facebook Click ID for attribution
                        })
                    }).catch(err => console.error('Conversion tracking error:', err));
                } else {
                    setStatus('error');
                }
            })
            .catch(() => setStatus('error'));
    }, []);

    // Handle MAC address input with auto-format
    const handleMacChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatMacAddress(e.target.value);
        setDeviceInfo({ ...deviceInfo, macAddress: formatted });
    };

    // Handle PIN input (6 digits only)
    const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const pin = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
        setDeviceInfo({ ...deviceInfo, pinKey: pin });
    };

    // Move to device step
    const handleContinueToDevice = () => {
        setStep('device');
    };

    const handleDeviceSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!deviceInfo.macAddress || deviceInfo.pinKey.length !== 6) return;

        setIsSubmitting(true);

        // Track completed order to Google Sheets
        try {
            await fetch('/api/track-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'checkout_completed',
                    customerName: metadata?.customerName,
                    customerEmail: metadata?.customerEmail,
                    customerPhone: metadata?.customerPhone,
                    productId: metadata?.productId,
                    productName: metadata?.productName,
                    price: metadata?.price,
                    macAddress: deviceInfo.macAddress,
                    pinKey: deviceInfo.pinKey,
                    timestamp: new Date().toISOString(),
                    url: window.location.href,
                })
            });
        } catch (err) {
            console.log('Order tracking error:', err);
        }

        // Build WhatsApp message with all info
        const message = lang === 'fr'
            ? `🎬 NOUVELLE ACTIVATION ALPHATV

👤 Nom: ${metadata?.customerName}
📧 Email: ${metadata?.customerEmail}
📱 Tél: ${metadata?.customerPhone || 'N/A'}

📺 MAC: ${deviceInfo.macAddress}
🔑 PIN: ${deviceInfo.pinKey}

🎁 Produit: ${metadata?.productName}
💰 Prix: €${metadata?.price}`
            : `🎬 NEW ALPHATV ACTIVATION

👤 Name: ${metadata?.customerName}
📧 Email: ${metadata?.customerEmail}
📱 Phone: ${metadata?.customerPhone || 'N/A'}

📺 MAC: ${deviceInfo.macAddress}
🔑 PIN: ${deviceInfo.pinKey}

🎁 Product: ${metadata?.productName}
💰 Price: €${metadata?.price}`;

        // Open WhatsApp with the message (use direct navigation to avoid popup blocker)
        const whatsappUrl = `https://wa.me/33758928901?text=${encodeURIComponent(message)}`;

        // Update state first
        setStep('complete');
        setIsSubmitting(false);

        // Navigate to WhatsApp (won't be blocked like window.open)
        window.location.href = whatsappUrl;
    };

    if (status === 'loading') {
        return (
            <div className="success-loading">
                <div className="loading-spinner"></div>
                <p>{lang === 'fr' ? 'Vérification du paiement...' : 'Verifying payment...'}</p>

                <style>{`
                    .success-loading {
                        max-width: 480px;
                        margin: 0 auto;
                        text-align: center;
                        padding: 4rem 1rem;
                    }
                    
                    .loading-spinner {
                        width: 48px;
                        height: 48px;
                        border: 4px solid var(--color-primary);
                        border-top-color: transparent;
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                        margin: 0 auto 1rem;
                    }
                    
                    .success-loading p {
                        color: var(--color-text-muted);
                    }
                    
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="success-error">
                <div className="error-card">
                    <div className="error-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" /></svg>
                    </div>
                    <h1>{lang === 'fr' ? 'Paiement non complété' : 'Payment not completed'}</h1>
                    <p>
                        {lang === 'fr'
                            ? 'Votre paiement n\'a pas été finalisé. Veuillez réessayer.'
                            : 'Your payment was not completed. Please try again.'}
                    </p>
                    <a href="/pricing" className="error-btn">
                        {lang === 'fr' ? 'Retour aux forfaits' : 'Back to plans'}
                    </a>
                </div>

                <style>{`
                    .success-error {
                        max-width: 480px;
                        margin: 0 auto;
                    }
                    
                    .error-card {
                        background: var(--color-surface);
                        border: 1px solid var(--color-border);
                        border-radius: 20px;
                        padding: 2.5rem 1.5rem;
                        text-align: center;
                    }
                    
                    .error-icon {
                        width: 64px;
                        height: 64px;
                        border-radius: 50%;
                        background: rgba(239, 68, 68, 0.1);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin: 0 auto 1.5rem;
                        color: var(--color-error);
                    }
                    
                    .error-card h1 {
                        font-size: 1.5rem;
                        font-weight: 700;
                        margin-bottom: 0.75rem;
                    }
                    
                    .error-card p {
                        color: var(--color-text-muted);
                        margin-bottom: 1.5rem;
                    }
                    
                    .error-btn {
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        padding: 0.875rem 1.5rem;
                        font-size: 0.9375rem;
                        font-weight: 600;
                        color: white;
                        background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
                        border-radius: 12px;
                        text-decoration: none;
                        transition: all 0.2s ease;
                    }
                    
                    .error-btn:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 8px 25px rgba(139, 92, 246, 0.4);
                    }
                `}</style>
            </div>
        );
    }

    // Step Complete - Final confirmation
    if (step === 'complete') {
        return (
            <div className="success-content">
                <div className="success-card">
                    <div className="success-header complete">
                        <div className="success-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                        </div>
                        <h1>{lang === 'fr' ? '🎉 Activation en cours!' : '🎉 Activation in progress!'}</h1>
                        <p>
                            {lang === 'fr'
                                ? 'Votre demande a été envoyée. Vous serez activé sous 5-10 minutes.'
                                : 'Your request has been sent. You will be activated within 5-10 minutes.'}
                        </p>
                    </div>

                    <div className="success-body">
                        <div className="info-box">
                            <h3>📱 {lang === 'fr' ? 'Informations envoyées' : 'Information sent'}</h3>
                            <div className="info-grid">
                                <div className="info-item">
                                    <span className="info-label">{lang === 'fr' ? 'Adresse MAC' : 'MAC Address'}</span>
                                    <span className="info-value">{deviceInfo.macAddress}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">{lang === 'fr' ? 'Clé PIN' : 'PIN Key'}</span>
                                    <span className="info-value">{deviceInfo.pinKey}</span>
                                </div>
                            </div>
                        </div>

                        <div className="next-steps-final">
                            <p>
                                {lang === 'fr'
                                    ? '✅ Notre équipe va activer votre abonnement. Vous recevrez une confirmation sur WhatsApp.'
                                    : '✅ Our team will activate your subscription. You will receive confirmation on WhatsApp.'}
                            </p>
                        </div>

                        <a href="/" className="home-btn">
                            {lang === 'fr' ? 'Retour à l\'accueil' : 'Back to Home'}
                        </a>
                    </div>
                </div>

                <style>{successStyles}</style>
            </div>
        );
    }

    return (
        <div className="success-content">
            <div className="success-card">
                {/* Progress Steps */}
                <div className="progress-steps">
                    <div className={`progress-step ${step === 'thankyou' ? 'active' : ''} completed`}>
                        <div className="step-number">✓</div>
                        <span>{lang === 'fr' ? 'Paiement' : 'Payment'}</span>
                    </div>
                    <div className="progress-line"></div>
                    <div className={`progress-step ${step === 'device' ? 'active' : ''} ${step === 'complete' ? 'completed' : ''}`}>
                        <div className="step-number">{step === 'complete' ? '✓' : '2'}</div>
                        <span>{lang === 'fr' ? 'Appareil' : 'Device'}</span>
                    </div>
                    <div className="progress-line"></div>
                    <div className={`progress-step ${step === 'complete' ? 'active' : ''}`}>
                        <div className="step-number">3</div>
                        <span>{lang === 'fr' ? 'Activation' : 'Activation'}</span>
                    </div>
                </div>

                {/* Step 1: Thank You Page */}
                {step === 'thankyou' && (
                    <>
                        <div className="success-header">
                            <div className="success-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                            </div>
                            <h1>{lang === 'fr' ? '🎉 Merci pour votre achat!' : '🎉 Thank you for your purchase!'}</h1>
                            <p className="success-subtitle">
                                {lang === 'fr'
                                    ? 'Votre paiement a été confirmé avec succès'
                                    : 'Your payment has been confirmed successfully'}
                            </p>
                        </div>

                        <div className="success-body">
                            {/* Order Summary */}
                            {metadata && (
                                <div className="order-summary">
                                    <h3>{lang === 'fr' ? '📋 Récapitulatif' : '📋 Order Summary'}</h3>
                                    <div className="summary-row">
                                        <span>{lang === 'fr' ? 'Produit' : 'Product'}</span>
                                        <span className="summary-value">{metadata.productName}</span>
                                    </div>
                                    <div className="summary-row">
                                        <span>Email</span>
                                        <span className="summary-value">{customerEmail}</span>
                                    </div>
                                    <div className="summary-row highlight">
                                        <span>{lang === 'fr' ? 'Total payé' : 'Total Paid'}</span>
                                        <span className="summary-value price">€{metadata.price}</span>
                                    </div>
                                </div>
                            )}

                            <button onClick={handleContinueToDevice} className="submit-btn">
                                {lang === 'fr' ? 'Continuer → Entrer mes infos appareil' : 'Continue → Enter Device Info'}
                            </button>
                        </div>
                    </>
                )}

                {/* Step 2: Device Form */}
                {step === 'device' && (
                    <>
                        <div className="success-header compact">
                            <h2>📺 {lang === 'fr' ? 'Informations de l\'appareil' : 'Device Information'}</h2>
                            <p>{lang === 'fr' ? 'Entrez votre adresse MAC et code PIN' : 'Enter your MAC address and PIN code'}</p>
                        </div>

                        <div className="success-body">
                            <form onSubmit={handleDeviceSubmit} className="device-form">
                                <div className="form-group">
                                    <label htmlFor="macAddress">
                                        {lang === 'fr' ? 'Adresse MAC' : 'MAC Address'} *
                                    </label>
                                    <input
                                        id="macAddress"
                                        type="text"
                                        value={deviceInfo.macAddress}
                                        onChange={handleMacChange}
                                        placeholder="BC:12:34:56:78:90"
                                        maxLength={17}
                                        required
                                        className="mac-input"
                                    />
                                    <span className="input-hint">
                                        {lang === 'fr' ? 'Format auto: XX:XX:XX:XX:XX:XX' : 'Auto format: XX:XX:XX:XX:XX:XX'}
                                    </span>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="pinKey">
                                        {lang === 'fr' ? 'Code PIN (6 chiffres)' : 'PIN Code (6 digits)'} *
                                    </label>
                                    <input
                                        id="pinKey"
                                        type="text"
                                        inputMode="numeric"
                                        value={deviceInfo.pinKey}
                                        onChange={handlePinChange}
                                        placeholder="123456"
                                        maxLength={6}
                                        required
                                        className="pin-input"
                                    />
                                    <span className="input-hint">
                                        {lang === 'fr' ? 'Affiché dans Cap Player' : 'Shown in Cap Player app'}
                                    </span>
                                    <div className="pin-dots">
                                        {[0, 1, 2, 3, 4, 5].map(i => (
                                            <span key={i} className={`pin-dot ${deviceInfo.pinKey.length > i ? 'filled' : ''}`}></span>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting || deviceInfo.macAddress.length < 17 || deviceInfo.pinKey.length !== 6}
                                    className="submit-btn whatsapp-btn"
                                >
                                    {isSubmitting ? (
                                        <span className="btn-loading">
                                            <svg className="spinner" viewBox="0 0 24 24">
                                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25" />
                                                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" opacity="0.75" />
                                            </svg>
                                            {lang === 'fr' ? 'Envoi...' : 'Sending...'}
                                        </span>
                                    ) : (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                            </svg>
                                            {lang === 'fr' ? 'Envoyer via WhatsApp' : 'Send via WhatsApp'}
                                        </>
                                    )}
                                </button>
                            </form>

                            {/* Installation Guide - Expandable */}
                            <details className="install-guide" open>
                                <summary className="install-guide-toggle">
                                    <span>📲 {lang === 'fr' ? 'Guide d\'installation Cap Player' : 'Cap Player Installation Guide'}</span>
                                    <svg className="chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M6 9l6 6 6-6" />
                                    </svg>
                                </summary>
                                <div className="install-guide-content">
                                    {/* iOS / tvOS */}
                                    <div className="platform-section">
                                        <div className="platform-header">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.98-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                                            </svg>
                                            <h4>iOS / Apple TV</h4>
                                        </div>
                                        <ol className="platform-steps">
                                            <li>{lang === 'fr' ? 'Ouvrez l\'App Store' : 'Open the App Store'}</li>
                                            <li>{lang === 'fr' ? 'Recherchez "Cap Player"' : 'Search for "Cap Player"'}</li>
                                            <li>{lang === 'fr' ? 'Téléchargez et installez' : 'Download and install'}</li>
                                            <li>{lang === 'fr' ? 'Ouvrez l\'app' : 'Open the app'}</li>
                                            <li>{lang === 'fr' ? 'Notez votre MAC et PIN affichés' : 'Note your displayed MAC and PIN'}</li>
                                        </ol>
                                        <a href="https://apps.apple.com/us/app/cap-player/id6471679250" target="_blank" className="download-link">
                                            📥 {lang === 'fr' ? 'Télécharger' : 'Download'}
                                        </a>
                                    </div>

                                    {/* Android / Android TV */}
                                    <div className="platform-section">
                                        <div className="platform-header">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85-.29-.15-.65-.06-.83.22l-1.88 3.24a11.46 11.46 0 0 0-8.94 0L5.65 5.67c-.19-.28-.54-.37-.83-.22-.3.16-.42.54-.26.85l1.84 3.18C2.92 11.03 1 14.22 1 17.8h22c0-3.58-1.92-6.77-5.4-8.32zM8.06 15.2c-.66 0-1.2-.54-1.2-1.2 0-.66.54-1.2 1.2-1.2.66 0 1.2.54 1.2 1.2 0 .66-.54 1.2-1.2 1.2zm7.88 0c-.66 0-1.2-.54-1.2-1.2 0-.66.54-1.2 1.2-1.2.66 0 1.2.54 1.2 1.2 0 .66-.54 1.2-1.2 1.2z" />
                                            </svg>
                                            <h4>Android / Android TV</h4>
                                        </div>
                                        <ol className="platform-steps">
                                            <li>{lang === 'fr' ? 'Ouvrez le Play Store' : 'Open the Play Store'}</li>
                                            <li>{lang === 'fr' ? 'Recherchez "Cap Player"' : 'Search for "Cap Player"'}</li>
                                            <li>{lang === 'fr' ? 'Installer' : 'Install'}</li>
                                            <li>{lang === 'fr' ? 'Lancer l\'application' : 'Launch the app'}</li>
                                            <li>{lang === 'fr' ? 'Copiez votre MAC et PIN' : 'Copy your MAC and PIN'}</li>
                                        </ol>
                                        <a href="https://play.google.com/store/apps/details?id=tv.cap.player" target="_blank" className="download-link">
                                            📥 {lang === 'fr' ? 'Télécharger' : 'Download'}
                                        </a>
                                    </div>

                                    {/* Fire TV */}
                                    <div className="platform-section">
                                        <div className="platform-header">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V9h7V2.99c3.17.81 5.53 3.58 6 6.99h-6v3.01z" />
                                            </svg>
                                            <h4>Amazon Fire TV</h4>
                                        </div>
                                        <ol className="platform-steps">
                                            <li>{lang === 'fr' ? 'Allez dans "Find" > "Search"' : 'Go to "Find" > "Search"'}</li>
                                            <li>{lang === 'fr' ? 'Tapez "Cap Player" ou le code: 628699' : 'Type "Cap Player" or code: 628699'}</li>
                                            <li>{lang === 'fr' ? 'Télécharger et installer' : 'Download and install'}</li>
                                            <li>{lang === 'fr' ? 'Ouvrir l\'app' : 'Open the app'}</li>
                                            <li>{lang === 'fr' ? 'Relever le MAC et PIN' : 'Note the MAC and PIN'}</li>
                                        </ol>
                                        <div className="download-code">
                                            {lang === 'fr' ? 'Code de recherche:' : 'Search code:'} <strong>628699</strong>
                                        </div>
                                    </div>

                                    {/* Smart TV */}
                                    <div className="platform-section">
                                        <div className="platform-header">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <rect x="2" y="7" width="20" height="15" rx="2" ry="2" />
                                                <polyline points="17 2 12 7 7 2" />
                                            </svg>
                                            <h4>Smart TV (Samsung / LG / Hisense)</h4>
                                        </div>
                                        <ol className="platform-steps">
                                            <li>{lang === 'fr' ? 'Ouvrez votre App Store TV' : 'Open your TV App Store'}</li>
                                            <li>{lang === 'fr' ? 'Recherchez "Cap Player"' : 'Search "Cap Player"'}</li>
                                            <li>{lang === 'fr' ? 'Installer l\'application' : 'Install the application'}</li>
                                            <li>{lang === 'fr' ? 'Lancer' : 'Launch'}</li>
                                            <li>{lang === 'fr' ? 'Notez le MAC et PIN' : 'Note the MAC and PIN'}</li>
                                        </ol>
                                    </div>

                                    {/* Windows */}
                                    <div className="platform-section">
                                        <div className="platform-header">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801" />
                                            </svg>
                                            <h4>Windows PC</h4>
                                        </div>
                                        <ol className="platform-steps">
                                            <li>{lang === 'fr' ? 'Ouvrez le Microsoft Store' : 'Open Microsoft Store'}</li>
                                            <li>{lang === 'fr' ? 'Cherchez "Cap Player"' : 'Search "Cap Player"'}</li>
                                            <li>{lang === 'fr' ? 'Installer' : 'Install'}</li>
                                            <li>{lang === 'fr' ? 'Ouvrir l\'app' : 'Open the app'}</li>
                                            <li>{lang === 'fr' ? 'Copiez le MAC et PIN' : 'Copy the MAC and PIN'}</li>
                                        </ol>
                                        <a href="https://apps.microsoft.com/detail/9pncrbkbb90x" target="_blank" className="download-link">
                                            📥 {lang === 'fr' ? 'Télécharger' : 'Download'}
                                        </a>
                                    </div>
                                </div>
                            </details>

                            {/* Expandable Help Guide */}
                            <details className="help-guide">
                                <summary className="help-guide-toggle">
                                    <span>❓ {lang === 'fr' ? 'Comment trouver mon MAC / PIN ?' : 'How to find my MAC / PIN?'}</span>
                                    <svg className="chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M6 9l6 6 6-6" />
                                    </svg>
                                </summary>
                                <div className="help-guide-content">
                                    <div className="guide-step">
                                        <div className="guide-step-number">1</div>
                                        <div className="guide-step-text">
                                            <strong>{lang === 'fr' ? 'Ouvrez Cap Player' : 'Open Cap Player'}</strong>
                                            <p>{lang === 'fr' ? 'Lancez l\'application sur votre appareil' : 'Launch the app on your device'}</p>
                                        </div>
                                    </div>
                                    <div className="guide-step">
                                        <div className="guide-step-number">2</div>
                                        <div className="guide-step-text">
                                            <strong>{lang === 'fr' ? 'Écran de connexion' : 'Login Screen'}</strong>
                                            <p>{lang === 'fr' ? 'Votre MAC et PIN sont affichés' : 'Your MAC and PIN are displayed'}</p>
                                        </div>
                                    </div>
                                    <div className="guide-screenshot">
                                        <img src="/images/PHOTO-2025-12-14-13-47-55.jpg" alt="Cap Player MAC Address" />
                                    </div>
                                    <a href="/how-it-works" target="_blank" className="guide-link">
                                        📖 {lang === 'fr' ? 'Voir le guide complet' : 'View full guide'}
                                    </a>
                                </div>
                            </details>
                        </div>
                    </>
                )}

                {/* Step 3: Complete */}
                {step === 'complete' && (
                    <div className="success-header">
                        <div className="success-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                        </div>
                        <h1>{lang === 'fr' ? '✅ Demande envoyée!' : '✅ Request Sent!'}</h1>
                        <p>{lang === 'fr' ? 'Nous allons activer votre compte sous peu via WhatsApp' : 'We will activate your account shortly via WhatsApp'}</p>
                    </div>
                )}
            </div>

            <style>{successStyles}</style>
        </div>
    );
}

const successStyles = `
    .success-content {
        max-width: 520px;
        margin: 0 auto;
    }
    
    .success-card {
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: 20px;
        overflow: hidden;
    }

    /* Progress Steps */
    .progress-steps {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1.25rem;
        background: var(--color-surface-elevated);
        border-bottom: 1px solid var(--color-border);
    }

    .progress-step {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.375rem;
    }

    .step-number {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: var(--color-border);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--color-text-muted);
    }

    .progress-step.active .step-number {
        background: var(--color-primary);
        color: white;
    }

    .progress-step.completed .step-number {
        background: var(--color-success);
        color: white;
    }

    .progress-step span {
        font-size: 0.75rem;
        color: var(--color-text-muted);
    }

    .progress-step.active span {
        color: var(--color-primary);
        font-weight: 600;
    }

    .progress-line {
        flex: 1;
        height: 2px;
        background: var(--color-border);
        margin: 0 0.75rem;
        margin-bottom: 1.25rem;
    }
    
    .success-header {
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%);
        padding: 2rem 1.5rem;
        text-align: center;
    }
    
    .success-header.complete {
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%);
    }
    
    @media (min-width: 640px) {
        .success-header {
            padding: 2.5rem 2rem;
        }
    }
    
    .success-icon {
        width: 72px;
        height: 72px;
        border-radius: 50%;
        background: rgba(16, 185, 129, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 1.25rem;
        color: var(--color-success);
        animation: pulse 2s ease-in-out infinite;
    }
    
    @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.05); opacity: 0.9; }
    }
    
    .success-header h1 {
        font-size: 1.5rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
    }
    
    @media (min-width: 640px) {
        .success-header h1 {
            font-size: 1.75rem;
        }
    }
    
    .success-header p {
        color: var(--color-text-muted);
        font-size: 0.9375rem;
    }
    
    .success-body {
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
    }
    
    @media (min-width: 640px) {
        .success-body {
            padding: 2rem;
        }
    }

    /* Order Summary */
    .order-summary {
        background: var(--color-surface-elevated);
        border-radius: 12px;
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .summary-row {
        display: flex;
        justify-content: space-between;
        font-size: 0.875rem;
    }

    .summary-row span:first-child {
        color: var(--color-text-muted);
    }

    .summary-row span:last-child {
        font-weight: 500;
    }

    /* Device Form */
    .device-form {
        background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(236, 72, 153, 0.05) 100%);
        border: 1px solid rgba(139, 92, 246, 0.2);
        border-radius: 16px;
        padding: 1.25rem;
    }

    .device-form h3 {
        font-size: 1rem;
        font-weight: 600;
        margin-bottom: 1rem;
        text-align: center;
    }

    .form-group {
        margin-bottom: 1rem;
    }

    .form-group label {
        display: block;
        font-size: 0.8125rem;
        font-weight: 500;
        margin-bottom: 0.375rem;
    }

    .form-group input {
        width: 100%;
        padding: 0.875rem 1rem;
        font-size: 1rem;
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: 12px;
        color: var(--color-text);
        font-family: monospace;
        transition: all 0.2s ease;
    }

    .form-group input:focus {
        outline: none;
        border-color: var(--color-primary);
        box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.15);
    }

    .input-hint {
        display: block;
        font-size: 0.75rem;
        color: var(--color-text-subtle);
        margin-top: 0.375rem;
    }

    .submit-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        width: 100%;
        padding: 1rem;
        font-size: 1rem;
        font-weight: 700;
        color: white;
        background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
        border: none;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3);
    }

    .submit-btn:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
    }

    .submit-btn.whatsapp-btn {
        background: #25D366;
        box-shadow: 0 4px 15px rgba(37, 211, 102, 0.3);
    }

    .submit-btn.whatsapp-btn:hover:not(:disabled) {
        background: #20bd5a;
        box-shadow: 0 6px 20px rgba(37, 211, 102, 0.4);
    }

    .submit-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
    }

    .btn-loading {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .spinner {
        width: 20px;
        height: 20px;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    /* PIN Dots Visual */
    .pin-dots {
        display: flex;
        gap: 0.5rem;
        margin-top: 0.5rem;
    }

    .pin-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: var(--color-border);
        transition: all 0.2s ease;
    }

    .pin-dot.filled {
        background: var(--color-primary);
        box-shadow: 0 0 8px rgba(139, 92, 246, 0.5);
    }

    /* Summary Styling */
    .order-summary h3 {
        margin-bottom: 1rem;
        font-size: 1rem;
        font-weight: 600;
    }

    .summary-value {
        font-weight: 600;
        color: var(--color-text);
    }

    .summary-row.highlight {
        margin-top: 0.5rem;
        padding-top: 0.5rem;
        border-top: 1px solid var(--color-border);
    }

    .summary-value.price {
        font-size: 1.25rem;
        color: var(--color-primary);
    }

    /* Compact Header */
    .success-header.compact {
        padding: 1rem 0;
    }

    .success-header.compact h2 {
        font-size: 1.25rem;
        margin-bottom: 0.5rem;
    }

    /* MAC Input */
    .mac-input {
        font-family: 'JetBrains Mono', 'Fira Code', monospace;
        letter-spacing: 0.1em;
        text-transform: uppercase;
    }

    .pin-input {
        font-family: 'JetBrains Mono', 'Fira Code', monospace;
        letter-spacing: 0.3em;
        text-align: center;
        font-size: 1.5rem;
    }

    .success-subtitle {
        color: var(--color-text-muted);
        margin-top: 0.5rem;
    }

    .help-note {
        text-align: center;
        padding: 0.75rem;
        background: rgba(139, 92, 246, 0.05);
        border-radius: 10px;
    }

    .help-note p {
        font-size: 0.8125rem;
        color: var(--color-text-muted);
        margin: 0;
    }

    /* Complete Step */
    .info-box {
        background: var(--color-surface-elevated);
        border-radius: 14px;
        padding: 1.25rem;
    }

    .info-box h3 {
        font-size: 0.875rem;
        font-weight: 600;
        margin-bottom: 1rem;
        text-align: center;
    }

    .info-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
    }

    .info-item {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .info-label {
        font-size: 0.75rem;
        color: var(--color-text-subtle);
    }

    .info-value {
        font-size: 0.875rem;
        font-weight: 600;
        font-family: monospace;
    }

    .next-steps-final {
        text-align: center;
        padding: 1rem;
        background: rgba(16, 185, 129, 0.1);
        border-radius: 12px;
    }

    .next-steps-final p {
        font-size: 0.875rem;
        color: var(--color-text);
        margin: 0;
    }

    .home-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0.875rem;
        font-size: 0.9375rem;
        font-weight: 600;
        color: var(--color-text);
        background: var(--color-surface-elevated);
        border: 1px solid var(--color-border);
        border-radius: 12px;
        text-decoration: none;
        transition: all 0.2s ease;
    }

    .home-btn:hover {
        background: rgba(139, 92, 246, 0.1);
        border-color: var(--color-primary);
    }

    /* Installation Guide */
    .install-guide {
        margin-bottom: 1rem;
        border-radius: 12px;
        overflow: hidden;
    }

    .install-guide-toggle {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.875rem 1rem;
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
        border: 1px solid rgba(16, 185, 129, 0.2);
        border-radius: 12px;
        cursor: pointer;
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--color-success);
        list-style: none;
    }

    .install-guide-toggle::-webkit-details-marker {
        display: none;
    }

    .install-guide[open] .install-guide-toggle {
        border-radius: 12px 12px 0 0;
    }

    .install-guide .chevron {
        transition: transform 0.2s ease;
    }

    .install-guide[open] .chevron {
        transform: rotate(180deg);
    }

    .install-guide-content {
        padding: 1rem;
        background: var(--color-surface-elevated);
        border: 1px solid rgba(16, 185, 129, 0.2);
        border-top: none;
        border-radius: 0 0 12px 12px;
    }

    .platform-section {
        margin-bottom: 1rem;
        padding: 1rem;
        background: rgba(139, 92, 246, 0.05);
        border: 1px solid rgba(139, 92, 246, 0.1);
        border-radius: 10px;
    }

    .platform-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.75rem;
    }

    .platform-header svg {
        color: var(--color-primary);
    }

    .platform-header h4 {
        font-size: 0.875rem;
        font-weight: 600;
        margin: 0;
    }

    .platform-steps {
        margin: 0.75rem 0;
        padding-left: 1.25rem;
    }

    .platform-steps li {
        font-size: 0.8125rem;
        color: var(--color-text-muted);
        margin-bottom: 0.375rem;
    }

    .download-link {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
        padding: 0.5rem 0.875rem;
        background: var(--color-primary);
        color: white;
        text-decoration: none;
        border-radius: 8px;
        font-size: 0.75rem;
        font-weight: 600;
        transition: all 0.2s ease;
    }

    .download-link:hover {
        background: var(--color-primary-dark);
        transform: translateY(-1px);
    }

    .download-code {
        margin-top: 0.5rem;
        padding: 0.5rem;
        background: rgba(139, 92, 246, 0.1);
        border-radius: 6px;
        font-size: 0.8125rem;
        text-align: center;
    }

    .download-code strong {
        color: var(--color-primary);
        font-weight: 700;
        font-size: 1rem;
    }

    /* Expandable Help Guide */
    .help-guide {
        border-radius: 12px;
        overflow: hidden;
    }

    .help-guide-toggle {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.875rem 1rem;
        background: rgba(139, 92, 246, 0.1);
        border: 1px solid rgba(139, 92, 246, 0.2);
        border-radius: 12px;
        cursor: pointer;
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--color-primary);
        list-style: none;
    }

    .help-guide-toggle::-webkit-details-marker {
        display: none;
    }

    .help-guide[open] .help-guide-toggle {
        border-radius: 12px 12px 0 0;
    }

    .help-guide .chevron {
        transition: transform 0.2s ease;
    }

    .help-guide[open] .chevron {
        transform: rotate(180deg);
    }

    .help-guide-content {
        padding: 1rem;
        background: var(--color-surface-elevated);
        border: 1px solid rgba(139, 92, 246, 0.2);
        border-top: none;
        border-radius: 0 0 12px 12px;
    }

    .guide-step {
        display: flex;
        gap: 0.75rem;
        margin-bottom: 0.75rem;
    }

    .guide-step-number {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: var(--color-primary);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.75rem;
        font-weight: 700;
        flex-shrink: 0;
    }

    .guide-step-text strong {
        display: block;
        font-size: 0.8125rem;
        margin-bottom: 0.125rem;
    }

    .guide-step-text p {
        font-size: 0.75rem;
        color: var(--color-text-muted);
        margin: 0;
    }

    .guide-screenshot {
        margin: 1rem 0;
        border-radius: 10px;
        overflow: hidden;
        border: 2px solid var(--color-primary);
    }

    .guide-screenshot img {
        width: 100%;
        display: block;
    }

    .guide-link {
        display: block;
        text-align: center;
        padding: 0.625rem;
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--color-primary);
        text-decoration: none;
    }

    .guide-link:hover {
        text-decoration: underline;
    }
`;
