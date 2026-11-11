import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Plus, FileText, Calendar, Search, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import NarrativeGenerator from '@/components/narrative/NarrativeGenerator';
import PullToRefresh from '@/components/PullToRefresh';

const dayRatings = [
  { value: 'excellent', label: '🌟 Excellent', color: 'bg-green-100 text-green-800' },
  { value: 'good', label: '✅ Good', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'fair', label: '😐 Fair', color: 'bg-amber-100 text-amber-800' },
  { value: 'challenging', label: '⚠️ Challenging', color: 'bg-orange-100 text-orange-800' },
  { value: 'crisis', label: '🔴 Crisis', color: 'bg-red-100 text-red-800' },
];

const attendanceOptions = [
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'tardy', label: 'Tardy' },
  { value: 'early_dismissal', label: 'Early Dismissal' },
];

export default function DailyNotes() {
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [formData, setFormData] = useState({
    overall_day: 'good',
    attendance: 'present',
    highlights: '',
    challenges: '',
    parent_communication: '',
    follow_up: ''
  });
  const queryClient = useQueryClient();

  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: ['students'],
    queryFn: () => base44.entities.Student.filter({ status: 'active' }),
  });

  const { data: dailyNotes = [], isLoading: loadingNotes } = useQuery({
    queryKey: ['dailyNotes', selectedDate],
    queryFn: () => base44.entities.DailyNote.filter({ date: selectedDate }),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.DailyNote.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyNotes'] });
      setShowForm(false);
      setSelectedStudent(null);
      resetForm();
      toast.success('Daily note saved');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DailyNote.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyNotes'] });
      setShowForm(false);
      setSelectedStudent(null);
      resetForm();
      toast.success('Daily note updated');
    },
  });

  const resetForm = () => {
    setFormData({
      overall_day: 'good',
      attendance: 'present',
      highlights: '',
      challenges: '',
      parent_communication: '',
      follow_up: ''
    });
  };

  const handleOpenForm = (student) => {
    const existingNote = dailyNotes.find(n => n.student_id === student.id);
    if (existingNote) {
      setFormData({
        overall_day: existingNote.overall_day,
        attendance: existingNote.attendance || 'present',
        highlights: existingNote.highlights || '',
        challenges: existingNote.challenges || '',
        parent_communication: existingNote.parent_communication || '',
        follow_up: existingNote.follow_up || ''
      });
    } else {
      resetForm();
    }
    setSelectedStudent(student);
    setShowForm(true);
  };

  const handleSave = () => {
    const existingNote = dailyNotes.find(n => n.student_id === selectedStudent.id);
    const noteData = {
      ...formData,
      student_id: selectedStudent.id,
      date: selectedDate
    };

    if (existingNote) {
      updateMutation.mutate({ id: existingNote.id, data: noteData });
    } else {
      createMutation.mutate(noteData);
    }
  };

  const getStudentNote = (studentId) => {
    return dailyNotes.find(n => n.student_id === studentId);
  };

  const isLoading = loadingStudents || loadingNotes;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  const completedCount = students.filter(s => getStudentNote(s.id)).length;

  return (
    <PullToRefresh onRefresh={() => queryClient.invalidateQueries({ queryKey: ['dailyNotes'] })}>
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-xl">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Daily Notes</h1>
              <p className="text-slate-600">Record how each student's day went</p>
            </div>
          </div>
        </div>

        {/* Date Selector & Stats */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-slate-500" />
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-auto"
            />
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-slate-600">
              {completedCount} of {students.length} completed
            </span>
          </div>
        </div>

        {/* Student List */}
        <div className="space-y-4">
          {students.length === 0 ? (
            <Card className="text-center py-16">
              <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-600 mb-2">No students</h3>
              <p className="text-slate-500">Add students to start logging daily notes</p>
            </Card>
          ) : (
            students.map(student => {
              const note = getStudentNote(student.id);
              const ratingInfo = note ? dayRatings.find(r => r.value === note.overall_day) : null;

              return (
                <Card 
                  key={student.id}
                  className={`hover:shadow-md transition-all cursor-pointer ${note ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-slate-200'}`}
                  onClick={() => handleOpenForm(student)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                          <AvatarImage src={student.photo_url} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white">
                            {student.first_name?.[0]}{student.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-slate-800">
                            {student.first_name} {student.last_name}
                          </p>
                          <p className="text-sm text-slate-500">{student.grade} Grade</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {note ? (
                          <>
                            <Badge className={ratingInfo?.color || 'bg-slate-100'}>
                              {ratingInfo?.label || note.overall_day}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {note.attendance || 'present'}
                            </Badge>
                          </>
                        ) : (
                          <Button size="sm" variant="outline">
                            <Plus className="h-4 w-4 mr-1" />
                            Add Note
                          </Button>
                        )}
                      </div>
                    </div>

                    {note && (note.highlights || note.challenges) && (
                      <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {note.highlights && (
                          <div>
                            <p className="text-xs text-green-600 font-medium mb-1">✨ Highlights</p>
                            <p className="text-sm text-slate-700 line-clamp-2">{note.highlights}</p>
                          </div>
                        )}
                        {note.challenges && (
                          <div>
                            <p className="text-xs text-amber-600 font-medium mb-1">⚠️ Challenges</p>
                            <p className="text-sm text-slate-700 line-clamp-2">{note.challenges}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Form Modal */}
        <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) setSelectedStudent(null); }}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                {selectedStudent && (
                  <>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={selectedStudent.photo_url} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white text-xs">
                        {selectedStudent.first_name?.[0]}{selectedStudent.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span>{selectedStudent.first_name}'s Daily Note</span>
                  </>
                )}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Overall Day</Label>
                  <Select 
                    value={formData.overall_day} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, overall_day: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {dayRatings.map(rating => (
                        <SelectItem key={rating.value} value={rating.value}>
                          {rating.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Attendance</Label>
                  <Select 
                    value={formData.attendance} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, attendance: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {attendanceOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="highlights">✨ Highlights</Label>
                  <NarrativeGenerator
                    buttonText="AI Rewrite"
                    initialText={formData.highlights}
                    onGenerated={(text) => setFormData(prev => ({ ...prev, highlights: text }))}
                  />
                </div>
                <Textarea
                  id="highlights"
                  value={formData.highlights}
                  onChange={(e) => setFormData(prev => ({ ...prev, highlights: e.target.value }))}
                  placeholder="What went well today?"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="challenges">⚠️ Challenges</Label>
                  <NarrativeGenerator
                    buttonText="AI Rewrite"
                    initialText={formData.challenges}
                    onGenerated={(text) => setFormData(prev => ({ ...prev, challenges: text }))}
                  />
                </div>
                <Textarea
                  id="challenges"
                  value={formData.challenges}
                  onChange={(e) => setFormData(prev => ({ ...prev, challenges: e.target.value }))}
                  placeholder="Any difficulties or concerns?"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="parent_communication">📧 Parent Communication</Label>
                  <NarrativeGenerator
                    buttonText="AI Rewrite"
                    initialText={formData.parent_communication}
                    onGenerated={(text) => setFormData(prev => ({ ...prev, parent_communication: text }))}
                  />
                </div>
                <Textarea
                  id="parent_communication"
                  value={formData.parent_communication}
                  onChange={(e) => setFormData(prev => ({ ...prev, parent_communication: e.target.value }))}
                  placeholder="Notes to share with parents..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="follow_up">📋 Follow-up Items</Label>
                <Textarea
                  id="follow_up"
                  value={formData.follow_up}
                  onChange={(e) => setFormData(prev => ({ ...prev, follow_up: e.target.value }))}
                  placeholder="Items needing follow-up..."
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSave}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Save Note
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
    </PullToRefresh>
  );
}