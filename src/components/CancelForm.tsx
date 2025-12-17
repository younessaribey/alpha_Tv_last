import { useState, useEffect } from 'react';

interface CancelFormProps {
    lang: 'en' | 'fr';
}

export default function CancelForm({ lang }: CancelFormProps) {
    const [step, setStep] = useState<'request' | 'verify' | 'confirm' | 'success'>('request');
    const [email, setEmail] = useState('');
    const [reason, setReason] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Check for token in URL
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        const emailParam = params.get('email');

        if (token && emailParam) {
            setEmail(emailParam);
            setStep('confirm');
        }
    }, []);

    const handleRequestLink = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('/api/cancel/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                setStep('verify');
            } else {
                setError(data.error || (lang === 'fr' ? 'Une erreur est survenue' : 'An error occurred'));
            }
        } catch {
            setError(lang === 'fr' ? 'Une erreur est survenue' : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmCancel = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');

        try {
            const response = await fetch('/api/cancel/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, email, reason }),
            });

            const data = await response.json();

            if (response.ok) {
                setStep('success');
            } else {
                setError(data.error || (lang === 'fr' ? 'Une erreur est survenue' : 'An error occurred'));
            }
        } catch {
            setError(lang === 'fr' ? 'Une erreur est survenue' : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    // Step 1: Request
    if (step === 'request') {
        return (
            <div className="card p-8">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 mx-auto bg-orange-500/20 rounded-full flex items-center justify-center mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" /></svg>
                    </div>
                    <h1 className="text-2xl font-bold mb-2">
                        {lang === 'fr' ? 'Annuler mon abonnement' : 'Cancel my subscription'}
                    </h1>
                    <p className="text-[var(--color-text-muted)]">
                        {lang === 'fr'
                            ? 'Entrez votre email pour recevoir un lien de confirmation'
                            : 'Enter your email to receive a confirmation link'}
                    </p>
                </div>

                <form onSubmit={handleRequestLink} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium mb-2">
                            {lang === 'fr' ? 'Email utilisé lors de la commande' : 'Email used for your order'}
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="email@example.com"
                            className="input"
                            required
                        />
                    </div>

                    {error && (
                        <div className="bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg p-3 text-sm flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="btn w-full py-4 bg-orange-500 hover:bg-orange-600 text-white"
                    >
                        {isLoading ? (
                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                                {lang === 'fr' ? 'Envoyer le lien' : 'Send cancellation link'}
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-6 pt-6 border-t border-[var(--color-border)] text-center">
                    <p className="text-[var(--color-text-subtle)] text-sm mb-3">
                        {lang === 'fr' ? 'Ou contactez-nous directement:' : 'Or contact us directly:'}
                    </p>
                    <a
                        href="https://wa.me/447861393211?text=Je%20souhaite%20annuler%20mon%20abonnement"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-green-400 hover:text-green-300"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
                        WhatsApp
                    </a>
                </div>
            </div>
        );
    }

    // Step 2: Verify
    if (step === 'verify') {
        return (
            <div className="card p-8 text-center">
                <div className="w-16 h-16 mx-auto bg-[var(--color-primary)]/20 rounded-full flex items-center justify-center mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                </div>
                <h2 className="text-2xl font-bold mb-2">
                    {lang === 'fr' ? 'Vérifiez votre email' : 'Check your email'}
                </h2>
                <p className="text-[var(--color-text-muted)] mb-6">
                    {lang === 'fr'
                        ? `Un lien a été envoyé à ${email}`
                        : `A link has been sent to ${email}`}
                </p>
                <div className="bg-[var(--color-surface-elevated)] rounded-lg p-4 mb-6">
                    <p className="text-[var(--color-text-subtle)] text-sm">
                        {lang === 'fr'
                            ? 'Le lien expire dans 24 heures. Vérifiez vos spams.'
                            : 'The link expires in 24 hours. Check your spam folder.'}
                    </p>
                </div>
                <button
                    onClick={() => setStep('request')}
                    className="btn btn-secondary"
                >
                    {lang === 'fr' ? 'Renvoyer l\'email' : 'Resend email'}
                </button>
            </div>
        );
    }

    // Step 3: Confirm
    if (step === 'confirm') {
        return (
            <div className="card p-8">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 mx-auto bg-orange-500/20 rounded-full flex items-center justify-center mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
                    </div>
                    <h2 className="text-2xl font-bold mb-2">
                        {lang === 'fr' ? 'Confirmer l\'annulation' : 'Confirm Cancellation'}
                    </h2>
                    <p className="text-[var(--color-text-muted)]">
                        {lang === 'fr'
                            ? 'Êtes-vous sûr de vouloir annuler votre abonnement?'
                            : 'Are you sure you want to cancel your subscription?'}
                    </p>
                </div>

                <form onSubmit={handleConfirmCancel} className="space-y-4">
                    <div>
                        <label htmlFor="reason" className="block text-sm font-medium mb-2">
                            {lang === 'fr' ? 'Raison (optionnel)' : 'Reason (optional)'}
                        </label>
                        <textarea
                            id="reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder={lang === 'fr' ? 'Dites-nous pourquoi...' : 'Tell us why...'}
                            rows={4}
                            className="input resize-none"
                        />
                    </div>

                    {error && (
                        <div className="bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg p-3 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                        <p className="text-orange-400 text-sm">
                            ⚠️ {lang === 'fr'
                                ? 'Cette action est irréversible. Votre accès sera désactivé.'
                                : 'This action is irreversible. Your access will be deactivated.'}
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <a href="/" className="btn btn-secondary flex-1">
                            {lang === 'fr' ? 'Annuler' : 'Go back'}
                        </a>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn flex-1 bg-red-500 hover:bg-red-600 text-white"
                        >
                            {isLoading ? (
                                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                lang === 'fr' ? 'Confirmer' : 'Confirm'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    // Step 4: Success
    return (
        <div className="card p-8 text-center">
            <div className="w-16 h-16 mx-auto bg-[var(--color-success)]/20 rounded-full flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">
                {lang === 'fr' ? 'Demande reçue' : 'Request Received'}
            </h2>
            <p className="text-[var(--color-text-muted)] mb-6">
                {lang === 'fr'
                    ? 'Nous vous contacterons sous 24h pour confirmer.'
                    : 'We will contact you within 24h to confirm.'}
            </p>
            <a href="/" className="btn btn-secondary">
                {lang === 'fr' ? 'Retour à l\'accueil' : 'Back to Home'}
            </a>
        </div>
    );
}
