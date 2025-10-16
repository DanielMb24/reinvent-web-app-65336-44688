import React from 'react';
import {Link} from 'react-router-dom';
import {Button} from '@/components/ui/button';
import {Settings} from 'lucide-react';
import { ThemeSwitcher } from './ThemeSwitcher';
import { LanguageSwitcher } from './LanguageSwitcher';

const Header = () => {
    return (
        <header className="bg-background border-b border-border">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center">
                        <Link to="/" className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                                <span className="text-primary-foreground font-bold">G</span>
                            </div>
                            <span className="text-xl font-bold text-foreground">GabConcours</span>
                        </Link>
                    </div>

                    <nav className="hidden md:flex items-center space-x-8">
                        <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
                            Accueil
                        </Link>
                        <Link to="/concours" className="text-muted-foreground hover:text-foreground transition-colors">
                            Concours
                        </Link>
                        <Link to="/connexion" className="text-muted-foreground hover:text-foreground transition-colors">
                            Candidature
                        </Link>
                    </nav>

                    <div className="flex items-center space-x-2">
                        <LanguageSwitcher />
                        <ThemeSwitcher />
                        {/*<Button variant="ghost" size="sm" asChild>*/}
                        {/*    <Link to="/admin">*/}
                        {/*        <Settings className="h-4 w-4 mr-2"/>*/}
                        {/*        Administration*/}
                        {/*    </Link>*/}
                        {/*</Button>*/}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
