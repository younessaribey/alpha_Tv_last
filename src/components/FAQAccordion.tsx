import { useState } from 'react';

interface FAQ {
    question: { en: string; fr: string };
    answer: { en: string; fr: string };
    link?: string;
}

interface FAQAccordionProps {
    faqs: FAQ[];
    lang: 'en' | 'fr';
}

export default function FAQAccordion({ faqs, lang }: FAQAccordionProps) {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    return (
        <div className="space-y-3">
            {faqs.map((faq, index) => (
                <div
                    key={index}
                    className={`card overflow-hidden transition-all ${openIndex === index ? 'border-[var(--color-primary)]/50' : ''}`}
                >
                    <button
                        onClick={() => setOpenIndex(openIndex === index ? null : index)}
                        className="w-full p-5 flex items-center justify-between text-left hover:bg-[var(--color-surface-elevated)]/50 transition-colors"
                    >
                        <span className="font-medium pr-4">{faq.question[lang]}</span>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="var(--color-primary)"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={`flex-shrink-0 transition-transform ${openIndex === index ? 'rotate-180' : ''}`}
                        >
                            <path d="m6 9 6 6 6-6" />
                        </svg>
                    </button>

                    {openIndex === index && (
                        <div className="px-5 pb-5 pt-0">
                            <p className="text-[var(--color-text-muted)] leading-relaxed mb-3">
                                {faq.answer[lang]}
                            </p>
                            {faq.link && (
                                <a
                                    href={faq.link}
                                    className="inline-flex items-center gap-1 text-sm text-[var(--color-primary)] hover:underline"
                                >
                                    {lang === 'fr' ? 'En savoir plus' : 'Learn more'}
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                                </a>
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
