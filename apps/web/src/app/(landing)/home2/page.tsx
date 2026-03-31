"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Users,
  Film,
  MessageSquare,
  Languages,
  Play,
  ArrowRight,
  Check,
  Sparkles,
  Zap,
  Globe,
  Star,
  Shield,
  Clock,
  Mic,
  Video,
  Wand2,
  ChevronRight,
  Menu,
  X,
  Sun,
  Moon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

const HeroScene = dynamic(() => import("./components/ThreeScenes").then(m => ({ default: m.HeroScene })), { ssr: false });
const FeaturesScene = dynamic(() => import("./components/ThreeScenes").then(m => ({ default: m.FeaturesScene })), { ssr: false });
const StepsScene = dynamic(() => import("./components/ThreeScenes").then(m => ({ default: m.StepsScene })), { ssr: false });

/* ============================================================
   DATA (same as home)
   ============================================================ */

const HERO_STATS = [
  { value: "500+", label: "Avatares IA", icon: Users },
  { value: "175+", label: "Idiomas", icon: Globe },
  { value: "4K", label: "Ultra HD", icon: Film },
  { value: "<2min", label: "Para gerar", icon: Clock },
] as const;

const AVATAR_SHOWCASE = [
  { name: "Sofia", role: "Apresentadora Corporativa", img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face" },
  { name: "Lucas", role: "Instrutor de Treinamento", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face" },
  { name: "Yuki", role: "Atendente Virtual", img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face" },
  { name: "André", role: "Porta-voz de Marca", img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face" },
  { name: "Mariana", role: "Educadora Digital", img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face" },
  { name: "Kenji", role: "Tech Presenter", img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=face" },
] as const;

interface BentoFeature {
  readonly icon: typeof Users;
  readonly title: string;
  readonly description: string;
  readonly tag?: string;
  readonly span: string;
}

const BENTO_FEATURES: readonly BentoFeature[] = [
  { icon: Users, title: "500+ Avatares Hiper-Realistas", description: "Biblioteca com centenas de avatares diversos em gênero, etnia e estilo. Ou crie seu próprio clone digital com apenas 2 minutos de vídeo.", tag: "Mais popular", span: "md:col-span-2 md:row-span-2" },
  { icon: Wand2, title: "Video Agent IA", description: "Descreva em texto o que precisa e nosso agente inteligente cria o vídeo completo automaticamente.", tag: "Novo", span: "md:col-span-1" },
  { icon: Mic, title: "Vozes Naturais", description: "Clone de voz com fidelidade de 99%. Mais de 400 vozes em 175 idiomas.", span: "md:col-span-1" },
  { icon: Film, title: "AI Studio Pro", description: "Editor profissional com templates, cenas, legendas automáticas, trilha sonora IA e transições cinematográficas.", span: "md:col-span-1" },
  { icon: Languages, title: "Tradução + Lip Sync", description: "Traduza vídeos para 175+ idiomas com sincronização labial perfeita. Um vídeo, alcance global.", span: "md:col-span-1" },
  { icon: Shield, title: "Enterprise Ready", description: "SOC 2 Type II, LGPD, SSO, API robusta e SLA garantido. Pronto para escalar com sua empresa.", span: "md:col-span-2" },
];

const STEPS = [
  { step: "01", title: "Escolha o Avatar", description: "Selecione da biblioteca ou crie seu clone digital personalizado em minutos.", icon: Users },
  { step: "02", title: "Escreva ou Cole o Script", description: "Digite seu texto ou deixe a IA gerar o roteiro perfeito para você.", icon: MessageSquare },
  { step: "03", title: "Gere e Compartilhe", description: "Vídeo profissional em 4K pronto em menos de 2 minutos. Exporte e publique.", icon: Video },
] as const;

const USE_CASES = [
  { title: "Marketing & Vendas", description: "Anúncios personalizados, demos de produto, depoimentos em escala.", img: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=600&h=400&fit=crop", stats: "3x mais conversão" },
  { title: "Treinamento & RH", description: "Onboarding, compliance, treinamentos atualizados sem regravar.", img: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=400&fit=crop", stats: "70% menos custo" },
  { title: "Educação & Cursos", description: "Aulas envolventes com avatares, multilíngue e acessíveis.", img: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&h=400&fit=crop", stats: "2x retenção" },
  { title: "Atendimento ao Cliente", description: "Vídeos personalizados de suporte, tutoriais e FAQ interativo.", img: "https://images.unsplash.com/photo-1556745757-8d76bdb6984b?w=600&h=400&fit=crop", stats: "50% menos tickets" },
] as const;

const LOGOS = ["Nubank", "iFood", "Mercado Livre", "Magazine Luiza", "Itaú", "Ambev", "Globo", "VTEX", "Stone", "PagBank", "Totvs", "Locaweb"] as const;

interface PricingPlan {
  readonly name: string;
  readonly price: string;
  readonly period: string;
  readonly description: string;
  readonly features: readonly string[];
  readonly cta: string;
  readonly highlighted: boolean;
  readonly badge?: string;
}

const PLANS: readonly PricingPlan[] = [
  { name: "Free", price: "R$ 0", period: "para sempre", description: "Explore a plataforma sem compromisso", features: ["1 minuto de vídeo/mês", "3 avatares básicos", "Resolução 720p", "Marca d'água CloneWeebs"], cta: "Comece Grátis", highlighted: false },
  { name: "Creator", price: "R$ 49", period: "/mês", description: "Para criadores de conteúdo independentes", features: ["15 minutos de vídeo/mês", "50 avatares premium", "Resolução Full HD", "Sem marca d'água", "5 idiomas para tradução", "Video Agent (5 usos/mês)"], cta: "Assinar Creator", highlighted: false },
  { name: "Pro", price: "R$ 149", period: "/mês", description: "Para empresas e equipes de conteúdo", features: ["60 minutos de vídeo/mês", "Todos os 500+ avatares", "Resolução 4K Ultra HD", "Clone digital personalizado", "175+ idiomas com lip sync", "Video Agent ilimitado", "API de integração", "Suporte prioritário"], cta: "Assinar Pro", highlighted: true, badge: "Mais popular" },
  { name: "Enterprise", price: "Sob consulta", period: "", description: "Para grandes organizações", features: ["Vídeos ilimitados", "Avatares exclusivos da marca", "SLA 99.9% garantido", "Suporte dedicado 24/7", "SSO + LGPD compliance", "Treinamento da equipe", "Integração personalizada", "Gerente de conta exclusivo"], cta: "Fale com Vendas", highlighted: false },
];

const FOOTER_LINKS = {
  Produto: ["Avatares IA", "AI Studio", "Video Agent", "Tradução", "API", "Integrações"],
  "Casos de Uso": ["Marketing", "Treinamento", "Educação", "Atendimento", "Vendas"],
  Empresa: ["Sobre nós", "Blog", "Carreiras", "Contato", "Parceiros"],
  Recursos: ["Central de Ajuda", "Documentação", "Tutoriais", "Status", "Changelog"],
  Legal: ["Termos de Uso", "Privacidade", "Cookies", "LGPD"],
} as const;

/* ============================================================
   MAIN PAGE COMPONENT
   ============================================================ */

export default function Home2Page() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("light");

  useEffect(() => {
    const saved = localStorage.getItem("cloneweebs-theme") as "dark" | "light" | null;
    if (saved === "dark" || saved === "light") {
      setTheme(saved);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark", "light");
    root.classList.add(theme);
    localStorage.setItem("cloneweebs-theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");
  const isDark = theme === "dark";

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden">
      <div className="noise pointer-events-none fixed inset-0 z-[60]" />

      {/* ══════ HEADER ══════ */}
      <header className="glass-strong sticky top-0 z-50">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-green-500">
              <Sparkles className="h-5 w-5 text-black" />
              <div className="absolute inset-0 rounded-xl bg-green-500 opacity-40 blur-lg" />
            </div>
            <span className={cn("text-lg font-bold tracking-tight", isDark ? "text-green-400" : "text-green-700")}>
              CloneWeebs
            </span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {["Funcionalidades", "Como Funciona", "Casos de Uso", "Preços"].map((label) => (
              <a key={label} href={`#${label.toLowerCase().replace(/ /g, "-")}`}
                className={cn("text-sm font-medium transition-colors", isDark ? "text-white/60 hover:text-white" : "text-gray-500 hover:text-gray-900")}>
                {label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <button onClick={toggleTheme}
              className={cn("flex h-9 w-9 items-center justify-center rounded-lg transition-colors", isDark ? "text-white/60 hover:bg-white/5 hover:text-white" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900")}
              aria-label="Alternar tema">
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Button variant="ghost" className={cn(isDark ? "text-white/70 hover:bg-white/5 hover:text-white" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900")} asChild>
              <Link href="/login">Entrar</Link>
            </Button>
            <Button className="bg-green-500 text-black font-semibold shadow-lg shadow-green-500/25 hover:bg-green-400 hover:shadow-green-500/40" asChild>
              <Link href="/register">Comece Grátis <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
            </Button>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <button onClick={toggleTheme} className={cn("flex h-9 w-9 items-center justify-center rounded-lg", isDark ? "text-white/60" : "text-gray-500")} aria-label="Alternar tema">
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button className={isDark ? "text-white/80" : "text-gray-700"} onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className={cn("glass-strong border-t px-4 pb-6 pt-4 md:hidden", isDark ? "border-white/5" : "border-gray-200")}>
            <nav className="flex flex-col gap-4">
              {["Funcionalidades", "Como Funciona", "Casos de Uso", "Preços"].map((label) => (
                <a key={label} href={`#${label.toLowerCase().replace(/ /g, "-")}`}
                  className={cn("text-sm font-medium", isDark ? "text-white/70 hover:text-white" : "text-gray-600 hover:text-gray-900")}
                  onClick={() => setMobileMenuOpen(false)}>
                  {label}
                </a>
              ))}
              <div className="mt-2 flex flex-col gap-2">
                <Button variant="ghost" className="justify-start" asChild><Link href="/login">Entrar</Link></Button>
                <Button className="bg-green-500 text-black font-semibold" asChild><Link href="/register">Comece Grátis</Link></Button>
              </div>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1">
        {/* ══════ HERO + THREE.JS ══════ */}
        <section className="relative overflow-hidden pt-16 pb-24 sm:pt-24 sm:pb-36 lg:pt-28 lg:pb-44">
          <div className="absolute inset-0 -z-10 mesh-gradient-hero" />
          <div className="absolute inset-0 -z-10 grid-pattern" />

          {/* Three.js background */}
          <HeroScene />

          {/* Floating orbs (CSS) */}
          <div className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-green-500/10 blur-[100px] animate-pulse-glow" />
          <div className="absolute -right-32 bottom-20 h-80 w-80 rounded-full bg-green-600/8 blur-[100px] animate-pulse-glow delay-300" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 z-10">
            <div className="text-center">
              <div className={cn(
                "animate-slide-up inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium backdrop-blur-sm",
                isDark ? "border-green-500/20 bg-green-500/10 text-green-300" : "border-green-500/30 bg-green-50 text-green-700"
              )}>
                <Zap className="h-3.5 w-3.5" />
                Plataforma #1 de vídeos com IA no Brasil
                <ChevronRight className="h-3.5 w-3.5" />
              </div>

              <h1 className={cn(
                "animate-slide-up delay-100 mx-auto mt-8 max-w-5xl text-5xl font-extrabold leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl",
                isDark ? "text-white" : "text-gray-900"
              )}>
                Transforme texto em{" "}
                <span className={cn("gradient-text", isDark && "animate-text-glow")}>vídeos com avatares IA</span>{" "}
                em minutos
              </h1>

              <p className={cn(
                "animate-slide-up delay-200 mx-auto mt-8 max-w-2xl text-lg leading-relaxed sm:text-xl",
                isDark ? "text-white/50" : "text-gray-500"
              )}>
                Sem câmera. Sem estúdio. Sem equipe. Crie vídeos profissionais
                com avatares hiper-realistas, vozes clonadas e tradução automática
                para 175+ idiomas.
              </p>

              <div className="animate-slide-up delay-300 mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button size="lg" className="h-14 gap-2.5 rounded-xl bg-green-500 px-8 text-base font-semibold text-black shadow-2xl shadow-green-500/25 transition-all hover:bg-green-400 hover:shadow-green-500/40" asChild>
                  <Link href="/register">Comece Grátis — Sem Cartão <ArrowRight className="h-5 w-5" /></Link>
                </Button>
                <Button size="lg" variant="outline" className={cn("h-14 gap-2.5 rounded-xl px-8 text-base font-semibold backdrop-blur-sm", isDark ? "border-white/10 bg-white/5 text-white hover:bg-white/10" : "border-gray-200 bg-white text-gray-900 hover:bg-gray-50")}>
                  <Play className="h-5 w-5 text-green-500" />
                  Ver Demo em 60s
                </Button>
              </div>

              <div className="animate-scale-in delay-500 relative mx-auto mt-20 max-w-5xl">
                <div className={cn("relative overflow-hidden rounded-2xl border shadow-2xl", isDark ? "border-green-500/10 shadow-green-500/5" : "border-gray-200 shadow-green-500/10")}>
                  <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-green-500/20 via-emerald-500/10 to-green-500/20 opacity-60 blur-sm" />
                  <div className={cn("relative aspect-video w-full overflow-hidden rounded-2xl", isDark ? "bg-black" : "bg-gray-100")}>
                    <img src="https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1200&h=675&fit=crop" alt="CloneWeebs IA Platform Demo" className="h-full w-full object-cover opacity-80" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10 backdrop-blur-md transition-transform hover:scale-110">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500">
                          <Play className="h-7 w-7 text-black ml-1" />
                        </div>
                      </div>
                    </div>
                    <div className={cn("absolute bottom-0 left-0 right-0 h-32", isDark ? "bg-gradient-to-t from-black/60 to-transparent" : "bg-gradient-to-t from-white/40 to-transparent")} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════ STATS BAR ══════ */}
        <section className={cn("relative border-y", isDark ? "border-white/5" : "border-gray-200")}>
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-transparent to-green-500/5" />
          <div className={cn("relative mx-auto grid max-w-7xl grid-cols-2 gap-0 divide-x px-4 sm:px-6 md:grid-cols-4 lg:px-8", isDark ? "divide-white/5" : "divide-gray-200")}>
            {HERO_STATS.map((stat) => (
              <div key={stat.label} className="flex items-center justify-center gap-4 py-8">
                <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl", isDark ? "bg-green-500/10" : "bg-green-50")}>
                  <stat.icon className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className={cn("text-2xl font-bold", isDark ? "text-white" : "text-gray-900")}>{stat.value}</p>
                  <p className={cn("text-sm", isDark ? "text-white/40" : "text-gray-400")}>{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ══════ LOGO BAR ══════ */}
        <section className="overflow-hidden py-16">
          <p className={cn("mb-8 text-center text-sm font-medium uppercase tracking-widest", isDark ? "text-white/30" : "text-gray-400")}>
            Usado por mais de 10.000 empresas no Brasil e no mundo
          </p>
          <div className="relative">
            <div className={cn("absolute left-0 top-0 z-10 h-full w-32 bg-gradient-to-r to-transparent", isDark ? "from-[hsl(0,0%,2%)]" : "from-[hsl(0,0%,99%)]")} />
            <div className={cn("absolute right-0 top-0 z-10 h-full w-32 bg-gradient-to-l to-transparent", isDark ? "from-[hsl(0,0%,2%)]" : "from-[hsl(0,0%,99%)]")} />
            <div className="flex animate-marquee items-center gap-16">
              {[...LOGOS, ...LOGOS].map((logo, i) => (
                <span key={`${logo}-${i}`} className={cn("shrink-0 text-lg font-bold tracking-wide transition-colors", isDark ? "text-white/15 hover:text-white/30" : "text-gray-200 hover:text-gray-400")}>
                  {logo}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ══════ AVATAR SHOWCASE ══════ */}
        <section className="relative py-20 sm:py-28">
          <div className="absolute inset-0 mesh-gradient-section" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <span className={cn("inline-block rounded-full border px-4 py-1 text-xs font-semibold uppercase tracking-wider", isDark ? "border-green-500/20 bg-green-500/10 text-green-400" : "border-green-500/30 bg-green-50 text-green-700")}>
                Avatares
              </span>
              <h2 className={cn("mt-4 text-3xl font-bold sm:text-5xl", isDark ? "text-white" : "text-gray-900")}>
                Conheça seus novos <span className="gradient-text-cyan">apresentadores</span>
              </h2>
              <p className={cn("mx-auto mt-4 max-w-2xl", isDark ? "text-white/40" : "text-gray-500")}>
                Mais de 500 avatares realistas prontos para representar sua marca.
              </p>
            </div>

            <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {AVATAR_SHOWCASE.map((avatar, i) => (
                <div key={avatar.name} className="group hover-lift" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className={cn("relative overflow-hidden rounded-2xl border", isDark ? "border-white/5 bg-white/[0.02]" : "border-gray-200 bg-white")}>
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/0 to-green-500/0 transition-all duration-500 group-hover:from-green-500/20 group-hover:to-emerald-500/10" />
                    <img src={avatar.img} alt={avatar.name} className="aspect-[3/4] w-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-12">
                      <p className="text-sm font-semibold text-white">{avatar.name}</p>
                      <p className="text-xs text-white/50">{avatar.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 text-center">
              <Button variant="outline" className={cn("rounded-full", isDark ? "border-white/10 bg-white/5 text-white hover:bg-white/10" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50")} asChild>
                <Link href="/register">Ver todos os 500+ avatares <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        </section>

        {/* ══════ BENTO FEATURES + THREE.JS ══════ */}
        <section id="funcionalidades" className="relative py-20 sm:py-28">
          <FeaturesScene />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 z-10">
            <div className="text-center">
              <span className={cn("inline-block rounded-full border px-4 py-1 text-xs font-semibold uppercase tracking-wider", isDark ? "border-green-500/20 bg-green-500/10 text-green-400" : "border-green-500/30 bg-green-50 text-green-700")}>
                Funcionalidades
              </span>
              <h2 className={cn("mt-4 text-3xl font-bold sm:text-5xl", isDark ? "text-white" : "text-gray-900")}>
                Tudo que você precisa. <span className={isDark ? "text-white/40" : "text-gray-400"}>Nada que não precisa.</span>
              </h2>
            </div>

            <div className="mt-16 grid gap-4 md:grid-cols-4">
              {BENTO_FEATURES.map((feature) => (
                <div key={feature.title} className={cn(
                  "group relative overflow-hidden rounded-2xl border p-6 transition-all hover-lift backdrop-blur-sm",
                  feature.span,
                  isDark ? "border-white/5 bg-white/[0.02] hover:border-green-500/20 hover:bg-white/[0.04]" : "border-gray-200 bg-white/80 hover:border-green-500/30 hover:shadow-lg"
                )}>
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/0 to-emerald-500/0 opacity-0 transition-opacity group-hover:opacity-100 group-hover:from-green-500/5 group-hover:to-emerald-500/3" />
                  <div className="relative z-10">
                    {feature.tag && (
                      <span className={cn("mb-4 inline-block rounded-full px-3 py-0.5 text-xs font-semibold", isDark ? "bg-green-500/20 text-green-300" : "bg-green-50 text-green-700")}>
                        {feature.tag}
                      </span>
                    )}
                    <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl transition-colors", isDark ? "bg-green-500/10 group-hover:bg-green-500/20" : "bg-green-50 group-hover:bg-green-100")}>
                      <feature.icon className="h-6 w-6 text-green-500" />
                    </div>
                    <h3 className={cn("mt-4 text-lg font-semibold", isDark ? "text-white" : "text-gray-900")}>{feature.title}</h3>
                    <p className={cn("mt-2 text-sm leading-relaxed", isDark ? "text-white/40" : "text-gray-500")}>{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════ HOW IT WORKS + THREE.JS ══════ */}
        <section id="como-funciona" className="relative py-20 sm:py-28">
          <div className="absolute inset-0 mesh-gradient-section" />
          <StepsScene />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 z-10">
            <div className="text-center">
              <span className={cn("inline-block rounded-full border px-4 py-1 text-xs font-semibold uppercase tracking-wider", isDark ? "border-green-500/20 bg-green-500/10 text-green-400" : "border-green-500/30 bg-green-50 text-green-700")}>
                Simples
              </span>
              <h2 className={cn("mt-4 text-3xl font-bold sm:text-5xl", isDark ? "text-white" : "text-gray-900")}>
                3 passos. Menos de 2 minutos.
              </h2>
              <p className={cn("mx-auto mt-4 max-w-xl", isDark ? "text-white/40" : "text-gray-500")}>
                Criar vídeos profissionais nunca foi tão rápido.
              </p>
            </div>

            <div className="relative mt-20 grid gap-8 md:grid-cols-3">
              <div className="absolute left-0 right-0 top-16 hidden h-px bg-gradient-to-r from-transparent via-green-500/30 to-transparent md:block" />
              {STEPS.map((step) => (
                <div key={step.step} className="group relative text-center">
                  <div className="relative mx-auto mb-8">
                    <div className={cn(
                      "mx-auto flex h-32 w-32 items-center justify-center rounded-3xl border transition-all backdrop-blur-sm",
                      isDark ? "border-white/10 bg-white/[0.02] group-hover:border-green-500/20 group-hover:bg-white/[0.05]" : "border-gray-200 bg-white/80 group-hover:border-green-500/30 group-hover:shadow-lg"
                    )}>
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500">
                        <step.icon className="h-8 w-8 text-black" />
                      </div>
                    </div>
                    <span className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-sm font-bold text-black shadow-lg">
                      {step.step}
                    </span>
                  </div>
                  <h3 className={cn("text-xl font-semibold", isDark ? "text-white" : "text-gray-900")}>{step.title}</h3>
                  <p className={cn("mx-auto mt-3 max-w-xs text-sm leading-relaxed", isDark ? "text-white/40" : "text-gray-500")}>{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════ USE CASES ══════ */}
        <section id="casos-de-uso" className="py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <span className={cn("inline-block rounded-full border px-4 py-1 text-xs font-semibold uppercase tracking-wider", isDark ? "border-green-500/20 bg-green-500/10 text-green-400" : "border-green-500/30 bg-green-50 text-green-700")}>
                Casos de Uso
              </span>
              <h2 className={cn("mt-4 text-3xl font-bold sm:text-5xl", isDark ? "text-white" : "text-gray-900")}>
                Um vídeo vale mais que <span className="gradient-text">mil reuniões</span>
              </h2>
            </div>

            <div className="mt-16 grid gap-6 md:grid-cols-2">
              {USE_CASES.map((useCase) => (
                <div key={useCase.title} className={cn(
                  "group relative overflow-hidden rounded-2xl border transition-all hover-lift",
                  isDark ? "border-white/5 bg-white/[0.02] hover:border-green-500/20" : "border-gray-200 bg-white hover:border-green-500/30 hover:shadow-lg"
                )}>
                  <div className="aspect-[2/1] overflow-hidden">
                    <img src={useCase.img} alt={useCase.title} className="h-full w-full object-cover opacity-50 transition-all duration-700 group-hover:scale-105 group-hover:opacity-70" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <span className="inline-block rounded-full bg-green-500/20 px-3 py-0.5 text-xs font-semibold text-green-300 backdrop-blur-sm">{useCase.stats}</span>
                    <h3 className="mt-3 text-xl font-semibold text-white">{useCase.title}</h3>
                    <p className="mt-2 text-sm text-white/50">{useCase.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════ TESTIMONIAL ══════ */}
        <section className="relative py-20 sm:py-28">
          <div className="absolute inset-0 mesh-gradient-section" />
          <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <div className="mx-auto flex justify-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-6 w-6 fill-green-500 text-green-500" />
              ))}
            </div>
            <blockquote className={cn("mt-8 text-2xl font-medium leading-relaxed sm:text-3xl", isDark ? "text-white/80" : "text-gray-800")}>
              &ldquo;CloneWeebs reduziu nosso custo de produção de vídeo em 90%.
              O que levava 3 dias com equipe, agora fazemos em 10 minutos.&rdquo;
            </blockquote>
            <div className="mt-8 flex items-center justify-center gap-4">
              <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=80&h=80&fit=crop&crop=face" alt="Carlos Mendes" className="h-12 w-12 rounded-full object-cover ring-2 ring-green-500/30" />
              <div className="text-left">
                <p className={cn("text-sm font-semibold", isDark ? "text-white" : "text-gray-900")}>Carlos Mendes</p>
                <p className={cn("text-sm", isDark ? "text-white/40" : "text-gray-500")}>Head de Marketing, TechCorp Brasil</p>
              </div>
            </div>
          </div>
        </section>

        {/* ══════ PRICING ══════ */}
        <section id="preços" className="py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <span className={cn("inline-block rounded-full border px-4 py-1 text-xs font-semibold uppercase tracking-wider", isDark ? "border-green-500/20 bg-green-500/10 text-green-400" : "border-green-500/30 bg-green-50 text-green-700")}>
                Preços
              </span>
              <h2 className={cn("mt-4 text-3xl font-bold sm:text-5xl", isDark ? "text-white" : "text-gray-900")}>
                Comece grátis. Escale sem limites.
              </h2>
              <p className={cn("mx-auto mt-4 max-w-xl", isDark ? "text-white/40" : "text-gray-500")}>
                Sem surpresas. Sem taxas escondidas. Cancele quando quiser.
              </p>
            </div>

            <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {PLANS.map((plan) => (
                <div key={plan.name} className={cn(
                  "group relative flex flex-col overflow-hidden rounded-2xl border p-6 transition-all hover-lift",
                  plan.highlighted
                    ? isDark ? "border-green-500/40 bg-green-500/5 shadow-xl shadow-green-500/10" : "border-green-500/40 bg-green-50/50 shadow-xl shadow-green-500/10"
                    : isDark ? "border-white/5 bg-white/[0.02] hover:border-white/10" : "border-gray-200 bg-white hover:border-green-500/30"
                )}>
                  {plan.badge && (
                    <div className="absolute -top-px left-0 right-0">
                      <div className="mx-auto w-fit rounded-b-lg bg-green-500 px-4 py-1 text-xs font-semibold text-black">{plan.badge}</div>
                    </div>
                  )}
                  <div className={plan.badge ? "mt-4" : ""}>
                    <h3 className={cn("text-lg font-semibold", isDark ? "text-white" : "text-gray-900")}>{plan.name}</h3>
                    <p className={cn("mt-1 text-sm", isDark ? "text-white/40" : "text-gray-500")}>{plan.description}</p>
                  </div>
                  <div className="mt-6 flex items-baseline gap-1">
                    <span className={cn("text-4xl font-bold", isDark ? "text-white" : "text-gray-900")}>{plan.price}</span>
                    {plan.period && <span className={cn("text-sm", isDark ? "text-white/40" : "text-gray-400")}>{plan.period}</span>}
                  </div>
                  <ul className="mt-8 flex-1 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className={cn("flex items-start gap-2.5 text-sm", isDark ? "text-white/50" : "text-gray-500")}>
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button className={cn("mt-8 w-full rounded-xl",
                    plan.highlighted ? "bg-green-500 text-black font-semibold shadow-lg shadow-green-500/25 hover:bg-green-400" : isDark ? "border-white/10 bg-white/5 text-white hover:bg-white/10" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                  )} variant={plan.highlighted ? "default" : "outline"} asChild>
                    <Link href="/register">{plan.cta}</Link>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════ FINAL CTA ══════ */}
        <section className="relative overflow-hidden py-28 sm:py-36">
          <div className="absolute inset-0 -z-10">
            <div className="absolute left-1/2 top-1/2 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-green-500/10 blur-[120px] animate-pulse-glow" />
            <div className="absolute left-1/3 top-1/3 h-[400px] w-[400px] rounded-full bg-emerald-500/8 blur-[100px] animate-float-slow" />
          </div>
          <div className="absolute inset-0 -z-10 grid-pattern" />

          <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-green-500 shadow-2xl shadow-green-500/30">
              <Sparkles className="h-10 w-10 text-black" />
            </div>
            <h2 className={cn("mt-10 text-4xl font-bold sm:text-5xl lg:text-6xl", isDark ? "text-white" : "text-gray-900")}>
              Pronto para criar vídeos que <span className="gradient-text">impressionam</span>?
            </h2>
            <p className={cn("mx-auto mt-6 max-w-xl text-lg", isDark ? "text-white/40" : "text-gray-500")}>
              Junte-se a mais de 10.000 criadores e empresas que já transformaram sua comunicação com CloneWeebs IA.
            </p>
            <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" className="h-14 gap-2.5 rounded-xl bg-green-500 px-10 text-base font-semibold text-black shadow-2xl shadow-green-500/25 transition-all hover:bg-green-400 hover:shadow-green-500/40" asChild>
                <Link href="/register">Comece Grátis Agora <ArrowRight className="h-5 w-5" /></Link>
              </Button>
            </div>
            <p className={cn("mt-6 text-sm", isDark ? "text-white/30" : "text-gray-400")}>
              Sem cartão de crédito. Setup em 30 segundos. Cancele quando quiser.
            </p>
          </div>
        </section>
      </main>

      {/* ══════ FOOTER ══════ */}
      <footer className={cn("border-t", isDark ? "border-white/5 bg-black/30" : "border-gray-200 bg-gray-50")}>
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-6">
            <div className="md:col-span-1">
              <Link href="/" className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-500">
                  <Sparkles className="h-5 w-5 text-black" />
                </div>
                <span className={cn("text-lg font-bold", isDark ? "text-green-400" : "text-green-700")}>CloneWeebs</span>
              </Link>
              <p className={cn("mt-4 text-sm leading-relaxed", isDark ? "text-white/30" : "text-gray-400")}>
                A plataforma brasileira de vídeos com IA mais avançada do mercado.
              </p>
            </div>
            {Object.entries(FOOTER_LINKS).map(([category, links]) => (
              <div key={category}>
                <h4 className={cn("text-sm font-semibold", isDark ? "text-white/70" : "text-gray-700")}>{category}</h4>
                <ul className="mt-4 space-y-2.5">
                  {links.map((link) => (
                    <li key={link}>
                      <a href="#" className={cn("text-sm transition-colors", isDark ? "text-white/30 hover:text-white/60" : "text-gray-400 hover:text-gray-600")}>{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className={cn("mt-16 flex flex-col items-center justify-between gap-4 border-t pt-8 sm:flex-row", isDark ? "border-white/5" : "border-gray-200")}>
            <p className={cn("text-sm", isDark ? "text-white/20" : "text-gray-400")}>
              &copy; {new Date().getFullYear()} CloneWeebs IA. Todos os direitos reservados.
            </p>
            <div className="flex gap-6">
              {["Twitter", "LinkedIn", "YouTube", "Instagram"].map((social) => (
                <a key={social} href="#" className={cn("text-sm transition-colors", isDark ? "text-white/20 hover:text-white/50" : "text-gray-400 hover:text-gray-600")}>{social}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
