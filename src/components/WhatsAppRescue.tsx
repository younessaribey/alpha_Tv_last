import { useState, useEffect } from 'react';

interface WhatsAppRescueProps {
    lang: 'en' | 'fr';
    productName?: string;
    isCheckoutPage?: boolean;  // Set to true on checkout pages
}

// WhatsApp number (change before campaign)
const WHATSAPP_NUMBER = '447861393211';

export default function WhatsAppRescue({ lang, productName, isCheckoutPage = false }: WhatsAppRescueProps) {
    const [showNotification, setShowNotification] = useState(false); // Notification popup + badge

    useEffect(() => {
        // If on checkout page, mark that user visited checkout
        if (isCheckoutPage) {
            sessionStorage.setItem('visited_checkout', 'true');
            sessionStorage.setItem('checkout_product', productName || '');
        }

        // Don't show notification if already dismissed this session
        if (sessionStorage.getItem('whatsapp_rescue_dismissed')) {
            return;
        }

        let timeoutId: NodeJS.Timeout;
        let hasTriggered = false;

        const triggerNotification = (reason: string) => {
            if (hasTriggered) return;
            hasTriggered = true;
            setShowNotification(true); // Show notification popup
        };

        // Check if user came BACK from checkout to this page
        const visitedCheckout = sessionStorage.getItem('visited_checkout');

        if (!isCheckoutPage && visitedCheckout) {
            // User left checkout and came to another page - show notification immediately!
            triggerNotification('User returned from checkout page');
            // Clear the flag so it doesn't trigger again on next page
            sessionStorage.removeItem('visited_checkout');
            return;
        }

        // Only apply these triggers on checkout page
        if (isCheckoutPage) {
            let lastScrollY = 0;
            let scrollTimeout: NodeJS.Timeout;

            // Handle back button from browser cache (BFCache)
            const handlePageShow = (event: PageTransitionEvent) => {
                // If page loaded from cache (back button on mobile)
                if (event.persisted) {
                    triggerNotification('Back from cache');
                }
            };

            // 1. Mobile: Scroll to top detection (exit intent on mobile)
            const handleScroll = () => {
                const currentScrollY = window.scrollY;

                // Rapid scroll to top = exit intent on mobile
                if (currentScrollY < 50 && lastScrollY > 100) {
                    triggerNotification('Mobile exit intent - scroll to top');
                }

                lastScrollY = currentScrollY;

                // Reset scroll timeout (user is active)
                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(() => {
                    // User stopped scrolling for 5s - show notification
                    if (currentScrollY > 200) {
                        triggerNotification('User inactive while scrolling');
                    }
                }, 5000);
            };

            // 2. Visibility change (user switches tab/app)
            const handleVisibilityChange = () => {
                if (document.hidden) {
                    // User left the page/tab
                    triggerNotification('Tab/app switched');
                }
            };

            // 3. Back button detection (works on mobile)
            const handlePopState = () => {
                triggerNotification('Back button pressed');
            };

            // 4. Desktop: Exit intent (mouse leaves viewport from top)
            const handleMouseLeave = (e: MouseEvent) => {
                if (e.clientY <= 0) {
                    triggerNotification('Desktop exit intent');
                }
            };

            // 5. Timer-based trigger (30 seconds, works on all devices)
            timeoutId = setTimeout(() => {
                triggerNotification('Timer');
            }, 30000); // 30 seconds

            // Register all event listeners
            window.addEventListener('pageshow', handlePageShow); // Back button from cache
            window.addEventListener('scroll', handleScroll, { passive: true });
            document.addEventListener('visibilitychange', handleVisibilityChange);
            window.addEventListener('popstate', handlePopState);
            document.addEventListener('mouseleave', handleMouseLeave); // Desktop only

            // Push a state so back button works
            window.history.pushState({ whatsapp: true }, '');

            return () => {
                window.removeEventListener('pageshow', handlePageShow);
                window.removeEventListener('scroll', handleScroll);
                document.removeEventListener('visibilitychange', handleVisibilityChange);
                window.removeEventListener('popstate', handlePopState);
                document.removeEventListener('mouseleave', handleMouseLeave);
                clearTimeout(timeoutId);
                clearTimeout(scrollTimeout);
            };
        }
    }, [isCheckoutPage, productName]);

    // Track notification impression when it becomes visible
    useEffect(() => {
        if (!showNotification) return;

        // Track to Google Sheets
        fetch('/api/track-checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'whatsapp_impression',
                customerName: '',
                customerEmail: '',
                customerPhone: '',
                productId: '',
                productName: productName || '',
                price: 0,
                url: window.location.href,
                timestamp: new Date().toISOString(),
                leadId: sessionStorage.getItem('leadId') || '',
            }),
        }).catch(err => console.error('WhatsApp tracking error:', err));

        // Track TikTok ViewContent for popup shown
        if ((window as any).ttq) {
            (window as any).ttq.track('ViewContent', {
                content_name: 'WhatsApp Rescue Popup',
                content_type: 'popup',
                description: 'Checkout rescue popup displayed',
            });
        }

        // Track Meta Pixel
        if ((window as any).fbq) {
            (window as any).fbq('trackCustom', 'WhatsAppPopupShown', {
                product_name: productName,
            });
        }
    }, [showNotification, productName]);

    const handleWhatsApp = () => {
        console.log('[WhatsApp] Button clicked - opening WhatsApp');

        const checkoutProduct = sessionStorage.getItem('checkout_product') || productName;
        const message = lang === 'fr'
            ? `Bonjour ! J'ai besoin d'aide pour finaliser mon essai gratuit 24h ${checkoutProduct ? `(${checkoutProduct})` : ''}`
            : `Hello! I need help completing my 24h free trial ${checkoutProduct ? `(${checkoutProduct})` : ''}`;

        const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

        // Track WhatsApp click for analytics
        if ((window as any).ttq) {
            (window as any).ttq.track('Contact', {
                content_name: 'WhatsApp Rescue',
                content_id: 'whatsapp_checkout_rescue'
            });
        }
        if ((window as any).fbq) {
            (window as any).fbq('track', 'Contact', {
                content_name: 'WhatsApp Rescue Clicked',
            });
        }

        // Track to Google Sheets
        fetch('/api/track-whatsapp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                product: checkoutProduct,
                timestamp: new Date().toISOString(),
                url: window.location.href,
            }),
        }).catch(err => console.error('WhatsApp click tracking error:', err));

        window.open(whatsappUrl, '_blank');
        setShowNotification(false); // Hide notification after click
        sessionStorage.setItem('whatsapp_rescue_dismissed', 'true');
        sessionStorage.removeItem('visited_checkout');
        sessionStorage.removeItem('checkout_product');
    };

    const dismissNotification = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowNotification(false);
    };

    return (
        <>
            {/* Notification Bubble - Shows based on triggers */}
            {showNotification && (
                <div className="whatsapp-message-bubble" onClick={handleWhatsApp}>
                    <button className="message-close" onClick={dismissNotification}>×</button>
                    <div className="message-header">
                        <span className="message-name">AlphaTV Support</span>
                        <span className="message-time">
                            {lang === 'fr' ? 'En ligne' : 'Online'}
                        </span>
                    </div>
                    <div className="message-text">
                        {lang === 'fr'
                            ? '👋 Notre équipe est là pour vous aider ! N\'hésitez pas à nous contacter.'
                            : '👋 Our team is here to assist you! Feel free to reach out.'}
                    </div>
                </div>
            )}

            {/* WhatsApp Icon - Always visible */}
            <div className="whatsapp-rescue-float" onClick={handleWhatsApp}>
                {/* WhatsApp Icon */}
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="white">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>

                {/* Red Badge - Only shows when notification is triggered */}
                {showNotification && (
                    <span className="rescue-badge">1</span>
                )}

                {/* Tooltip (shows on hover) */}
                {!showNotification && (
                    <span className="rescue-tooltip">
                        {lang === 'fr' ? 'Besoin d\'aide ?' : 'Need help?'}
                    </span>
                )}
            </div>

            <style>{`
                .whatsapp-message-bubble {
                    position: fixed;
                    bottom: 170px;
                    right: 20px;
                    width: 280px;
                    background: white;
                    border-radius: 16px;
                    padding: 16px;
                    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
                    z-index: 9999;
                    cursor: pointer;
                    animation: slideIn 0.4s ease;
                }

                .message-close {
                    position: absolute;
                    top: 8px;
                    right: 12px;
                    background: none;
                    border: none;
                    font-size: 20px;
                    color: #999;
                    cursor: pointer;
                    padding: 0;
                    line-height: 1;
                }

                .message-close:hover {
                    color: #666;
                }

                .message-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                }

                .message-name {
                    font-weight: 600;
                    color: #075e54;
                    font-size: 14px;
                }

                .message-time {
                    font-size: 11px;
                    color: #25D366;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                .message-time::before {
                    content: '';
                    width: 8px;
                    height: 8px;
                    background: #25D366;
                    border-radius: 50%;
                }

                .message-text {
                    color: #333;
                    font-size: 14px;
                    line-height: 1.4;
                }

                .whatsapp-message-bubble::after {
                    content: '';
                    position: absolute;
                    bottom: -10px;
                    right: 30px;
                    border: 10px solid transparent;
                    border-top-color: white;
                    border-bottom: 0;
                }

                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateY(20px) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }

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
                    .whatsapp-message-bubble {
                        right: 12px;
                        left: 12px;
                        width: auto;
                        bottom: 150px;
                    }

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
