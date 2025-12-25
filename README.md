<div align="center">

# 🛍️ VisionCommerce

### 让购物看得见真实 | See Before You Buy

**Next-generation AI-powered platform combining AR/3D commerce, intelligent code generation, and enterprise SaaS capabilities**

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue)](https://www.typescriptlang.org/)
[![Powered by Gemini](https://img.shields.io/badge/Powered%20by-Gemini%20AI-orange)](https://ai.google.dev/)

[Features](#-key-features) • [Quick Start](#-quick-start) • [Tech Stack](#-tech-stack) • [Contributing](#-contributing)

</div>

---

## 🌟 About VisionCommerce

VisionCommerce is a revolutionary platform that merges AI-powered development tools with immersive 3D/AR shopping experiences and enterprise-grade infrastructure. Built with React 19, TypeScript, and cutting-edge AI technologies.

**Perfect for:**
- 🛒 E-commerce platforms needing AR/3D visualization
- 💻 Development teams building AI-powered applications  
- 🏢 Enterprises requiring full-stack SaaS solutions
- 📊 Businesses needing intelligent marketing automation
- 🎨 Creators wanting advanced UI/UX systems

---

## ✨ Key Features

### 🤖 AI Studio & Code Generation
- **Gemini AI Integration** - Advanced code generation and assistance
- **Monaco Editor** - Professional code editing experience
- **Multi-Agent System** - Specialized AI agents for different tasks
- **Real-time Preview** - Instant visualization of generated code

### 🎮 3D/AR Commerce System (Planned)
- **360° Product Viewer** - Interactive Three.js visualization
- **AR Try-On** - MediaPipe face tracking for virtual testing
- **Virtual Store** - Immersive 3D shopping environments
- **AI Body Analysis** - Smart sizing recommendations

### 🎨 Modern UI/UX Framework
- **Shadcn UI Components** - Beautiful Radix UI primitives
- **Framer Motion** - Smooth animations and transitions
- **Particle Effects** - Canvas-based visual effects
- **Glassmorphism Design** - Premium dark theme with Nuxt green (#00DC82)

### 📊 Enterprise Backend (Planned)
- **Supabase Integration** - PostgreSQL backend
- **Stripe Payments** - Subscription and billing
- **User Management** - Auth and role-based access
- **Analytics Dashboard** - Business insights

### 📢 AI Marketing Automation
- **Multi-Platform Ads** - Google, Facebook, TikTok, Douyin, etc.
- **AI Copywriting** - Gemini-powered content generation
- **Campaign Management** - Unified dashboard
- **Performance Analytics** - Real-time metrics

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+
- Modern browser (Chrome 90+, Safari 14+, Firefox 88+)

### Installation

```bash
# Clone the repository
git clone https://github.com/v3ai2026/vision-.git
cd vision-

# Install dependencies (use --legacy-peer-deps for React 19)
npm install --legacy-peer-deps

# Set up environment
cp .env.example .env.local
# Add your VITE_GEMINI_API_KEY to .env.local

# Start development server
npm run dev
```

Visit `http://localhost:5173` 🎉

### Build for Production

```bash
npm run build
npm run preview
```

---

## 📦 Tech Stack

**Core:** React 19, TypeScript 5.8, Vite 6  
**UI:** Shadcn UI, Tailwind CSS 4, Framer Motion, Lucide Icons  
**3D/AR:** Three.js, @react-three/fiber, MediaPipe  
**Backend:** Supabase, Stripe, TanStack Query, Zustand  
**AI:** Google Gemini, Monaco Editor, Recharts  

---

## 🏗️ Project Structure

```
vision-/
├── components/         # React components
│   ├── ui/            # Shadcn UI components
│   ├── ads/           # Ad system components
│   └── UIElements.tsx # Core UI elements
├── services/          # Business logic & APIs
│   ├── ads/           # Ad platform services
│   ├── geminiService.ts
│   └── githubService.ts
├── lib/               # Utilities
├── App.tsx            # Main app
└── types.ts           # TypeScript types
```

---

## 🔧 Configuration

Create `.env.local` from `.env.example`:

```env
# Required
VITE_GEMINI_API_KEY=your_key_here

# Optional
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_STRIPE_PUBLISHABLE_KEY=
```

---

## 🤝 Contributing

Contributions welcome! Please check [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

---

## 📄 License

MIT License - see [LICENSE](./LICENSE)

---

<div align="center">

**Made with 💚 by the VisionCommerce Team**

[Website](https://vision-.vercel.app) • [Issues](https://github.com/v3ai2026/vision-/issues)

</div>
