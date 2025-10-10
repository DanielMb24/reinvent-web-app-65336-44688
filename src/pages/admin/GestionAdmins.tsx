import React, {useState} from 'react';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Badge} from '@/components/ui/badge';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table';
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from '@/components/ui/dialog';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {
    Plus,
    Edit,
    Trash2,
    Users,
    Shield,
    Building,
    Search,
    Mail
} from 'lucide-react';
import {toast} from '@/hooks/use-toast';
import {adminApiService} from '@/services/adminApi';
import {apiService} from '@/services/api';

const GestionAdmins = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [selectedAdmin, setSelectedAdmin] = useState<any>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const queryClient = useQueryClient();

    // Récupérer tous les admins
    const {data: adminsData, isLoading: loadingAdmins} = useQuery({
        queryKey: ['admins'],
        queryFn: () => adminApiService.getAdmins(),
    });

    // Récupérer les établissements pour le formulaire
    const {data: etablissementsData} = useQuery({
        queryKey: ['etablissements'],
        queryFn: () => apiService.getEtablissements(),
    });

    const admins = adminsData?.data || [];
    const etablissements = etablissementsData?.data || [];

    const filteredAdmins = admins.filter((admin: any) =>
        admin.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.etablissement_nom?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Mutation pour créer un admin
    const createAdminMutation = useMutation({
        mutationFn: adminApiService.createAdmin,
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['admins']}).then(r => {

            });
            setIsCreateDialogOpen(false);
            toast({
                title: "Admin créé",
                description: "L'administrateur a été créé avec succès. Les identifiants ont été envoyés par email.",
            });
        },
        onError: (error: any) => {
            toast({
                title: "Erreur",
                description: error.message || "Impossible de créer l'admin",
                variant: "destructive",
            });
        },
    });

    // Mutation pour modifier un admin
    const updateAdminMutation = useMutation({
        mutationFn: ({id, data}: { id: number; data: any }) =>
            adminApiService.updateAdmin(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['admins']}).then(r => {

            });
            setIsEditDialogOpen(false);
            setSelectedAdmin(null);
            toast({
                title: "Admin modifié",
                description: "L'administrateur a été modifié avec succès",
            });
        },
        onError: () => {
            toast({
                title: "Erreur",
                description: "Impossible de modifier l'admin",
                variant: "destructive",
            });
        },
    });

    // Mutation pour supprimer un admin
    const deleteAdminMutation = useMutation({
        mutationFn: adminApiService.deleteAdmin,
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['admins']});
            toast({
                title: "Admin supprimé",
                description: "L'administrateur a été supprimé avec succès",
            });
        },
        onError: () => {
            toast({
                title: "Erreur",
                description: "Impossible de supprimer l'admin",
                variant: "destructive",
            });
        },
    });

    const handleCreateAdmin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        try {
            const adminData = {
                nom: formData.get('nom') as string,
                prenom: formData.get('prenom') as string,
                email: formData.get('email') as string,
                etablissement_id: formData.get('etablissement_id') ?
                    parseInt(formData.get('etablissement_id') as string) : undefined,
            };

            console.log('Création admin avec données:', adminData);

            await createAdminMutation.mutateAsync(adminData);
        } catch (error) {
            console.error('Erreur lors de la création:', error);
        }
    };

    const handleEditAdmin = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedAdmin) return;

        const formData = new FormData(e.currentTarget);

        updateAdminMutation.mutate({
            id: selectedAdmin.id,
            data: {
                nom: formData.get('nom') as string,
                prenom: formData.get('prenom') as string,
                email: formData.get('email') as string,
                statut: formData.get('statut') as string,
                etablissement_id: formData.get('etablissement_id') ?
                    parseInt(formData.get('etablissement_id') as string) : null,
            }
        });
    };

    const getStatusBadge = (statut: string) => {
        switch (statut) {
            case 'actif':
                return <Badge className="bg-green-100 text-green-800">Actif</Badge>;
            case 'inactif':
                return <Badge className="bg-gray-100 text-gray-800">Inactif</Badge>;
            case 'suspendu':
                return <Badge className="bg-red-100 text-red-800">Suspendu</Badge>;
            default:
                return <Badge variant="secondary">{statut}</Badge>;
        }
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'super_admin':
                return <Badge className="bg-purple-100 text-purple-800">Super Admin</Badge>;
            case 'admin_etablissement':
                return <Badge className="bg-blue-100 text-blue-800">Admin Établissement</Badge>;
            default:
                return <Badge variant="secondary">{role}</Badge>;
        }
    };

    if (loadingAdmins) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Gestion des Administrateurs</h1>
                    <p className="text-muted-foreground">Gérer les comptes administrateurs de la plateforme</p>
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2"/>
                            Nouvel Admin
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Créer un Administrateur</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreateAdmin} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="prenom">Prénom</Label>
                                    <Input id="prenom" name="prenom" required/>
                                </div>
                                <div>
                                    <Label htmlFor="nom">Nom</Label>
                                    <Input id="nom" name="nom" required/>
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" name="email" type="email" required/>
                            </div>
                            <div>
                                <Label htmlFor="etablissement_id">Établissement</Label>
                                <Select name="etablissement_id">
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sélectionner un établissement"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {etablissements.map((etablissement: any) => (
                                            <SelectItem key={etablissement.id} value={etablissement.id.toString()}>
                                                {etablissement.nomets}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex space-x-2">
                                <Button type="submit" disabled={createAdminMutation.isPending}>
                                    {createAdminMutation.isPending ? 'Création...' : 'Créer'}
                                </Button>
                                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                                    Annuler
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-3">
                            <Users className="h-8 w-8 text-blue-500"/>
                            <div>
                                <p className="text-2xl font-bold">
                                    {admins.filter((a: any) => a.role === 'admin_etablissement').length}
                                </p>
                                <p className="text-sm text-muted-foreground">Admins Établissement</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-3">
                            <Shield className="h-8 w-8 text-purple-500"/>
                            <div>
                                <p className="text-2xl font-bold">
                                    {admins.filter((a: any) => a.role === 'super_admin').length}
                                </p>
                                <p className="text-sm text-muted-foreground">Super Admins</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-3">
                            <Building className="h-8 w-8 text-green-500"/>
                            <div>
                                <p className="text-2xl font-bold">
                                    {admins.filter((a: any) => a.statut === 'actif').length}
                                </p>
                                <p className="text-sm text-muted-foreground">Actifs</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Liste des admins */}
            <Card>
                <CardHeader>
                    <CardTitle>Liste des Administrateurs</CardTitle>
                    <div className="flex items-center space-x-2">
                        <Search className="h-4 w-4 text-muted-foreground"/>
                        <Input
                            placeholder="Rechercher un administrateur..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="max-w-sm"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nom</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Rôle</TableHead>
                                <TableHead>Établissement</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead>Dernière connexion</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredAdmins.map((admin: any) => (
                                <TableRow key={admin.id}>
                                    <TableCell className="font-medium">
                                        {admin.prenom} {admin.nom}
                                    </TableCell>
                                    <TableCell>{admin.email}</TableCell>
                                    <TableCell>{getRoleBadge(admin.role)}</TableCell>
                                    <TableCell>{admin.etablissement_nom || '-'}</TableCell>
                                    <TableCell>{getStatusBadge(admin.statut)}</TableCell>
                                    <TableCell>
                                        {admin.derniere_connexion ?
                                            new Date(admin.derniere_connexion).toLocaleDateString('fr-FR') :
                                            'Jamais'
                                        }
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center space-x-2">
                                            {admin.role !== 'super_admin' && (
                                                <>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedAdmin(admin);
                                                            setIsEditDialogOpen(true);
                                                        }}
                                                    >
                                                        <Edit className="h-4 w-4"/>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            if (confirm('Êtes-vous sûr de vouloir supprimer cet admin ?')) {
                                                                deleteAdminMutation.mutate(admin.id);
                                                            }
                                                        }}
                                                        className="text-red-600 hover:text-red-700"
                                                    >
                                                        <Trash2 className="h-4 w-4"/>
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Dialog d'édition */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Modifier l'Administrateur</DialogTitle>
                    </DialogHeader>
                    {selectedAdmin && (
                        <form onSubmit={handleEditAdmin} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="edit-prenom">Prénom</Label>
                                    <Input
                                        id="edit-prenom"
                                        name="prenom"
                                        defaultValue={selectedAdmin.prenom}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="edit-nom">Nom</Label>
                                    <Input
                                        id="edit-nom"
                                        name="nom"
                                        defaultValue={selectedAdmin.nom}
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="edit-email">Email</Label>
                                <Input
                                    id="edit-email"
                                    name="email"
                                    type="email"
                                    defaultValue={selectedAdmin.email}
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="edit-statut">Statut</Label>
                                <Select name="statut" defaultValue={selectedAdmin.statut}>
                                    <SelectTrigger>
                                        <SelectValue/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="actif">Actif</SelectItem>
                                        <SelectItem value="inactif">Inactif</SelectItem>
                                        <SelectItem value="suspendu">Suspendu</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="edit-etablissement">Établissement</Label>
                                <Select
                                    name="etablissement_id"
                                    defaultValue={selectedAdmin.etablissement_id?.toString()}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sélectionner un établissement"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">Aucun établissement</SelectItem>
                                        {etablissements.map((etablissement: any) => (
                                            <SelectItem key={etablissement.id} value={etablissement.id.toString()}>
                                                {etablissement.nomets}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex space-x-2">
                                <Button type="submit" disabled={updateAdminMutation.isPending}>
                                    {updateAdminMutation.isPending ? 'Modification...' : 'Modifier'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setIsEditDialogOpen(false);
                                        setSelectedAdmin(null);
                                    }}
                                >
                                    Annuler
                                </Button>
                            </div>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default GestionAdmins;
