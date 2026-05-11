// src/components/shared/BadgeShopModal.js
import { useState } from "react";
import { createPortal } from "react-dom";
import { BADGES, useBadgeShop } from "../../hooks/useBadgeSystem";
import { useCoins } from "../../hooks/useCoins";

export default function BadgeShopModal({ onClose }) {
  const { balance } = useCoins();
  const { shopBadges, badges, buying, error, purchaseBadge } = useBadgeShop();
  const [selected, setSelected] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleBuy = async (badgeId) => {
    const ok = await purchaseBadge(badgeId, balance);
    if (ok) {
      setSuccess(badgeId);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const sel = selected ? BADGES[selected] : null;
  const owned = selected ? badges.includes(selected) : false;

  return createPortal(
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{
      position:"fixed",inset:0,zIndex:500,
      background:"rgba(0,0,0,.85)",backdropFilter:"blur(8px)",
      display:"flex",alignItems:"center",justifyContent:"center",padding:20,
    }}>
      <div style={{
        background:"var(--bg-1)",border:"1.5px solid var(--border-2)",
        borderRadius:24,width:"100%",maxWidth:520,maxHeight:"90vh",
        display:"flex",flexDirection:"column",overflow:"hidden",
        boxShadow:"0 0 60px var(--glow-purple),0 32px 80px rgba(0,0,0,.8)",
        animation:"modal-enter .25s cubic-bezier(.16,1,.3,1)",
      }}>
        {/* Header */}
        <div style={{
          padding:"20px 24px 16px",borderBottom:"1px solid var(--border)",
          display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,
          background:"linear-gradient(135deg,rgba(124,58,237,.15),rgba(6,182,212,.08))",
        }}>
          <div>
            <h2 style={{fontSize:18,fontWeight:800,letterSpacing:"-.03em"}}>🏅 Badge Shop</h2>
            <p style={{fontSize:12,color:"var(--text-3)",marginTop:2}}>Spend coins to unlock badges & benefits</p>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{
              background:"rgba(245,158,11,.15)",border:"1.5px solid rgba(245,158,11,.3)",
              borderRadius:20,padding:"6px 14px",fontSize:14,fontWeight:700,color:"#f59e0b",
            }}>🪙 {balance}</div>
            <button className="icon-btn" onClick={onClose}>✕</button>
          </div>
        </div>

        <div style={{display:"flex",flex:1,minHeight:0}}>
          {/* Badge grid */}
          <div style={{flex:1,overflowY:"auto",padding:16,display:"flex",flexDirection:"column",gap:8}}>
            {error && (
              <div style={{background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.2)",
                borderRadius:10,padding:"8px 12px",fontSize:12,color:"#fca5a5",marginBottom:4}}>
                {error}
              </div>
            )}
            {shopBadges.map(badge => {
              const isOwned = badges.includes(badge.id);
              const isSelected = selected === badge.id;
              const isBuying = buying === badge.id;
              const isSuccess = success === badge.id;
              const canAfford = balance >= badge.shopPrice;

              return (
                <button key={badge.id} onClick={() => setSelected(badge.id)}
                  style={{
                    display:"flex",alignItems:"center",gap:14,
                    padding:"14px 16px",background:isSelected?"var(--accent-bg)":"var(--bg-2)",
                    border:`1.5px solid ${isSelected?badge.color+"66":"var(--border)"}`,
                    borderRadius:16,cursor:"pointer",textAlign:"left",
                    transition:"all .15s",width:"100%",
                    boxShadow:isSelected?`0 0 16px ${badge.glow}`:"none",
                  }}>
                  {/* Badge icon */}
                  <div style={{
                    width:48,height:48,borderRadius:"50%",flexShrink:0,
                    background:`${badge.color}20`,border:`2px solid ${badge.color}44`,
                    display:"flex",alignItems:"center",justifyContent:"center",
                    fontSize:22,boxShadow:`0 0 12px ${badge.glow}`,
                  }}>{badge.icon}</div>

                  {/* Info */}
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                      <span style={{fontSize:14,fontWeight:700}}>{badge.label}</span>
                      {isOwned && (
                        <span style={{background:"rgba(34,197,94,.15)",border:"1px solid rgba(34,197,94,.3)",
                          borderRadius:20,padding:"1px 8px",fontSize:10,fontWeight:700,color:"var(--green)"}}>
                          OWNED ✓
                        </span>
                      )}
                    </div>
                    <div style={{fontSize:12,color:"var(--text-3)",marginBottom:6}}>{badge.desc}</div>
                    <div style={{fontSize:11,color:"var(--text-2)"}}>
                      {badge.benefits.slice(0,2).join(" · ")}
                    </div>
                  </div>

                  {/* Price / action */}
                  <div style={{flexShrink:0,textAlign:"right"}}>
                    {isOwned ? (
                      <div style={{fontSize:18}}>✓</div>
                    ) : isSuccess ? (
                      <div style={{fontSize:12,fontWeight:700,color:"var(--green)"}}>Unlocked! 🎉</div>
                    ) : (
                      <button onClick={e=>{e.stopPropagation();handleBuy(badge.id)}}
                        disabled={!canAfford||isBuying}
                        style={{
                          background:canAfford?"linear-gradient(135deg,var(--accent),var(--accent-2))":"var(--bg-3)",
                          border:"none",borderRadius:12,padding:"7px 14px",
                          color:canAfford?"#fff":"var(--text-3)",
                          fontFamily:"var(--font)",fontSize:12,fontWeight:700,cursor:canAfford?"pointer":"not-allowed",
                          boxShadow:canAfford?"0 0 12px var(--glow-purple)":"none",
                          transition:"all .15s",whiteSpace:"nowrap",
                        }}>
                        {isBuying ? "…" : `🪙 ${badge.shopPrice}`}
                      </button>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detail panel */}
          {sel && (
            <div style={{
              width:200,flexShrink:0,borderLeft:"1px solid var(--border)",
              padding:16,overflowY:"auto",display:"flex",flexDirection:"column",gap:12,
            }}>
              <div style={{
                width:64,height:64,borderRadius:"50%",margin:"0 auto",
                background:`${sel.color}20`,border:`2px solid ${sel.color}55`,
                display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,
                boxShadow:`0 0 20px ${sel.glow}`,
              }}>{sel.icon}</div>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:15,fontWeight:800,color:sel.color}}>{sel.label}</div>
                <div style={{fontSize:11,color:"var(--text-3)",marginTop:4}}>{sel.desc}</div>
              </div>
              <div style={{background:"rgba(245,158,11,.1)",border:"1px solid rgba(245,158,11,.2)",
                borderRadius:10,padding:"8px 10px",textAlign:"center"}}>
                <div style={{fontSize:11,color:"var(--text-3)"}}>Coin reward</div>
                <div style={{fontSize:16,fontWeight:800,color:"#f59e0b"}}>🪙 +{sel.coinReward}</div>
              </div>
              <div>
                <div style={{fontSize:10,fontWeight:700,color:"var(--text-3)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:8}}>Benefits</div>
                {sel.benefits.map((b,i) => (
                  <div key={i} style={{display:"flex",gap:6,marginBottom:6}}>
                    <span style={{color:sel.color,flexShrink:0,fontSize:12}}>✦</span>
                    <span style={{fontSize:11,color:"var(--text-2)",lineHeight:1.5}}>{b}</span>
                  </div>
                ))}
              </div>
              {sel.shopPrice && !owned && (
                <button onClick={() => handleBuy(sel.id)}
                  disabled={balance < sel.shopPrice || buying === sel.id}
                  style={{
                    background:balance>=sel.shopPrice?"linear-gradient(135deg,var(--accent),var(--accent-2))":"var(--bg-3)",
                    border:"none",borderRadius:12,padding:"10px",
                    color:balance>=sel.shopPrice?"#fff":"var(--text-3)",
                    fontFamily:"var(--font)",fontSize:13,fontWeight:700,cursor:"pointer",
                    boxShadow:balance>=sel.shopPrice?"0 0 14px var(--glow-purple)":"none",
                  }}>
                  {buying===sel.id?"Unlocking…":`Unlock · 🪙 ${sel.shopPrice}`}
                </button>
              )}
              {owned && (
                <div style={{textAlign:"center",fontSize:12,fontWeight:700,color:"var(--green)"}}>
                  ✓ You own this badge
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
