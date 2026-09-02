import { create } from 'zustand';

const getInitialUser = () => {
  if (typeof window === 'undefined') return null;
  try {
    const saved = sessionStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

const getInitialToken = () => {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('token') || null;
};

const useAuthStore = create((set, get) => ({
  user: getInitialUser(),
  token: getInitialToken(),
  isAuthenticated: false,

  syncAuth: () => {
    if (typeof window === 'undefined') return false;
    const token = sessionStorage.getItem('token');
    const userStr = sessionStorage.getItem('user');
    let user = null;
    try {
      user = userStr ? JSON.parse(userStr) : null;
    } catch {}

    const isAuthed = !!token;
    set({ user, token, isAuthenticated: isAuthed });
    return isAuthed;
  },

  setAuth: (user, token) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('user', JSON.stringify(user));
      sessionStorage.setItem('token', token);
    }
    set({ user, token, isAuthenticated: true });
  },

  updateUser: (userData) => {
    if (typeof window !== 'undefined') {
      const currentUser = get().user || {};
      const updated = { ...currentUser, ...userData };
      sessionStorage.setItem('user', JSON.stringify(updated));
      set({ user: updated });
    } else {
      set((state) => ({ user: { ...state.user, ...userData } }));
    }
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('token');
    }
    set({ user: null, token: null, isAuthenticated: false });
  },
}));

export default useAuthStore;
