<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# IntelliBuild Studio - Neural Agent OS

A comprehensive AI-powered development platform with integrated 3D/AR virtual store capabilities.

View your app in AI Studio: https://ai.studio/apps/drive/1pKtDgh7WukKx9-Yh1Rmpy0ihKgvkExTf

## 🌟 Features

### Core Platform
- **AI Code Generation**: Full-stack project generation with Gemini AI
- **Agent Management**: Distributed AI agent orchestration
- **Design Integration**: Figma design import and multimodal synthesis
- **Cloud Deployment**: Vercel deployment and GCS storage integration
- **Collaborative Notebook**: Colab notebook export

### 🆕 3D/AR Virtual Store System
- **3D Product Viewer**: Interactive 360° product visualization
- **AR Try-On**: Real-time face tracking for virtual accessories
- **Virtual Store**: Immersive 3D shopping environment
- **AI Body Analysis**: Smart size recommendation
- **Social Sharing**: Photo capture with filters and platform integration

[📚 Learn more about 3D/AR features →](docs/AR_3D_STORE.md)

## Run Locally

**Prerequisites:**  Node.js 18+

1. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```

2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key

3. Run the app:
   ```bash
   npm run dev
   ```

4. Open http://localhost:5173 in your browser

## 🚀 Quick Start - 3D/AR Features

### Access AR Try-On
1. Click the 👓 icon in the sidebar
2. Allow camera permissions
3. Select glasses to try on
4. Take photos and share

### View 3D Products
1. Click the 📦 icon in the sidebar
2. Rotate, zoom, and interact with 3D models
3. Switch colors and materials
4. Take screenshots

### Explore Virtual Store
1. Click the 🏪 icon in the sidebar
2. Navigate the 3D environment
3. Click products to view details
4. Add items to cart

## 📚 Documentation

- [3D/AR System Overview](docs/AR_3D_STORE.md) - Complete user guide
- [3D Model Integration Guide](docs/3D_MODEL_GUIDE.md) - How to add custom 3D models

## 🛠️ Tech Stack

### Platform
- React 19 + TypeScript
- Vite
- Monaco Editor
- Tailwind CSS

### 3D/AR
- Three.js + React Three Fiber
- @react-three/drei
- MediaPipe (Face Tracking)
- TensorFlow.js
- Cannon.js (Physics)

### AI & Services
- Google Gemini AI
- Figma API
- Vercel Deployment
- Google Cloud Storage

## 📦 Project Structure

```
src/
├── components/
│   ├── 3d/              # 3D visualization components
│   ├── ar/              # AR try-on components
│   ├── ai/              # AI analysis components
│   └── social/          # Social sharing components
├── hooks/               # Custom React hooks
├── lib/                 # Utility libraries
│   ├── 3d/             # 3D model utilities
│   └── ar/             # AR utilities
├── services/            # API services
└── docs/               # Documentation
```

## 🔒 Security

✅ All security scans passed (CodeQL)  
✅ Camera data processed locally  
✅ No sensitive data uploaded  
✅ Pinned dependency versions

## 📈 Performance

- Build size: ~1.76 MB (gzipped: 491 KB)
- 60 FPS on desktop
- 30 FPS on mobile
- Optimized for modern browsers

## 🌐 Browser Support

- Chrome 90+
- Safari 14+
- Firefox 88+
- Edge 90+

### AR Features
- Chrome Android (WebRTC + MediaPipe)
- Safari iOS (WebRTC + MediaPipe)

## 🤝 Contributing

Contributions welcome! Please check existing issues and PRs before submitting.

## 📄 License

MIT License

---

**Built with ❤️ using cutting-edge AI and 3D technologies**
