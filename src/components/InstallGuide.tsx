import { useState } from 'react';

interface InstallGuideProps {
    lang: 'en' | 'fr';
}

const devices = [
    {
        id: 'windows',
        name: 'Windows PC',
        icon: '💻',
        storeLink: 'https://apps.microsoft.com/detail/9pncrbkbb90x',
        downloadLink: 'https://capplayer.com/downloadWindows',
        steps: {
            fr: [
                'Visitez capplayer.com/windows ou Microsoft Store',
                'Téléchargez Cap Player',
                'Installez et lancez l\'application',
                'Sélectionnez "Connexion avec MAC & Mot de passe"',
                'Entrez vos identifiants',
                'Regardez sur votre PC !'
            ],
            en: [
                'Visit capplayer.com/windows or Microsoft Store',
                'Download Cap Player',
                'Install and launch the application',
                'Select "Login with MAC & Password"',
                'Enter your credentials',
                'Watch on your PC!'
            ]
        }
    },
    {
        id: 'smart-tv',
        name: 'Smart TV',
        icon: '📺',
        platforms: ['Samsung (Tizen)', 'LG (WebOS)', 'Hisense/Toshiba (VIDAA)', 'Philips/TCL (ZEASN)'],
        steps: {
            fr: [
                'Allez sur l\'App Store de votre TV (Samsung Apps, LG Content Store, etc.)',
                'Recherchez "Cap Player"',
                'Installez l\'application',
                'Lancez Cap Player',
                'Sélectionnez "Connexion avec MAC & Mot de passe"',
                'Entrez vos identifiants',
                'Profitez sur grand écran !'
            ],
            en: [
                'Go to your TV\'s App Store (Samsung Apps, LG Content Store, etc.)',
                'Search for "Cap Player"',
                'Install the application',
                'Launch Cap Player',
                'Select "Login with MAC & Password"',
                'Enter your credentials',
                'Enjoy on the big screen!'
            ]
        }
    },
    {
        id: 'ios',
        name: 'iPhone/iPad',
        icon: '📱',
        storeLink: 'https://apps.apple.com/us/app/cap-player/id6471679250',
        steps: {
            fr: [
                'Ouvrez l\'App Store sur votre iPhone ou iPad',
                'Recherchez "Cap Player"',
                'Téléchargez et installez l\'application',
                'Ouvrez Cap Player',
                'Sélectionnez "Connexion avec MAC & Mot de passe"',
                'Entrez vos identifiants et profitez !'
            ],
            en: [
                'Open the App Store on your iPhone or iPad',
                'Search for "Cap Player"',
                'Download and install the app',
                'Open Cap Player',
                'Select "Login with MAC & Password"',
                'Enter your credentials and enjoy!'
            ]
        }
    },
    {
        id: 'apple-tv',
        name: 'Apple TV',
        icon: '🍎',
        storeLink: 'https://apps.apple.com/us/app/cap-player/id6471679250',
        steps: {
            fr: [
                'Sur votre Apple TV, ouvrez l\'App Store',
                'Recherchez "Cap Player"',
                'Installez l\'application',
                'Lancez Cap Player',
                'Sélectionnez "Connexion avec MAC & Mot de passe"',
                'Entrez vos identifiants',
                'Profitez en 4K !'
            ],
            en: [
                'On your Apple TV, open the App Store',
                'Search for "Cap Player"',
                'Install the application',
                'Launch Cap Player',
                'Select "Login with MAC & Password"',
                'Enter your credentials',
                'Enjoy in 4K!'
            ]
        }
    },
    {
        id: 'android',
        name: 'Android',
        icon: '🤖',
        storeLink: 'https://play.google.com/store/apps/details?id=tv.cap.player',
        downloadLink: 'https://capplayer.com/download',
        steps: {
            fr: [
                'Ouvrez le Google Play Store',
                'Recherchez "Cap Player"',
                'Installez l\'application',
                'Lancez Cap Player',
                'Sélectionnez "Connexion avec MAC & Mot de passe"',
                'Entrez vos identifiants'
            ],
            en: [
                'Open Google Play Store',
                'Search for "Cap Player"',
                'Install the application',
                'Launch Cap Player',
                'Select "Login with MAC & Password"',
                'Enter your credentials'
            ]
        }
    },
    {
        id: 'firetv',
        name: 'Fire TV/Stick',
        icon: '🔥',
        code: '628699',
        steps: {
            fr: [
                'Sur votre Fire TV, installez l\'app "Downloader"',
                'Ouvrez Downloader',
                'Entrez le code: 628699',
                'Téléchargez et installez Cap Player',
                'Lancez l\'application',
                'Sélectionnez "Connexion avec MAC & Mot de passe"',
                'Entrez vos identifiants'
            ],
            en: [
                'On your Fire TV, install the "Downloader" app',
                'Open Downloader',
                'Enter code: 628699',
                'Download and install Cap Player',
                'Launch the app',
                'Select "Login with MAC & Password"',
                'Enter your credentials'
            ]
        }
    },
    {
        id: 'roku',
        name: 'Roku',
        icon: '📺',
        code: 'CAPPLAYER',
        activationLink: 'https://my.roku.com/account/add/CAPPLAYER',
        steps: {
            fr: [
                'Allez sur https://my.roku.com/account/add/CAPPLAYER',
                'Connectez-vous à votre compte Roku',
                'Ajoutez Cap Player à votre compte',
                'Sur votre Roku TV, allez dans "Mes chaînes"',
                'Lancez Cap Player',
                'Sélectionnez "Connexion avec MAC & Mot de passe"',
                'Entrez vos identifiants'
            ],
            en: [
                'Go to https://my.roku.com/account/add/CAPPLAYER',
                'Log in to your Roku account',
                'Add Cap Player to your account',
                'On your Roku TV, go to "My Channels"',
                'Launch Cap Player',
                'Select "Login with MAC & Password"',
                'Enter your credentials'
            ]
        }
    }
];

export default function InstallGuide({ lang }: InstallGuideProps) {
    const [selectedDevice, setSelectedDevice] = useState(devices[0].id);

    const currentDevice = devices.find(d => d.id === selectedDevice) || devices[0];

    return (
        <div className="install-guide">
            {/* Device Selector */}
            <div className="device-selector">
                {devices.map((device) => (
                    <button
                        key={device.id}
                        className={`device-btn ${selectedDevice === device.id ? 'active' : ''}`}
                        onClick={() => setSelectedDevice(device.id)}
                    >
                        <span className="device-icon">{device.icon}</span>
                        <span className="device-name">{device.name}</span>
                    </button>
                ))}
            </div>

            {/* Installation Steps */}
            <div className="install-steps">
                <h3 className="steps-title">
                    {lang === 'fr' ? `Installation sur ${currentDevice.name}` : `Install on ${currentDevice.name}`}
                </h3>

                {currentDevice.platforms && (
                    <div className="platforms-list">
                        <span className="platforms-label">{lang === 'fr' ? 'Compatibilité:' : 'Compatibility:'}</span>
                        {currentDevice.platforms.map((platform, idx) => (
                            <span key={idx} className="platform-badge">{platform}</span>
                        ))}
                    </div>
                )}

                <ol className="steps-list">
                    {currentDevice.steps[lang].map((step, index) => (
                        <li key={index} className="step-item">
                            <span className="step-number">{index + 1}</span>
                            <span className="step-text">{step}</span>
                        </li>
                    ))}
                </ol>

                {/* Download/Store Links */}
                <div className="download-actions">
                    {currentDevice.storeLink && (
                        <a
                            href={currentDevice.storeLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="download-btn primary"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            {lang === 'fr' ? 'Télécharger depuis le Store' : 'Download from Store'}
                        </a>
                    )}
                    {currentDevice.downloadLink && (
                        <a
                            href={currentDevice.downloadLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="download-btn secondary"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            {currentDevice.id === 'android'
                                ? (lang === 'fr' ? 'Télécharger APK' : 'Download APK')
                                : (lang === 'fr' ? 'Télécharger .exe' : 'Download .exe')}
                        </a>
                    )}
                    {currentDevice.code && (
                        <div className="device-code">
                            <span className="code-label">
                                {currentDevice.id === 'roku'
                                    ? (lang === 'fr' ? 'Code Roku:' : 'Roku Code:')
                                    : (lang === 'fr' ? 'Code Downloader:' : 'Downloader Code:')}
                            </span>
                            <span className="code-value">{currentDevice.code}</span>
                        </div>
                    )}
                    {currentDevice.activationLink && (
                        <a
                            href={currentDevice.activationLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="download-btn secondary"
                        >
                            {lang === 'fr' ? 'Activer sur Roku.com' : 'Activate on Roku.com'}
                        </a>
                    )}
                </div>
            </div>

            <style>{`
                .install-guide {
                    width: 100%;
                }

                .device-selector {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
                    gap: 0.75rem;
                    margin-bottom: 2rem;
                }

                .device-btn {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 1rem 0.75rem;
                    background: var(--color-surface);
                    border: 2px solid var(--color-border);
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .device-btn:hover {
                    border-color: var(--color-primary);
                    transform: translateY(-2px);
                }

                .device-btn.active {
                    background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%);
                    border-color: var(--color-primary);
                }

                .device-icon {
                    font-size: 2rem;
                }

                .device-name {
                    font-size: 0.8125rem;
                    font-weight: 600;
                    color: var(--color-text);
                    text-align: center;
                }

                .install-steps {
                    background: var(--color-surface);
                    border: 1px solid var(--color-border);
                    border-radius: 16px;
                    padding: 2rem;
                }

                .steps-title {
                    font-size: 1.25rem;
                    font-weight: 700;
                    margin-bottom: 1.5rem;
                    color: var(--color-text);
                }

                .platforms-list {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    flex-wrap: wrap;
                    margin-bottom: 1.5rem;
                    padding: 1rem;
                    background: rgba(99, 102, 241, 0.05);
                    border: 1px solid rgba(99, 102, 241, 0.1);
                    border-radius: 12px;
                }

                .platforms-label {
                    font-size: 0.875rem;
                    font-weight: 600;
                    color: var(--color-text-muted);
                }

                .platform-badge {
                    padding: 0.25rem 0.75rem;
                    background: var(--color-primary);
                    color: white;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    font-weight: 600;
                }

                .steps-list {
                    list-style: none;
                    counter-reset: step-counter;
                    margin: 0 0 2rem 0;
                    padding: 0;
                }

                .step-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 1rem;
                    padding: 1rem;
                    margin-bottom: 0.75rem;
                    background: rgba(139, 92, 246, 0.05);
                    border: 1px solid rgba(139, 92, 246, 0.1);
                    border-radius: 12px;
                    transition: all 0.2s ease;
                }

                .step-item:hover {
                    background: rgba(139, 92, 246, 0.1);
                    transform: translateX(4px);
                }

                .step-number {
                    flex-shrink: 0;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: var(--color-primary);
                    color: white;
                    border-radius: 50%;
                    font-weight: 700;
                    font-size: 0.875rem;
                }

                .step-text {
                    flex: 1;
                    line-height: 1.6;
                    color: var(--color-text);
                    padding-top: 0.25rem;
                }

                .download-actions {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    flex-wrap: wrap;
                }

                .download-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.875rem 1.5rem;
                    border-radius: 12px;
                    font-weight: 600;
                    text-decoration: none;
                    transition: all 0.3s ease;
                    font-size: 0.9375rem;
                }

                .download-btn.primary {
                    background: var(--color-primary);
                    color: white;
                }

                .download-btn.primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(139, 92, 246, 0.4);
                }

                .download-btn.secondary {
                    background: rgba(139, 92, 246, 0.1);
                    color: var(--color-primary);
                    border: 1px solid rgba(139, 92, 246, 0.2);
                }

                .download-btn.secondary:hover {
                    background: rgba(139, 92, 246, 0.2);
                    transform: translateY(-2px);
                }

                .device-code {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.75rem 1.25rem;
                    background: rgba(16, 185, 129, 0.1);
                    border: 1px solid rgba(16, 185, 129, 0.2);
                    border-radius: 12px;
                }

                .code-label {
                    font-size: 0.875rem;
                    font-weight: 600;
                    color: var(--color-text-muted);
                }

                .code-value {
                    font-size: 1.125rem;
                    font-weight: 700;
                    color: #10b981;
                    font-family: 'Courier New', monospace;
                }

                @media (max-width: 768px) {
                    .device-selector {
                        grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
                    }

                    .install-steps {
                        padding: 1.5rem;
                    }

                    .steps-title {
                        font-size: 1.125rem;
                    }

                    .download-btn {
                        font-size: 0.875rem;
                        padding: 0.75rem 1.25rem;
                    }
                }
            `}</style>
        </div>
    );
}
