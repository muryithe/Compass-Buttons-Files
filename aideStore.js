// Keeps the AI Classroom Aide chat alive outside the dashboard page, so a reply
// keeps loading (and is kept) when you navigate to another page and back.
// Lives in memory only: it clears on refresh and on sign-out.
import { supabase } from '@/api/supabaseClient';
import { toast } from 'sonner';

const empty = { messages: [], draft: '', isLoading: false, error: null };
let state = empty;
let generation = 0; // bumps on reset so late replies from a previous session are dropped
const listeners = new Set();

const set = (patch) => {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
};

export const aideStore = {
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot() {
    return state;
  },
  setDraft(draft) {
    set({ draft });
  },
  reset() {
    generation += 1;
    state = empty;
    listeners.forEach((l) => l());
  },
  async send(text) {
    const content = String(text || '').trim();
    if (!content || state.isLoading) return;
    const gen = generation;
    const previous = state.messages;
    const next = [...previous, { role: 'user', content }];
    set({ messages: next, draft: '', isLoading: true, error: null });
    try {
      const { data, error } = await supabase.functions.invoke('classroom-chat', {
        body: { messages: next },
      });
      if (error) throw error;
      if (gen !== generation) return;
      set({ messages: [...next, { role: 'assistant', content: data.reply }], isLoading: false });
      // nobody is looking at the chat right now
      if (listeners.size === 0) toast.success('Your AI Classroom Aide reply is ready on the Overview page.');
    } catch (err) {
      if (gen !== generation) return;
      const needsPro = err?.context?.status === 402;
      let limitMessage = null;
      if (err?.context?.status === 429) {
        const b = await err.context.json().catch(() => null);
        limitMessage = b?.reason === 'daily_limit'
          ? "You have reached today's AI limit. It resets tomorrow."
          : `You have used this month's AI prompts. They reset on ${b?.resets_on ?? 'the 1st'}.`;
      }
      if (needsPro) window.dispatchEvent(new CustomEvent('cc:upgrade', { detail: { feature: 'ai' } }));
      else console.error('Classroom Aide error', err);
      set({
        messages: previous,
        draft: content,
        isLoading: false,
        error: needsPro
          ? 'The AI Classroom Aide is part of the Pro plan.'
          : limitMessage || 'The assistant could not answer right now. Please try again in a moment.',
      });
    }
  },
};
