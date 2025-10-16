import React from 'react';
import ConcoursBasedDashboard from './ConcoursBasedDashboard';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Building, Settings, Trophy, Users, FileText, DollarSign} from "lucide-react";
import {useNavigate} from "react-router-dom";
import {useQuery} from '@tanstack/react-query';
import {apiService} from '@/services/api';
import {useAdminAuth} from '@/contexts/AdminAuthContext';

const EnhancedAdminDashboard = () => {
    const navigate = useNavigate();
    const {admin} = useAdminAuth();

    // Actions rapides selon le rôle
    const getQuickActions = () => {
        // Admin principal
        if (admin?.role === 'admin_etablissement' || admin?.role === 'super_admin') {
            return [
                {
                    title: 'Gérer les Candidats',
                    description: 'Voir et gérer les candidats',
                    icon: Users,
                    action: () => navigate('/admin/candidats'),
                    color: 'bg-blue-500'
                },
                {
                    title: 'Gérer les Documents',
                    description: 'Valider les documents',
                    icon: FileText,
                    action: () => navigate('/admin/dossiers'),
                    color: 'bg-green-500'
                },
                {
                    title: 'Gérer les Notes',
                    description: 'Saisir et gérer les notes',
                    icon: Trophy,
                    action: () => navigate('/admin/notes'),
                    color: 'bg-purple-500'
                },
                {
                    title: 'Sous-Admins',
                    description: 'Gérer les sous-admins',
                    icon: Settings,
                    action: () => navigate('/admin/sub-admins'),
                    color: 'bg-indigo-500'
                }
            ];
        }

        // Sub-admin Notes
        if (admin?.admin_role === 'notes') {
            return [
                {
                    title: 'Gérer les Notes',
                    description: 'Saisir et gérer les notes',
                    icon: Trophy,
                    action: () => navigate('/admin/notes'),
                    color: 'bg-purple-500'
                }
            ];
        }

        // Sub-admin Documents
        if (admin?.admin_role === 'documents') {
            return [
                {
                    title: 'Gérer les Documents',
                    description: 'Valider les documents',
                    icon: FileText,
                    action: () => navigate('/admin/dossiers'),
                    color: 'bg-green-500'
                }
            ];
        }

        return [];
    };

    const quickActions = getQuickActions();

    return (
        <div className="space-y-6 p-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Dashboard Administrateur</h1>
                    <p className="text-muted-foreground">
                        {admin?.etablissement_nom || 'Gestion de l\'établissement'}
                    </p>
                </div>
            </div>

            {/* Actions rapides */}
            <Card>
                <CardHeader>
                    <CardTitle>Actions Rapides</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {quickActions.map((action, index) => (
                            <div
                                key={index}
                                className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                                onClick={action.action}
                            >
                                <div
                                    className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mb-3`}>
                                    <action.icon className="h-6 w-6 text-white"/>
                                </div>
                                <h3 className="font-semibold mb-1">{action.title}</h3>
                                <p className="text-sm text-muted-foreground">{action.description}</p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Dashboard basé sur les concours */}

        </div>
    );
};

export default EnhancedAdminDashboard;
