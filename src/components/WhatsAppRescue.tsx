import { useState, useEffect } from 'react';

interface WhatsAppRescueProps {
    lang: 'en' | 'fr';
    productName?: string;
}

export default function WhatsAppRescue({ lang, productName }: WhatsAppRescueProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [showBadge, setShowBadge] = useState(false);

    useEffect(() => {
        // Don't show if already dismissed this session
        if (sessionStorage.getItem('whatsapp_rescue_dismissed')) {
            return;
        }

        let timeoutId: NodeJS.Timeout;
        let hasTriggered = false;

        // Exit intent detection (mouse leaves viewport from top)
        const handleMouseLeave = (e: MouseEvent) => {
            if (e.clientY <= 0 && !hasTriggered) {
                hasTriggered = true;
                setIsVisible(true);
                setShowBadge(true);
            }
        };

        // Timer-based trigger (60 seconds)
        timeoutId = setTimeout(() => {
            if (!hasTriggered) {
                hasTriggered = true;
                setIsVisible(true);
                setShowBadge(true);
            }
        }, 60000); // 60 seconds

        document.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            document.removeEventListener('mouseleave', handleMouseLeave);
            clearTimeout(timeoutId);
        };
    }, []);

    const handleWhatsApp = () => {
        const message = lang === 'fr'
            ? `Bonjour ! J'ai besoin d'aide pour finaliser mon essai gratuit 24h ${productName ? `(${productName})` : ''}`
            : `Hello! I need help completing my 24h free trial ${productName ? `(${productName})` : ''}`;

        const whatsappUrl = `https://wa.me/33612345678?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
        setShowBadge(false);
        sessionStorage.setItem('whatsapp_rescue_dismissed', 'true');
    };

    if (!isVisible) return null;

    return (
        <>
            <div className="whatsapp-rescue-float" onClick={handleWhatsApp}>
                {/* WhatsApp Icon */}
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="white">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>

                {/* Red Badge */}
                {showBadge && (
                    <span className="rescue-badge">1</span>
                )}

                {/* Tooltip */}
                <span className="rescue-tooltip">
                    {lang === 'fr' ? 'Besoin d\'aide ?' : 'Need help?'}
                </span>
            </div>

            <style>{`
                .whatsapp-rescue-float {
                    position: fixed;
                    bottom: 100px;
                    right: 20px;
                    width: 56px;
                    height: 56px;
                    background: #25D366;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    box-shadow: 0 4px 20px rgba(37, 211, 102, 0.4);
                    z-index: 9999;
                    transition: all 0.3s ease;
                    animation: bounceIn 0.5s ease;
                }

                .whatsapp-rescue-float:hover {
                    transform: scale(1.1);
                    box-shadow: 0 6px 25px rgba(37, 211, 102, 0.5);
                }

                .whatsapp-rescue-float:hover .rescue-tooltip {
                    opacity: 1;
                    transform: translateX(-10px);
                }

                .rescue-badge {
                    position: absolute;
                    top: -4px;
                    right: -4px;
                    width: 22px;
                    height: 22px;
                    background: #ef4444;
                    color: white;
                    font-size: 12px;
                    font-weight: 700;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 2px solid var(--color-background, #030014);
                    animation: pulse 2s infinite;
                }

                .rescue-tooltip {
                    position: absolute;
                    right: 100%;
                    top: 50%;
                    transform: translateY(-50%);
                    background: var(--color-surface, #1a1a2e);
                    color: white;
                    padding: 0.5rem 1rem;
                    border-radius: 8px;
                    font-size: 0.875rem;
                    font-weight: 500;
                    white-space: nowrap;
                    opacity: 0;
                    transition: all 0.3s ease;
                    pointer-events: none;
                    margin-right: 12px;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
                }

                .rescue-tooltip::after {
                    content: '';
                    position: absolute;
                    right: -6px;
                    top: 50%;
                    transform: translateY(-50%);
                    border: 6px solid transparent;
                    border-left-color: var(--color-surface, #1a1a2e);
                }

                @keyframes bounceIn {
                    0% {
                        opacity: 0;
                        transform: scale(0.5);
                    }
                    50% {
                        transform: scale(1.1);
                    }
                    100% {
                        opacity: 1;
                        transform: scale(1);
                    }
                }

                @keyframes pulse {
                    0%, 100% {
                        transform: scale(1);
                    }
                    50% {
                        transform: scale(1.1);
                    }
                }

                @media (max-width: 640px) {
                    .whatsapp-rescue-float {
                        bottom: 80px;
                        right: 16px;
                        width: 52px;
                        height: 52px;
                    }
                    
                    .rescue-tooltip {
                        display: none;
                    }
                }
            `}</style>
        </>
    );
}
