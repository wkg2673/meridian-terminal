"use client";

import { create } from "zustand";

interface UiState {
  searchOpen: boolean;
  shortcutsOpen: boolean;
  mobileNavOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  setShortcutsOpen: (open: boolean) => void;
  setMobileNavOpen: (open: boolean) => void;
}

export const useUi = create<UiState>((set) => ({
  searchOpen: false,
  shortcutsOpen: false,
  mobileNavOpen: false,
  setSearchOpen: (searchOpen) => set({ searchOpen }),
  setShortcutsOpen: (shortcutsOpen) => set({ shortcutsOpen }),
  setMobileNavOpen: (mobileNavOpen) => set({ mobileNavOpen }),
}));
