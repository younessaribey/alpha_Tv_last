import { useState } from 'react';

interface ContactFormProps {
    lang: 'en' | 'fr';
}

export default function ContactForm({ lang }: ContactFormProps) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: '',
    });
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');

        // Simulate form submission
        await new Promise(resolve => setTimeout(resolve, 1000));

        // TODO: Implement actual form submission (email service, etc.)
        setStatus('success');
        setFormData({ name: '', email: '', message: '' });
    };

    if (status === 'success') {
        return (
            <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-[var(--color-success)]/20 flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                </div>
                <h3 className="text-xl font-bold mb-2">
                    {lang === 'fr' ? 'Message envoyé !' : 'Message sent!'}
                </h3>
                <p className="text-[var(--color-text-muted)] mb-6">
                    {lang === 'fr' ? 'Nous vous répondrons sous 24h' : 'We\'ll respond within 24h'}
                </p>
                <button
                    onClick={() => setStatus('idle')}
                    className="btn btn-secondary"
                >
                    {lang === 'fr' ? 'Envoyer un autre message' : 'Send another message'}
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2">
                    {lang === 'fr' ? 'Nom' : 'Name'}
                </label>
                <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={lang === 'fr' ? 'Votre nom' : 'Your name'}
                    className="input"
                    required
                />
            </div>

            <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                    Email
                </label>
                <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@example.com"
                    className="input"
                    required
                />
            </div>

            <div>
                <label htmlFor="message" className="block text-sm font-medium mb-2">
                    Message
                </label>
                <textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder={lang === 'fr' ? 'Votre message...' : 'Your message...'}
                    rows={5}
                    className="input resize-none"
                    required
                />
            </div>

            <button
                type="submit"
                disabled={status === 'loading'}
                className="btn btn-primary w-full"
            >
                {status === 'loading' ? (
                    <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {lang === 'fr' ? 'Envoi...' : 'Sending...'}
                    </span>
                ) : (
                    <span className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" x2="11" y1="2" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                        {lang === 'fr' ? 'Envoyer' : 'Send'}
                    </span>
                )}
            </button>
        </form>
    );
}
