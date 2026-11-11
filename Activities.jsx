import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Plus, Search, BookOpen, Star } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';

import ActivityCard from '@/components/activities/ActivityCard';
import ActivityForm from '@/components/activities/ActivityForm';
import PullToRefresh from '@/components/PullToRefresh';

const categories = [
  { value: 'all', label: 'All Categories' },
  { value: 'academic', label: 'Academic' },
  { value: 'sensory', label: 'Sensory' },
  { value: 'motor', label: 'Motor' },
  { value: 'social', label: 'Social' },
  { value: 'life_skills', label: 'Life Skills' },
  { value: 'recreation', label: 'Recreation' },
  { value: 'calming', label: 'Calming' },
];

export default function Activities() {
  const [showForm, setShowForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('all');
  const queryClient = useQueryClient();

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['activities'],
    queryFn: () => base44.entities.Activity.list('name'),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Activity.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      setShowForm(false);
      toast.success('Activity added');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Activity.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      setShowForm(false);
      setEditingActivity(null);
      toast.success('Activity updated');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Activity.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      setDeleteId(null);
      toast.success('Activity deleted');
    },
  });

  const handleSave = (data) => {
    if (editingActivity) {
      updateMutation.mutate({ id: editingActivity.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleToggleFavorite = (activity) => {
    updateMutation.mutate({
      id: activity.id,
      data: { ...activity, is_favorite: !activity.is_favorite }
    });
  };

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || activity.category === categoryFilter;
    const matchesTab = activeTab === 'all' || (activeTab === 'favorites' && activity.is_favorite);
    return matchesSearch && matchesCategory && matchesTab;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={() => queryClient.invalidateQueries({ queryKey: ['activities'] })}>
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-xl">
              <BookOpen className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Groups</h1>
              <p className="text-slate-600">Categories</p>
            </div>
          </div>
          <Button 
            onClick={() => { setEditingActivity(null); setShowForm(true); }}
            className="bg-amber-600 hover:bg-amber-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Activity
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="bg-white shadow-sm">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              All Activities
            </TabsTrigger>
            <TabsTrigger value="favorites" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              Favorites
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search activities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Activity Grid */}
        {filteredActivities.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
            <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-600 mb-2">No activities found</h3>
            <p className="text-slate-500 mb-4">
              {searchTerm || categoryFilter !== 'all'
                ? "Try adjusting your filters"
                : activeTab === 'favorites'
                ? "Star some activities to add them to favorites"
                : "Add your first activity to get started"}
            </p>
            {!searchTerm && categoryFilter === 'all' && activeTab === 'all' && (
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Activity
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredActivities.map(activity => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                onEdit={(act) => { setEditingActivity(act); setShowForm(true); }}
                onDelete={(id) => setDeleteId(id)}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </div>
        )}

        {/* Form Modal */}
{showForm && (
        <ActivityForm
          isOpen={showForm}
          onClose={() => { setShowForm(false); setEditingActivity(null); }}
          activity={editingActivity}
          onSave={handleSave}
          isSaving={createMutation.isPending || updateMutation.isPending}
        />
)}

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Activity?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteMutation.mutate(deleteId)}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
    </PullToRefresh>
  );
}