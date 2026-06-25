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
  enriched?: boolean;
};

// Dummy data removed to ensure database connectivity is accurately reflected

interface AppState {
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
}

export const useAppStore = create<AppState>((set, get) => ({
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
      const store = useAppStore.getState();
      await store.fetchCompanies();
      
    } catch (err) {
      console.error("Failed to add companies due to network/database error.", err);
    }
  },
  updateCompany: async (id, data) => {
    try {
      // Optimistic update first for better UX
      set((state) => ({
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
        const store = useAppStore.getState();
        await store.fetchCompanies();
      }
    } catch (err) {
      console.error("Database connection unavailable or update failed", err);
      // Revert by refetching
      const store = useAppStore.getState();
      await store.fetchCompanies();
    }
  },
}));
