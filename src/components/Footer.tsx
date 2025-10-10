import React from 'react';

const Footer = () => {
    return (
        <footer className="bg-gray-50 border-t mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold">G</span>
                            </div>
                            <span className="font-bold text-lg">GabConcours</span>
                        </div>
                        <p className="text-muted-foreground text-sm">
                            Plateforme officielle de candidature aux concours publics de la République Gabonaise.
                        </p>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-4">Liens utiles</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><a href="#" className="hover:text-primary">Guide du candidat</a></li>
                            <li><a href="#" className="hover:text-primary">FAQ</a></li>
                            <li><a href="#" className="hover:text-primary">Contact</a></li>
                            <li><a href="#" className="hover:text-primary">Aide technique</a></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-4">Contact</h3>
                        <div className="space-y-2 text-sm text-muted-foreground">
                            <p>Email: gabonconcours.com</p>
                            <p>Téléphone: +241 74604327</p>
                            <p>Disponible 24h/24 - 7j/7</p>
                        </div>
                    </div>
                </div>

                <div className="border-t mt-8 pt-6 text-center text-sm text-muted-foreground">
                    <p>&copy; 2024 République Gabonaise - Tous droits réservés</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
