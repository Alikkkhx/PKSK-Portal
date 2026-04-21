import { create } from 'zustand';
import { firebaseApi } from '../service/firebaseApi';

export const useStore = create((set, get) => ({
  messages: [],
  requests: [],
  hasMoreMessages: true,
  hasMoreRequests: true,
  isLoading: true,
  historyLoading: false,

  setMessages: (messages) => set({ messages, isLoading: false }),
  setRequests: (requests) => set({ requests, isLoading: false }),

  addOlderMessages: (older) => set((state) => ({
    messages: [...older.reverse(), ...state.messages],
    hasMoreMessages: older.length === 20
  })),

  addOlderRequests: (older) => set((state) => ({
    requests: [...state.requests, ...older],
    hasMoreRequests: older.length === 15
  })),

  setHistoryLoading: (historyLoading) => set({ historyLoading })
}));
