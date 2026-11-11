import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Loader2, Calendar, Plus, Copy } from 'lucide-react';
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

import ScheduleGrid from '@/components/schedule/ScheduleGrid';
import ScheduleBlockForm from '@/components/schedule/ScheduleBlockForm';
import ScheduleSkeleton from '@/components/loading/ScheduleSkeleton';

export default function Schedule() {
  const [showForm, setShowForm] = useState(false);
  const [editingBlock, setEditingBlock] = useState(null);
  const [defaultDay, setDefaultDay] = useState('monday');
  const [deleteId, setDeleteId] = useState(null);
  const queryClient = useQueryClient();

  const { data: scheduleBlocks = [], isLoading } = useQuery({
    queryKey: ['scheduleBlocks'],
    queryFn: () => base44.entities.ScheduleBlock.list(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ScheduleBlock.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduleBlocks'] });
      setShowForm(false);
      toast.success('Schedule block added');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ScheduleBlock.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduleBlocks'] });
      setShowForm(false);
      setEditingBlock(null);
      toast.success('Schedule block updated');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ScheduleBlock.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduleBlocks'] });
      setDeleteId(null);
      toast.success('Schedule block deleted');
    },
  });

  const handleAddBlock = (day) => {
    setDefaultDay(day);
    setEditingBlock(null);
    setShowForm(true);
  };

  const handleEdit = (block) => {
    setEditingBlock(block);
    setShowForm(true);
  };

  const handleSave = (data) => {
    if (editingBlock) {
      updateMutation.mutate({ id: editingBlock.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleCopyDay = async (fromDay, toDay) => {
    const blocksFromDay = scheduleBlocks.filter(b => b.day_of_week === fromDay);
    if (blocksFromDay.length === 0) {
      toast.error('No blocks to copy from this day');
      return;
    }

    const newBlocks = blocksFromDay.map(block => ({
      ...block,
      day_of_week: toDay,
      id: undefined,
      created_date: undefined,
      updated_date: undefined,
    }));

    await base44.entities.ScheduleBlock.bulkCreate(newBlocks);
    queryClient.invalidateQueries({ queryKey: ['scheduleBlocks'] });
    toast.success(`Copied ${newBlocks.length} blocks to ${toDay}`);
  };

  if (isLoading) {
    return <ScheduleSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-xl">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Lessons</h1>
              <p className="text-slate-600">No lessons yet</p>
            </div>
          </div>
          <Button 
            onClick={() => handleAddBlock('monday')}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Lesson
          </Button>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mb-6 p-4 bg-white rounded-xl shadow-sm">
          <span className="text-sm text-slate-600 font-medium">Activity Types:</span>
          {[
            { type: 'instruction', color: 'bg-blue-200', label: 'Instruction' },
            { type: 'independent_work', color: 'bg-purple-200', label: 'Independent Work' },
            { type: 'group_activity', color: 'bg-green-200', label: 'Group' },
            { type: 'break', color: 'bg-amber-200', label: 'Break' },
            { type: 'lunch', color: 'bg-orange-200', label: 'Lunch' },
            { type: 'therapy', color: 'bg-indigo-200', label: 'Therapy' },
          ].map(item => (
            <div key={item.type} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded-full ${item.color}`} />
              <span className="text-xs text-slate-600">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Schedule Grid */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <ScheduleGrid
            scheduleBlocks={scheduleBlocks}
            onEdit={handleEdit}
            onDelete={(id) => setDeleteId(id)}
            onAddBlock={handleAddBlock}
          />
        </div>

        {/* Form Modal */}
{showForm && (
        <ScheduleBlockForm
          isOpen={showForm}
          onClose={() => { setShowForm(false); setEditingBlock(null); }}
          block={editingBlock}
          defaultDay={defaultDay}
          onSave={handleSave}
          isSaving={createMutation.isPending || updateMutation.isPending}
        />
)}

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Schedule Block?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. The schedule block will be permanently removed.
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
  );
}