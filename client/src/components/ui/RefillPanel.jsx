import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

export default function RefillPanel() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [notice, setNotice] = useState('');
  const [restockTarget, setRestockTarget] = useState(null);
  const [restockQty, setRestockQty] = useState(30);
  const [busy, setBusy] = useState(false);

  const loadRefill = () => {
    api('/patient/refill').then(setData).catch(e => setErr(e.message));
  };

  useEffect(() => {
    loadRefill();
  }, []);

  async function handleRestock(e) {
    e.preventDefault();
    if (!restockTarget || busy) return;
    const qty = Number(restockQty);
    if (!qty || qty <= 0) return;
    setBusy(true);
    try {
      const res = await api(`/patient/medicines/${restockTarget._id}/refill`, {
        method: 'POST',
        body: JSON.stringify({ quantity: qty }),
      });
      setNotice(res.message || `Added ${qty} units to ${restockTarget.name}.`);
      setRestockTarget(null);
      setRestockQty(30);
      loadRefill();
      setTimeout(() => setNotice(''), 4000);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (err) return <div className="form-error">{err}</div>;
  if (!data) return <div className="notice">Loading refill...</div>;
  if (data.length === 0) return <div className="notice">No refill data yet. Add a medicine with quantity.</div>;

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {notice && <div className="notice">{notice}</div>}
      {data.map(m => {
        const pct = m.initialQuantity ? Math.round((m.remaining / m.initialQuantity) * 100) : null;
        return (
          <div key={m._id} style={{ background: '#fff', border: '1px solid #e2e8e1', borderRadius: 10, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ fontSize: 16 }}>{m.name}</strong>
                <span style={{ marginLeft: 8, fontSize: 11, padding: '2px 8px', borderRadius: 12, background: m.lowStock ? '#fae9e4' : '#edf7f0', color: m.lowStock ? '#a35d4c' : '#2c7a59', fontWeight: 600 }}>
                  {m.lowStock ? 'Low stock (≤5 days)' : 'Healthy stock'}
                </span>
              </div>
              <button
                className="outline-button compact"
                onClick={() => { setRestockTarget(m); setRestockQty(30); }}
                style={{ fontSize: 12, padding: '6px 12px' }}
              >
                + Restock
              </button>
            </div>

            <div style={{ fontSize: 13, color: '#7a837d', marginTop: 6 }}>
              {m.takenLogs} taken · <strong>{m.remaining ?? '—'}</strong> remaining {m.initialQuantity ? ` / ${m.initialQuantity} total` : ''} · ~{m.avgDaily}/day
            </div>

            {pct != null && (
              <div style={{ height: 8, background: '#f0f3ef', borderRadius: 4, marginTop: 10 }}>
                <div style={{ width: `${Math.max(0, Math.min(100, pct))}%`, height: '100%', background: m.lowStock ? '#e8a09a' : '#2c7a59', borderRadius: 4, transition: 'width 0.3s' }} />
              </div>
            )}

            <div style={{ fontSize: 12, marginTop: 8, color: m.lowStock ? '#a35d4c' : '#53655c', fontWeight: m.lowStock ? 600 : 400 }}>
              {m.daysLeft != null
                ? `Runs out in ~${m.daysLeft} days ${m.depletionDate ? '(' + new Date(m.depletionDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) + ')' : ''}`
                : 'No depletion estimate (set quantity on medicine).'}
            </div>
          </div>
        );
      })}

      {restockTarget && (
        <div className="modal-backdrop" onClick={() => setRestockTarget(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 380 }}>
            <button className="close" onClick={() => setRestockTarget(null)}>×</button>
            <p className="eyebrow">Refill stock</p>
            <h3 style={{ margin: '0 0 6px' }}>Restock {restockTarget.name}</h3>
            <p className="muted" style={{ margin: '0 0 14px', fontSize: 13 }}>
              Add new units to your inventory to extend your depletion date and update your caregiver.
            </p>
            <form onSubmit={handleRestock}>
              <label>
                Quantity to add (units / pills)
                <input
                  type="number"
                  min="1"
                  max="10000"
                  required
                  value={restockQty}
                  onChange={e => setRestockQty(e.target.value)}
                  placeholder="e.g. 30"
                />
              </label>

              <div style={{ display: 'flex', gap: 6, margin: '10px 0 16px' }}>
                {[15, 30, 60, 90].map(q => (
                  <button
                    key={q}
                    type="button"
                    className="outline-button compact"
                    onClick={() => setRestockQty(q)}
                    style={{ flex: 1, padding: '4px 6px', fontSize: 11, background: Number(restockQty) === q ? '#edf7f0' : 'transparent', borderColor: Number(restockQty) === q ? '#2c7a59' : '#e2e8e1' }}
                  >
                    +{q}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" className="primary-button" disabled={busy} style={{ flex: 1 }}>
                  {busy ? 'Saving...' : 'Confirm Restock'}
                </button>
                <button type="button" className="outline-button" onClick={() => setRestockTarget(null)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
