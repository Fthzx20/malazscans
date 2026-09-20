'use client';

import React, { useState, useEffect } from 'react';
import { 
  Coins, 
  X, 
  CheckCircle2, 
  QrCode, 
  History, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Sparkles,
  Loader2,
  Lock
} from 'lucide-react';
import { useCoinStore, DEFAULT_COIN_PACKAGES } from '../store/coinStore';
import { useAuthStore } from '../../auth/store/authStore';
import { CoinPackage } from '@/types';

export const CoinWalletModal: React.FC = () => {
  const isWalletOpen = useCoinStore((state) => state.isWalletOpen);
  const closeWallet = useCoinStore((state) => state.closeWallet);
  const userCoins = useCoinStore((state) => state.userCoins);
  const selectedPackage = useCoinStore((state) => state.selectedPackage);
  const setSelectedPackage = useCoinStore((state) => state.setSelectedPackage);
  const transactions = useCoinStore((state) => state.transactions);
  const addCoins = useCoinStore((state) => state.addCoins);
  const currentUser = useAuthStore((state) => state.currentUser);

  const [activeTab, setActiveTab] = useState<'packages' | 'history' | 'unlocked'>('packages');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showQrSimulation, setShowQrSimulation] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [unlockedList, setUnlockedList] = useState<{ id: string; novelId: string; chapterId: string; cost: number; unlockedAt: string }[]>([]);
  const [loadingUnlocked, setLoadingUnlocked] = useState(false);

  useEffect(() => {
    if (activeTab === 'unlocked') {
      setLoadingUnlocked(true);
      fetch('/api/coins/unlocked')
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => setUnlockedList(data))
        .catch(() => setUnlockedList([]))
        .finally(() => setLoadingUnlocked(false));
    }
  }, [activeTab]);

  if (!isWalletOpen) return null;

  const currentPkg: CoinPackage = selectedPackage || DEFAULT_COIN_PACKAGES[1];

  const handleStartCheckout = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/coins/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: currentPkg.id,
          coins: currentPkg.coins + (currentPkg.bonusCoins || 0),
          amountIdr: currentPkg.priceIdr,
        }),
      });

      const data = await res.json();
      const snapToken = data.snapToken || data.token;

      if (snapToken && typeof window !== 'undefined') {
        // Dynamically load Midtrans Snap JS if not loaded
        const loadSnapScript = () =>
          new Promise<void>((resolve, reject) => {
            if ((window as unknown as { snap?: { pay: (token: string, cb: object) => void } }).snap) {
              return resolve();
            }
            const script = document.createElement('script');
            const isProd = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true';
            script.src = isProd
              ? 'https://app.midtrans.com/snap/snap.js'
              : 'https://app.sandbox.midtrans.com/snap/snap.js';
            const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '';
            if (clientKey) script.setAttribute('data-client-key', clientKey);
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load Snap script'));
            document.body.appendChild(script);
          });

        try {
          await loadSnapScript();
          const snap = (window as unknown as { snap: { pay: (token: string, cb: object) => void } }).snap;
          snap.pay(snapToken, {
            onSuccess: () => {
              const totalReceived = currentPkg.coins + (currentPkg.bonusCoins || 0);
              addCoins(totalReceived, `Top Up: ${currentPkg.label} (Midtrans)`);
              setOrderSuccess(true);
              setTimeout(() => setOrderSuccess(false), 4000);
            },
            onPending: () => {
              setShowQrSimulation(true);
            },
            onError: () => {
              alert('Payment could not be completed. Please try again.');
            },
            onClose: () => {},
          });
        } catch {
          setShowQrSimulation(true);
        }
      } else {
        // Fallback: Direct QRIS simulation screen
        setShowQrSimulation(true);
      }
    } catch {
      // Offline fallback: Direct QRIS simulation screen
      setShowQrSimulation(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCompleteSimulation = () => {
    const totalReceived = currentPkg.coins + (currentPkg.bonusCoins || 0);
    addCoins(totalReceived, `Top Up: ${currentPkg.label} (QRIS Simulation)`);
    setShowQrSimulation(false);
    setOrderSuccess(true);
    setTimeout(() => setOrderSuccess(false), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-xl bg-[#0F0F11] border border-zinc-800 shadow-2xl shadow-black/80 flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-[#141416]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-none bg-[#FF3D00]/10 border border-[#FF3D00]/40 flex items-center justify-center text-[#FF3D00]">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                Coin Wallet <span className="text-xs px-2 py-0.5 bg-[#FF3D00] text-black font-extrabold">MALAZ</span>
              </h2>
              <p className="text-xs text-zinc-400">Purchase coins to unlock premium light novel chapters</p>
            </div>
          </div>
          <button
            onClick={closeWallet}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors cursor-pointer border-none bg-transparent"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Balance Bar */}
        <div className="px-6 py-4 bg-gradient-to-r from-zinc-900 via-[#181512] to-zinc-900 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <span className="text-xs uppercase tracking-widest text-zinc-400 font-mono">Your Coin Balance</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-3xl font-black text-amber-400 font-mono tracking-tight">{userCoins.toLocaleString()}</span>
              <span className="text-xs font-semibold text-amber-500/80 font-mono uppercase">Coins</span>
            </div>
          </div>

          <div className="flex bg-zinc-950 p-1 border border-zinc-800">
            <button
              onClick={() => { setActiveTab('packages'); setShowQrSimulation(false); }}
              className={`px-3 py-1.5 text-xs font-mono font-medium transition-colors cursor-pointer border-none ${
                activeTab === 'packages'
                  ? 'bg-[#FF3D00] text-black font-bold'
                  : 'text-zinc-400 hover:text-zinc-200 bg-transparent'
              }`}
            >
              Buy Coins
            </button>
            <button
              onClick={() => { setActiveTab('history'); setShowQrSimulation(false); }}
              className={`px-3 py-1.5 text-xs font-mono font-medium flex items-center gap-1.5 transition-colors cursor-pointer border-none ${
                activeTab === 'history'
                  ? 'bg-[#FF3D00] text-black font-bold'
                  : 'text-zinc-400 hover:text-zinc-200 bg-transparent'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              History
            </button>
            <button
              onClick={() => { setActiveTab('unlocked'); setShowQrSimulation(false); }}
              className={`px-3 py-1.5 text-xs font-mono font-medium flex items-center gap-1.5 transition-colors cursor-pointer border-none ${
                activeTab === 'unlocked'
                  ? 'bg-[#FF3D00] text-black font-bold'
                  : 'text-zinc-400 hover:text-zinc-200 bg-transparent'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              Unlocked
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {orderSuccess && (
            <div className="p-4 bg-emerald-950/50 border border-emerald-500/50 text-emerald-300 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <p className="text-xs font-bold font-mono">PAYMENT SUCCESSFUL!</p>
                <p className="text-xs text-emerald-400/90">Coins have been credited to your account balance.</p>
              </div>
            </div>
          )}

          {activeTab === 'packages' && (
            showQrSimulation ? (
              /* QRIS Simulation Screen */
              <div className="space-y-5">
                <div className="bg-zinc-900/90 border border-zinc-700/80 p-5 text-center space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono">
                    <QrCode className="w-4 h-4" />
                    QRIS PAYMENT SIMULATION
                  </div>

                  <p className="text-xs text-zinc-400">
                    Scan QRIS with any e-wallet or mobile banking app (GoPay, OVO, Dana, ShopeePay, BCA, Mandiri)
                  </p>

                  {/* QR Box Visual */}
                  <div className="mx-auto w-48 h-48 bg-white p-3 flex flex-col items-center justify-center border-4 border-zinc-800 shadow-inner">
                    <div className="w-full h-full border-2 border-dashed border-zinc-400 flex flex-col items-center justify-center p-2 text-zinc-800">
                      <QrCode className="w-24 h-24 text-black mb-1" />
                      <span className="text-[10px] font-mono font-bold tracking-tighter text-zinc-900 uppercase">MALAZ-QRIS-{currentPkg.id}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs text-zinc-400">Total Payment:</div>
                    <div className="text-2xl font-black text-white font-mono">
                      Rp {currentPkg.priceIdr.toLocaleString('id-ID')}
                    </div>
                    <div className="text-xs text-amber-400 font-mono">
                      You will receive: {currentPkg.coins + (currentPkg.bonusCoins || 0)} Coins
                    </div>
                  </div>
                </div>

                {/* Simulation Action Buttons */}
                <div className="space-y-2">
                  <button
                    onClick={handleCompleteSimulation}
                    className="w-full py-3 bg-[#FF3D00] hover:bg-[#FF3D00]/90 text-black font-black uppercase font-mono tracking-wider text-xs flex items-center justify-center gap-2 transition-transform active:scale-[0.99] cursor-pointer border-none"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Simulate Successful Payment (Instant)
                  </button>

                  <button
                    onClick={() => setShowQrSimulation(false)}
                    className="w-full py-2.5 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 font-mono text-xs transition-colors cursor-pointer border-none"
                  >
                    Cancel / Choose Another Package
                  </button>
                </div>
              </div>
            ) : (
              /* Package Selection Screen */
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-3">
                    Select Coin Package
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {DEFAULT_COIN_PACKAGES.map((pkg) => {
                      const isSelected = currentPkg.id === pkg.id;
                      return (
                        <div
                          key={pkg.id}
                          onClick={() => setSelectedPackage(pkg)}
                          className={`relative cursor-pointer p-4 border transition-all ${
                            isSelected
                              ? 'bg-zinc-900 border-[#FF3D00] ring-1 ring-[#FF3D00]'
                              : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/40'
                          }`}
                        >
                          {pkg.badge && (
                            <span className="absolute -top-2.5 right-3 px-2 py-0.5 text-[9px] font-black uppercase font-mono tracking-wider bg-[#FF3D00] text-black">
                              {pkg.badge}
                            </span>
                          )}

                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-none flex items-center justify-center ${
                              isSelected ? 'bg-[#FF3D00] text-black' : 'bg-zinc-800 text-amber-400'
                            }`}>
                              <Coins className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-sm font-bold text-white font-mono flex items-center gap-1.5">
                                {pkg.coins} Coins
                                {pkg.bonusCoins && (
                                  <span className="text-xs text-amber-400 font-normal">
                                    +{pkg.bonusCoins} Bonus
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-zinc-400 font-mono">
                                Rp {pkg.priceIdr.toLocaleString('id-ID')}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400">
                    Payment Method
                  </label>
                  <div className="p-3.5 bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-none">
                        <QrCode className="w-5 h-5 text-black" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white font-mono">QRIS (All E-Wallets & Banks)</div>
                        <div className="text-[11px] text-zinc-400">GoPay, OVO, Dana, ShopeePay, BCA Mobile, etc.</div>
                      </div>
                    </div>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      Instant
                    </span>
                  </div>
                </div>

                {/* Checkout Summary & Action */}
                <div className="pt-2 border-t border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-zinc-400">Total Amount:</span>
                    <span className="text-lg font-black text-white">
                      Rp {currentPkg.priceIdr.toLocaleString('id-ID')}
                    </span>
                  </div>

                  <button
                    onClick={handleStartCheckout}
                    disabled={isProcessing}
                    className="w-full py-3 bg-[#FF3D00] hover:bg-[#FF3D00]/90 disabled:opacity-50 text-black font-black uppercase font-mono tracking-wider text-xs flex items-center justify-center gap-2 transition-transform active:scale-[0.99] cursor-pointer border-none"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Preparing Payment...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Pay Now (Rp {currentPkg.priceIdr.toLocaleString('id-ID')})
                      </>
                    )}
                  </button>

                  <p className="text-[10px] text-zinc-500 text-center font-mono">
                    Coins are credited instantly to your account once payment is confirmed.
                  </p>
                </div>
              </div>
            )
          )}

          {/* History Screen */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              {transactions.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 font-mono text-xs">
                  No transaction history yet.
                </div>
              ) : (
                transactions.map((tx) => {
                  const isTopup = tx.type === 'TOPUP';
                  return (
                    <div
                      key={tx.id}
                      className="p-3.5 bg-zinc-950/60 border border-zinc-800/80 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-none flex items-center justify-center ${
                            isTopup
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-[#FF3D00]/10 text-[#FF3D00] border border-[#FF3D00]/30'
                          }`}
                        >
                          {isTopup ? (
                            <ArrowDownLeft className="w-4 h-4" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-zinc-200">
                            {tx.description}
                          </div>
                          <div className="text-[10px] text-zinc-500 font-mono">
                            {new Date(tx.createdAt).toLocaleDateString('en-US', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      </div>

                      <div
                        className={`text-sm font-mono font-bold ${
                          isTopup ? 'text-emerald-400' : 'text-[#FF3D00]'
                        }`}
                      >
                        {isTopup ? `+${tx.amount}` : tx.amount} Coins
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Unlocked Chapters Screen */}
          {activeTab === 'unlocked' && (
            <div className="space-y-3">
              {loadingUnlocked ? (
                <div className="py-12 text-center text-zinc-500 font-mono text-xs animate-pulse">
                  Loading unlocked chapters from database...
                </div>
              ) : unlockedList.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 font-mono text-xs">
                  No unlocked chapters yet. Chapters you unlock with coins will appear here.
                </div>
              ) : (
                unlockedList.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 bg-zinc-950/60 border border-zinc-800/80 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-none flex items-center justify-center bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        <Lock className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-zinc-200">
                          {item.chapterId}
                        </div>
                        <div className="text-[10px] text-zinc-500 font-mono">
                          {new Date(item.unlockedAt).toLocaleDateString('en-US', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })} • {item.cost} Coins
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase bg-emerald-500/10 px-2 py-1 border border-emerald-500/30">
                      Owned
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Modal Footer info */}
        <div className="px-6 py-3 border-t border-zinc-800/80 bg-[#121214] flex items-center justify-between text-[11px] text-zinc-500 font-mono">
          <span>Secure & Encrypted Transactions</span>
          <span className="text-zinc-400">Instant Payment (QRIS)</span>
        </div>
      </div>
    </div>
  );
};

export default CoinWalletModal;
