// src/components/shared/CoinWallet.js
import { useState, useEffect } from "react";
import { doc, onSnapshot, collection, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
import { formatDistanceToNow } from "date-fns";
import BadgeShopModal from "./BadgeShopModal";

function timeAgo(ts) {
  try {
    return formatDistanceToNow(ts?.toDate ? ts.toDate() : new Date(ts), { addSuffix: true });
  } catch { return "just now"; }
}

export default function CoinWallet() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(null); // null = still loading
  const [transactions, setTransactions] = useState([]);
  const [showShop, setShowShop] = useState(false);

  // Live balance
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(
      doc(db, "coins", user.uid),
      snap => setBalance(snap.exists() ? (snap.data().balance ?? 0) : 0),
      () => setBalance(0) // on permission error show 0, don't spin forever
    );
    return unsub;
  }, [user]);

  // Live transactions (incoming)
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "transactions"),
      where("toUid", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(10)
    );
    const unsub = onSnapshot(q, snap => {
      setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, () => {});
    return unsub;
  }, [user]);

  const loading = balance === null;

  return (
    <>
      <div style={{ background: "var(--bg-1)", border: "1.5px solid var(--border-2)", borderRadius: "var(--r-xl)", overflow: "hidden", boxShadow: "0 0 24px var(--glow-purple)", marginBottom: 16 }}>

        {/* ── Balance ── */}
        <div style={{ background: "linear-gradient(135deg,rgba(124,58,237,.18) 0%,rgba(245,158,11,.10) 100%)", padding: "24px 22px 20px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 10 }}>Coin balance</div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(245,158,11,.18)", border: "2px solid rgba(245,158,11,.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0, boxShadow: "0 0 20px rgba(245,158,11,.3)" }}>🪙</div>
            <div>
              {loading
                ? <div style={{ width: 80, height: 36, borderRadius: "var(--r-md)", background: "var(--bg-3)", animation: "pulse 1.4s ease-in-out infinite" }} />
                : <div style={{ fontSize: 38, fontWeight: 800, letterSpacing: "-.03em", color: "#f59e0b", lineHeight: 1, textShadow: "0 0 20px rgba(245,158,11,.4)" }}>{balance.toLocaleString()}</div>
              }
              <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4 }}>virtual coins · no real-world value</div>
            </div>
          </div>
          <button onClick={() => setShowShop(true)} style={{ marginTop: 16, width: "100%", background: "linear-gradient(135deg,var(--accent),var(--accent-2))", border: "none", borderRadius: "var(--r-lg)", padding: 11, color: "#fff", fontFamily: "var(--font)", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 0 14px var(--glow-purple)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}>🏅</span> Badge Shop
          </button>
        </div>

        {/* ── Transactions ── */}
        <div style={{ padding: "14px 0 4px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--text-3)", padding: "0 18px 10px" }}>Recent activity</div>
          {transactions.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px 16px 18px", fontSize: 13, color: "var(--text-3)", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 26 }}>🪙</span>No transactions yet
            </div>
          ) : transactions.map((tx, i) => {
            const isBadge  = tx.type === "badge_reward";
            const isSystem = tx.fromUid === "system";
            const icon  = isSystem ? "🎁" : isBadge ? "🏅" : "⬇️";
            const label = isSystem
              ? (tx.fromUsername || "Nexus Owner") + " gifted you"
              : isBadge
                ? (tx.badgeId || "").replace(/_/g, " ") + " badge reward"
                : "from " + (tx.fromUsername || "someone");
            const color = isBadge ? "#a855f7" : isSystem ? "#06b6d4" : "var(--green)";
            return (
              <div key={tx.id || i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 18px", borderTop: i === 0 ? "none" : "1px solid var(--border)" }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0, background: "var(--bg-2)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>{icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</div>
                  <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 1 }}>{timeAgo(tx.createdAt)}</div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 800, color, flexShrink: 0 }}>+{tx.amount} 🪙</div>
              </div>
            );
          })}
        </div>
      </div>
      {showShop && <BadgeShopModal onClose={() => setShowShop(false)} />}
    </>
  );
}
