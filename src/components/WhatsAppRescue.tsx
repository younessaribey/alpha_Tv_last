import { useState, useEffect } from 'react';

interface WhatsAppRescueProps {
    lang: 'en' | 'fr';
    productName?: string;
}

export default function WhatsAppRescue({ lang, productName }: WhatsAppRescueProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [hasShown, setHasShown] = useState(false);

    useEffect(() => {
        // Don't show if already dismissed this session
        if (sessionStorage.getItem('whatsapp_rescue_dismissed')) {
            return;
        }

        let timeoutId: NodeJS.Timeout;
        let hasTriggered = false;

        // Exit intent detection (mouse leaves viewport from top)
        const handleMouseLeave = (e: MouseEvent) => {
            if (e.clientY <= 0 && !hasTriggered && !hasShown) {
                hasTriggered = true;
                setIsVisible(true);
                setHasShown(true);
            }
        };

        // Timer-based trigger (60 seconds)
        timeoutId = setTimeout(() => {
            if (!hasTriggered && !hasShown) {
                hasTriggered = true;
                setIsVisible(true);
                setHasShown(true);
            }
        }, 60000); // 60 seconds

        document.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            document.removeEventListener('mouseleave', handleMouseLeave);
            clearTimeout(timeoutId);
        };
    }, [hasShown]);

    const handleDismiss = () => {
        setIsVisible(false);
        sessionStorage.setItem('whatsapp_rescue_dismissed', 'true');
    };

    const handleWhatsApp = () => {
        const message = lang === 'fr'
            ? `Bonjour ! J'ai besoin d'aide pour finaliser mon essai gratuit 24h ${productName ? `(${productName})` : ''}`
            : `Hello! I need help completing my 24h free trial ${productName ? `(${productName})` : ''}`;

        const whatsappUrl = `https://wa.me/33612345678?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
        handleDismiss();
    };

    if (!isVisible) return null;

    return (
        <>
            {/* Backdrop */}
            <div className="rescue-backdrop" onClick={handleDismiss} />

            {/* Popup */}
            <div className="rescue-popup">
                <button className="rescue-close" onClick={handleDismiss}>×</button>

                <div className="rescue-icon">💬</div>

                <h3>
                    {lang === 'fr'
                        ? 'Besoin d\'aide ?'
                        : 'Need help?'}
                </h3>

                <p>
                    {lang === 'fr'
                        ? 'Un problème pour finaliser votre essai gratuit ? Notre équipe peut vous aider instantanément sur WhatsApp.'
                        : 'Having trouble completing your free trial? Our team can help you instantly on WhatsApp.'}
                </p>

                <div className="rescue-benefits">
                    <span>✅ {lang === 'fr' ? 'Réponse en 2 min' : 'Reply in 2 min'}</span>
                    <span>✅ {lang === 'fr' ? 'Aide gratuite' : 'Free help'}</span>
                </div>

                <button className="rescue-cta" onClick={handleWhatsApp}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    {lang === 'fr' ? 'Discuter sur WhatsApp' : 'Chat on WhatsApp'}
                </button>

                <button className="rescue-dismiss" onClick={handleDismiss}>
                    {lang === 'fr' ? 'Non merci, je continue' : 'No thanks, I\'ll continue'}
                </button>
            </div>

            <style>{`
                .rescue-backdrop {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.7);
                    backdrop-filter: blur(4px);
                    z-index: 9998;
                    animation: fadeIn 0.3s ease;
                }

                .rescue-popup {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: var(--color-surface, #1a1a2e);
                    border: 1px solid var(--color-border, #333);
                    border-radius: 20px;
                    padding: 2rem;
                    max-width: 400px;
                    width: 90%;
                    text-align: center;
                    z-index: 9999;
                    animation: popIn 0.3s ease;
                }

                .rescue-close {
                    position: absolute;
                    top: 1rem;
                    right: 1rem;
                    background: none;
                    border: none;
                    color: var(--color-text-muted, #888);
                    font-size: 1.5rem;
                    cursor: pointer;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: background 0.2s;
                }

                .rescue-close:hover {
                    background: rgba(255, 255, 255, 0.1);
                }

                .rescue-icon {
                    font-size: 3rem;
                    margin-bottom: 1rem;
                }

                .rescue-popup h3 {
                    font-size: 1.5rem;
                    font-weight: 700;
                    margin-bottom: 0.75rem;
                    color: var(--color-text, white);
                }

                .rescue-popup p {
                    color: var(--color-text-muted, #aaa);
                    font-size: 0.9375rem;
                    line-height: 1.5;
                    margin-bottom: 1rem;
                }

                .rescue-benefits {
                    display: flex;
                    justify-content: center;
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                }

                .rescue-benefits span {
                    font-size: 0.8125rem;
                    color: var(--color-success, #10b981);
                }

                .rescue-cta {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    width: 100%;
                    padding: 1rem;
                    background: #25D366;
                    color: white;
                    font-size: 1rem;
                    font-weight: 700;
                    border: none;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .rescue-cta:hover {
                    background: #20bd5a;
                    transform: translateY(-2px);
                }

                .rescue-dismiss {
                    background: none;
                    border: none;
                    color: var(--color-text-muted, #888);
                    font-size: 0.8125rem;
                    margin-top: 1rem;
                    cursor: pointer;
                    text-decoration: underline;
                }

                .rescue-dismiss:hover {
                    color: var(--color-text, white);
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes popIn {
                    from {
                        opacity: 0;
                        transform: translate(-50%, -50%) scale(0.9);
                    }
                    to {
                        opacity: 1;
                        transform: translate(-50%, -50%) scale(1);
                    }
                }
            `}</style>
        </>
    );
}
