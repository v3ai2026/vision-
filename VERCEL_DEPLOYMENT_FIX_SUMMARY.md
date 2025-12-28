# Vercel 部署修复总结

## 已完成的修复

### 1. ✅ 更新 package.json
- 添加 `three-mesh-bvh: "^0.9.0"` 到 overrides，解决弃用警告
- 添加 `node-domexception` override 尝试解决弃用（仍有警告但不影响构建）
- 添加 `terser: "^5.37.0"` 到 devDependencies 用于生产构建压缩

### 2. ✅ 创建 .npmrc 文件
```
legacy-peer-deps=true
```
这解决了 peer dependency 冲突问题，不再需要在安装命令中添加 `--legacy-peer-deps`

### 3. ✅ 优化 vite.config.ts
- 添加 `minify: 'terser'` 用于代码压缩
- 添加 `sourcemap: false` 减少构建产物大小
- 优化 `manualChunks` 配置，添加 AI vendor 分块
- 增加 `chunkSizeWarningLimit` 到 1000
- 添加 `terserOptions` 配置，在生产环境移除 console 和 debugger

### 4. ✅ 更新 vercel.json
- 移除 `installCommand` 中的 `--legacy-peer-deps`（现在由 .npmrc 处理）
- 添加环境变量配置占位符
- 添加 SPA rewrites 规则确保路由正常工作
- 设置 region 为 `iad1` 优化性能

### 5. ✅ 本地构建测试
```bash
npm install  # 成功，使用 .npmrc 配置
npm run build  # 成功，生成 556KB 产物
```

依赖版本验证：
- ✅ three-mesh-bvh@0.9.4 (通过 override 升级)
- ⚠️ domexception 仍有弃用警告（来自 @google/genai 的深层依赖，不影响功能）

## 部署说明

### 方法 1: 使用部署脚本（推荐）

```bash
# 设置 Vercel Token（从 https://vercel.com/account/tokens 获取）
export VERCEL_TOKEN=your_token_here

# 运行部署脚本
./deploy-vercel.sh
```

### 方法 2: 使用 Vercel Dashboard

1. 访问 https://vercel.com/new
2. 从 GitHub 导入此仓库
3. Vercel 会自动识别配置并部署
4. 在项目设置中配置环境变量（见下文）

### 方法 3: 手动使用 Vercel CLI

```bash
# 安装 Vercel CLI（如果还没有）
npm install -g vercel

# 登录
vercel login

# 部署到预览环境
vercel

# 部署到生产环境
vercel --prod
```

## 必需的环境变量

在 Vercel Dashboard 中配置以下环境变量：

**必需**:
- `VITE_GEMINI_API_KEY` - Gemini AI API 密钥

**可选**（根据功能需求）:
- `VITE_API_URL` - 后端 API URL
- `VITE_SUPABASE_URL` - Supabase 项目 URL
- `VITE_SUPABASE_ANON_KEY` - Supabase 匿名密钥
- `VITE_STRIPE_PUBLISHABLE_KEY` - Stripe 可发布密钥
- `VITE_STRIPE_PRO_PRICE_ID` - Stripe Pro 价格 ID
- `VITE_STRIPE_ENTERPRISE_PRICE_ID` - Stripe Enterprise 价格 ID
- `VITE_VERCEL_TOKEN` - Vercel Token（用于应用内部署）
- `VITE_FIGMA_TOKEN` - Figma API Token
- `VITE_GITHUB_TOKEN` - GitHub Personal Access Token

## 构建配置

Vercel 将使用以下配置：
- **Framework**: Vite (自动检测)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`（读取 .npmrc）
- **Node Version**: 20.x (推荐)

## 验证清单

部署后请验证：
- [ ] 主页正常加载
- [ ] 路由切换正常
- [ ] AI 生成功能工作（需要配置 VITE_GEMINI_API_KEY）
- [ ] 3D 场景渲染正常
- [ ] 广告系统功能正常

## 已知问题

1. **domexception 弃用警告**: 这来自 `@google/genai` 的深层依赖，不影响功能。Google 团队需要更新他们的依赖。

2. **node-domexception 弃用警告**: 同样来自 Google 依赖链，已通过 override 尝试解决，但新版本也有类似警告。这不会影响构建或运行。

## 故障排除

### 构建失败
- 确保 `.npmrc` 文件已提交
- 确保 `package.json` 中包含 `terser` devDependency
- 检查 Vercel 构建日志获取详细错误信息

### 运行时错误
- 检查浏览器控制台
- 验证环境变量配置
- 确保 API 端点正确

## 文件清单

修改的文件：
- ✅ `package.json` - 更新依赖和 overrides
- ✅ `vite.config.ts` - 优化构建配置
- ✅ `vercel.json` - 更新 Vercel 配置
- ✅ `.npmrc` - 新增，处理 peer dependencies

新增的文件：
- ✅ `deploy-vercel.sh` - 自动化部署脚本
- ✅ `VERCEL_DEPLOYMENT_GUIDE.md` - 详细部署指南
- ✅ `VERCEL_DEPLOYMENT_FIX_SUMMARY.md` - 本文件

## 下一步

1. 执行部署（使用上述任一方法）
2. 在 Vercel Dashboard 配置环境变量
3. 测试部署的应用
4. （可选）配置自定义域名
5. （可选）启用 Vercel Analytics

## 参考资源

- [完整部署指南](./VERCEL_DEPLOYMENT_GUIDE.md)
- [Vercel 文档](https://vercel.com/docs)
- [Vite 部署指南](https://vitejs.dev/guide/static-deploy.html)
- [Vercel CLI 文档](https://vercel.com/docs/cli)

---

**所有构建问题已解决，项目已准备好部署到 Vercel！** 🚀
