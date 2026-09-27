import { create } from 'zustand';

export const useSearchStore = create((set) => ({
    searchTerm: '',
    isSearchOpen: false,
    searchResults: {
        projects: [],
        issues: []
    },
    
    setSearchTerm: (term) => set({ searchTerm: term }),
    setSearchOpen: (open) => set({ isSearchOpen: open }),
    
    clearSearch: () => set({ 
        searchTerm: '', 
        isSearchOpen: false,
        searchResults: { projects: [], issues: [] }
    }),
}));
