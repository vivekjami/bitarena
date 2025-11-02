"use client"

import { ArrowRight, Zap, Shield, Users, TrendingUp, ChevronRight, Play, MessageCircle, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useState } from "react"

export default function BitArenaLanding() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0)

  const faqs = [
    {
      question: "How do I log in with Mezo Passport?",
      answer:
        "Click 'Connect Mezo Passport' on the landing page. You'll be redirected to authenticate with your Mezo Passport, which securely links your Bitcoin wallet to BitArena.",
    },
    {
      question: "How is MUSD used in matches?",
      answer:
        "MUSD is the stake currency for all matches. When you join a tournament, your MUSD is locked in a smart contract. Winners receive the prize pool minus a 2.5% platform fee.",
    },
    {
      question: "Are winnings automatic?",
      answer:
        "Yes! When a match completes, the oracle verifies the result and automatically transfers your winnings to your wallet within seconds. No manual claims needed.",
    },
    {
      question: "How secure is the game?",
      answer:
        "BitArena uses Bitcoin-backed security through the Mezo network. All stakes are held in audited smart contracts with multi-signature verification and timelock refunds.",
    },
    {
      question: "What games are available?",
      answer:
        "We currently offer Projectile Duel (2-player competitive shooter) and Gravity Painters (3-10 player territorial control). More games coming soon!",
    },
  ]

  const testimonials = [
    {
      name: "Alex Chen",
      role: "Professional Gamer",
      text: "Finally, a gaming platform where my skills actually earn me real Bitcoin rewards. BitArena is the future.",
    },
    {
      name: "Jordan Smith",
      role: "DeFi Enthusiast",
      text: "The integration with Mezo Passport is seamless. I love that my winnings are instantly available and fully transparent.",
    },
    {
      name: "Sam Rivera",
      role: "Crypto Native",
      text: "BitArena combines everything I love - competitive gaming, Bitcoin security, and real economic stakes. Absolutely brilliant.",
    },
  ]

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-cyan-500/20 bg-[#0A0A0F]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-cyan-400 bg-cyan-400/10">
              <Zap className="h-6 w-6 text-cyan-400" fill="currentColor" />
            </div>
            <span className="font-mono text-xl font-bold tracking-tight">
              BIT<span className="text-cyan-400">ARENA</span>
            </span>
          </div>

          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-zinc-400 transition-colors hover:text-cyan-400">
              Features
            </a>
            <a href="#how-it-works" className="text-sm text-zinc-400 transition-colors hover:text-cyan-400">
              How It Works
            </a>
            <a href="#faqs" className="text-sm text-zinc-400 transition-colors hover:text-cyan-400">
              FAQs
            </a>
            <Button className="bg-cyan-400 font-mono text-sm font-semibold text-black hover:bg-cyan-300">
              Launch App
            </Button>
          </div>

          <button className="md:hidden">
            <div className="flex h-6 w-6 flex-col justify-center gap-1.5">
              <span className="h-0.5 w-full bg-cyan-400"></span>
              <span className="h-0.5 w-full bg-cyan-400"></span>
            </div>
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 pt-32 pb-20 md:px-6 md:pt-40 md:pb-32">
        {/* Background Grid Effect */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#18181B_1px,transparent_1px),linear-gradient(to_bottom,#18181B_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>

        <div className="relative mx-auto max-w-7xl">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-sm font-mono text-violet-300">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-pulse rounded-full bg-violet-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-500"></span>
              </span>
              Now Live on Mezo Network
            </div>

            <h1 className="mb-6 font-mono text-5xl font-bold leading-tight tracking-tight text-balance md:text-7xl">
              Battle. Stake. <span className="text-cyan-400">Dominate.</span>
            </h1>

            <p className="mb-10 text-lg leading-relaxed text-zinc-400 text-pretty md:text-xl">
              The first Bitcoin-backed multiplayer gaming arena. Stake MUSD, compete in tournaments, and earn real
              rewards secured by the world's most trusted blockchain.
            </p>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                className="group w-full bg-cyan-400 font-mono text-base font-semibold text-black hover:bg-cyan-300 sm:w-auto"
              >
                Enter Arena
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full border-zinc-700 bg-transparent font-mono text-base text-white hover:border-cyan-400 hover:bg-cyan-400/10 hover:text-cyan-400 sm:w-auto"
              >
                Connect Mezo Passport
              </Button>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-3 gap-6 border-t border-zinc-800 pt-10">
              <div>
                <div className="mb-1 font-mono text-3xl font-bold text-cyan-400 md:text-4xl">2</div>
                <div className="text-sm text-zinc-500">Live Games</div>
              </div>
              <div>
                <div className="mb-1 font-mono text-3xl font-bold text-cyan-400 md:text-3xl">100%</div>
                <div className="text-sm text-zinc-500">On-Chain Verified</div>
              </div>
              <div>
                <div className="mb-1 font-mono text-3xl font-bold text-cyan-400 md:text-2xl"> Lowest Fee</div>
                <div className="text-sm text-zinc-500">Smart Contract Secured</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="px-4 py-20 md:px-6 md:py-32 border-t border-zinc-800">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 md:grid-cols-2 md:gap-16 items-center">
            <div>
              <h2 className="mb-6 font-mono text-4xl font-bold tracking-tight text-balance md:text-5xl">
                About <span className="text-cyan-400">BitArena</span>
              </h2>
              <p className="mb-4 text-lg leading-relaxed text-zinc-400">
                BitArena is a revolutionary gaming platform that combines competitive multiplayer gaming with
                Bitcoin-backed financial incentives. We're building the future of play-to-earn gaming on the Mezo
                network.
              </p>
              <p className="mb-6 text-lg leading-relaxed text-zinc-400">
                Every match is secured by smart contracts. Every win earns you real MUSD rewards. Every player is
                verified through Mezo Passport. We're not just building a game—we're building an economy where skill and
                competition matter.
              </p>
              <div className="flex gap-4">
                <div className="flex gap-3">
                  <Shield className="h-6 w-6 text-cyan-400 flex-shrink-0" />
                  <div>
                    <div className="font-mono font-semibold text-white">Bitcoin-Backed</div>
                    <div className="text-sm text-zinc-500">Secured by Mezo</div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Users className="h-6 w-6 text-violet-400 flex-shrink-0" />
                  <div>
                    <div className="font-mono font-semibold text-white">Community-Driven</div>
                    <div className="text-sm text-zinc-500">Player-first design</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-video rounded-2xl border-2 border-cyan-400/30 bg-[#18181B] overflow-hidden flex items-center justify-center">
                <div className="text-center">
                  <Play className="h-16 w-16 text-cyan-400/50 mx-auto mb-4" />
                  <p className="text-zinc-500 font-mono text-sm">Gameplay Demo Video</p>
                </div>
              </div>
              <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(ellipse_at_center,rgba(0,217,255,0.1),transparent_70%)] pointer-events-none"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-4 py-20 md:px-6 md:py-32 border-t border-zinc-800">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 font-mono text-4xl font-bold tracking-tight text-balance md:text-5xl">
              Built for <span className="text-cyan-400">Champions</span>
            </h2>
            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-zinc-400 text-pretty">
              BitArena combines competitive gaming with Bitcoin's security and transparent rewards
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-zinc-800 bg-[#18181B] transition-all hover:border-cyan-400/50">
              <CardContent className="p-8">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl border-2 border-cyan-400 bg-cyan-400/10">
                  <Shield className="h-7 w-7 text-cyan-400" />
                </div>
                <h3 className="mb-3 font-mono text-xl font-bold text-white">Bitcoin-Secured</h3>
                <p className="leading-relaxed text-zinc-400">
                  All stakes and rewards are backed by Bitcoin through the Mezo network, ensuring maximum security and
                  trust
                </p>
              </CardContent>
            </Card>

            <Card className="border-zinc-800 bg-[#18181B] transition-all hover:border-cyan-400/50">
              <CardContent className="p-8">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl border-2 border-violet-500 bg-violet-500/10">
                  <Zap className="h-7 w-7 text-violet-400" />
                </div>
                <h3 className="mb-3 font-mono text-xl font-bold text-white">Instant Rewards</h3>
                <p className="leading-relaxed text-zinc-400">
                  Win matches and earn MUSD instantly. No waiting periods, no hidden fees, just pure competitive gaming
                </p>
              </CardContent>
            </Card>

            <Card className="border-zinc-800 bg-[#18181B] transition-all hover:border-cyan-400/50">
              <CardContent className="p-8">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl border-2 border-cyan-400 bg-cyan-400/10">
                  <Users className="h-7 w-7 text-cyan-400" />
                </div>
                <h3 className="mb-3 font-mono text-xl font-bold text-white">Mezo Passport</h3>
                <p className="leading-relaxed text-zinc-400">
                  Seamless authentication with your Mezo Passport. One identity across the entire Bitcoin gaming
                  ecosystem
                </p>
              </CardContent>
            </Card>

            <Card className="border-zinc-800 bg-[#18181B] transition-all hover:border-cyan-400/50">
              <CardContent className="p-8">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl border-2 border-violet-500 bg-violet-500/10">
                  <TrendingUp className="h-7 w-7 text-violet-400" />
                </div>
                <h3 className="mb-3 font-mono text-xl font-bold text-white">Stake & Earn</h3>
                <p className="leading-relaxed text-zinc-400">
                  Stake MUSD to enter tournaments. The more you stake, the bigger the prize pools and rewards you can
                  claim
                </p>
              </CardContent>
            </Card>

            <Card className="border-zinc-800 bg-[#18181B] transition-all hover:border-cyan-400/50">
              <CardContent className="p-8">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl border-2 border-cyan-400 bg-cyan-400/10">
                  <Trophy className="h-7 w-7 text-cyan-400" fill="currentColor" />
                </div>
                <h3 className="mb-3 font-mono text-xl font-bold text-white">Fair Matchmaking</h3>
                <p className="leading-relaxed text-zinc-400">
                  Advanced algorithms ensure balanced matches. Compete against players at your skill level for fair
                  competition
                </p>
              </CardContent>
            </Card>

            <Card className="border-zinc-800 bg-[#18181B] transition-all hover:border-cyan-400/50">
              <CardContent className="p-8">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl border-2 border-violet-500 bg-violet-500/10">
                  <Shield className="h-7 w-7 text-violet-400" />
                </div>
                <h3 className="mb-3 font-mono text-xl font-bold text-white">Transparent Rules</h3>
                <p className="leading-relaxed text-zinc-400">
                  All game rules and reward distributions are on-chain and verifiable. Complete transparency, zero
                  manipulation
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="px-4 py-20 md:px-6 md:py-32 border-t border-zinc-800">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 font-mono text-4xl font-bold tracking-tight text-balance md:text-5xl">
              Three Steps to <span className="text-cyan-400">Victory</span>
            </h2>
            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-zinc-400 text-pretty">
              Getting started with BitArena is simple and secure
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="relative">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-cyan-400 bg-cyan-400/10 font-mono text-2xl font-bold text-cyan-400">
                01
              </div>
              <h3 className="mb-3 font-mono text-2xl font-bold text-white">Connect Wallet</h3>
              <p className="leading-relaxed text-zinc-400">
                Link your Mezo Passport and fund your account with MUSD. Your Bitcoin-backed gaming wallet is ready in
                seconds.
              </p>
              {/* Connector Line */}
              <div className="absolute top-8 left-16 hidden h-0.5 w-[calc(100%+2rem)] bg-zinc-800 md:block">
                <div className="absolute right-0 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-cyan-400"></div>
              </div>
            </div>

            <div className="relative">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-violet-500 bg-violet-500/10 font-mono text-2xl font-bold text-violet-400">
                02
              </div>
              <h3 className="mb-3 font-mono text-2xl font-bold text-white">Stake & Play</h3>
              <p className="leading-relaxed text-zinc-400">
                Choose your stake amount and join a tournament. Compete against players worldwide in fast-paced
                multiplayer matches.
              </p>
              {/* Connector Line */}
              <div className="absolute top-8 left-16 hidden h-0.5 w-[calc(100%+2rem)] bg-zinc-800 md:block">
                <div className="absolute right-0 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-violet-500"></div>
              </div>
            </div>

            <div className="relative">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-cyan-400 bg-cyan-400/10 font-mono text-2xl font-bold text-cyan-400">
                03
              </div>
              <h3 className="mb-3 font-mono text-2xl font-bold text-white">Claim Rewards</h3>
              <p className="leading-relaxed text-zinc-400">
                Win matches to earn MUSD rewards instantly. Withdraw anytime or reinvest in higher-stakes tournaments.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Demo & Testimonials Section */}
      <section className="px-4 py-20 md:px-6 md:py-32 border-t border-zinc-800">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 font-mono text-4xl font-bold tracking-tight text-balance md:text-5xl">
              Watch How It <span className="text-cyan-400">Works</span>
            </h2>
            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-zinc-400 text-pretty">
              See BitArena in action - from login to victory
            </p>
          </div>

          {/* Demo Video */}
          <div className="mb-16 relative">
            <div className="aspect-video rounded-2xl border-2 border-cyan-400/30 bg-[#18181B] overflow-hidden flex items-center justify-center">
              <div className="text-center">
                <Play className="h-20 w-20 text-cyan-400/50 mx-auto mb-4" />
                <p className="text-zinc-500 font-mono text-sm">Interactive Demo Video</p>
                <p className="text-zinc-600 font-mono text-xs mt-2">2-4 minute gameplay walkthrough</p>
              </div>
            </div>
            <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(ellipse_at_center,rgba(0,217,255,0.1),transparent_70%)] pointer-events-none"></div>
          </div>

          {/* Testimonials */}
          <div className="mb-16">
            <h3 className="mb-8 text-center font-mono text-2xl font-bold text-white">What Players Say</h3>
            <div className="grid gap-6 md:grid-cols-3">
              {testimonials.map((testimonial, idx) => (
                <Card key={idx} className="border-zinc-800 bg-[#18181B]">
                  <CardContent className="p-8">
                    <div className="mb-4 flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className="text-cyan-400">
                          ★
                        </span>
                      ))}
                    </div>
                    <p className="mb-6 leading-relaxed text-zinc-300">"{testimonial.text}"</p>
                    <div>
                      <div className="font-mono font-semibold text-white">{testimonial.name}</div>
                      <div className="text-sm text-zinc-500">{testimonial.role}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Community Section */}
          <div className="rounded-2xl border-2 border-violet-500/30 bg-violet-500/5 p-8 text-center md:p-12">
            <MessageCircle className="h-12 w-12 text-violet-400 mx-auto mb-4" />
            <h3 className="mb-3 font-mono text-2xl font-bold text-white">Join Our Community</h3>
            <p className="mb-6 text-zinc-400">
              Connect with thousands of players, share strategies, and stay updated on tournaments
            </p>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button className="bg-violet-500 hover:bg-violet-600 font-mono text-sm font-semibold">
                {"Launch App"}
              </Button>
              <Button
                variant="outline"
                className="border-zinc-700 hover:border-violet-400 hover:text-violet-400 font-mono text-sm bg-transparent"
              >
                Follow Twitter
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section id="faqs" className="px-4 py-20 md:px-6 md:py-32 border-t border-zinc-800">
        <div className="mx-auto max-w-3xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 font-mono text-4xl font-bold tracking-tight text-balance md:text-5xl">
              Frequently Asked <span className="text-cyan-400">Questions</span>
            </h2>
            <p className="text-lg leading-relaxed text-zinc-400 text-pretty">
              Everything you need to know about BitArena
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <button
                key={idx}
                onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                className="w-full text-left"
              >
                <div className="rounded-xl border border-zinc-800 bg-[#18181B] p-6 transition-all hover:border-cyan-400/50">
                  <div className="flex items-center justify-between">
                    <h3 className="font-mono text-lg font-semibold text-white">{faq.question}</h3>
                    <ChevronRight
                      className={`h-5 w-5 text-cyan-400 transition-transform ${expandedFaq === idx ? "rotate-90" : ""}`}
                    />
                  </div>
                  {expandedFaq === idx && <p className="mt-4 leading-relaxed text-zinc-400">{faq.answer}</p>}
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="px-4 py-20 md:px-6 md:py-32 border-t border-zinc-800">
        <div className="mx-auto max-w-7xl">
          <Card className="relative overflow-hidden border-cyan-400/30 bg-[#18181B]">
            <CardContent className="p-12 text-center md:p-20">
              <div className="relative z-10">
                <h2 className="mb-4 font-mono text-4xl font-bold tracking-tight text-balance md:text-5xl">
                  Ready to <span className="text-cyan-400">Compete</span>?
                </h2>
                <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-zinc-400 text-pretty">
                  Join thousands of players earning Bitcoin rewards through competitive gaming
                </p>
                <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <Button
                    size="lg"
                    className="group w-full bg-cyan-400 font-mono text-base font-semibold text-black hover:bg-cyan-300 sm:w-auto"
                  >
                    Launch BitArena
                    <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full border-zinc-700 bg-transparent font-mono text-base text-white hover:border-cyan-400 hover:bg-cyan-400/10 hover:text-cyan-400 sm:w-auto"
                  >
                    View Documentation
                  </Button>
                </div>
              </div>

              {/* Background Glow Effect */}
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,217,255,0.15),transparent_70%)]"></div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 px-4 py-12 md:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 md:grid-cols-4">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-cyan-400 bg-cyan-400/10">
                  <Zap className="h-6 w-6 text-cyan-400" fill="currentColor" />
                </div>
                <span className="font-mono text-xl font-bold tracking-tight">
                  BIT<span className="text-cyan-400">ARENA</span>
                </span>
              </div>
              <p className="text-sm leading-relaxed text-zinc-500">
                Bitcoin-backed competitive gaming on the Mezo network
              </p>
            </div>

            <div>
              <h4 className="mb-4 font-mono text-sm font-semibold text-white">Platform</h4>
              <ul className="space-y-3">
                <li>
                  <a href="#features" className="text-sm text-zinc-500 hover:text-cyan-400 transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-zinc-500 hover:text-cyan-400 transition-colors">
                    Tournaments
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-zinc-500 hover:text-cyan-400 transition-colors">
                    Leaderboard
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-zinc-500 hover:text-cyan-400 transition-colors">
                    Rewards
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 font-mono text-sm font-semibold text-white">Resources</h4>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-sm text-zinc-500 hover:text-cyan-400 transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-zinc-500 hover:text-cyan-400 transition-colors">
                    API
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-zinc-500 hover:text-cyan-400 transition-colors">
                    Support
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-zinc-500 hover:text-cyan-400 transition-colors">
                    Status
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 font-mono text-sm font-semibold text-white">Community</h4>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-sm text-zinc-500 hover:text-cyan-400 transition-colors">
                    Discord
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-zinc-500 hover:text-cyan-400 transition-colors">
                    Twitter
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-zinc-500 hover:text-cyan-400 transition-colors">
                    GitHub
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-zinc-500 hover:text-cyan-400 transition-colors">
                    Blog
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-zinc-800 pt-8 md:flex-row">
            <p className="text-sm text-zinc-500">© 2025 BitArena. Built on Mezo. Secured by Bitcoin.</p>
            <div className="flex gap-6">
              <a href="#" className="text-sm text-zinc-500 hover:text-cyan-400 transition-colors">
                Privacy
              </a>
              <a href="#" className="text-sm text-zinc-500 hover:text-cyan-400 transition-colors">
                Terms
              </a>
              <a href="#" className="text-sm text-zinc-500 hover:text-cyan-400 transition-colors">
                Security
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
