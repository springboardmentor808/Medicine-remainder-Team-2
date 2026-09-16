import React, { useState } from 'react';

export default function RefillPredictionCard({
  medicineId,
  medicineName = 'Metformin',
  currentStock = 30,
  dailyFrequency = 2,
  onOrderRefill,
}) {
  const [stock, setStock] = useState(currentStock);
  const [frequency, setFrequency] = useState(dailyFrequency);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderQty, setOrderQty] = useState(30);
  const [ordering, setOrdering] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  // Calculate estimated days left and depletion date
  const safeFreq = frequency > 0 ? frequency : 1;
  const daysLeft = Math.floor(stock / safeFreq);

  const depletionDate = new Date();
  depletionDate.setDate(depletionDate.getDate() + daysLeft);

  const formattedDepletion = depletionDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const isLowStock = daysLeft <= 5;
  const isCritical = daysLeft <= 2;

  // Visual percentage relative to a standard 30-day bottle
  const stockPercentage = Math.min(100, Math.round((stock / (safeFreq * 30)) * 100));

  async function handleConfirmOrder(e) {
    e.preventDefault();
    setOrdering(true);
    try {
      if (onOrderRefill) {
        await onOrderRefill({ medicineId, quantity: orderQty });
      } else {
        // Fallback simulated order
        await new Promise(r => setTimeout(r, 600));
      }
      setStock(prev => prev + Number(orderQty));
      setSuccessToast(`Refill confirmed! +${orderQty} pills added to ${medicineName}.`);
      setShowOrderModal(false);
      setTimeout(() => setSuccessToast(''), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setOrdering(false);
    }
  }

  return (
    <div
      className={`rounded-2xl p-6 transition-all duration-300 relative overflow-hidden bg-white shadow-sm ${
        isCritical
          ? 'border-2 border-rose-500 shadow-rose-100 ring-2 ring-rose-200/50'
          : isLowStock
          ? 'border-2 border-amber-400 shadow-amber-100 ring-2 ring-amber-200/40'
          : 'border border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* Toast */}
      {successToast && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg animate-fade-in flex items-center gap-1.5">
          <span>✓</span> {successToast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-slate-900 text-base">{medicineName}</h4>
            {isCritical ? (
              <span className="text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 animate-pulse">
                🚨 Critical (≤2 Days)
              </span>
            ) : isLowStock ? (
              <span className="text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                ⚠️ Low Stock (≤5 Days)
              </span>
            ) : (
              <span className="text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                ✓ Stock Healthy
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            AI-powered depletion forecast based on daily dose frequency.
          </p>
        </div>

        <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-lg flex-shrink-0">
          📦
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
          <span className="text-[11px] text-slate-500 font-medium block">Current Stock</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className={`text-xl font-extrabold ${isLowStock ? 'text-amber-600' : 'text-slate-900'}`}>
              {stock}
            </span>
            <span className="text-xs text-slate-400">pills</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
          <span className="text-[11px] text-slate-500 font-medium block">Daily Frequency</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl font-extrabold text-slate-900">{safeFreq}</span>
            <span className="text-xs text-slate-400">pills/day</span>
          </div>
        </div>

        <div className={`p-3 rounded-xl border col-span-2 sm:col-span-1 ${
          isLowStock ? 'bg-amber-50/60 border-amber-200' : 'bg-slate-50 border-slate-100'
        }`}>
          <span className="text-[11px] text-slate-500 font-medium block">Estimated Runway</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className={`text-xl font-extrabold ${isCritical ? 'text-rose-600' : isLowStock ? 'text-amber-600' : 'text-emerald-600'}`}>
              ~{daysLeft}
            </span>
            <span className="text-xs text-slate-500 font-medium">days left</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center text-xs text-slate-500 mb-1">
          <span>Inventory Level</span>
          <span className="font-bold">{stockPercentage}%</span>
        </div>
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isCritical
                ? 'bg-rose-500'
                : isLowStock
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.max(4, Math.min(100, stockPercentage))}%` }}
          />
        </div>
      </div>

      {/* Prediction Notice & Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
        <div className="text-xs">
          <span className="text-slate-500">Estimated Depletion Date: </span>
          <strong className={isLowStock ? 'text-rose-600 font-bold' : 'text-slate-800 font-semibold'}>
            {formattedDepletion}
          </strong>
        </div>

        <button
          type="button"
          onClick={() => setShowOrderModal(true)}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm ${
            isLowStock
              ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
          }`}
        >
          <span>🛒</span>
          <span>Order Refill</span>
        </button>
      </div>

      {/* Order Refill Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-scale-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-xs uppercase tracking-wider font-bold text-emerald-700">
                  Refill Dispatch
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                  Order Refill: {medicineName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowOrderModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-5">
              Confirm the quantity to restock. Replenishing units automatically updates your AI depletion forecast and notifies your linked caregiver.
            </p>

            <form onSubmit={handleConfirmOrder}>
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Refill Pack Size (Pills)
                </label>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[15, 30, 60, 90].map(qty => (
                    <button
                      key={qty}
                      type="button"
                      onClick={() => setOrderQty(qty)}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                        orderQty === qty
                          ? 'bg-emerald-50 border-emerald-600 text-emerald-800'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      +{qty} pills
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="1"
                  max="500"
                  required
                  value={orderQty}
                  onChange={e => setOrderQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Custom quantity..."
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 text-xs text-slate-600 space-y-1 mb-5">
                <div className="flex justify-between">
                  <span>Current Stock:</span>
                  <span className="font-bold">{stock} pills</span>
                </div>
                <div className="flex justify-between">
                  <span>After Refill:</span>
                  <span className="font-bold text-emerald-700">{stock + Number(orderQty)} pills</span>
                </div>
                <div className="flex justify-between">
                  <span>New Runway:</span>
                  <span className="font-bold text-emerald-700">
                    ~{Math.floor((stock + Number(orderQty)) / safeFreq)} days
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowOrderModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={ordering}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-200 transition-all flex items-center justify-center gap-1.5"
                >
                  {ordering ? 'Ordering...' : 'Confirm Refill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
