# v3 - AI-Powered Full-Stack Development Platform

一个集成了 **AI Studio** 和 **完整后台管理系统** 的企业级全栈开发平台。

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

## 🌟 双模式系统

### ✨ AI Studio 模式
原有的顶级AI编排系统，支持：
- 🤖 多AI模型集成 (Gemini)
- 🎨 Figma设计导入
- ☁️ Google Cloud Storage
- 🚀 Vercel部署
- 📓 Colab Notebook导出

### 🎛️ Admin 后台模式 (NEW!)
全新的企业级后台管理系统，包含：
- 📊 数据分析仪表盘
- 📁 项目管理系统
- 💳 Stripe支付集成
- 👥 团队协作功能
- 🔑 API密钥管理
- ⚙️ 完整设置中心

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 配置环境变量

复制 `.env.example` 为 `.env`:

```bash
cp .env.example .env
```

填写配置：

```env
# Supabase (后台系统)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Stripe (支付系统)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
VITE_STRIPE_PRO_PRICE_ID=price_xxx
VITE_STRIPE_ENTERPRISE_PRICE_ID=price_xxx

# Gemini (AI Studio)
VITE_GEMINI_API_KEY=your-gemini-api-key
```

### 启动开发服务器

```bash
npm run dev
```

访问:
- **AI Studio**: http://localhost:3000?mode=studio
- **Admin 后台**: http://localhost:3000?mode=admin (默认)

### 构建生产版本

```bash
npm run build
npm run preview
```

## 📚 完整文档

- 📖 **[后台系统设置指南](./BACKEND_SETUP.md)** - 详细的Supabase和Stripe配置
- 📋 **[功能实现清单](./IMPLEMENTATION_SUMMARY.md)** - 所有已实现功能
- 🗄️ **[数据库架构](./supabase-schema.sql)** - 完整的SQL迁移脚本

## 🏗️ 技术栈

### 前端
- React 19 + TypeScript
- Vite 6
- React Router 6
- TailwindCSS

### 状态管理
- Zustand (全局状态)
- TanStack Query (服务器状态)

### 后端服务
- Supabase (数据库 + 认证)
- Stripe (支付)
- Gitee API (代码托管)

### UI & 可视化
- 自定义 Neural 主题组件
- Recharts (图表)
- Monaco Editor (代码编辑器)

## 💳 订阅计划

### Free Plan - $0/月
- 3个项目
- 100 AI生成/月
- 基础部署
- 社区支持

### Pro Plan - $29/月
- 无限项目
- 1000 AI生成/月
- 高级AI模型
- 优先支持
- 团队协作(5人)

### Enterprise Plan - $99/月
- Pro的所有功能
- 5000 AI生成/月
- 专属AI模型
- 无限团队成员
- SLA保证

## 🔐 安全特性

- ✅ Row Level Security (RLS)
- ✅ JWT 认证
- ✅ 加密存储敏感数据
- ✅ 审计日志

## 📱 响应式设计

完全适配移动端、平板和桌面设备

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可

MIT License

---

**View your app in AI Studio**: https://ai.studio/apps/drive/1pKtDgh7WukKx9-Yh1Rmpy0ihKgvkExTf
