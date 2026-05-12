// Developer: AKARSHANA
// src/pages/HomePage.jsx — Dynamic content from Firestore
import { useRef, useMemo, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { HiChevronDown, HiShieldCheck, HiLightningBolt, HiCog, HiStar } from "react-icons/hi";
import { subscribeSiteContent, subscribeAnnouncements } from "../firebase/firestore";

const DEFAULT_ICONS = [HiShieldCheck, HiLightningBolt, HiCog, HiStar];

const Particle = ({ style }) => (
  <motion.div
    className="absolute w-1 h-1 rounded-full bg-cyan opacity-40"
    style={style}
    animate={{ y: [0, -60, 0], opacity: [0.2, 0.8, 0.2] }}
    transition={{ duration: style.duration, repeat: Infinity, delay: style.delay }}
  />
);

const AnnouncementBanner = ({ item }) => {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;
  const colors = {
    info:    { bg: "bg-cyan/10",    border: "border-cyan/30",    text: "text-cyan"    },
    warning: { bg: "bg-yellow-400/10", border: "border-yellow-400/30", text: "text-yellow-400" },
    success: { bg: "bg-green-400/10",  border: "border-green-400/30",  text: "text-green-400"  },
    danger:  { bg: "bg-red-400/10",    border: "border-red-400/30",    text: "text-red-400"    },
  };
  const c = colors[item.type] || colors.info;
  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
      className={`${c.bg} border ${c.border} rounded-xl px-4 py-3 flex items-start justify-between gap-3 mb-4`}>
      <div className="flex-1 min-w-0">
        <span className={`font-orbitron text-xs font-bold ${c.text} mr-2`}>{item.title}</span>
        <span className="text-white/60 text-xs font-rajdhani">{item.message}</span>
        {item.link && (
          <a href={item.link} target="_blank" rel="noopener noreferrer" className={`ml-2 text-xs underline ${c.text}`}>{item.linkLabel || "Read more"}</a>
        )}
      </div>
      <button onClick={() => setVisible(false)} className="text-white/30 hover:text-white shrink-0 mt-0.5">✕</button>
    </motion.div>
  );
};

export default function HomePage() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef });
  const heroY    = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const heroOpac = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const [content, setContent] = useState(null);
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    const u1 = subscribeSiteContent("home", (data) => setContent(data));
    const u2 = subscribeAnnouncements(setAnnouncements);
    return () => { u1(); u2(); };
  }, []);

  const c = content || {};
  const heroTitle    = c.heroTitle    || "SAMURA";
  const heroSubtitle = c.heroSubtitle || "XITER";
  const heroTagline  = c.heroTagline  || "Premium Gaming & Software Portal";
  const heroBadge    = c.heroBadge    || "v2.5 ONLINE";
  const ctaText      = c.ctaText      || "⚡ ENTER CLIENT AREA";
  const stats = [
    { val: c.stat1Val || "500+",  label: c.stat1Label || "ACTIVE CLIENTS" },
    { val: c.stat2Val || "99.9%", label: c.stat2Label || "UPTIME"         },
    { val: c.stat3Val || "24/7",  label: c.stat3Label || "SUPPORT"        },
  ];
  const features = [1,2,3,4].map((n, i) => ({
    icon: DEFAULT_ICONS[i],
    title: c[`feature${n}Title`] || ["SECURE PLATFORM","INSTANT ACCESS","AUTO UPDATES","PREMIUM SUPPORT"][i],
    desc:  c[`feature${n}Desc`]  || ["Military-grade encryption protecting every session.","License activated after payment confirmation via WhatsApp.","Premium updates pushed to your portal automatically.","WhatsApp support line with 24h response guarantee."][i],
  }));

  const particles = useMemo(() => Array.from({ length: 20 }, () => ({
    left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
    duration: 4 + Math.random() * 4, delay: Math.random() * 4,
  })), []);

  return (
    <div className="bg-dark">
      {/* Announcements */}
      {announcements.length > 0 && (
        <div className="fixed top-20 left-0 right-0 z-40 px-4 max-w-3xl mx-auto space-y-2 pt-2">
          {announcements.map(a => <AnnouncementBanner key={a.id} item={a} />)}
        </div>
      )}

      {/* Hero */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden bg-grid">
        <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />
        {particles.map((p, i) => <Particle key={i} style={p} />)}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(8)].map((_, i) => <motion.div key={i} className="absolute left-0 right-0 h-px bg-cyan/5" style={{ top: `${(i+1)*12.5}%` }} />)}
        </div>
        <div className="absolute top-24 left-8 w-16 h-16 border-t border-l border-cyan/30" />
        <div className="absolute top-24 right-8 w-16 h-16 border-t border-r border-cyan/30" />
        <div className="absolute bottom-16 left-8 w-16 h-16 border-b border-l border-cyan/30" />
        <div className="absolute bottom-16 right-8 w-16 h-16 border-b border-r border-cyan/30" />

        <motion.div style={{ y: heroY, opacity: heroOpac }} className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="inline-flex items-center gap-2 mb-8">
            <span className="badge-cyan">{heroBadge}</span>
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-400/80 font-mono text-xs">ALL SYSTEMS OPERATIONAL</span>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.8 }}
            className="font-orbitron text-4xl md:text-6xl lg:text-7xl font-black leading-tight mb-4">
            <span className="brand-samura">{heroTitle}</span><br />
            <span className="brand-xiter neon-text">{heroSubtitle}</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 0.6 }}
            className="text-white/50 text-lg md:text-xl font-rajdhani tracking-widest mb-3 uppercase">
            {heroTagline}
          </motion.p>
          <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 1, duration: 0.6 }}
            className="w-48 h-px bg-gradient-to-r from-transparent via-cyan to-transparent mx-auto mb-10" />
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/auth" className="btn-cyber-filled text-sm px-8 py-4">{ctaText}</Link>
            <Link to="/about" className="btn-cyber text-sm px-8 py-4"><span>LEARN MORE</span></Link>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}
            className="flex items-center justify-center gap-8 mt-16 text-center">
            {stats.map(({ val, label }) => (
              <div key={label}>
                <div className="font-orbitron text-2xl font-bold text-cyan">{val}</div>
                <div className="font-mono text-xs text-white/30 tracking-widest">{label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-cyan/40">
          <HiChevronDown size={28} />
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <div className="badge-cyan mb-4">{c.sectionBadge || "CAPABILITIES"}</div>
          <h2 className="section-title text-3xl md:text-4xl text-white mb-4">
            {c.sectionTitle ? (
              c.sectionTitle.includes("XITER") ? (
                <>{c.sectionTitle.replace("XITER", "")} <span className="neon-text">XITER</span></>
              ) : c.sectionTitle
            ) : <>WHY CHOOSE <span className="neon-text">XITER</span></>}
          </h2>
          <p className="text-white/40 max-w-lg mx-auto">{c.sectionDesc || "Professional gaming tools delivered through a secure, modern client portal."}</p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1, duration: 0.5 }} viewport={{ once: true }}
              className="glass-card p-6 group cursor-default">
              <div className="w-12 h-12 border border-cyan/30 rounded-lg flex items-center justify-center text-cyan mb-4 group-hover:border-cyan group-hover:shadow-neon-sm transition-all">
                <f.icon size={22} />
              </div>
              <h3 className="font-orbitron text-sm font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 px-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
          className="max-w-4xl mx-auto glass-card p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan/5 via-transparent to-transparent" />
          <div className="relative z-10">
            <h2 className="section-title text-2xl md:text-3xl text-white mb-4">
              {c.ctaBannerTitle || <><span className="neon-text">READY TO</span> LEVEL UP?</>}
            </h2>
            <p className="text-white/50 mb-8 max-w-md mx-auto">{c.ctaBannerDesc || "Join hundreds of clients with access to premium tools, instant updates, and priority support."}</p>
            <Link to="/auth" className="btn-cyber-filled px-10 py-4">GET STARTED NOW</Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
