// src/components/shared/CoinWallet.js
import { useState } from "react";
import { useCoins, useTransactions } from "../../hooks/useCoins";
import { useAuth } from "../../context/AuthContext";
import { formatDistanceToNow } from "date-fns";
import BadgeShopModal from "./BadgeShopModal";

function timeAgo(ts) {
  try {
    return formatDistanceToNow(
      ts?.toDate ? ts.toDate() : new Date(ts),
      { addSuffix: true }
    );
  } catch { return ""; }
}

export default function CoinWallet() {
  const { user } = useAuth();
  const { balance, loading } = useCoins();
  const transactions = useTransactions(user?.uid);
  const [showShop, setShowShop] = useState(false);

  return (
    <>
      <div style={{
        background: "var(--bg-1)",
        border: "1.5px solid var(--border-2)",
        borderRadius: "var(--r-xl)",
        overflow: "hidden",
        boxShadow: "0 0 24px var(--glow-purple)",
      }}>

        {/* ── Balance header ── */}
        <div style={{
          background: "linear-gradient(135deg, rgba(124,58,237,.22) 0%, rgba(245,158,11,.12) 100%)",
          padding: "24px 22px 20px",
          borderBottom: "1px solid var(--border)",
        }}>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: ".1em",
            textTransform: "uppercase", color: "var(--text-3)", marginBottom: 10,
          }}>
            Coin balance
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {/* Coin icon */}
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              background: "rgba(245,158,11,.18)",
              border: "2px solid rgba(245,158,11,.4)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 26, flexShrink: 0,
              boxShadow: "0 0 20px rgba(245,158,11,.3)",
            }}>
              🪙
            </div>

            <div>
              {loading ? (
                <div style={{
                  width: 80, height: 36, borderRadius: "var(--r-md)",
                  background: "var(--bg-3)", animation: "pulse 1.4s ease-in-out infinite",
                }} />
              ) : (
                <div style={{
                  fontSize: 38, fontWeight: 800, letterSpacing: "-.03em",
                  color: "#f59e0b", lineHeight: 1,
                  textShadow: "0 0 20px rgba(245,158,11,.4)",
                }}>
                  {balance.toLocaleString()}
                </div>
              )}
              <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 3 }}>
                virtual coins · no real-world value
              </div>
            </div>
          </div>

          {/* Shop button */}
          <button
            onClick={() => setShowShop(true)}
            style={{
              marginTop: 16, width: "100%",
              background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
              border: "none", borderRadius: "var(--r-lg)", padding: "11px",
              color: "#fff", fontFamily: "var(--font)", fontSize: 13, fontWeight: 700,
              cursor: "pointer", boxShadow: "0 0 14px var(--glow-purple)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "all .15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 0 24px var(--glow-purple)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 0 14px var(--glow-purple)"; e.currentTarget.style.transform = "none"; }}
          >
            <span style={{ fontSize: 16 }}>🏅</span> Badge Shop
          </button>
        </div>

        {/* ── Recent transactions ── */}
        <div style={{ padding: "14px 0 4px" }}>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: ".08em",
            textTransform: "uppercase", color: "var(--text-3)",
            padding: "0 18px 8px",
          }}>
            Recent activity
          </div>

          {transactions.length === 0 ? (
            <div style={{
              textAlign: "center", padding: "20px 16px 16px",
              fontSize: 13, color: "var(--text-3)", display: "flex",
              flexDirection: "column", alignItems: "center", gap: 6,
            }}>
              <span style={{ fontSize: 26 }}>🪙</span>
              No transactions yet
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {transactions.slice(0, 6).map((tx, i) => {
                const isIncoming = tx.toUid === user?.uid && tx.fromUid !== "system";
                const isBadge    = tx.type === "badge_reward";
                const isSystem   = tx.fromUid === "system";

                let icon  = isIncoming ? "⬇️" : "⬆️";
                let label = isIncoming ? `from ${tx.fromUsername}` : `to ${tx.toUsername}`;
                let color = isIncoming ? "var(--green)" : "#f59e0b";

                if (isBadge)  { icon = "🏅"; label = `${tx.badgeId?.replace(/_/g," ")} badge reward`; color = "#a855f7"; }
                if (isSystem) { icon = "🎁"; label = "gifted by Nexus";  color = "#06b6d4"; }

                return (
                  <div key={tx.id || i} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 18px",
                    borderTop: i === 0 ? "none" : "1px solid var(--border)",
                    transition: "background .1s",
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--bg-hover)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    {/* Icon */}
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                      background: "var(--bg-2)", border: "1px solid var(--border)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 15,
                    }}>
                      {icon}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 13, fontWeight: 600,
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                      }}>
                        {label}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 1 }}>
                        {timeAgo(tx.createdAt)}
                      </div>
                    </div>

                    {/* Amount */}
                    <div style={{
                      fontSize: 14, fontWeight: 800, color, flexShrink: 0,
                    }}>
                      {isIncoming || isBadge || isSystem ? "+" : "−"}{tx.amount} 🪙
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showShop && <BadgeShopModal onClose={() => setShowShop(false)} />}
    </>
  );
}
