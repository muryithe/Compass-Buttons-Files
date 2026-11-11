import React, { useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Loader2, Lightbulb } from 'lucide-react';
import { FadeIn, RotatingText } from '@/components/motion';
import { useAuth } from '@/lib/AuthContext';

import TodaySchedule from '@/components/dashboard/TodaySchedule';
import StudentQuickView from '@/components/dashboard/StudentQuickView';
import QuickActions from '@/components/dashboard/QuickActions';
import RecentAlerts from '@/components/dashboard/RecentAlerts';
import PullToRefresh from '@/components/PullToRefresh';
import AutomatedInsights from '@/components/dashboard/AutomatedInsights';
import AIClassroomChat from '@/components/dashboard/AIClassroomChat';

const dayMap = {
  0: null,
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: null
};

const TIPS = [
  'Small wins add up: log one positive moment today.',
  'Check the visual schedule together before each transition.',
  'Pair a verbal prompt with a visual cue.',
  'Offer a movement break before frustration builds.',
  'Celebrate effort, not just accuracy.',
  'Consistent routines make hard days easier.',
  'Wait time matters: give a full 10 seconds before prompting.',
];

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

export default function Dashboard() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const firstName = (user?.full_name || '').split(' ')[0];
  const seededRef = useRef(false);

  useEffect(() => {
    if (seededRef.current) return;
    seededRef.current = true;
    base44.functions.invoke('seedPracticeStudents', {}).then((res) => {
      if (res.data?.seeded) {
        queryClient.invalidateQueries({ queryKey: ['students'] });
      }
    }).catch(() => {});
  }, []);
  const today = new Date();
  const todayString = format(today, 'yyyy-MM-dd');
  const currentDay = dayMap[today.getDay()];

  const handleRefresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['students'] }),
      queryClient.invalidateQueries({ queryKey: ['scheduleBlocks'] }),
      queryClient.invalidateQueries({ queryKey: ['dailyNotes'] }),
      queryClient.invalidateQueries({ queryKey: ['behaviorLogs'] })
    ]);
  };

  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: ['students'],
    queryFn: () => base44.entities.Student.filter({ status: 'active' }),
  });

  const { data: scheduleBlocks = [], isLoading: loadingSchedule } = useQuery({
    queryKey: ['scheduleBlocks', currentDay],
    queryFn: () => currentDay 
      ? base44.entities.ScheduleBlock.filter({ day_of_week: currentDay })
      : Promise.resolve([]),
    enabled: !!currentDay,
  });

  const { data: dailyNotes = [], isLoading: loadingNotes } = useQuery({
    queryKey: ['dailyNotes', todayString],
    queryFn: () => base44.entities.DailyNote.filter({ date: todayString }),
  });

  const { data: behaviorLogs = [], isLoading: loadingLogs } = useQuery({
    queryKey: ['behaviorLogs'],
    queryFn: () => base44.entities.BehaviorLog.list('-date', 20),
  });

  const sortedSchedule = [...scheduleBlocks].sort((a, b) => 
    a.start_time.localeCompare(b.start_time)
  );

  const isLoading = loadingStudents || loadingSchedule || loadingNotes || loadingLogs;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-slate-600">Loading your classroom...</p>
        </div>
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <img src="/cc-icon.png" alt="" className="h-10 w-10 rounded-xl" />
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
                Behavior Tracker
              </h1>
            </div>
            <p className="text-slate-600">
              {greeting()}{firstName ? `, ${firstName}` : ''}. Track student behavior for every lesson.
            </p>
            <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-full bg-amber-50 border border-amber-100 px-3 py-1.5 text-sm text-amber-900">
              <Lightbulb className="h-4 w-4 shrink-0 text-amber-500" />
              <RotatingText items={TIPS} interval={6000} className="min-w-0" />
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              <FadeIn><AutomatedInsights /></FadeIn>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TodaySchedule scheduleBlocks={sortedSchedule} students={students} />
                <StudentQuickView students={students} dailyNotes={dailyNotes} />
              </div>
              <FadeIn delay={0.2}><RecentAlerts behaviorLogs={behaviorLogs} students={students} /></FadeIn>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <FadeIn delay={0.1}><QuickActions /></FadeIn>

              {/* Stats Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                  <p className="text-3xl font-bold text-blue-600">{students.length}</p>
                  <p className="text-sm text-slate-600 mt-1">Students</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                  <p className="text-3xl font-bold text-green-600">
                    {dailyNotes.filter(n => n.overall_day === 'excellent' || n.overall_day === 'good').length}
                  </p>
                  <p className="text-sm text-slate-600 mt-1">Great Days</p>
                </div>
              </div>

              <FadeIn delay={0.3}><AIClassroomChat /></FadeIn>
            </div>
          </div>
        </div>
      </div>
    </PullToRefresh>
  );
}
