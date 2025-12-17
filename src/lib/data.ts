export interface Product {
    id: string;
    name: {
        en: string;
        fr: string;
    };
    price: number;
    originalPrice?: number;
    duration: string;
    devices: number;
    features: {
        en: string[];
        fr: string[];
    };
    popular?: boolean;
    badge?: {
        en: string;
        fr: string;
    };
}

export const products: Product[] = [
    {
        id: '6months-1device',
        name: {
            en: '6 Months',
            fr: '6 Mois',
        },
        price: 39,
        originalPrice: 49.99,
        duration: '6 months',
        devices: 1,
        features: {
            en: [
                '24h Free Trial',
                '10,000+ Channels',
                '4K Ultra HD Quality',
                'VOD Library',
                '24/7 Support',
            ],
            fr: [
                '24h Essai Gratuit',
                '10 000+ Chaînes',
                'Qualité 4K Ultra HD',
                'Bibliothèque VOD',
                'Assistance 24/7',
            ],
        },
        badge: {
            en: 'Save €11',
            fr: '-11€',
        },
    },
    {
        id: '12months-1device',
        name: {
            en: '12 Months',
            fr: '12 Mois',
        },
        price: 59,
        originalPrice: 89.99,
        duration: '12 months',
        devices: 1,
        features: {
            en: [
                '24h Free Trial',
                '10,000+ Channels',
                '4K Ultra HD Quality',
                'VOD Library',
                '24/7 Priority Support',
                'Regular Updates',
            ],
            fr: [
                '24h Essai Gratuit',
                '10 000+ Chaînes',
                'Qualité 4K Ultra HD',
                'Bibliothèque VOD',
                'Assistance Prioritaire 24/7',
                'Mises à Jour Régulières',
            ],
        },
        popular: true,
        badge: {
            en: 'Save €31',
            fr: '-31€',
        },
    },
    {
        id: '12months-2devices',
        name: {
            en: '12 Months Duo',
            fr: '12 Mois Duo',
        },
        price: 79,
        originalPrice: 159.99,
        duration: '12 months',
        devices: 2,
        features: {
            en: [
                '24h Free Trial',
                '10,000+ Channels',
                '4K Ultra HD Quality',
                'VOD Library',
                '24/7 Priority Support',
                '2 Simultaneous Streams',
            ],
            fr: [
                '24h Essai Gratuit',
                '10 000+ Chaînes',
                'Qualité 4K Ultra HD',
                'Bibliothèque VOD',
                'Assistance Prioritaire 24/7',
                '2 Flux Simultanés',
            ],
        },
        badge: {
            en: 'Save €81',
            fr: '-81€',
        },
    },
];

export const platforms = [
    {
        id: 'ios',
        name: 'iOS & tvOS',
        icon: 'apple',
        details: 'iPhone, iPad, Apple TV',
        downloadLink: 'https://apps.apple.com/us/app/cap-player/id6471679250',
    },
    {
        id: 'android',
        name: 'Android',
        icon: 'smartphone',
        details: 'Phones, Tablets, Android TV',
        downloadLink: 'https://play.google.com/store/apps/details?id=tv.cap.player',
    },
    {
        id: 'firetv',
        name: 'Fire TV',
        icon: 'tv',
        details: 'Fire TV Stick & Box',
        downloadCode: '628699',
    },
    {
        id: 'roku',
        name: 'Roku',
        icon: 'play-circle',
        details: 'Roku Stick & Box',
        downloadLink: 'https://my.roku.com/account/add/CAPPLAYER',
    },
    {
        id: 'smarttv',
        name: 'Smart TV',
        icon: 'monitor',
        details: 'Samsung, LG, Hisense',
    },
    {
        id: 'windows',
        name: 'Windows',
        icon: 'laptop',
        details: 'Windows 10/11',
        downloadLink: 'https://apps.microsoft.com/detail/9pncrbkbb90x',
    },
];

export type Lang = 'en' | 'fr';

export const translations = {
    en: {
        // Navigation
        'nav.home': 'Home',
        'nav.pricing': 'Pricing',
        'nav.howItWorks': 'How It Works',
        'nav.faq': 'FAQ',
        'nav.contact': 'Contact',

        // Hero
        'hero.badge': 'Premium IPTV Experience',
        'hero.title': 'Stream 10,000+ Channels in',
        'hero.titleHighlight': 'Crystal Clear 4K',
        'hero.description': 'The ultimate streaming experience with Cap Player. Access live TV, movies, sports, and more from anywhere in the world.',
        'hero.cta': 'Get Started',
        'hero.secondary': 'View All Plans',
        'hero.trial': '24h Free Trial Included',

        // Features
        'features.title': 'Why Choose Us',
        'features.channels': '10,000+ Channels',
        'features.channelsDesc': 'Live TV from around the world',
        'features.quality': '4K Ultra HD',
        'features.qualityDesc': 'Crystal clear streaming',
        'features.uptime': '99.9% Uptime',
        'features.uptimeDesc': 'Reliable 24/7 service',
        'features.support': 'Instant Support',
        'features.supportDesc': 'We\'re always here to help',

        // Products
        'products.title': 'Simple, Transparent Pricing',
        'products.subtitle': 'Choose the perfect plan for your streaming needs',
        'products.popular': 'Most Popular',
        'products.device': 'device',
        'products.devices': 'devices',
        'products.cta': 'Get Started',
        'products.trial': '24h free trial included',

        // CTA
        'cta.title': 'Ready to Start Streaming?',
        'cta.description': 'Join thousands of satisfied customers enjoying premium IPTV.',
        'cta.button': 'Get Started Now',

        // Footer
        'footer.description': 'Premium IPTV streaming service with 10,000+ channels in 4K quality.',
        'footer.links': 'Quick Links',
        'footer.support': 'Support',
        'footer.legal': 'Legal',
        'footer.contact': 'Contact Us',
        'footer.rights': 'All rights reserved.',
    },
    fr: {
        // Navigation
        'nav.home': 'Accueil',
        'nav.pricing': 'Tarifs',
        'nav.howItWorks': 'Comment ça marche',
        'nav.faq': 'FAQ',
        'nav.contact': 'Contact',

        // Hero
        'hero.badge': 'Expérience IPTV Premium',
        'hero.title': 'Diffusez 10 000+ chaînes en',
        'hero.titleHighlight': '4K Ultra HD',
        'hero.description': 'L\'expérience streaming ultime avec Cap Player. Accédez à la TV en direct, films, sports et plus du monde entier.',
        'hero.cta': 'Commencer',
        'hero.secondary': 'Voir les Forfaits',
        'hero.trial': '24h d\'essai gratuit inclus',

        // Features
        'features.title': 'Pourquoi Nous Choisir',
        'features.channels': '10 000+ Chaînes',
        'features.channelsDesc': 'TV en direct du monde entier',
        'features.quality': '4K Ultra HD',
        'features.qualityDesc': 'Streaming cristallin',
        'features.uptime': '99.9% Disponibilité',
        'features.uptimeDesc': 'Service fiable 24/7',
        'features.support': 'Support Instantané',
        'features.supportDesc': 'Toujours là pour vous aider',

        // Products
        'products.title': 'Tarifs Simples et Transparents',
        'products.subtitle': 'Choisissez le forfait parfait pour vos besoins',
        'products.popular': 'Le Plus Populaire',
        'products.device': 'appareil',
        'products.devices': 'appareils',
        'products.cta': 'Commencer',
        'products.trial': '24h d\'essai gratuit inclus',

        // CTA
        'cta.title': 'Prêt à Commencer le Streaming?',
        'cta.description': 'Rejoignez des milliers de clients satisfaits profitant de l\'IPTV premium.',
        'cta.button': 'Commencer Maintenant',

        // Footer
        'footer.description': 'Service de streaming IPTV premium avec 10 000+ chaînes en qualité 4K.',
        'footer.links': 'Liens Rapides',
        'footer.support': 'Support',
        'footer.legal': 'Légal',
        'footer.contact': 'Nous Contacter',
        'footer.rights': 'Tous droits réservés.',
    },
};

export function t(lang: Lang, key: string): string {
    return translations[lang][key as keyof typeof translations['en']] || key;
}
