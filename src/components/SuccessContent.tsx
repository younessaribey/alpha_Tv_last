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
    const [step, setStep] = useState<'thankyou' | 'device' | 'complete'>('thankyou');
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

                    // Track TikTok Pixel Purchase event (client-side with same event_id)
                    if ((window as any).ttq) {
                        (window as any).ttq.track('CompletePayment', {
                            content_id: data.metadata?.productId,
                            content_name: data.metadata?.productName,
                            currency: 'EUR',
                            value: parseFloat(data.metadata?.price || '0'),
                            event_id: eventId, // For deduplication
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

        // Open WhatsApp with the message
        const whatsappUrl = `https://wa.me/33612345678?text=${encodeURIComponent(message)}`;

        setTimeout(() => {
            setStep('complete');
            setIsSubmitting(false);
            window.open(whatsappUrl, '_blank');
        }, 500);
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
