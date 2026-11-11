import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
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
import { Loader2, Plus, Target, Search, Edit, Trash2, TrendingUp, ClipboardCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

const goalAreas = [
  { value: 'communication', label: 'Communication', color: 'bg-slate-700 text-white' },
  { value: 'social_behavior', label: 'Social/Behavior', color: 'bg-slate-700 text-white' },
  { value: 'literacy_ell', label: 'Literacy/ELL', color: 'bg-slate-700 text-white' },
  { value: 'mathematics', label: 'Mathematics', color: 'bg-slate-700 text-white' },
  { value: 'life_skills', label: 'Life Skills', color: 'bg-slate-700 text-white' },
];

const goalLibrary = [
  'Student will use AAC device to initiate requests in 4 out of 5 opportunities.',
  'Student will use yes/no buttons to express preferences or needs during transitions.',
  'Student will engage in a task for 3-minute intervals with minimal prompting.',
  'Student will transition between activities using visual schedules independently.',
  'Student will independently request motor breaks when needed in 3 out of 5 opportunities.',
  'Student will complete two-step vocational tasks with visual aids in 4 out of 5 trials.'
];

const presetMathematicsGoals = [
  '(Level 1) Student will count objects up to 20 with 1:1 correspondence.',
  '(Level 2) Student will solve single-digit addition and subtraction problems using visual manipulatives (no regrouping).',
  '(Level 3) Student will solve addition and subtraction problems involving regrouping with 80% accuracy.',
  '(Level 4) Student will solve single-digit multiplication problems using arrays or a calculator.',
  '(Functional) Student will identify and name coins and bills to complete a simulated purchase up to $20.',
  '(Level 5 - Advanced Academic) Student will solve 2-digit by 2-digit addition and subtraction problems involving regrouping with 80% accuracy.',
  '(Level 5 - Advanced Academic) Student will solve single and double-digit multiplication problems using standard algorithms or a calculator.',
  '(Level 5 - Advanced Academic) Student will identify, compare, and simplify basic fractions (1/2, 1/4, 3/4) using visual models or manipulatives.',
  '(Level 5 - Advanced Academic) Student will solve real-world word problems involving money and time with 3 or fewer verbal prompts.',
  '(Functional Life Skills) Student will identify and name all US coins and bills (penny, nickel, dime, quarter, $1, $5, $10, $20) with 100% accuracy.',
  '(Functional Life Skills) Student will calculate the total cost of 2 items and determine if they have \'enough\' money to make the purchase.',
  '(Functional Life Skills) Student will use the \'Next Dollar Up\' strategy to pay for items in a simulated or community shopping environment.',
  '(Functional Life Skills) Student will locate 3 items on a shopping list within a store and identify their prices.'
];

const communicationObjectiveTemplates = [
  'Will navigate to the target page on AAC with physical guidance.',
  'Will select the target icon with a single verbal prompt.',
  'Will independently initiate the request using the AAC device.'
];

const socialBehaviorObjectiveTemplates = [
  'Will remain at a workstation for 60 seconds with continuous support.',
  'Will complete a 2-minute task with no more than two redirections.',
  'Will engage in a non-preferred task for 3 minutes independently.'
];

const mathematicsObjectiveTemplates = [
  'Will touch-count objects 1-5 with hand-over-hand support.',
  'Will count objects 1-10 with visual counting mats.',
  'Will independently count a set of 20 objects with 1:1 correspondence.'
];

const literacyEllObjectiveTemplates = [
  'Will point to a target picture/icon when the word is spoken.',
  'Will match 5 functional sight words to their corresponding objects.',
  'Will identify 10 high-frequency icons or words without visual cues.'
];

const functionalLifeSkillsObjectiveTemplates = [
  'Will sort coins into matching categories (e.g., all quarters in one pile) with 80% accuracy.',
  'Will use a calculator to add the prices of two items from a grocery circular.',
  'Will demonstrate the \'Next Dollar Up\' method by providing $5 for an item costing $4.25.',
  'Will independently wait in a checkout line and hand the payment to the cashier.'
];

const baselineTargetOptions = [
  'Independent (no prompts)',
  'Verbal/Gestural prompts',
  'Physical assistance (HOH)',
  'Grade-level with accommodations',
  'Needs frequent redirection',
  'Other (Custom)'
];

const statusOptions = [
  { value: 'active', label: 'Active', color: 'bg-blue-700 text-white' },
  { value: 'mastered', label: 'Mastered', color: 'bg-green-700 text-white' },
  { value: 'modified', label: 'Modified', color: 'bg-slate-700 text-white' },
  { value: 'discontinued', label: 'Discontinued', color: 'bg-slate-600 text-white' },
];

export default function IEPGoals() {
  const urlParams = new URLSearchParams(window.location.search);
  const studentIdFromUrl = urlParams.get('student');

  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [studentFilter, setStudentFilter] = useState(studentIdFromUrl || 'all');
  const [areaFilter, setAreaFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    student_id: studentIdFromUrl || '',
    goal_area: 'communication',
    goal_description: '',
    short_term_objectives: [],
    baseline: '',
    target: '',
    current_progress: 0,
    measurement_method: 'Observation',
    review_date: '',
    status: 'active',
    notes: ''
  });
  const [newObjective, setNewObjective] = useState('');
  const [showGoalLibrary, setShowGoalLibrary] = useState(false);
  const [showTemplateCheckboxes, setShowTemplateCheckboxes] = useState(false);
  const [customObjectiveIndices, setCustomObjectiveIndices] = useState([]);
  const queryClient = useQueryClient();

  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: ['students'],
    queryFn: () => base44.entities.Student.filter({ status: 'active' }),
  });

  const { data: goals = [], isLoading: loadingGoals } = useQuery({
    queryKey: ['goals'],
    queryFn: () => base44.entities.IEPGoal.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.IEPGoal.create(data),
    onMutate: async (newGoal) => {
      await queryClient.cancelQueries({ queryKey: ['goals'] });
      const previousGoals = queryClient.getQueryData(['goals']);
      queryClient.setQueryData(['goals'], (old = []) => [
        { ...newGoal, id: 'temp-' + Date.now() },
        ...old
      ]);
      return { previousGoals };
    },
    onError: (err, newGoal, context) => {
      queryClient.setQueryData(['goals'], context.previousGoals);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setShowForm(false);
      resetForm();
      toast.success('IEP Goal added');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.IEPGoal.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['goals'] });
      const previousGoals = queryClient.getQueryData(['goals']);
      queryClient.setQueryData(['goals'], (old = []) =>
        old.map(goal => goal.id === id ? { ...goal, ...data } : goal)
      );
      return { previousGoals };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['goals'], context.previousGoals);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setShowForm(false);
      setEditingGoal(null);
      resetForm();
      toast.success('IEP Goal updated');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.IEPGoal.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['goals'] });
      const previousGoals = queryClient.getQueryData(['goals']);
      queryClient.setQueryData(['goals'], (old = []) =>
        old.filter(goal => goal.id !== id)
      );
      return { previousGoals };
    },
    onError: (err, id, context) => {
      queryClient.setQueryData(['goals'], context.previousGoals);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setDeleteId(null);
      toast.success('IEP Goal deleted');
    },
  });

  const resetForm = () => {
    setFormData({
      student_id: studentIdFromUrl || '',
      goal_area: 'communication',
      goal_description: '',
      short_term_objectives: [],
      baseline: '',
      target: '',
      current_progress: 0,
      measurement_method: 'Observation',
      review_date: '',
      status: 'active',
      notes: ''
    });
    setNewObjective('');
    setShowTemplateCheckboxes(false);
    setCustomObjectiveIndices([]);
  };

  const handleEdit = (goal) => {
    setFormData({
      student_id: goal.student_id,
      goal_area: goal.goal_area,
      goal_description: goal.goal_description,
      short_term_objectives: goal.short_term_objectives || [],
      baseline: goal.baseline || '',
      target: goal.target || '',
      current_progress: goal.current_progress || 0,
      measurement_method: goal.measurement_method || '',
      review_date: goal.review_date || '',
      status: goal.status || 'active',
      notes: goal.notes || ''
    });
    setEditingGoal(goal);
    setShowForm(true);
    setShowTemplateCheckboxes(false);
    setCustomObjectiveIndices([]);
  };

  const handleSave = () => {
    if (editingGoal) {
      updateMutation.mutate({ id: editingGoal.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const addObjective = () => {
    if (newObjective.trim()) {
      setFormData(prev => ({
        ...prev,
        short_term_objectives: [...(prev.short_term_objectives || []), newObjective.trim()]
      }));
      setNewObjective('');
    }
  };

  const removeObjective = (index) => {
    setFormData(prev => ({
      ...prev,
      short_term_objectives: prev.short_term_objectives.filter((_, i) => i !== index)
    }));
    setCustomObjectiveIndices(prev => prev.filter(i => i !== index).map(i => i > index ? i - 1 : i));
  };

  const getTemplateForArea = (area) => {
    switch(area) {
      case 'communication': return communicationObjectiveTemplates;
      case 'social_behavior': return socialBehaviorObjectiveTemplates;
      case 'mathematics': return mathematicsObjectiveTemplates;
      case 'literacy_ell': return literacyEllObjectiveTemplates;
      case 'life_skills': return functionalLifeSkillsObjectiveTemplates;
      default: return [];
    }
  };

  const toggleTemplateObjective = (objective) => {
    setFormData(prev => {
      const current = prev.short_term_objectives || [];
      if (current.includes(objective)) {
        const index = current.indexOf(objective);
        const newCustomIndices = customObjectiveIndices.filter(i => i !== index).map(i => i > index ? i - 1 : i);
        setCustomObjectiveIndices(newCustomIndices);
        return {
          ...prev,
          short_term_objectives: current.filter(obj => obj !== objective)
        };
      } else {
        return {
          ...prev,
          short_term_objectives: [...current, objective]
        };
      }
    });
  };

  const addCustomObjective = () => {
    const newIndex = (formData.short_term_objectives || []).length;
    setFormData(prev => ({
      ...prev,
      short_term_objectives: [...(prev.short_term_objectives || []), '']
    }));
    setCustomObjectiveIndices(prev => [...prev, newIndex]);
  };

  const getStudentName = (studentId) => {
    const student = students.find(s => s.id === studentId);
    return student ? `${student.first_name} ${student.last_name}` : 'Unknown';
  };

  const filteredGoals = goals.filter(goal => {
    const matchesStudent = studentFilter === 'all' || goal.student_id === studentFilter;
    const matchesArea = areaFilter === 'all' || goal.goal_area === areaFilter;
    const matchesSearch = goal.goal_description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStudent && matchesArea && matchesSearch;
  });

  const isLoading = loadingStudents || loadingGoals;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-blue-700" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl">
              <Target className="h-6 w-6 text-blue-700" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">IEP Goals</h1>
              <p className="text-slate-600">Track student progress towards goals</p>
            </div>
          </div>
          <Button 
            onClick={() => { resetForm(); setEditingGoal(null); setShowForm(true); }}
            className="bg-blue-700 hover:bg-blue-800"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Goal
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search goals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={studentFilter} onValueChange={setStudentFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Students" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Students</SelectItem>
              {students.map(student => (
                <SelectItem key={student.id} value={student.id}>
                  {student.first_name} {student.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={areaFilter} onValueChange={setAreaFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Areas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Areas</SelectItem>
              {goalAreas.map(area => (
                <SelectItem key={area.value} value={area.value}>{area.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Goals Grid */}
        {filteredGoals.length === 0 ? (
          <Card className="text-center py-16">
            <Target className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-600 mb-2">No IEP goals found</h3>
            <p className="text-slate-500 mb-4">
              {searchTerm || studentFilter !== 'all' || areaFilter !== 'all'
                ? "Try adjusting your filters"
                : "Add goals to track student progress"}
            </p>
            {!searchTerm && studentFilter === 'all' && areaFilter === 'all' && (
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Goal
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredGoals.map(goal => {
              const areaInfo = goalAreas.find(a => a.value === goal.goal_area);
              const statusInfo = statusOptions.find(s => s.value === goal.status);

              return (
                <Card key={goal.id} className="bg-white border border-slate-200 hover:shadow-md transition-shadow select-none">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-bold text-gray-900 mb-1">
                          {getStudentName(goal.student_id)}
                        </p>
                        <div className="flex gap-2">
                          <Badge className={areaInfo?.color || 'bg-slate-100'}>
                            {areaInfo?.label || goal.goal_area}
                          </Badge>
                          <Badge className={statusInfo?.color || 'bg-slate-100'}>
                            {statusInfo?.label || goal.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Link to={createPageUrl(`GoalDataCollection?goal=${goal.id}`)}>
                          <Button variant="ghost" size="icon" className="text-green-600" title="Collect Data">
                            <ClipboardCheck className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(goal)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(goal.id)} className="text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-gray-900 font-medium leading-[1.4]">{goal.goal_description}</p>

                    {goal.current_progress !== null && (
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-slate-600 flex items-center gap-1">
                            <TrendingUp className="h-4 w-4" />
                            Progress
                          </span>
                          <span className="font-bold text-gray-900">{goal.current_progress}%</span>
                        </div>
                        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                            style={{ width: `${goal.current_progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {goal.short_term_objectives?.length > 0 && (
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Objectives</p>
                        <ul className="space-y-1">
                          {goal.short_term_objectives.slice(0, 3).map((obj, i) => (
                            <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                              <span className="text-slate-400">•</span>
                              {obj}
                            </li>
                          ))}
                          {goal.short_term_objectives.length > 3 && (
                            <li className="text-xs text-slate-400">
                              +{goal.short_term_objectives.length - 3} more
                            </li>
                          )}
                        </ul>
                      </div>
                    )}

                    {goal.review_date && (
                      <p className="text-xs text-slate-500">
                        Review: {format(new Date(goal.review_date), 'MMM d, yyyy')}
                      </p>
                    )}

                    <Link to={createPageUrl(`GoalDataCollection?goal=${goal.id}`)}>
                      <Button size="sm" className="w-full mt-4 bg-green-600 hover:bg-green-700">
                        <ClipboardCheck className="h-4 w-4 mr-2" />
                        Collect Data (I-V-G-Ph)
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Form Modal */}
        <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) { setEditingGoal(null); resetForm(); } }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingGoal ? 'Edit IEP Goal' : 'Add New IEP Goal'}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Student *</Label>
                  <Select 
                    value={formData.student_id} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, student_id: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select student..." />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map(student => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.first_name} {student.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Goal Category *</Label>
                  <Select 
                    value={formData.goal_area} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, goal_area: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {goalAreas.map(area => (
                        <SelectItem key={area.value} value={area.value}>{area.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.goal_area === 'mathematics' && (
                <div className="space-y-2">
                  <Label>Pre-set Goals (Optional)</Label>
                  <Select 
                    value=""
                    onValueChange={(v) => setFormData(prev => ({ ...prev, goal_description: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a pre-set mathematics goal..." />
                    </SelectTrigger>
                    <SelectContent>
                      {presetMathematicsGoals.map((goal, i) => (
                        <SelectItem key={i} value={goal}>
                          {goal.length > 70 ? goal.substring(0, 70) + '...' : goal}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Goal Description *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowGoalLibrary(!showGoalLibrary)}
                    className="text-xs"
                  >
                    {showGoalLibrary ? 'Hide' : 'Browse'} Goal Library
                  </Button>
                </div>
                
                {showGoalLibrary && (
                  <div className="p-3 bg-white rounded-lg border border-gray-200 space-y-2 max-h-64 overflow-y-auto">
                    <p className="text-xs text-slate-600 mb-2">Click a goal to use it as a template:</p>
                    {goalLibrary.map((goal, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, goal_description: goal }));
                          setShowGoalLibrary(false);
                        }}
                        className="w-full text-left p-2 text-sm bg-white border border-gray-200 rounded hover:border-blue-700 hover:bg-sky-50 transition-colors"
                      >
                        {goal}
                      </button>
                    ))}
                  </div>
                )}
                
                <Textarea
                  value={formData.goal_description}
                  onChange={(e) => setFormData(prev => ({ ...prev, goal_description: e.target.value }))}
                  placeholder="Enter your own goal or browse the library above..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Short-term Objectives</Label>
                  <div className="flex gap-2">
                    {getTemplateForArea(formData.goal_area).length > 0 && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowTemplateCheckboxes(!showTemplateCheckboxes)}
                      >
                        Load Template
                      </Button>
                    )}
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={addCustomObjective}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Field
                    </Button>
                  </div>
                </div>

                {showTemplateCheckboxes && getTemplateForArea(formData.goal_area).length > 0 && (
                  <div className="p-3 bg-white rounded-lg space-y-2 border border-gray-200">
                    <p className="text-xs text-slate-600 mb-2">Select objectives to add:</p>
                    {getTemplateForArea(formData.goal_area).map((template, idx) => (
                      <label key={idx} className="flex items-start gap-2 cursor-pointer hover:bg-slate-100 p-2 rounded">
                        <input
                          type="checkbox"
                          checked={formData.short_term_objectives?.includes(template)}
                          onChange={() => toggleTemplateObjective(template)}
                          className="mt-1"
                        />
                        <span className="text-sm text-slate-700">{template}</span>
                      </label>
                    ))}
                  </div>
                )}

                <div className="space-y-2">
                  {formData.short_term_objectives?.map((obj, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input
                        value={obj}
                        onChange={(e) => {
                          const updated = [...formData.short_term_objectives];
                          updated[i] = e.target.value;
                          setFormData(prev => ({ ...prev, short_term_objectives: updated }));
                        }}
                        placeholder={`Objective ${i + 1}...`}
                        readOnly={!customObjectiveIndices.includes(i)}
                        className={!customObjectiveIndices.includes(i) ? 'bg-slate-50' : ''}
                      />
                      {customObjectiveIndices.includes(i) && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-red-500"
                          onClick={() => removeObjective(i)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Baseline</Label>
                  <Select 
                    value={baselineTargetOptions.includes(formData.baseline) ? formData.baseline : 'Other (Custom)'} 
                    onValueChange={(v) => {
                      if (v === 'Other (Custom)' && !baselineTargetOptions.includes(formData.baseline)) {
                        return;
                      }
                      setFormData(prev => ({ ...prev, baseline: v === 'Other (Custom)' ? '' : v }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select baseline..." />
                    </SelectTrigger>
                    <SelectContent>
                      {baselineTargetOptions.map(option => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {(!baselineTargetOptions.includes(formData.baseline) || formData.baseline === 'Other (Custom)') && (
                    <Input
                      value={formData.baseline === 'Other (Custom)' ? '' : formData.baseline}
                      onChange={(e) => setFormData(prev => ({ ...prev, baseline: e.target.value }))}
                      placeholder="Enter custom baseline..."
                      className="mt-2"
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Target</Label>
                  <Select 
                    value={baselineTargetOptions.includes(formData.target) ? formData.target : 'Other (Custom)'} 
                    onValueChange={(v) => {
                      if (v === 'Other (Custom)' && !baselineTargetOptions.includes(formData.target)) {
                        return;
                      }
                      setFormData(prev => ({ ...prev, target: v === 'Other (Custom)' ? '' : v }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select target..." />
                    </SelectTrigger>
                    <SelectContent>
                      {baselineTargetOptions.map(option => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {(!baselineTargetOptions.includes(formData.target) || formData.target === 'Other (Custom)') && (
                    <Input
                      value={formData.target === 'Other (Custom)' ? '' : formData.target}
                      onChange={(e) => setFormData(prev => ({ ...prev, target: e.target.value }))}
                      placeholder="Enter custom target..."
                      className="mt-2"
                    />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Current Progress: {formData.current_progress}%</Label>
                <Slider
                  value={[formData.current_progress]}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, current_progress: v[0] }))}
                  max={100}
                  step={5}
                  className="touch-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Measurement Method</Label>
                  <Select 
                    value={formData.measurement_method} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, measurement_method: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select method..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Observation">Observation</SelectItem>
                      <SelectItem value="Data Collection">Data Collection</SelectItem>
                      <SelectItem value="Work Samples">Work Samples</SelectItem>
                      <SelectItem value="Teacher-Made Tests">Teacher-Made Tests</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Review Date</Label>
                  <Input
                    type="date"
                    value={formData.review_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, review_date: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, status: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(status => (
                      <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
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
                disabled={!formData.student_id || !formData.goal_description || !formData.target || createMutation.isPending || updateMutation.isPending}
                className="bg-blue-700 hover:bg-blue-800"
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {editingGoal ? 'Update Goal' : 'Add Goal'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete IEP Goal?</AlertDialogTitle>
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
  );
}