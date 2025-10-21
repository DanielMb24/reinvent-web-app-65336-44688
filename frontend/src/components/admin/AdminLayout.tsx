import React, {memo} from 'react';
import {Outlet, Link, useLocation} from 'react-router-dom';
import {Button} from '@/components/ui/button';
import {
    Home,
    Trophy,
    Users,
    Building,
    FileText,
    Settings,
    BarChart3,
    DollarSign,
    Calendar,
    LogOut,
    UserCog,
    GraduationCap,
    BookOpen
} from 'lucide-react';
import {useAdminAuth} from '@/contexts/AdminAuthContext';

interface AdminLayoutProps {
    children?: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = memo(({children}) => {
    const location = useLocation();
    const {admin, logout} = useAdminAuth();

    // Menu items selon le rôle
    const getMenuItems = () => {
        const baseItems = [
            { path: '/admin/dashboard', label: 'Dashboard', icon: Home }
        ];

        // Super Admin voit tout
        if (admin?.role === 'super_admin') {
            return [
                ...baseItems,
                { path: '/admin/concour', label: 'Concours', icon: Trophy },
                { path: '/admin/candidats', label: 'Candidats', icon: Users },
                { path: '/admin/dossiers', label: 'Documents', icon: FileText },
                { path: '/admin/paiements', label: 'Paiements', icon: DollarSign },
                { path: '/admin/statistiques', label: 'Statistiques', icon: BarChart3 },
                { path: '/admin/profile', label: 'Profil', icon: Settings }
            ];
        }

        // Admin établissement voit tout sauf super-admin features
        if (admin?.role === 'admin_etablissement') {
            return [
                ...baseItems,
                { path: '/admin/concours', label: 'Concours', icon: Trophy },
                { path: '/admin/messagerie', label: 'Messages', icon: Settings },
                { path: '/admin/statistiques', label: 'Statistiques', icon: BarChart3 },
                { path: '/admin/sub-admins', label: 'Sous-Admins', icon: UserCog },
                { path: '/admin/profile', label: 'Profil', icon: Settings }
            ];
        }

        // Sub-admin Notes
        if (admin?.role === 'sub_admin' && admin?.admin_role === 'notes') {
            return [
                ...baseItems,
                { path: '/admin/notes', label: 'Gestion des Notes', icon: GraduationCap },
                { path: '/admin/profile', label: 'Profil', icon: Settings }
            ];
        }

        // Sub-admin Documents
        if (admin?.role === 'sub_admin' && admin?.admin_role === 'documents') {
            return [
                ...baseItems,
                { path: '/admin/dossiers', label: 'Gestion des Documents', icon: FileText },
                { path: '/admin/profile', label: 'Profil', icon: Settings }
            ];
        }

        return baseItems;
    };

    const menuItems = getMenuItems();

    const isActive = (path: string) => {
        if (path === '/admin/dashboard') {
            return location.pathname === '/admin' || location.pathname === '/admin/dashboard';
        }
        return location.pathname.startsWith(path);
    };

    console.log('Rendering AdminLayout for path:', location.pathname);

    return (
        <div className="min-h-screen bg-background flex">
            {/* Sidebar */}
            <div className="w-64 bg-card border-r border-border flex flex-col">
                <div className="p-6">
                    <h2 className="text-xl font-bold text-foreground">GabConcours Admin</h2>
                    <p className="text-sm text-muted-foreground mt-1">Panel d'administration</p>
                </div>

                <nav className="px-4 space-y-2 flex-1">
                    {menuItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                                isActive(item.path)
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                            }`}
                        >
                            <item.icon className="h-5 w-5"/>
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-border">
                    <div className="flex items-center space-x-3 mb-3">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground text-sm font-medium">
                {admin?.prenom?.charAt(0) || 'A'}
              </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                                {admin?.prenom} {admin?.nom}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                                {admin?.email}
                            </p>
                        </div>
                    </div>
                    <Button variant="ghost" className="w-full justify-start" onClick={logout}>
                        <LogOut className="h-4 w-4 mr-2"/>
                        Déconnexion
                    </Button>
                    <Button variant="ghost" className="w-full justify-start mt-2" asChild>
                        <Link to="/">
                            <Home className="h-4 w-4 mr-2"/>
                            Retour au site
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                <header className="bg-card border-b border-border px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-lg font-semibold text-foreground">Administration</h1>
                            <p className="text-sm text-muted-foreground">
                                Gestion de la plateforme GabConcours
                            </p>
                        </div>
                        <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                Connecté en tant que <strong>{admin?.role}</strong>
              </span>
                        </div>
                    </div>
                </header>

                <main className="flex-1 p-6">
                    {children || <Outlet/>}
                </main>
            </div>
        </div>
    );
});

export default AdminLayout;
