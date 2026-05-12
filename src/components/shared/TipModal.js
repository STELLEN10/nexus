// src/components/shared/TipModal.js
import { useState } from "react";
import { createPortal } from "react-dom";
import { useCoins, COIN_AMOUNTS } from "../../hooks/useCoins";

export default function TipModal({ toUser, onClose }) {
  const { balance, displayBalance, tip, isOwner } = useCoins();
  const [amount, setAmount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleTip = async () => {
    setLoading(true); setError("");
    try {
      await tip(toUser.uid, toUser.displayName || toUser.username, amount);
      setDone(true);
      setTimeout(onClose, 2200);
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  const canAfford = isOwner || balance >= amount;

  return createPortal(
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{
      position:"fixed",inset:0,zIndex:300,
      background:"rgba(0,0,0,.78)",backdropFilter:"blur(6px)",
      display:"flex",alignItems:"center",justifyContent:"center",padding:20,
    }}>
      <div style={{
        background:"var(--bg-1)",border:"1.5px solid var(--border-2)",
        borderRadius:22,width:"100%",maxWidth:340,overflow:"hidden",
        boxShadow:"0 0 40px var(--glow-purple),0 24px 60px rgba(0,0,0,.8)",
        animation:"modal-enter .2s cubic-bezier(.16,1,.3,1)",
      }}>
        {/* Header */}
        <div style={{
          padding:"16px 20px",borderBottom:"1px solid var(--border)",
          display:"flex",alignItems:"center",justifyContent:"space-between",
          background:"linear-gradient(135deg,rgba(245,158,11,.1),rgba(124,58,237,.08))",
        }}>
          <span style={{fontSize:15,fontWeight:800}}>🪙 Send Coins</span>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>

        {done ? (
          <div style={{padding:"44px 20px",textAlign:"center"}}>
            <div style={{fontSize:52,marginBottom:14}}>🎉</div>
            <p style={{fontSize:17,fontWeight:800,color:"var(--green)"}}>Sent {amount} coins!</p>
            <p style={{fontSize:13,color:"var(--text-2)",marginTop:6}}>
              to {toUser.displayName || toUser.username}
            </p>
          </div>
        ) : (
          <div style={{padding:20,display:"flex",flexDirection:"column",gap:16}}>

            {/* Recipient */}
            <div style={{
              display:"flex",alignItems:"center",gap:12,
              padding:"12px 14px",background:"var(--bg-2)",borderRadius:14,
            }}>
              <div style={{
                width:40,height:40,borderRadius:"50%",flexShrink:0,
                background:"var(--accent-bg)",overflow:"hidden",
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:16,fontWeight:700,color:"var(--accent-2)",
              }}>
                {toUser.avatar
                  ? <img src={toUser.avatar} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                  : (toUser.displayName||"?").slice(0,2).toUpperCase()
                }
              </div>
              <div>
                <p style={{fontSize:14,fontWeight:700}}>{toUser.displayName||toUser.username}</p>
                <p style={{fontSize:12,color:"var(--text-3)"}}>@{toUser.username}</p>
              </div>
            </div>

            {/* Balance */}
            <div style={{
              textAlign:"center",padding:"10px 0",
              background:"var(--bg-2)",borderRadius:14,
            }}>
              <p style={{fontSize:11,color:"var(--text-3)",marginBottom:4,fontWeight:600,textTransform:"uppercase",letterSpacing:".06em"}}>Your balance</p>
              <p style={{
                fontSize:28,fontWeight:800,
                color: isOwner ? "#f59e0b" : "var(--accent-2)",
              }}>
                🪙 {displayBalance}
                {isOwner && <span style={{fontSize:12,color:"var(--text-3)",fontWeight:600,marginLeft:6}}>unlimited</span>}
              </p>
            </div>

            {/* Amount picker */}
            <div>
              <p style={{fontSize:11,fontWeight:700,color:"var(--text-3)",marginBottom:10,textTransform:"uppercase",letterSpacing:".06em"}}>Choose amount</p>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                {COIN_AMOUNTS.map(a => (
                  <button key={a} onClick={() => setAmount(a)} style={{
                    padding:"13px",
                    border:`2px solid ${amount===a?"var(--accent)":"var(--border)"}`,
                    borderRadius:14,
                    background:amount===a?"var(--accent-bg)":"var(--bg-2)",
                    color:amount===a?"var(--accent-2)":"var(--text-2)",
                    fontFamily:"var(--font)",fontSize:16,fontWeight:800,cursor:"pointer",
                    transition:"all .15s",
                    boxShadow:amount===a?"0 0 14px var(--glow-purple)":"none",
                  }}>
                    🪙 {a}
                  </button>
                ))}
              </div>
            </div>

            {error && <p style={{fontSize:12,color:"var(--red)",textAlign:"center",fontWeight:600}}>{error}</p>}

            {/* Send button */}
            <button onClick={handleTip} disabled={loading || !canAfford} style={{
              background: canAfford
                ? "linear-gradient(135deg,var(--accent),var(--accent-2))"
                : "var(--bg-3)",
              border:"none",borderRadius:14,padding:"14px",
              color: canAfford ? "#fff" : "var(--text-3)",
              fontFamily:"var(--font)",fontSize:14,fontWeight:700,
              cursor: loading || !canAfford ? "not-allowed" : "pointer",
              boxShadow: canAfford ? "0 0 20px var(--glow-purple)" : "none",
              transition:"all .15s",
            }}>
              {loading ? "Sending…" : !canAfford ? "Not enough coins" : `Send 🪙 ${amount} coins`}
            </button>

            <p style={{fontSize:11,color:"var(--text-3)",textAlign:"center"}}>
              Coins are virtual and have no real-world value
            </p>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
