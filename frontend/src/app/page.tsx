"use client";

import Link from "next/link";
import { useSolPrice } from "@/context/SolPriceContext";
import AgentIcon from "@/components/AgentIcon";
import MarketplaceSection from "@/components/MarketplaceSection";
import DashboardSection from "@/components/DashboardSection";
import PublishSection from "@/components/PublishSection";
import AgentModal from "@/components/AgentModal";
import { useEffect, useState } from "react";

const AGENT_ICON_TYPES = ["trading", "farming", "scheduling", "rebalancing", "content", "business"];

export default function Home() {
  const { solPriceUSD } = useSolPrice();
  const [particles, setParticles] = useState<{id: number, top: string, left: string, size: number, delay: number, duration: number}[]>([]);

  useEffect(() => {
    // Generate random background particles
    const newParticles = [];
    for (let i = 0; i < 50; i++) {
      newParticles.push({
        id: i,
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        size: Math.random() * 3 + 1,
        delay: Math.random() * 5,
        duration: Math.random() * 3 + 2,
      });
    }
    setParticles(newParticles);
  }, []);

  return (
    <div className="relative min-h-screen scroll-smooth" style={{ background: "#0A0A08" }}>
      {/* ── Background Animations ─────────────── */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full"
            style={{
              top: p.top,
              left: p.left,
              width: `${p.size}px`,
              height: `${p.size}px`,
              background: "rgba(212, 168, 83, 0.4)",
              boxShadow: "0 0 10px rgba(212, 168, 83, 0.8)",
              animation: `pulse-glow ${p.duration}s infinite alternate ease-in-out`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
        {/* Soft global glow */}
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 70% 70% at 50% 50%, rgba(212, 168, 83, 0.05) 0%, transparent 100%)`,
          }}
        />
      </div>

      <AgentModal />

      {/* ── Hero Section (Single Page Landing) ───────────────── */}
      <section id="home" className="relative flex min-h-screen flex-col items-center justify-center px-4 pt-16 overflow-hidden">
        
        {/* Massive Background Glowing Logo Structure */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none flex items-center justify-center -z-10">
          
          {/* Outer Big Ring */}
          <div
            className="absolute rounded-full"
            style={{
              width: "min(1200px, 150vw)",
              height: "min(1200px, 150vw)",
              border: "1px solid rgba(212, 168, 83, 0.05)",
              background: "radial-gradient(circle at 50% 50%, rgba(10, 10, 8, 0) 60%, rgba(212, 168, 83, 0.02) 100%)",
            }}
          />

          {/* Inner Small Ring */}
          <div
            className="absolute rounded-full animate-pulse-glow"
            style={{
              width: "240px",
              height: "240px",
              border: "2px solid rgba(212, 168, 83, 0.3)",
              boxShadow: "0 0 40px rgba(212, 168, 83, 0.1) inset, 0 0 40px rgba(212, 168, 83, 0.1)",
            }}
          />

          {/* Center 4-Pointed Star (Logo) */}
          <div className="absolute flex items-center justify-center">
            <svg width="200" height="200" viewBox="0 0 80 80" className="animate-pulse-glow">
              <defs>
                <radialGradient id="starGlowMain" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FFFBEA" stopOpacity="1" />
                  <stop offset="20%" stopColor="#D4A853" stopOpacity="0.9" />
                  <stop offset="60%" stopColor="#C8842D" stopOpacity="0" />
                </radialGradient>
                <filter id="blurMain">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
                </filter>
              </defs>
              <circle cx="40" cy="40" r="15" fill="url(#starGlowMain)" filter="url(#blurMain)" />
              <path
                d="M40 0 L43 37 L80 40 L43 43 L40 80 L37 43 L0 40 L37 37 Z"
                fill="url(#starGlowMain)"
              />
            </svg>
          </div>
        </div>

        {/* Floating Agent Icons (Horizontal Center Line) */}
        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex w-full items-center justify-around px-4 md:px-16 z-0 pointer-events-none">
          {AGENT_ICON_TYPES.map((type, i) => (
            <div
              key={type}
              className="glass-sm flex h-10 w-10 md:h-14 md:w-14 items-center justify-center pointer-events-auto"
              style={{
                borderRadius: "50%",
                animation: `float ${3 + i * 0.5}s ease-in-out infinite`,
                animationDelay: `${i * 0.3}s`,
                background: "rgba(20, 20, 18, 0.8)",
                boxShadow: "0 0 15px rgba(212, 168, 83, 0.2)",
                border: "1px solid rgba(212, 168, 83, 0.3)",
              }}
            >
              <AgentIcon type={type} size={20} />
            </div>
          ))}
        </div>

        {/* Content Container (Pushed below center) */}
        <div className="relative z-10 flex flex-col items-center text-center mt-[300px] md:mt-[380px]">
          <h1
            className="mb-4 text-3xl font-semibold tracking-wide md:text-5xl lg:text-[56px] uppercase"
            style={{
              color: "#F5F5F0",
              lineHeight: 1.1,
              letterSpacing: "0.02em",
            }}
          >
            Simplifying Blockchain Finance
            <br />
            For A Smarter Tomorrow
          </h1>

          <p
            className="mb-8 max-w-2xl text-xs leading-relaxed md:text-sm"
            style={{ color: "#888880" }}
          >
            Join the future of digital finance with a secure, fast, and intuitive platform designed for seamless crypto trading and investment.
          </p>

          <div className="flex w-full flex-col sm:flex-row items-center justify-center gap-4">
            <a href="#marketplace" className="btn-primary w-full sm:w-auto justify-center" style={{ padding: "14px 32px", fontSize: "14px" }}>
              Get Started <span>→</span>
            </a>
            <a href="#features" className="btn-secondary w-full sm:w-auto justify-center" style={{ padding: "14px 32px", fontSize: "14px" }}>
              Contact Us
            </a>
          </div>
        </div>

        {/* Floating Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[#888880] animate-bounce">
          <span className="text-[10px] uppercase tracking-widest">Scroll</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </section>

      {/* ── SPA Sections ───────────────── */}
      <div className="relative z-10 bg-[#0A0A08]">
        <MarketplaceSection />
        <DashboardSection />
        <PublishSection />
      </div>

    </div>
  );
}
