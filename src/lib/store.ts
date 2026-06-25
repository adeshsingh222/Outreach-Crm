import { create } from 'zustand';

export type Company = {
  id: string;
  name: string;
  website: string;
  status: string;
  priority: string;
  lastContact: string;
  phone?: string;
  address?: string;
  category?: string;
  rating?: number;
  reviews?: number;
  placeId?: string;
  imageUrl?: string;
  enriched?: boolean;
};

export type Asset = {
  id: string;
  title: string;
  url: string;
  type: 'PDF' | 'Portfolio' | 'GitHub' | 'LinkedIn' | 'Other';
  description?: string;
  createdAt: string;
};

// Dummy data removed to ensure database connectivity is accurately reflected

interface AppState {
  user: any;
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  companies: Company[];
  totalCompanies: number;
  currentPage: number;
  limit: number;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  fetchCompanies: (page?: number, limit?: number) => Promise<void>;
  addCompanies: (newCompanies: Company[]) => Promise<void>;
  updateCompany: (id: string, data: Partial<Company>) => Promise<void>;

  assets: Asset[];
  fetchAssets: () => Promise<void>;
  addAsset: (asset: Omit<Asset, 'id' | 'createdAt' | 'url'> & { url?: string; file?: File }) => Promise<void>;
  deleteAsset: (id: string) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoadingAuth: true,
  login: async (email, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (res.ok) {
        const data = await res.json();
        set({ user: data.user, isAuthenticated: true });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },
  logout: async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      set({ user: null, isAuthenticated: false });
    } catch (err) {
      console.error(err);
    }
  },
  checkAuth: async () => {
    try {
      set({ isLoadingAuth: true });
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        set({ user: data.user, isAuthenticated: true, isLoadingAuth: false });
      } else {
        set({ user: null, isAuthenticated: false, isLoadingAuth: false });
      }
    } catch {
      set({ user: null, isAuthenticated: false, isLoadingAuth: false });
    }
  },

  theme: 'light',
  setTheme: (theme) => set({ theme }),
  isSidebarOpen: true,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  companies: [],
  totalCompanies: 0,
  currentPage: 1,
  limit: 20,
  setPage: (page) => set({ currentPage: page }),
  setLimit: (limit) => set({ limit, currentPage: 1 }), // Reset to page 1 on limit change
  fetchCompanies: async (page = get().currentPage, limit = get().limit) => {
    try {
      const res = await fetch(`/api/companies?page=${page}&limit=${limit}`);
      if (!res.ok) {
        console.error("Failed to fetch companies");
        set({ companies: [], totalCompanies: 0 });
        return;
      }
      const data = await res.json();
      set({ 
        companies: data.data, 
        totalCompanies: data.total,
        currentPage: data.page 
      });
    } catch (error) {
      console.error("Database connection unavailable or request failed", error);
      set({ companies: [], totalCompanies: 0 });
    }
  },
  addCompanies: async (newCompanies) => {
    try {
      const res = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCompanies)
      });
      if (!res.ok) {
        console.error("Failed to persist to database.");
        return;
      }
      
      // Refetch from database to get the real MongoDB ObjectIds
      await get().fetchCompanies();
      
    } catch (err) {
      console.error("Failed to add companies due to network/database error.", err);
    }
  },
  updateCompany: async (id, data) => {
    try {
      // Optimistic update first for better UX
      set(state => ({
        companies: state.companies.map(c => c.id === id ? { ...c, ...data } : c)
      }));

      const res = await fetch(`/api/companies/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!res.ok) {
        console.error("Failed to persist update to database. Reverting...");
        // Revert by refetching
        await get().fetchCompanies();
      }
    } catch (err) {
      console.error("Database connection unavailable or update failed", err);
      // Revert by refetching
      await get().fetchCompanies();
    }
  },
  
  assets: [],
  fetchAssets: async () => {
    try {
      const res = await fetch('/api/assets');
      if (res.ok) {
        const data = await res.json();
        set({ assets: data.data || data });
      } else {
        set({ assets: [] });
      }
    } catch (err) {
      console.error("Failed to fetch assets", err);
      set({ assets: [] });
    }
  },
  addAsset: async (asset) => {
    try {
      let body: any;
      let headers: HeadersInit = {};

      if (asset.file) {
        const formData = new FormData();
        formData.append('title', asset.title);
        formData.append('type', asset.type);
        if (asset.description) formData.append('description', asset.description);
        formData.append('file', asset.file);
        body = formData;
      } else {
        headers = { 'Content-Type': 'application/json' };
        body = JSON.stringify(asset);
      }

      const res = await fetch('/api/assets', {
        method: 'POST',
        headers,
        body
      });
      if (res.ok) {
        await get().fetchAssets();
      }
    } catch (err) {
      console.error("Failed to add asset", err);
    }
  },
  deleteAsset: async (id) => {
    try {
      const res = await fetch(`/api/assets/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await get().fetchAssets();
      }
    } catch (err) {
      console.error("Failed to delete asset", err);
    }
  }
}));
