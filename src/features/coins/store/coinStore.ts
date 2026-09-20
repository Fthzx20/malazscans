import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CoinPackage, CoinTransaction } from '@/types';

export const DEFAULT_COIN_PACKAGES: CoinPackage[] = [
  { id: 'pkg_50', coins: 50, priceIdr: 5000, label: '50 Coins' },
  { id: 'pkg_100', coins: 100, priceIdr: 10000, label: '100 Coins', badge: 'POPULAR' },
  { id: 'pkg_250', coins: 250, bonusCoins: 25, priceIdr: 25000, label: '250 + 25 Bonus', badge: 'BEST VALUE' },
  { id: 'pkg_500', coins: 500, bonusCoins: 75, priceIdr: 50000, label: '500 + 75 Bonus', badge: 'MEGA PACK' },
];

interface CoinState {
  userCoins: number;
  unlockedChapterIds: string[]; // List of unlocked chapter IDs
  transactions: CoinTransaction[];
  isWalletOpen: boolean;
  selectedPackage: CoinPackage | null;

  // Actions
  openWallet: (pkg?: CoinPackage) => void;
  closeWallet: () => void;
  setSelectedPackage: (pkg: CoinPackage | null) => void;
  addCoins: (amount: number, description?: string) => void;
  unlockChapter: (novelId: string, chapterId: string, cost: number, chapterTitle?: string) => boolean;
  syncUnlockedChapters: () => Promise<void>;
  isChapterUnlocked: (chapterId: string) => boolean;
  resetBalanceForTesting: () => void;
  setCoins: (amount: number) => void;
}

export const useCoinStore = create<CoinState>()(
  persist(
    (set, get) => ({
      userCoins: 0, // No free coins by default (prevents multi-account exploitation)
      unlockedChapterIds: [],
      transactions: [],
      isWalletOpen: false,
      selectedPackage: DEFAULT_COIN_PACKAGES[1], // default 100 koin

      openWallet: (pkg?: CoinPackage) =>
        set({
          isWalletOpen: true,
          selectedPackage: pkg || get().selectedPackage || DEFAULT_COIN_PACKAGES[1],
        }),

      closeWallet: () => set({ isWalletOpen: false }),

      setSelectedPackage: (pkg: CoinPackage | null) => set({ selectedPackage: pkg }),

      addCoins: (amount: number, description = 'Coin Top Up') => {
        const newTx: CoinTransaction = {
          id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          type: 'TOPUP',
          amount,
          description,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          userCoins: state.userCoins + amount,
          transactions: [newTx, ...state.transactions],
        }));
      },

      syncUnlockedChapters: async () => {
        try {
          const res = await fetch('/api/coins/unlocked');
          if (res.ok) {
            const data: { chapterId: string }[] = await res.json();
            const cloudIds = data.map((d) => d.chapterId);
            const localIds = get().unlockedChapterIds;
            const merged = Array.from(new Set([...cloudIds, ...localIds]));
            set({ unlockedChapterIds: merged });
          }
        } catch {
          // Offline or unauthenticated
        }
      },

      unlockChapter: (novelId: string, chapterId: string, cost: number, chapterTitle?: string) => {
        const { userCoins, unlockedChapterIds, transactions } = get();

        // Already unlocked?
        if (unlockedChapterIds.includes(chapterId)) {
          return true;
        }

        // Check balance
        if (userCoins < cost) {
          return false;
        }

        const newTx: CoinTransaction = {
          id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          type: 'UNLOCK',
          amount: -cost,
          description: chapterTitle ? `Unlocked: ${chapterTitle}` : `Unlocked Chapter #${chapterId}`,
          createdAt: new Date().toISOString(),
          novelId,
          chapterId,
        };

        set({
          userCoins: userCoins - cost,
          unlockedChapterIds: [...unlockedChapterIds, chapterId],
          transactions: [newTx, ...transactions],
        });

        // Sync with server if logged in
        fetch('/api/coins/unlock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ novelId, chapterId, cost, chapterTitle }),
        })
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data && typeof data.coins === 'number') {
              set({ userCoins: data.coins });
            }
          })
          .catch(() => {});

        return true;
      },

      isChapterUnlocked: (chapterId: string) => {
        return get().unlockedChapterIds.includes(chapterId);
      },

      resetBalanceForTesting: () => {
        set({
          userCoins: 0,
          unlockedChapterIds: [],
          transactions: [],
        });
      },

      setCoins: (amount: number) => {
        set({ userCoins: amount });
      },
    }),
    {
      name: 'malaz_coin_store',
      partialize: (state) => ({
        userCoins: state.userCoins,
        unlockedChapterIds: state.unlockedChapterIds,
        transactions: state.transactions,
      }),
    }
  )
);
