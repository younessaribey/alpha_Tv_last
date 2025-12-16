import { useState, useCallback, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
    Elements,
    PaymentElement,
    useStripe,
    useElements,
    EmbeddedCheckoutProvider,
    EmbeddedCheckout
} from '@stripe/react-stripe-js';

// Load Stripe once outside component
const stripePromise = loadStripe(import.meta.env.PUBLIC_STRIPE_PUBLISHABLE_KEY);

interface CheckoutFormProps {
    productId: string;
    productName: string;
    price: number;
    lang: 'en' | 'fr';
}

// TikTok Pixel tracking helper
const trackTikTokEvent = (event: string, data?: Record<string, any>) => {
    if (typeof window !== 'undefined' && (window as any).ttq) {
        (window as any).ttq.track(event, data);
    }
};

// Stripe appearance with dark theme
const stripeAppearance = {
    theme: 'night' as const,
    variables: {
        colorPrimary: '#8b5cf6',
        colorBackground: '#0f0f17',
        colorText: '#ffffff',
        colorTextSecondary: '#a1a1aa',
        colorDanger: '#ef4444',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        borderRadius: '12px',
        spacingUnit: '4px',
    },
    rules: {
        '.Input': {
            backgroundColor: '#1a1a24',
            border: '1px solid #2a2a3e',
            boxShadow: 'none',
        },
        '.Input:focus': {
            border: '1px solid #8b5cf6',
            boxShadow: '0 0 0 3px rgba(139, 92, 246, 0.2)',
        },
        '.Label': {
            color: '#a1a1aa',
        },
        '.Tab': {
            backgroundColor: '#1a1a24',
            border: '1px solid #2a2a3e',
        },
        '.Tab--selected': {
            backgroundColor: '#8b5cf6',
            border: '1px solid #8b5cf6',
        },
        '.AccordionItem': {
            backgroundColor: '#1a1a24',
            border: '1px solid #2a2a3e',
            borderRadius: '12px',
            marginBottom: '8px',
        },
        '.AccordionItemHeader': {
            color: '#ffffff',
            padding: '16px',
        },
        '.AccordionItemBody': {
            padding: '0 16px 16px',
        },
    },
};

// Inner payment form component
function PaymentForm({ lang, onBack, customerName, customerEmail }: {
    lang: 'en' | 'fr';
    onBack: () => void;
    customerName: string;
    customerEmail: string;
}) {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Track when payment step is loaded
    useEffect(() => {
        trackTikTokEvent('AddPaymentInfo');
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) return;

        setIsProcessing(true);
        setError(null);

        const { error: submitError } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/checkout/success`,
            },
        });

        if (submitError) {
            setError(submitError.message || 'Payment failed');
            setIsProcessing(false);
        }
    };

    return (
        <div className="payment-form-container">
            {/* Progress Indicator */}
            <div className="checkout-progress">
                <div className="progress-step completed">
                    <div className="step-dot">✓</div>
                    <span>{lang === 'fr' ? 'Infos' : 'Info'}</span>
                </div>
                <div className="progress-line"></div>
                <div className="progress-step active">
                    <div className="step-dot">2</div>
                    <span>{lang === 'fr' ? 'Paiement' : 'Payment'}</span>
                </div>
            </div>

            {/* Back button */}
            <button onClick={onBack} className="back-btn" type="button">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg>
                {lang === 'fr' ? 'Modifier mes informations' : 'Edit my information'}
            </button>

            {/* Customer summary */}
            <div className="customer-info">
                <span className="customer-name">{customerName}</span>
                <span className="separator">•</span>
                <span className="customer-email">{customerEmail}</span>
            </div>

            <form onSubmit={handleSubmit} className="stripe-form">
                <PaymentElement
                    options={{
                        layout: {
                            type: 'accordion',
                            defaultCollapsed: false,
                            radios: true,
                            spacedAccordionItems: true,
                        },
                        wallets: {
                            applePay: 'auto',
                            googlePay: 'auto',
                        },
                        paymentMethodOrder: ['apple_pay', 'google_pay', 'card'],
                    }}
                />

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={!stripe || isProcessing}
                    className="pay-btn"
                >
                    {isProcessing ? (
                        <span className="btn-loading">
                            <svg className="spinner" viewBox="0 0 24 24">
                                <circle className="spinner-track" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="spinner-head" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            {lang === 'fr' ? 'Traitement...' : 'Processing...'}
                        </span>
                    ) : (
                        <span>{lang === 'fr' ? '💳 Payer maintenant' : '💳 Pay Now'}</span>
                    )}
                </button>

                {/* Reassurance Micro-copy */}
                <div className="reassurance">
                    <div className="reassurance-item">
                        <span>🔒</span>
                        <span>{lang === 'fr' ? 'Paiement 100% sécurisé' : '100% secure payment'}</span>
                    </div>
                    <div className="reassurance-item">
                        <span>✅</span>
                        <span>{lang === 'fr' ? 'Aucun frais caché' : 'No hidden fees'}</span>
                    </div>
                    <div className="reassurance-item">
                        <span>📧</span>
                        <span>{lang === 'fr' ? 'Confirmation par email' : 'Email confirmation'}</span>
                    </div>
                </div>
            </form>

            <style>{`
                .payment-form-container {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .back-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: none;
                    border: none;
                    color: var(--color-text-muted);
                    font-size: 0.875rem;
                    cursor: pointer;
                    padding: 0.5rem 0;
                    transition: color 0.2s ease;
                }

                .back-btn:hover {
                    color: var(--color-text);
                }

                .customer-info {
                    display: flex;
                    flex-wrap: wrap;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.875rem 1rem;
                    background: var(--color-surface);
                    border: 1px solid var(--color-border);
                    border-radius: 12px;
                    font-size: 0.875rem;
                }

                .customer-name {
                    font-weight: 600;
                    color: var(--color-text);
                }

                .separator {
                    color: var(--color-text-subtle);
                }

                .customer-email {
                    color: var(--color-text-muted);
                }

                .stripe-form {
                    display: flex;
                    flex-direction: column;
                    gap: 1.25rem;
                    background: #0f0f17;
                    border: 1px solid var(--color-border);
                    border-radius: 16px;
                    padding: 1.25rem;
                }

                .error-message {
                    padding: 0.75rem 1rem;
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.2);
                    border-radius: 10px;
                    color: #ef4444;
                    font-size: 0.875rem;
                }

                .pay-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 100%;
                    padding: 1rem;
                    font-size: 1rem;
                    font-weight: 700;
                    color: white;
                    background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
                    border: none;
                    border-radius: 12px;
                    cursor: pointer;
                    min-height: 52px;
                    transition: all 0.2s ease;
                    box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);
                }

                .pay-btn:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(139, 92, 246, 0.5);
                }

                .pay-btn:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
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

                .spinner-track {
                    opacity: 0.25;
                }

                .spinner-head {
                    opacity: 0.75;
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                /* Progress Indicator */
                .checkout-progress {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    padding: 0.75rem;
                    background: var(--color-surface);
                    border: 1px solid var(--color-border);
                    border-radius: 12px;
                }

                .progress-step {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .step-dot {
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.75rem;
                    font-weight: 700;
                    background: var(--color-border);
                    color: var(--color-text-muted);
                }

                .progress-step.completed .step-dot {
                    background: var(--color-success);
                    color: white;
                }

                .progress-step.active .step-dot {
                    background: var(--color-primary);
                    color: white;
                }

                .progress-step span {
                    font-size: 0.8125rem;
                    font-weight: 500;
                    color: var(--color-text-muted);
                }

                .progress-step.active span {
                    color: var(--color-primary);
                    font-weight: 600;
                }

                .progress-line {
                    width: 40px;
                    height: 2px;
                    background: var(--color-border);
                }

                /* Reassurance */
                .reassurance {
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: center;
                    gap: 0.75rem;
                    padding-top: 0.5rem;
                }

                .reassurance-item {
                    display: flex;
                    align-items: center;
                    gap: 0.375rem;
                    font-size: 0.75rem;
                    color: var(--color-text-muted);
                }
            `}</style>
        </div>
    );
}

export default function CheckoutForm({ productId, productName, price, lang }: CheckoutFormProps) {
    const [step, setStep] = useState<'form' | 'checkout'>('form');
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [checkoutMode, setCheckoutMode] = useState<'payment' | 'subscription'>('payment');
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
    });
    const [hasStartedForm, setHasStartedForm] = useState(false);

    // Track form abandonment when user leaves
    useEffect(() => {
        const trackAbandonment = () => {
            // Only track if form was started (has any data)
            if (hasStartedForm && step === 'form') {
                fetch('/api/track-checkout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'form_abandoned',
                        customerName: formData.name || undefined,
                        customerEmail: formData.email || undefined,
                        customerPhone: formData.phone || undefined,
                        productId,
                        productName,
                        price,
                        url: window.location.href,
                        timestamp: new Date().toISOString(),
                    })
                }).catch(err => console.log('Abandonment tracking error:', err));
            }
        };

        // Track on page unload
        window.addEventListener('beforeunload', trackAbandonment);

        return () => {
            window.removeEventListener('beforeunload', trackAbandonment);
        };
    }, [hasStartedForm, formData, step, productId, productName, price]);

    // Detect when form is started
    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (!hasStartedForm && value.length > 0) {
            setHasStartedForm(true);
            // Track form start
            fetch('/api/track-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'form_started',
                    productId,
                    productName,
                    price,
                    url: window.location.href,
                    timestamp: new Date().toISOString(),
                })
            }).catch(err => console.log('Form start tracking error:', err));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.email || !formData.phone) return;

        setIsLoading(true);

        // Track AddPaymentInfo event
        trackTikTokEvent('AddPaymentInfo', {
            content_id: productId,
            content_name: productName,
            currency: 'EUR',
            value: price
        });

        // Create checkout session (supports subscription with trial)
        try {
            const response = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId,
                    productName,
                    price,
                    customerName: formData.name,
                    customerEmail: formData.email,
                    customerPhone: formData.phone,
                    useSubscription: productId === '12months-1device', // Enable trial for 12 month plan
                }),
            });
            const data = await response.json();

            if (data.clientSecret) {
                setClientSecret(data.clientSecret);
                setCheckoutMode(data.mode || 'payment');
                setStep('checkout');
            }
        } catch (err) {
            console.error('Error creating checkout session:', err);
        }

        setIsLoading(false);
    };

    // Subscription mode - use EmbeddedCheckout (shows trial info nicely)
    if (step === 'checkout' && clientSecret && checkoutMode === 'subscription') {
        return (
            <div className="checkout-form-card embedded-mode">
                <div className="checkout-progress-simple">
                    <span className="step-label active">{lang === 'fr' ? 'Étape 2/2 : Paiement sécurisé' : 'Step 2/2: Secure Payment'}</span>
                </div>
                <div className="embedded-checkout-container">
                    <EmbeddedCheckoutProvider
                        stripe={stripePromise}
                        options={{ clientSecret }}
                    >
                        <EmbeddedCheckout />
                    </EmbeddedCheckoutProvider>
                </div>
                <style>{`
                    .checkout-form-card.embedded-mode {
                        padding: 0;
                        overflow: hidden;
                    }
                    
                    .embedded-mode .checkout-progress-simple {
                        padding: 1rem;
                        background: var(--color-surface);
                        border-bottom: 1px solid var(--color-border);
                    }
                    
                    .embedded-checkout-container {
                        min-height: 500px;
                        width: 100%;
                    }
                    
                    .embedded-checkout-container iframe {
                        width: 100% !important;
                        min-height: 500px !important;
                    }
                    
                    @media (max-width: 640px) {
                        .embedded-checkout-container {
                            min-height: 600px;
                        }
                    }
                `}</style>
            </div>
        );
    }

    // Payment mode - use Elements + PaymentForm
    if (step === 'checkout' && clientSecret && checkoutMode === 'payment') {
        return (
            <Elements
                stripe={stripePromise}
                options={{
                    clientSecret,
                    appearance: stripeAppearance,
                }}
            >
                <PaymentForm
                    lang={lang}
                    onBack={() => setStep('form')}
                    customerName={formData.name}
                    customerEmail={formData.email}
                />
            </Elements>
        );
    }

    return (
        <div className="checkout-form-card">
            {/* Free Trial Banner */}
            <div className="free-trial-banner">
                <div className="trial-icon-wrapper">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" /><path d="m9 12 2 2 4-4" /></svg>
                </div>
                <div className="trial-text">
                    <span className="trial-highlight">
                        {lang === 'fr' ? '🎁 Commencez GRATUITEMENT' : '🎁 Start FREE'}
                    </span>
                    <span className="trial-desc">
                        {lang === 'fr' ? '24h d\'essai sans engagement' : '24h trial, no commitment'}
                    </span>
                </div>
            </div>

            <div className="checkout-form-inner">
                {/* Progress Indicator Step 1 */}
                <div className="checkout-progress-simple">
                    <span className="step-label active">{lang === 'fr' ? 'Étape 1/2 : Vos informations' : 'Step 1/2: Your Information'}</span>
                </div>

                <form onSubmit={handleSubmit} className="checkout-form">
                    <div className="form-group">
                        <label htmlFor="name">
                            {lang === 'fr' ? 'Nom complet' : 'Full Name'} *
                        </label>
                        <input
                            id="name"
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            placeholder={lang === 'fr' ? 'Votre nom' : 'Your name'}
                            required
                            autoComplete="name"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email *</label>
                        <input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            placeholder="email@example.com"
                            required
                            autoComplete="email"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="phone">
                            {lang === 'fr' ? 'Téléphone' : 'Phone'} *
                        </label>
                        <input
                            id="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            placeholder="+33 6 12 34 56 78"
                            required
                            autoComplete="tel"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="submit-btn"
                    >
                        {isLoading ? (
                            <span className="btn-loading">
                                <svg className="spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="spinner-track" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="spinner-head" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                {lang === 'fr' ? 'Chargement...' : 'Loading...'}
                            </span>
                        ) : (
                            <span className="btn-content">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" /><path d="m9 12 2 2 4-4" /></svg>
                                {lang === 'fr' ? 'Commencer Gratuitement' : 'Start Free Trial'}
                            </span>
                        )}
                    </button>

                    <div className="payment-methods">
                        <span className="secure-badge">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                            {lang === 'fr' ? 'Paiement 100% sécurisé' : '100% Secure Payment'}
                        </span>
                        <div className="payment-icons">
                            <img src="/logos/visa.png" alt="Visa" className="payment-badge-img" />
                            <img src="/logos/mastercard.png" alt="Mastercard" className="payment-badge-img" />
                            <img src="/logos/apple-pay.png" alt="Apple Pay" className="payment-badge-img" />
                            <img src="/logos/google-pay.png" alt="Google Pay" className="payment-badge-img" />
                            <img src="/logos/stripe.png" alt="Stripe" className="payment-badge-img" />
                        </div>
                    </div>
                </form>
            </div>

            <style>{`
                .checkout-form-card {
                    background: var(--color-surface);
                    border: 1px solid var(--color-border);
                    border-radius: 20px;
                    overflow: hidden;
                }

                .free-trial-banner {
                    display: flex;
                    align-items: center;
                    gap: 0.875rem;
                    padding: 1rem 1.25rem;
                    background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%);
                    border-bottom: 1px solid rgba(16, 185, 129, 0.2);
                }

                .trial-icon-wrapper {
                    width: 44px;
                    height: 44px;
                    border-radius: 50%;
                    background: rgba(16, 185, 129, 0.2);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    color: #10b981;
                }

                .trial-text {
                    display: flex;
                    flex-direction: column;
                    gap: 0.125rem;
                }

                .trial-highlight {
                    font-size: 1rem;
                    font-weight: 700;
                    color: #10b981;
                }

                .trial-desc {
                    font-size: 0.8125rem;
                    color: var(--color-text-muted);
                }

                .checkout-form-inner {
                    padding: 1.25rem;
                }

                @media (min-width: 640px) {
                    .checkout-form-inner {
                        padding: 1.5rem;
                    }
                }

                .form-title {
                    font-size: 1.125rem;
                    font-weight: 700;
                    margin-bottom: 1.25rem;
                }

                .checkout-form {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.375rem;
                }

                .form-group label {
                    font-size: 0.8125rem;
                    font-weight: 500;
                    color: var(--color-text);
                }

                .form-group input {
                    width: 100%;
                    padding: 0.875rem 1rem;
                    font-size: 1rem;
                    background: var(--color-surface-elevated);
                    border: 1px solid var(--color-border);
                    border-radius: 12px;
                    color: var(--color-text);
                    transition: all 0.2s ease;
                    min-height: 48px;
                }

                .form-group input:focus {
                    outline: none;
                    border-color: var(--color-primary);
                    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.15);
                }

                .form-group input::placeholder {
                    color: var(--color-text-subtle);
                }

                .submit-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 100%;
                    padding: 1rem 1.5rem;
                    font-size: 1rem;
                    font-weight: 700;
                    color: white;
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    border: none;
                    border-radius: 14px;
                    cursor: pointer;
                    min-height: 56px;
                    transition: all 0.25s ease;
                    box-shadow: 0 4px 20px rgba(16, 185, 129, 0.4);
                    margin-top: 0.5rem;
                }

                .submit-btn:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 30px rgba(16, 185, 129, 0.5);
                }

                .submit-btn:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }

                .btn-content,
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

                .spinner-track {
                    opacity: 0.25;
                }

                .spinner-head {
                    opacity: 0.75;
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                .payment-methods {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.5rem;
                    padding-top: 0.75rem;
                }

                .payment-methods .secure-badge {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: #10b981;
                    background: rgba(16, 185, 129, 0.1);
                    padding: 0.5rem 1rem;
                    border-radius: 20px;
                    margin-bottom: 0.75rem;
                }

                .payment-icons {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.75rem;
                    flex-wrap: wrap;
                }

                .payment-badge-img {
                    height: 42px;
                    width: auto;
                    max-width: 120px;
                    object-fit: contain;
                    border-radius: 6px;
                    transition: transform 0.2s ease, opacity 0.2s ease;
                    opacity: 0.9;
                }

                .payment-badge-img:hover {
                    transform: translateY(-2px);
                    opacity: 1;
                }

                .checkout-progress-simple {
                    text-align: center;
                    margin-bottom: 1rem;
                }

                .step-label {
                    font-size: 0.8125rem;
                    font-weight: 600;
                    color: var(--color-text-muted);
                }

                .step-label.active {
                    color: var(--color-primary);
                }
            `}</style>
        </div>
    );
}
