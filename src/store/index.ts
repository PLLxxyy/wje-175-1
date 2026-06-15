import { create } from 'zustand';
import type { User, Pet } from '@shared/types';

interface AppointmentDraft {
  petId?: number;
  departmentId?: number;
  doctorId?: number;
  date?: string;
  timeSlot?: string;
}

interface AppState {
  user: User | null;
  token: string | null;
  selectedPet: Pet | null;
  appointmentDraft: AppointmentDraft;

  setUser: (user: User | null, token: string | null) => void;
  logout: () => void;
  setSelectedPet: (pet: Pet | null) => void;
  setAppointmentDraft: (draft: Partial<AppointmentDraft>) => void;
  clearAppointmentDraft: () => void;
}

const loadFromStorage = (): Pick<AppState, 'user' | 'token'> => {
  try {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    return { token, user };
  } catch {
    return { token: null, user: null };
  }
};

const { user: storedUser, token: storedToken } = loadFromStorage();

export const useAppStore = create<AppState>((set) => ({
  user: storedUser,
  token: storedToken,
  selectedPet: null,
  appointmentDraft: {},

  setUser: (user, token) => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
    set({ user, token });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null, selectedPet: null, appointmentDraft: {} });
  },

  setSelectedPet: (pet) => set({ selectedPet: pet }),

  setAppointmentDraft: (draft) =>
    set((state) => ({
      appointmentDraft: { ...state.appointmentDraft, ...draft },
    })),

  clearAppointmentDraft: () => set({ appointmentDraft: {} }),
}));
