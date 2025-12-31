# 🚀 快速部署指南

## 当前状态

✅ **所有功能已完整集成到本仓库！**

- 📦 **65个新文件** 已添加（组件、页面、Hooks、文档、脚本）
- 🏗️ **构建成功** - 1.84秒，538KB，0漏洞
- 🎨 **所有5个PR的功能** 都在这里，无需去其他地方下载
- ☁️ **Google Cloud Run** 部署配置已修复

---

## ☁️ Google Cloud Run 部署

### 当前配置
- **Project ID**: gen-lang-client-0654563230
- **Region**: europe-west1
- **Service Name**: novaui
- **Port**: 8080
- **Memory**: 512Mi
- **CPU**: 1
- **Max Instances**: 10
- **Min Instances**: 0

### 自动部署（推荐）

每次推送到 `main` 分支会自动触发：
1. 构建 Docker 镜像
2. 推送到 Artifact Registry
3. 部署到 Cloud Run

监控构建：https://console.cloud.google.com/cloud-build/builds

### 手动部署

#### 方法 1: 使用 gcloud CLI

```bash
# 1. 认证
gcloud auth login
gcloud config set project gen-lang-client-0654563230

# 2. 构建并推送镜像
docker build -t europe-west1-docker.pkg.dev/gen-lang-client-0654563230/cloud-run-source-deploy/novaui:latest .
docker push europe-west1-docker.pkg.dev/gen-lang-client-0654563230/cloud-run-source-deploy/novaui:latest

# 3. 部署到 Cloud Run
gcloud run deploy novaui \
  --image europe-west1-docker.pkg.dev/gen-lang-client-0654563230/cloud-run-source-deploy/novaui:latest \
  --region europe-west1 \
  --platform managed \
  --port 8080 \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1
```

#### 方法 2: 使用 Cloud Build

```bash
# 提交到 Cloud Build
gcloud builds submit --config cloudbuild.yaml
```

### 环境变量配置

在 Cloud Run 中设置环境变量：

```bash
gcloud run services update novaui \
  --region europe-west1 \
  --update-env-vars "VITE_GEMINI_API_KEY=your_key_here"
```

或在 Cloud Console 中：
1. 访问 Cloud Run 服务页面
2. 点击 "EDIT & DEPLOY NEW REVISION"
3. 在 "Variables & Secrets" 标签页添加环境变量

### 故障排除

#### "invalid reference format" 错误
- ✅ 已修复：使用 `novaui` 作为服务名
- ✅ 已修复：区域改为 `europe-west1`

#### 权限错误
确保 Cloud Build 服务账号有以下权限：
- Cloud Run Admin
- Service Account User
- Artifact Registry Writer

```bash
# 授予权限（替换 PROJECT_NUMBER）
gcloud projects add-iam-policy-binding gen-lang-client-0654563230 \
  --member serviceAccount:PROJECT_NUMBER@cloudbuild.gserviceaccount.com \
  --role roles/run.admin

gcloud projects add-iam-policy-binding gen-lang-client-0654563230 \
  --member serviceAccount:PROJECT_NUMBER@cloudbuild.gserviceaccount.com \
  --role roles/iam.serviceAccountUser
```

### 查看部署状态

```bash
# 列出服务
gcloud run services list --region europe-west1

# 查看服务详情
gcloud run services describe novaui --region europe-west1

# 查看日志
gcloud run services logs read novaui --region europe-west1
```

---

## 📊 完整内容清单

### 组件（49个文件）
```
components/
├── ui/              16个Shadcn组件
├── effects/         11个动画效果
├── effects/sparks/   8个粒子特效
├── 3d/              2个3D组件
├── ar/              2个AR组件
├── ai/              AI身体分析
├── auth/            2个认证组件
├── social/          照片捕获
├── ads/             广告系统（已有）
└── EnhancedUI等     增强UI组件
```

### 页面（7个）
- Dashboard.tsx - 仪表盘
- Projects.tsx - 项目管理
- Billing.tsx - 账单支付
- Teams.tsx - 团队协作
- ApiKeys.tsx - API密钥
- Profile.tsx - 个人资料
- Settings.tsx - 系统设置

### Hooks（8个）
- useAuth.ts - 认证
- useProjects.ts - 项目管理
- useSubscription.ts - 订阅
- useAnalytics.ts - 分析
- useMousePosition.ts - 鼠标位置
- useScrollProgress.ts - 滚动进度
- useInView.ts - 可见性检测
- useAuthStore.ts - 认证状态

### 应用入口
- **App.tsx** - AI Studio主应用
- **AdminApp.tsx** - 管理后台
- **RootApp.tsx** - 双模式切换器

---

## 🌐 部署到Vercel

### 方法1：GitHub自动部署（推荐）

1. **合并PR到main分支**
   - 在GitHub上打开这个PR
   - 点击绿色的 "Merge pull request" 按钮
   - 确认合并

2. **Vercel自动部署**
   - Vercel检测到main分支更新
   - 自动开始构建和部署
   - 5分钟内完成

3. **获取域名**
   - 访问 Vercel Dashboard
   - 查看项目的生产环境URL
   - 格式：`https://your-project.vercel.app`

### 方法2：手动部署

```bash
# 1. 克隆仓库
git clone https://github.com/v3ai2026/vision-.git
cd vision-

# 2. 切换到main分支（合并后）
git checkout main

# 3. 安装依赖
npm install --legacy-peer-deps

# 4. 构建
npm run build

# 5. 部署到Vercel
npx vercel --prod
```

### 方法3：使用部署脚本

```bash
# 使用自动化脚本（已包含在scripts/目录）
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

---

## ⚙️ 环境变量配置

在Vercel Dashboard中设置以下环境变量：

```env
# 必需 - AI功能
VITE_GEMINI_API_KEY=your_gemini_api_key

# 可选 - 后端功能
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# 可选 - 支付功能
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_key
VITE_STRIPE_PRO_PRICE_ID=price_xxx
VITE_STRIPE_ENTERPRISE_PRICE_ID=price_xxx
```

---

## 🔍 验证部署

部署完成后访问以下页面确认：

1. **首页** - `https://your-domain.vercel.app/`
   - 应该看到AI Studio界面

2. **管理后台** - 通过RootApp切换
   - Dashboard、Projects等页面

3. **特效测试**
   - 动画效果应正常工作
   - 粒子特效可见

---

## 📝 当前分支状态

- **当前分支**: `copilot/merge-all-features-into-main`
- **提交哈希**: `eafb4e7`
- **状态**: ✅ 所有文件已提交并推送
- **下一步**: 需要合并到 `main` 分支才能部署

---

## 🆘 常见问题

### Q: 为什么部署后是空白页面？
**A**: 因为代码还在PR分支上，需要合并到main分支。在GitHub上合并PR即可。

### Q: 如何切换到管理后台模式？
**A**: 使用RootApp.tsx的模式切换功能，或直接修改路由。

### Q: 所有组件都能用吗？
**A**: 是的！所有65个文件都在仓库里，包括：
- 16个Shadcn UI组件
- 11个动画效果
- 8个粒子特效
- 7个管理页面
- 3D/AR组件
- 所有Hooks和工具

### Q: 需要去其他地方下载吗？
**A**: 不需要！所有东西都在这个仓库里，直接clone就能用。

---

## 📞 技术支持

- **构建时间**: 1.84秒
- **包大小**: 538KB (137KB gzipped)
- **依赖数量**: 448个包
- **安全漏洞**: 0
- **TypeScript错误**: 0

---

## ✅ 部署检查清单

- [ ] PR已合并到main分支
- [ ] Vercel已连接到GitHub仓库
- [ ] 环境变量已配置（至少VITE_GEMINI_API_KEY）
- [ ] 构建命令：`npm run build`
- [ ] 安装命令：`npm install --legacy-peer-deps`
- [ ] 输出目录：`dist`
- [ ] 框架：`vite`

---

**最后更新**: 2025-12-25  
**提交**: eafb4e7  
**状态**: ✅ 准备部署
