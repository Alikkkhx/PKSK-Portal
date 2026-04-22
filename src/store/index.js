import { create } from 'zustand';

export const useStore = create((set) => ({
  messages: [],
  requests: [],
  hasMoreMessages: true,
  hasMoreRequests: true,
  isLoading: true,
  historyLoading: false,

  setMessages: (newMessages) => set((state) => {
    const map = new Map();
    state.messages.forEach(m => map.set(m.id, m));
    newMessages.forEach(m => map.set(m.id, m));
    const merged = Array.from(map.values()).sort((a, b) => 
      (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0)
    );
    return { messages: merged, isLoading: false };
  }),

  setRequests: (newRequests) => set((state) => {
    const map = new Map();
    state.requests.forEach(r => map.set(r.id, r));
    newRequests.forEach(r => map.set(r.id, r));
    const merged = Array.from(map.values()).sort((a, b) => 
      (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
    );
    return { requests: merged, isLoading: false };
  }),

  addOlderMessages: (older) => set((state) => {
    const map = new Map();
    state.messages.forEach(m => map.set(m.id, m));
    older.forEach(m => map.set(m.id, m));
    const merged = Array.from(map.values()).sort((a, b) => 
      (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0)
    );
    return { messages: merged, hasMoreMessages: older.length === 20 };
  }),

  addOlderRequests: (older) => set((state) => {
    const map = new Map();
    state.requests.forEach(r => map.set(r.id, r));
    older.forEach(r => map.set(r.id, r));
    const merged = Array.from(map.values()).sort((a, b) => 
      (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
    );
    return { requests: merged, hasMoreRequests: older.length === 15 };
  }),

  setHistoryLoading: (historyLoading) => set({ historyLoading }),
  setIsLoading: (isLoading) => set({ isLoading })
}));
