import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { UserPlus, Trash2, Edit, Shield } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

interface SubAdmin {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  admin_role: 'notes' | 'documents';
  created_at: string;
}

const SubAdminsManager: React.FC = () => {
  const { admin } = useAdminAuth();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    password: '',
    role_type: 'notes' as 'notes' | 'documents'
  });

  // Récupérer les sous-admins
  const { data: subAdminsData, isLoading } = useQuery({
    queryKey: ['sub-admins', admin?.etablissement_id],
    queryFn: async () => {
      const response = await apiService.get(`/sub-admins/etablissement/${admin?.etablissement_id}`);
      return response.data;
    },
    enabled: !!admin?.etablissement_id
  });

  const subAdmins: SubAdmin[] = subAdminsData?.data || [];
  const canCreateMore = subAdmins.length < 3;

  // Mutation pour créer un sous-admin
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiService.post('/sub-admins/create', {
        ...data,
        etablissement_id: admin?.etablissement_id,
        created_by: admin?.id
      });
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Sous-admin créé avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ['sub-admins'] });
      setIsCreateDialogOpen(false);
      setFormData({
        nom: '',
        prenom: '',
        email: '',
        password: '',
        role_type: 'notes'
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Erreur lors de la création",
        variant: "destructive"
      });
    }
  });

  // Mutation pour supprimer un sous-admin
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiService.delete(`/sub-admins/${id}`, {
        data: { deleted_by: admin?.id }
      });
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Sous-admin supprimé avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ['sub-admins'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Erreur lors de la suppression",
        variant: "destructive"
      });
    }
  });

  const handleCreate = () => {
    if (!formData.nom || !formData.prenom || !formData.email || !formData.password) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir tous les champs",
        variant: "destructive"
      });
      return;
    }

    if (formData.password.length < 8) {
      toast({
        title: "Mot de passe trop court",
        description: "Le mot de passe doit contenir au moins 8 caractères",
        variant: "destructive"
      });
      return;
    }

    createMutation.mutate(formData);
  };

  const getRoleBadge = (roleType: string) => {
    switch (roleType) {
      case 'notes':
        return <Badge className="bg-blue-500">Gestion des Notes</Badge>;
      case 'documents':
        return <Badge className="bg-green-500">Gestion des Documents</Badge>;
      default:
        return <Badge>Inconnu</Badge>;
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div></div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Gestion des Sous-Admins ({subAdmins.length}/3)
          </CardTitle>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={!canCreateMore}>
                <UserPlus className="h-4 w-4 mr-2" />
                Nouveau Sous-Admin
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Créer un Sous-Admin</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="nom">Nom</Label>
                  <Input
                    id="nom"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="prenom">Prénom</Label>
                  <Input
                    id="prenom"
                    value={formData.prenom}
                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Min. 8 caractères"
                  />
                </div>
                <div>
                  <Label htmlFor="role_type">Rôle</Label>
                  <Select 
                    value={formData.role_type} 
                    onValueChange={(value: 'notes' | 'documents') => setFormData({ ...formData, role_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="notes">Gestion des Notes</SelectItem>
                      <SelectItem value="documents">Gestion des Documents</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={handleCreate} 
                  className="w-full"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? 'Création...' : 'Créer le Sous-Admin'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {!canCreateMore && (
          <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm text-yellow-800 dark:text-yellow-200">
            Limite de 3 sous-admins atteinte. Supprimez un sous-admin existant pour en créer un nouveau.
          </div>
        )}

        <div className="space-y-4">
          {subAdmins.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucun sous-admin créé. Cliquez sur "Nouveau Sous-Admin" pour commencer.
            </p>
          ) : (
            subAdmins.map((subAdmin) => (
              <Card key={subAdmin.id} className="border-l-4 border-l-primary">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">
                          {subAdmin.prenom} {subAdmin.nom}
                        </h3>
                        {getRoleBadge(subAdmin.admin_role)}
                      </div>
                      <p className="text-sm text-muted-foreground">{subAdmin.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Créé le {new Date(subAdmin.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm(`Supprimer ${subAdmin.prenom} ${subAdmin.nom} ?`)) {
                          deleteMutation.mutate(subAdmin.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SubAdminsManager;
