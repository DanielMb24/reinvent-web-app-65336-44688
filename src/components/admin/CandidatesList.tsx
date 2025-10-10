import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Search, Eye } from 'lucide-react';
import { apiService } from '@/services/api';
import { useNavigate } from 'react-router-dom';

interface CandidatesListProps {
    concoursFilter?: number | null;
}

const CandidatesList: React.FC<CandidatesListProps> = ({ concoursFilter }) => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const { data: candidats, isLoading } = useQuery({
        queryKey: ['candidats', concoursFilter],
        queryFn: async () => {
            const response = await apiService.getCandidats<any[]>();
            let data = response.data || [];
            
            if (concoursFilter) {
                data = data.filter((c: any) => c.concours_id === concoursFilter);
            }
            
            return data;
        },
        refetchInterval: 30000,
    });

    const filteredCandidats = candidats?.filter((candidat: any) => {
        const matchesSearch =
            candidat.nomcan?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            candidat.prncan?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            candidat.nupcan?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            candidat.maican?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || candidat.statut === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const getStatusBadge = (statut: string) => {
        const statusMap: Record<string, { variant: any; label: string }> = {
            complet: { variant: 'default', label: 'Complet' },
            en_attente: { variant: 'secondary', label: 'En attente' },
            validation_admin: { variant: 'outline', label: 'Validation admin' },
        };
        
        const status = statusMap[statut] || { variant: 'secondary', label: statut };
        return <Badge variant={status.variant}>{status.label}</Badge>;
    };

    if (isLoading) {
        return (
            <Card>
                <CardContent className="p-12">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-4">Chargement des candidats...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Liste des Candidats</CardTitle>
                <div className="flex gap-4 mt-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher par nom, prénom, NUPCAN ou email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Filtrer par statut" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tous les statuts</SelectItem>
                            <SelectItem value="complet">Complet</SelectItem>
                            <SelectItem value="en_attente">En attente</SelectItem>
                            <SelectItem value="validation_admin">Validation admin</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>NUPCAN</TableHead>
                            <TableHead>Nom Complet</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Téléphone</TableHead>
                            <TableHead>Concours</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredCandidats && filteredCandidats.length > 0 ? (
                            filteredCandidats.map((candidat: any) => (
                                <TableRow key={candidat.id}>
                                    <TableCell className="font-medium">{candidat.nupcan}</TableCell>
                                    <TableCell>{candidat.prncan} {candidat.nomcan}</TableCell>
                                    <TableCell>{candidat.maican}</TableCell>
                                    <TableCell>{candidat.telcan}</TableCell>
                                    <TableCell>{candidat.concours_libelle}</TableCell>
                                    <TableCell>{getStatusBadge(candidat.statut || 'en_attente')}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => navigate(`/admin/candidat/${candidat.nupcan}`)}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                                    Aucun candidat trouvé
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                    <div>
                        Total: {filteredCandidats?.length || 0} candidat(s)
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default CandidatesList;
