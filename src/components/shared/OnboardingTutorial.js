// src/components/shared/OnboardingTutorial.js
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import NexusLogo from "./NexusLogo";

const TUTORIAL_KEY = "nexus_tutorial_v2_done";

const STEPS = [
  {
    id: "welcome",
    icon: null, // uses logo
    title: "Welcome to Nexus! 🔥",
    subtitle: "Chat. Share. Connect.",
    desc: "You're about to experience social media the way it should be. Let's take a quick tour — it'll only take a minute.",
    tip: null,
    highlight: null,
  },
  {
    id: "feed",
    icon: "🏠",
    title: "Your Feed",
    subtitle: "Home base",
    desc: "The feed shows posts from people you follow. Create posts with text or images, react with emojis, and comment to start conversations.",
    tip: "💡 Click ❤️ React on any post to pick your emoji reaction",
    highlight: "left rail → Home button",
  },
  {
    id: "stories",
    icon: "📖",
    title: "Stories",
    subtitle: "24-hour moments",
    desc: "Share photo or text stories that disappear after 24 hours. Tap the ring around an avatar to view someone's story.",
    tip: "💡 Hold a story to pause it, tap left/right to skip",
    highlight: "top of Feed page",
  },
  {
    id: "channels",
    icon: "💬",
    title: "Channels",
    subtitle: "Real-time chat rooms",
    desc: "Join public channels for real-time chat with everyone. Create your own channel for your community. Reply to messages, react, and send GIFs.",
    tip: "💡 Click 🎭 to open the GIF & sticker picker",
    highlight: "left rail → Channels button",
  },
  {
    id: "dms",
    icon: "✉️",
    title: "Direct Messages",
    subtitle: "Private conversations",
    desc: "Send private messages to anyone. You can send text, voice messages, GIFs, stickers, and see read receipts.",
    tip: "💡 Click 🎙 to record a voice message",
    highlight: "left rail → Messages button",
  },
  {
    id: "vibes",
    icon: "🔥",
    title: "Vibes",
    subtitle: "Express your mood",
    desc: "Set your vibe to show everyone how you're feeling. Your vibe appears as an animated ring around your avatar with an emoji badge.",
    tip: "💡 Click the emoji button at the bottom of the left rail",
    highlight: "bottom of left rail",
  },
  {
    id: "coins",
    icon: "🪙",
    title: "Coins & Badges",
    subtitle: "Earn rewards",
    desc: "You start with 100 coins! Earn more by getting badges. Use coins to tip creators, or buy badges from the shop. Each badge comes with real benefits.",
    tip: "💡 Visit someone's profile and click 🪙 Tip to send them coins",
    highlight: "Profile page → Tip button",
  },
  {
    id: "badges",
    icon: "🏅",
    title: "Badge Shop",
    subtitle: "Unlock perks",
    desc: "Badges unlock real benefits — gold borders, exclusive themes, extended stories, and more. Some are awarded, others can be bought with coins.",
    tip: "💡 Open Settings → Badges to see the shop",
    highlight: "Settings → Badges tab",
  },
  {
    id: "done",
    icon: "🚀",
    title: "You're all set!",
    subtitle: "Let's go",
    desc: "You've got 100 coins ready to spend, an Early Adopter badge, and a whole community waiting. Go explore!",
    tip: null,
    highlight: null,
  },
];

export default function OnboardingTutorial() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(TUTORIAL_KEY)) {
      const t = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(t);
    }
  }, []);

  const dismiss = () => {
    setExiting(true);
    localStorage.setItem(TUTORIAL_KEY, "1");
    setTimeout(() => { setVisible(false); setExiting(false); }, 300);
  };

  const next = () => {
    if (step >= STEPS.length - 1) { dismiss(); return; }
    setStep(s => s + 1);
  };

  const prev = () => { if (step > 0) setStep(s => s - 1); };

  if (!visible) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;
  const progress = ((step + 1) / STEPS.length) * 100;

  return createPortal(
    <div style={{
      position:"fixed",inset:0,zIndex:600,
      background:"rgba(0,0,0,.88)",backdropFilter:"blur(10px)",
      display:"flex",alignItems:"center",justifyContent:"center",padding:20,
      animation: exiting ? "tut-fade-out .3s ease forwards" : "tut-fade-in .35s ease",
    }}>
      <div style={{
        background:"var(--bg-1)",border:"1.5px solid var(--border-2)",
        borderRadius:24,width:"100%",maxWidth:480,overflow:"hidden",
        boxShadow:"0 0 80px var(--glow-purple),0 32px 80px rgba(0,0,0,.85)",
        animation: exiting ? "tut-slide-out .3s ease forwards" : "tut-slide-in .4s cubic-bezier(.16,1,.3,1)",
      }}>

        {/* Progress bar */}
        <div style={{height:3,background:"var(--bg-3)"}}>
          <div style={{
            height:"100%",background:`linear-gradient(90deg,var(--accent),var(--accent-2))`,
            width:`${progress}%`,transition:"width .4s cubic-bezier(.4,0,.2,1)",
            boxShadow:"0 0 8px var(--glow-purple)",
          }}/>
        </div>

        {/* Skip button */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 20px 0"}}>
          <span style={{fontSize:11,color:"var(--text-3)",fontWeight:600,letterSpacing:".04em"}}>
            {step + 1} / {STEPS.length}
          </span>
          <button onClick={dismiss} style={{
            background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",
            borderRadius:20,padding:"4px 12px",color:"var(--text-3)",
            fontFamily:"var(--font)",fontSize:11,fontWeight:600,cursor:"pointer",
            transition:"all .15s",
          }}>
            Skip tutorial
          </button>
        </div>

        {/* Content */}
        <div style={{padding:"24px 28px 20px",textAlign:"center"}}>
          {/* Icon */}
          <div style={{
            width:80,height:80,borderRadius:"50%",
            background:"radial-gradient(circle,var(--accent-bg) 0%,transparent 70%)",
            display:"flex",alignItems:"center",justifyContent:"center",
            margin:"0 auto 20px",
            boxShadow:"0 0 30px var(--glow-purple)",
            fontSize: current.icon ? 36 : undefined,
          }}>
            {current.icon ? current.icon : <NexusLogo size={48}/>}
          </div>

          <div style={{
            display:"inline-flex",alignItems:"center",gap:6,
            background:"var(--accent-bg)",border:"1px solid var(--accent-bd)",
            borderRadius:20,padding:"3px 12px",fontSize:11,fontWeight:700,
            color:"var(--accent-2)",letterSpacing:".06em",textTransform:"uppercase",
            marginBottom:12,
          }}>
            {current.subtitle}
          </div>

          <h2 style={{
            fontSize:22,fontWeight:800,letterSpacing:"-.03em",marginBottom:12,
          }}>{current.title}</h2>

          <p style={{
            fontSize:14,color:"var(--text-2)",lineHeight:1.7,marginBottom:16,
          }}>{current.desc}</p>

          {current.tip && (
            <div style={{
              background:"rgba(6,182,212,.08)",border:"1px solid rgba(6,182,212,.2)",
              borderRadius:12,padding:"10px 14px",fontSize:13,color:"var(--cyan)",
              textAlign:"left",lineHeight:1.6,
            }}>
              {current.tip}
            </div>
          )}

          {current.highlight && (
            <div style={{
              marginTop:10,display:"inline-flex",alignItems:"center",gap:6,
              background:"rgba(124,58,237,.08)",border:"1px solid rgba(124,58,237,.2)",
              borderRadius:20,padding:"4px 12px",fontSize:11,color:"var(--text-3)",
            }}>
              📍 Find it: <strong style={{color:"var(--accent-2)"}}>{current.highlight}</strong>
            </div>
          )}
        </div>

        {/* Dot indicators */}
        <div style={{display:"flex",justifyContent:"center",gap:6,paddingBottom:4}}>
          {STEPS.map((_,i) => (
            <button key={i} onClick={() => setStep(i)} style={{
              width: i === step ? 20 : 6,
              height:6,borderRadius:3,border:"none",cursor:"pointer",
              background: i === step ? "var(--accent)" : "var(--border-2)",
              transition:"all .25s",
              boxShadow: i === step ? "0 0 8px var(--glow-purple)" : "none",
            }}/>
          ))}
        </div>

        {/* Navigation */}
        <div style={{
          display:"flex",gap:10,padding:"16px 24px 24px",
        }}>
          {!isFirst && (
            <button onClick={prev} style={{
              flex:1,background:"transparent",border:"1.5px solid var(--border-2)",
              borderRadius:14,padding:"12px",color:"var(--text-2)",
              fontFamily:"var(--font)",fontSize:13,fontWeight:700,cursor:"pointer",
              transition:"all .15s",
            }}>
              ← Back
            </button>
          )}
          <button onClick={next} style={{
            flex:isFirst ? 1 : 2,
            background:"linear-gradient(135deg,var(--accent),var(--accent-2))",
            border:"none",borderRadius:14,padding:"12px",color:"#fff",
            fontFamily:"var(--font)",fontSize:14,fontWeight:700,cursor:"pointer",
            boxShadow:"0 0 20px var(--glow-purple)",transition:"all .15s",
            letterSpacing:"-.01em",
          }}
            onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 0 32px var(--glow-purple)";e.currentTarget.style.transform="translateY(-1px)"}}
            onMouseLeave={e=>{e.currentTarget.style.boxShadow="0 0 20px var(--glow-purple)";e.currentTarget.style.transform="none"}}
          >
            {isLast ? "Let's go! 🚀" : "Next →"}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes tut-fade-in  { from{opacity:0} to{opacity:1} }
        @keyframes tut-fade-out { from{opacity:1} to{opacity:0} }
        @keyframes tut-slide-in { from{opacity:0;transform:scale(.94) translateY(16px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes tut-slide-out{ from{opacity:1;transform:scale(1) translateY(0)} to{opacity:0;transform:scale(.94) translateY(16px)} }
      `}</style>
    </div>,
    document.body
  );
}
