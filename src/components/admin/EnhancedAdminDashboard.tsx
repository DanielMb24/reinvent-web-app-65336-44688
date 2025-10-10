import React from 'react';
import ConcoursBasedDashboard from './ConcoursBasedDashboard';
import {Building, Settings, Trophy, Users} from "lucide-react";
import {useNavigate} from "react-router-dom";

const EnhancedAdminDashboard = () => {


    const navigate = useNavigate();

    const quickActions = [
        {
            title: 'Créer un Établissement',
            description: 'Ajouter un nouvel établissement',
            icon: Building,
            action: () => navigate('/admin/gestion-etablissements'),
            color: 'bg-blue-500'
        },
        {
            title: 'Créer un Admin',
            description: 'Ajouter un administrateur',
            icon: Users,
            action: () => navigate('/admin/gestion-admins'),
            color: 'bg-green-500'
        },
        {
            title: 'Gérer les Concours',
            description: 'Configuration globale',
            icon: Trophy,
            action: () => navigate('/admin/concours'),
            color: 'bg-purple-500'
        },
        {
            title: 'Gérer les Filières',
            description: 'Configuration des filières',
            icon: Settings,
            action: () => navigate('/admin/filieres'),
            color: 'bg-orange-500'
        }
    ];

    return <ConcoursBasedDashboard/>




        ;

};

export default EnhancedAdminDashboard;
