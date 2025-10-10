import React from 'react';
import {useAdminAuth} from '@/contexts/AdminAuthContext';
import SuperAdminDashboard from './SuperAdminDashboard';
import AdminEtablissementDashboard from './AdminEtablissementDashboard';

const Dashboard = () => {
    const {admin} = useAdminAuth();

    if (!admin) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    // Afficher le dashboard approprié selon le rôle
    if (admin.role === 'super_admin') {
        return <SuperAdminDashboard/>;
    }

    return <AdminEtablissementDashboard/>;
};

export default Dashboard;
