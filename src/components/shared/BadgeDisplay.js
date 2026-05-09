import { useState } from "react";
import { createPortal } from "react-dom";
import { BADGES } from "../../hooks/useBadges";

function BadgeTooltip({ badge, onClose }) {
  return createPortal(
    <div onClick={onClose} style={{
      position:"fixed",inset:0,zIndex:400,display:"flex",
      alignItems:"center",justifyContent:"center",
      background:"rgba(0,0,0,.6)",backdropFilter:"blur(4px)"
    }}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:"var(--bg-1)",border:`1.5px solid ${badge.color}44`,
        borderRadius:"var(--r-xl)",padding:"28px 32px",
        textAlign:"center",maxWidth:280,
        boxShadow:`0 0 40px ${badge.glow},0 24px 48px rgba(0,0,0,.7)`,
        animation:"modal-enter .2s cubic-bezier(.16,1,.3,1)"
      }}>
        <div style={{
          width:72,height:72,borderRadius:"50%",
          background:`${badge.color}22`,border:`2px solid ${badge.color}66`,
          display:"flex",alignItems:"center",justifyContent:"center",
          fontSize:32,margin:"0 auto 16px",
          boxShadow:`0 0 20px ${badge.glow}`
        }}>{badge.icon}</div>
        <h3 style={{fontSize:18,fontWeight:800,color:badge.color,marginBottom:8}}>{badge.label}</h3>
        <p style={{fontSize:13,color:"var(--text-2)",lineHeight:1.6}}>{badge.desc}</p>
        <button onClick={onClose} style={{
          marginTop:20,background:"var(--bg-2)",border:"1.5px solid var(--border-2)",
          borderRadius:"var(--r-md)",padding:"8px 24px",color:"var(--text-2)",
          fontFamily:"var(--font)",fontSize:13,fontWeight:600,cursor:"pointer"
        }}>Close</button>
      </div>
    </div>,
    document.body
  );
}

export default function BadgeDisplay({ badgeIds = [], size = "md" }) {
  const [active, setActive] = useState(null);
  if (!badgeIds.length) return null;

  const sz = size === "sm" ? 22 : size === "lg" ? 34 : 28;
  const fontSize = size === "sm" ? 11 : size === "lg" ? 18 : 14;

  return (
    <>
      <div style={{ display:"flex", gap: size === "sm" ? 3 : 5, flexWrap:"wrap", alignItems:"center" }}>
        {badgeIds.map(id => {
          const badge = BADGES[id];
          if (!badge) return null;
          return (
            <button
              key={id}
              title={badge.label}
              onClick={() => setActive(badge)}
              style={{
                width:sz, height:sz,
                borderRadius:"50%",
                background:`${badge.color}22`,
                border:`1.5px solid ${badge.color}66`,
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize,cursor:"pointer",
                boxShadow:`0 0 8px ${badge.glow}`,
                transition:"transform .15s, box-shadow .15s",
              }}
              onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.2)";e.currentTarget.style.boxShadow=`0 0 16px ${badge.glow}`;}}
              onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";e.currentTarget.style.boxShadow=`0 0 8px ${badge.glow}`;}}
            >
              {badge.icon}
            </button>
          );
        })}
      </div>
      {active && <BadgeTooltip badge={active} onClose={() => setActive(null)} />}
    </>
  );
}
