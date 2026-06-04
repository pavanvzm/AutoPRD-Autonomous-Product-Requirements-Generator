import { create } from 'zustand';

const API_BASE = '/api/v1';

export const useAppStore = create((set, get) => ({
  // State
  currentStep: 'input', // input, discovery, generating, prd
  project: null,
  session: null,
  prd: null,
  loading: false,
  error: null,
  
  // Actions
  setProject: (project) => set({ project }),
  setSession: (session) => set({ session }),
  setPrd: (prd) => set({ prd }),
  setError: (error) => set({ error }),
  setLoading: (loading) => set({ loading }),
  setStep: (step) => set({ currentStep: step }),
  
  // API Calls
  startDiscovery: async (title, description, rawInput) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/discovery/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, raw_input: rawInput, input_type: 'text' }),
      });
      
      if (!response.ok) throw new Error('Failed to start discovery');
      
      const data = await response.json();
      set({ 
        project: { id: data.project_id, title, description },
        session: { id: data.session_id, questions: data.questions, answers: {} },
        currentStep: 'discovery',
        loading: false 
      });
      return data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  
  submitAnswers: async (answers) => {
    const { session } = get();
    set({ loading: true, error: null });
    
    try {
      const response = await fetch(`${API_BASE}/discovery/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: session.id, answers }),
      });
      
      if (!response.ok) throw new Error('Failed to submit answers');
      
      const updatedSession = { ...session, answers };
      set({ session: updatedSession, loading: false });
      return response.json();
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  
  generatePRD: async () => {
    const { project, session } = get();
    set({ loading: true, error: null, currentStep: 'generating' });
    
    try {
      const response = await fetch(`${API_BASE}/prd/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          project_id: project.id, 
          session_id: session?.id 
        }),
      });
      
      if (!response.ok) throw new Error('Failed to generate PRD');
      
      const data = await response.json();
      
      // Poll for PRD completion
      let prdData = null;
      let attempts = 0;
      while (!prdData && attempts < 30) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        try {
          const prdResponse = await fetch(`${API_BASE}/prd/${data.prd_id}`);
          if (prdResponse.ok) {
            prdData = await prdResponse.json();
            if (prdData.status === 'completed') break;
          }
        } catch (e) {
          // Continue polling
        }
        attempts++;
      }
      
      if (prdData) {
        set({ prd: prdData, currentStep: 'prd', loading: false });
      } else {
        throw new Error('PRD generation timed out');
      }
      
      return data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  
  reset: () => set({
    currentStep: 'input',
    project: null,
    session: null,
    prd: null,
    loading: false,
    error: null,
  }),
}));
