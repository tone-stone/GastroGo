import { create } from 'zustand';

interface SearchState {
  query: string;
  setQuery: (query: string) => void;
}

/** Búsqueda de la barra superior — cada pantalla decide cómo filtrar con `query`. */
export const useSearchStore = create<SearchState>((set) => ({
  query: '',
  setQuery: (query) => set({ query }),
}));
