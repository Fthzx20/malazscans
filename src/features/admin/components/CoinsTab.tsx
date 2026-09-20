"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Coins, DollarSign, Unlock, ShoppingBag, ArrowUpRight, ArrowDownLeft, Shield, User, RefreshCw, Plus, Search, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { useNovelStore } from '../../novels/store/novelStore';

interface CoinSummary {
  totalCoinsCirculation: number;
  totalRevenueIdr: number;
  totalPaidOrders: number;
  totalUnlocks: number;
}

interface UserInfo {
  id: string;
  username: string;
  email: string;
  avatar: string | null;
  provider: string | null;
}

interface CoinTransactionItem {
  id: string;
  userId: string | null;
  type: string;
  amount: number;
  description: string;
  chapterId: string | null;
  novelId: string | null;
  createdAt: string;
  user: UserInfo | null;
}

interface CoinOrderItem {
  id: string;
  userId: string | null;
  packageId: string;
  coins: number;
  amountIdr: number;
  status: string;
  paymentType: string | null;
  createdAt: string;
  user: UserInfo | null;
}

interface UnlockedChapterItem {
  id: string;
  userId: string;
  novelId: string;
  chapterId: string;
  cost: number;
  unlockedAt: string;
  user: UserInfo | null;
}

export const CoinsTab: React.FC = () => {
  const triggerToast = useNovelStore((state) => state.triggerToast);

  const [summary, setSummary] = useState<CoinSummary | null>(null);
  const [transactions, setTransactions] = useState<CoinTransactionItem[]>([]);
  const [orders, setOrders] = useState<CoinOrderItem[]>([]);
  const [unlocks, setUnlocks] = useState<UnlockedChapterItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeView, setActiveView] = useState<'transactions' | 'orders' | 'unlocks'>('transactions');

  // Adjustment Modal
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [targetUserId, setTargetUserId] = useState('');
  const [adjustAmount, setAdjustAmount] = useState(50);
  const [adjustReason, setAdjustReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/coins');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSummary(data.summary);
      setTransactions(data.recentTransactions || []);
      setOrders(data.recentOrders || []);
      setUnlocks(data.recentUnlocks || []);
    } catch {
      triggerToast('Failed to load coin and transaction data.');
    } finally {
      setLoading(false);
    }
  }, [triggerToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAdjustCoins = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserId.trim()) {
      triggerToast('Please provide a valid User ID.');
      return;
    }
    if (adjustAmount === 0) {
      triggerToast('Amount cannot be zero.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/coins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: targetUserId.trim(),
          amount: Number(adjustAmount),
          reason: adjustReason.trim() || 'Manual admin balance adjustment',
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Adjustment failed');
      }

      triggerToast(`Coins adjusted successfully (${adjustAmount > 0 ? `+${adjustAmount}` : adjustAmount} Coins).`);
      setShowAdjustModal(false);
      setTargetUserId('');
      setAdjustReason('');
      fetchData();
    } catch (err: any) {
      triggerToast(err.message || 'Failed to adjust coins.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-xs font-mono text-white">
      
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#262626] pb-4">
        <div>
          <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-white flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-400" />
            <span>Coin Economy & Transactions</span>
          </h2>
          <p className="text-[10px] text-zinc-400 mt-0.5">
            Real-time ledger of reader coin balances, Midtrans top-ups, and chapter unlocks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAdjustModal(true)}
            className="px-3 py-2 bg-[#FF3D00] text-[#0A0A0A] font-bold text-xs uppercase flex items-center gap-1.5 hover:bg-white transition-colors cursor-pointer border-none"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adjust Coins</span>
          </button>
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 border border-[#262626] bg-[#0F0F0F] text-zinc-400 hover:text-white hover:border-[#FF3D00] transition-colors cursor-pointer"
            title="Refresh Data"
            aria-label="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#FF3D00]' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Key Metrics Grid */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="border border-[#262626] bg-[#0F0F0F] p-4 space-y-1">
            <div className="flex justify-between items-center text-zinc-400">
              <span className="text-[10px] uppercase font-bold">Circulation</span>
              <Coins className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-400">
              {summary.totalCoinsCirculation.toLocaleString()}
            </div>
            <span className="text-[9px] text-zinc-500 block">Total user coin balances</span>
          </div>

          <div className="border border-[#262626] bg-[#0F0F0F] p-4 space-y-1">
            <div className="flex justify-between items-center text-zinc-400">
              <span className="text-[10px] uppercase font-bold">Gross Revenue</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-400">
              Rp {summary.totalRevenueIdr.toLocaleString('id-ID')}
            </div>
            <span className="text-[9px] text-zinc-500 block">From Midtrans payments</span>
          </div>

          <div className="border border-[#262626] bg-[#0F0F0F] p-4 space-y-1">
            <div className="flex justify-between items-center text-zinc-400">
              <span className="text-[10px] uppercase font-bold">Paid Orders</span>
              <ShoppingBag className="w-4 h-4 text-[#FF3D00]" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white">
              {summary.totalPaidOrders.toLocaleString()}
            </div>
            <span className="text-[9px] text-zinc-500 block">Completed coin top-ups</span>
          </div>

          <div className="border border-[#262626] bg-[#0F0F0F] p-4 space-y-1">
            <div className="flex justify-between items-center text-zinc-400">
              <span className="text-[10px] uppercase font-bold">Chapter Unlocks</span>
              <Unlock className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-cyan-400">
              {summary.totalUnlocks.toLocaleString()}
            </div>
            <span className="text-[9px] text-zinc-500 block">Total paid unlocks across catalog</span>
          </div>
        </div>
      )}

      {/* 3. Sub-View Selector */}
      <div className="flex border-b border-[#262626] gap-2">
        <button
          onClick={() => setActiveView('transactions')}
          className={`py-2 px-4 text-xs font-bold uppercase transition-colors cursor-pointer border-b-2 bg-transparent ${
            activeView === 'transactions'
              ? 'border-[#FF3D00] text-[#FF3D00]'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          Coin Ledger ({transactions.length})
        </button>
        <button
          onClick={() => setActiveView('orders')}
          className={`py-2 px-4 text-xs font-bold uppercase transition-colors cursor-pointer border-b-2 bg-transparent ${
            activeView === 'orders'
              ? 'border-[#FF3D00] text-[#FF3D00]'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          Payment Orders ({orders.length})
        </button>
        <button
          onClick={() => setActiveView('unlocks')}
          className={`py-2 px-4 text-xs font-bold uppercase transition-colors cursor-pointer border-b-2 bg-transparent ${
            activeView === 'unlocks'
              ? 'border-[#FF3D00] text-[#FF3D00]'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          Chapter Unlocks ({unlocks.length})
        </button>
      </div>

      {/* 4. Table Views */}
      <div className="border border-[#262626] bg-[#0F0F0F] overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-zinc-500 font-mono text-xs">
            Loading ledger records...
          </div>
        ) : activeView === 'transactions' ? (
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-[#050505] border-b border-[#262626] text-[10px] text-zinc-500 uppercase tracking-wider">
              <tr>
                <th className="p-3">User</th>
                <th className="p-3">Type</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Description</th>
                <th className="p-3 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262626]/50">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-zinc-500">
                    No coin transactions recorded yet.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const isTopup = tx.amount > 0;
                  return (
                    <tr key={tx.id} className="hover:bg-white/[0.02]">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {tx.user?.avatar ? (
                            <img src={tx.user.avatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                          ) : (
                            <div className="w-5 h-5 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 text-[10px]">
                              {tx.user?.username?.[0]?.toUpperCase() || '?'}
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-white block">{tx.user?.username || 'Unknown User'}</span>
                            <span className="text-[9px] text-zinc-500">{tx.user?.email || tx.userId || 'Guest'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 uppercase border ${
                          isTopup 
                            ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30' 
                            : 'text-amber-400 bg-amber-400/10 border-amber-400/30'
                        }`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="p-3 font-bold">
                        <span className={isTopup ? 'text-emerald-400' : 'text-amber-400'}>
                          {isTopup ? `+${tx.amount}` : tx.amount} Coins
                        </span>
                      </td>
                      <td className="p-3 text-zinc-300 max-w-xs truncate">
                        {tx.description}
                      </td>
                      <td className="p-3 text-right text-zinc-500 text-[11px]">
                        {new Date(tx.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        ) : activeView === 'orders' ? (
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-[#050505] border-b border-[#262626] text-[10px] text-zinc-500 uppercase tracking-wider">
              <tr>
                <th className="p-3">Order ID</th>
                <th className="p-3">User</th>
                <th className="p-3">Package</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262626]/50">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-zinc-500">
                    No payment orders recorded yet.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-white/[0.02]">
                    <td className="p-3 font-bold text-zinc-300 truncate max-w-[120px]">
                      {order.id}
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-white block">{order.user?.username || 'Guest / Unlinked'}</span>
                      <span className="text-[9px] text-zinc-500">{order.user?.email || order.userId || ''}</span>
                    </td>
                    <td className="p-3">
                      <span className="text-amber-400 font-bold">+{order.coins} Coins</span>
                    </td>
                    <td className="p-3 font-bold text-emerald-400">
                      Rp {order.amountIdr.toLocaleString('id-ID')}
                    </td>
                    <td className="p-3">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 uppercase border ${
                        order.status === 'PAID'
                          ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30'
                          : order.status === 'PENDING'
                          ? 'text-amber-400 bg-amber-400/10 border-amber-400/30'
                          : 'text-red-400 bg-red-400/10 border-red-400/30'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="p-3 text-right text-zinc-500 text-[11px]">
                      {new Date(order.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-[#050505] border-b border-[#262626] text-[10px] text-zinc-500 uppercase tracking-wider">
              <tr>
                <th className="p-3">Reader</th>
                <th className="p-3">Novel</th>
                <th className="p-3">Chapter</th>
                <th className="p-3">Cost</th>
                <th className="p-3 text-right">Unlocked At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262626]/50">
              {unlocks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-zinc-500">
                    No chapters unlocked yet.
                  </td>
                </tr>
              ) : (
                unlocks.map((unlock) => (
                  <tr key={unlock.id} className="hover:bg-white/[0.02]">
                    <td className="p-3">
                      <span className="font-bold text-white block">{unlock.user?.username || 'Reader'}</span>
                      <span className="text-[9px] text-zinc-500">{unlock.user?.email || unlock.userId}</span>
                    </td>
                    <td className="p-3 font-bold text-zinc-300">
                      {unlock.novelId}
                    </td>
                    <td className="p-3 text-zinc-300">
                      {unlock.chapterId}
                    </td>
                    <td className="p-3 font-bold text-amber-400">
                      {unlock.cost} Coins
                    </td>
                    <td className="p-3 text-right text-zinc-500 text-[11px]">
                      {new Date(unlock.unlockedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* 5. Coin Adjustment Modal */}
      {showAdjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="max-w-md w-full border-2 border-[#FF3D00] bg-[#0A0A0A] p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#262626] pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#FF3D00]" />
                <h3 className="text-sm font-black uppercase text-white tracking-wide">Manual Coin Adjustment</h3>
              </div>
              <button
                onClick={() => setShowAdjustModal(false)}
                className="text-zinc-500 hover:text-white bg-transparent border-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAdjustCoins} className="space-y-4 font-mono text-xs">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-zinc-400 block">User ID</label>
                <input
                  type="text"
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  placeholder="Paste user UUID (from Users tab)..."
                  className="w-full bg-[#151515] border border-[#262626] p-2.5 text-white focus:outline-none focus:border-[#FF3D00] rounded-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-zinc-400 block">Coin Amount (+ to credit, - to debit)</label>
                <input
                  type="number"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(Number(e.target.value))}
                  className="w-full bg-[#151515] border border-[#262626] p-2.5 text-white focus:outline-none focus:border-[#FF3D00] rounded-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-zinc-400 block">Reason / Audit Note</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Customer support top-up / Test credit"
                  className="w-full bg-[#151515] border border-[#262626] p-2.5 text-white focus:outline-none focus:border-[#FF3D00] rounded-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-[#FF3D00] text-black font-black uppercase text-xs hover:bg-white transition-colors cursor-pointer border-none flex items-center justify-center gap-1.5"
                >
                  <span>Apply Adjustment</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="px-4 py-3 border border-zinc-700 text-zinc-400 hover:text-white uppercase text-xs bg-transparent cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default CoinsTab;
