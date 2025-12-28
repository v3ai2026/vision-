# Vercel 部署指南 / Vercel Deployment Guide

本指南将帮助您将 Vision PaaS 前端部署到 Vercel。

## 🎯 部署前准备

### 1. 确保所有依赖问题已解决

本次更新已修复以下问题：
- ✅ 更新 `three-mesh-bvh` 到 v0.9.0+ (解决弃用警告)
- ✅ 添加 `.npmrc` 文件处理 peer dependency 冲突
- ✅ 优化 `vite.config.ts` 的生产构建配置
- ✅ 更新 `vercel.json` 配置
- ✅ 添加 `terser` 依赖用于代码压缩

### 2. 本地测试构建

在部署前，请先在本地测试构建：

```bash
# 安装依赖
npm install

# 运行构建
npm run build

# 预览构建结果
npm run preview
```

构建成功后，会在 `dist/` 目录生成静态文件。

## 🚀 部署方法

### 方法 1: 使用 Vercel CLI (推荐)

#### 1.1 安装 Vercel CLI

```bash
npm install -g vercel
```

#### 1.2 登录 Vercel

```bash
vercel login
```

#### 1.3 运行部署脚本

```bash
# 使用我们提供的部署脚本
./deploy-vercel.sh

# 或者直接使用 Vercel CLI
vercel --prod
```

#### 1.4 使用 Token 进行自动化部署

```bash
# 设置 Vercel Token (从 https://vercel.com/account/tokens 获取)
export VERCEL_TOKEN=your_token_here

# 部署
./deploy-vercel.sh
```

### 方法 2: 使用 Vercel Dashboard (Web UI)

#### 2.1 导入项目

1. 访问 [Vercel Dashboard](https://vercel.com/new)
2. 点击 "Import Project"
3. 从 GitHub 导入此仓库

#### 2.2 配置项目

Vercel 会自动检测到这是一个 Vite 项目，并使用 `vercel.json` 中的配置：

- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install` (会自动读取 `.npmrc`)

#### 2.3 配置环境变量

在 Vercel Dashboard 的项目设置中添加以下环境变量：

必需变量：
- `VITE_GEMINI_API_KEY` - Gemini AI API Key

可选变量（根据功能需求）：
- `VITE_API_URL` - 后端 API URL (默认: http://localhost:8080)
- `VITE_SUPABASE_URL` - Supabase 项目 URL
- `VITE_SUPABASE_ANON_KEY` - Supabase 匿名密钥
- `VITE_STRIPE_PUBLISHABLE_KEY` - Stripe 可发布密钥
- `VITE_STRIPE_PRO_PRICE_ID` - Stripe Pro 价格 ID
- `VITE_STRIPE_ENTERPRISE_PRICE_ID` - Stripe Enterprise 价格 ID
- `VITE_VERCEL_TOKEN` - Vercel Token (用于在应用内部署)
- `VITE_FIGMA_TOKEN` - Figma API Token
- `VITE_GITHUB_TOKEN` - GitHub Personal Access Token

#### 2.4 部署

点击 "Deploy" 按钮，Vercel 将自动：
1. 克隆代码
2. 安装依赖 (使用 `.npmrc` 中的 `legacy-peer-deps=true`)
3. 运行构建命令
4. 部署到 CDN

### 方法 3: 使用 GitHub Actions (CI/CD)

#### 3.1 创建 GitHub Workflow

创建文件 `.github/workflows/deploy-vercel.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm install
        
      - name: Build
        run: npm run build
        
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

#### 3.2 配置 GitHub Secrets

在仓库的 Settings > Secrets and variables > Actions 中添加：

- `VERCEL_TOKEN` - 从 https://vercel.com/account/tokens 获取
- `VERCEL_ORG_ID` - 从 `.vercel/project.json` 获取
- `VERCEL_PROJECT_ID` - 从 `.vercel/project.json` 获取

## 🔧 配置说明

### vercel.json

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "framework": "vite",
  "devCommand": "npm run dev",
  "env": {
    "VITE_GEMINI_API_KEY": "@gemini_api_key"
  },
  "regions": ["iad1"],
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**说明：**
- `installCommand` 会读取 `.npmrc` 中的 `legacy-peer-deps=true`
- `rewrites` 确保 SPA 路由正常工作
- `regions` 设置为 `iad1` (美国东部) 以获得最佳性能
- `env` 中的 `@` 前缀表示这是 Vercel 的环境变量引用

### .npmrc

```
legacy-peer-deps=true
```

这个配置确保 npm 在安装依赖时不会因为 peer dependency 版本冲突而失败。

### package.json overrides

```json
"overrides": {
  "react": "^19.2.3",
  "react-dom": "^19.2.3",
  "three-mesh-bvh": "^0.9.0",
  "node-domexception": "npm:domexception@^4.0.0"
}
```

这些 overrides 确保：
- React 19 一致性
- `three-mesh-bvh` 使用最新稳定版本（避免弃用警告）
- `node-domexception` 使用现代替代方案

## ✅ 验证部署

部署完成后，请验证以下功能：

1. **页面加载** - 访问部署的 URL，确保主页正常加载
2. **路由** - 测试不同页面的路由是否正常工作
3. **AI 生成** - 如果配置了 `VITE_GEMINI_API_KEY`，测试 AI 生成功能
4. **3D 功能** - 测试 Three.js 相关功能是否正常
5. **广告系统** - 测试广告管理功能

## 🐛 故障排除

### 构建失败

**问题**: 依赖安装失败
```
npm ERR! ERESOLVE unable to resolve dependency tree
```

**解决**: 确保 `.npmrc` 文件已提交到仓库，内容为 `legacy-peer-deps=true`

---

**问题**: Terser 相关错误
```
terser not found
```

**解决**: 确保 `package.json` 的 `devDependencies` 中包含 `terser`

---

**问题**: 环境变量未定义
```
process.env.VITE_GEMINI_API_KEY is undefined
```

**解决**: 在 Vercel Dashboard 的项目设置中添加环境变量

### 运行时错误

**问题**: 页面空白或路由不工作

**解决**: 
1. 检查浏览器控制台是否有 JavaScript 错误
2. 确保 `vercel.json` 中的 `rewrites` 配置正确
3. 检查 CDN 缓存，可能需要清除缓存

---

**问题**: API 请求失败

**解决**:
1. 检查 `VITE_API_URL` 是否正确配置
2. 确保后端服务正常运行
3. 检查 CORS 配置

## 📊 性能优化

部署后，可以通过以下方式优化性能：

1. **启用 Vercel Analytics**
   - 在项目设置中启用 Analytics
   - 监控页面加载时间和用户行为

2. **配置缓存**
   - Vercel 自动处理静态资源缓存
   - 可以在 `vercel.json` 中自定义缓存策略

3. **启用预渲染**
   - 对于静态页面，可以启用预渲染提高首屏速度

4. **图片优化**
   - 使用 Vercel Image Optimization
   - 将图片存储到 CDN

## 🔗 相关链接

- [Vercel 文档](https://vercel.com/docs)
- [Vite 部署指南](https://vitejs.dev/guide/static-deploy.html)
- [获取 Vercel Token](https://vercel.com/account/tokens)
- [Vercel CLI 文档](https://vercel.com/docs/cli)

## 💡 最佳实践

1. **分离环境**: 使用不同的 Vercel 项目区分开发、预览和生产环境
2. **Preview Deployments**: 利用 Vercel 的预览部署功能测试 PR
3. **回滚**: 如果部署出现问题，可以在 Vercel Dashboard 中快速回滚
4. **监控**: 定期检查 Vercel Analytics 和日志
5. **环境变量管理**: 使用 Vercel 的环境变量功能，避免硬编码敏感信息

## 📞 获取帮助

如果遇到问题：
1. 查看 Vercel 的部署日志
2. 检查本仓库的 Issues
3. 参考 [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
4. 联系项目维护者

---

**祝部署顺利！🎉**
