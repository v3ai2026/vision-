# 前后端路由完整映射表 (Frontend & Backend Route Mapping)

**项目**: IntelliBuild Studio  
**版本**: v1.0.0  
**日期**: 2025-12-28

---

## 📋 路由映射总览 (Route Mapping Overview)

本文档详细描述了前端路由与后端API之间的完整映射关系，以及数据流向。

```
┌─────────────────────────────────────────────────────────────────┐
│                        用户浏览器                                 │
│                                                                  │
│  前端路由 (Frontend Routes)                                       │
│  └─ React Router v7.11.0                                        │
│                                                                  │
│         │ HTTP Request (AJAX/Fetch)                             │
│         ↓                                                        │
├─────────────────────────────────────────────────────────────────┤
│                      网关/代理层                                  │
│  Nginx / Vercel Edge / API Gateway                             │
│                                                                  │
│         │ 路由分发                                               │
│         ↓                                                        │
├─────────────────────────────────────────────────────────────────┤
│                     后端服务                                      │
│                                                                  │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────────┐ │
│  │  Spring Boot   │  │  Supabase      │  │  External APIs   │ │
│  │  微服务         │  │  PostgreSQL    │  │  (Gemini, etc)   │ │
│  └────────────────┘  └────────────────┘  └──────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎨 前端路由详细清单 (Frontend Routes)

### 1️⃣ AI Studio 系统路由

| 前端路径 | 组件 | 页面功能 | 调用的后端API |
|---------|------|---------|--------------|
| `/` | `App.tsx` | AI Studio 主页 | - |
| `/studio` | `App.tsx` | AI Studio (别名) | - |

**App.tsx 内部标签页系统** (不在URL中体现，使用状态管理):

| 标签 | TabType | 功能描述 | 后端API调用 |
|------|---------|---------|------------|
| 📝 Creation Builder | `CREATION_BUILDER` | AI 项目生成 | `POST /api/ai/generate-project` |
| 🎨 Figma Import | `FIGMA_IMPORT` | Figma 设计导入 | `GET /api/figma/file/:id`<br>`GET /api/figma/images` |
| 🌐 Vercel Deploy | `VERCEL_DEPLOY` | Vercel 部署 | `POST /api/deploy/vercel`<br>`GET /api/deploy/status/:id` |
| ☁️ GCS Storage | `GCS_STORAGE` | Google Cloud Storage | `POST /api/storage/gcs/upload`<br>`GET /api/storage/gcs/list` |
| 📊 Ads Manager | `ADS_MANAGER` | 广告系统管理 | `GET /api/ads/campaigns`<br>`POST /api/ads/campaigns` |
| 🚀 Batch Deploy | `BATCH_DEPLOY` | 批量部署 | `POST /api/deploy/batch` |
| 🤖 AI Agents | `AI_AGENTS` | AI 代理编排 | `POST /api/ai/agents/create`<br>`GET /api/ai/agents/list` |
| 🎯 Ad Creator | `AD_CREATOR` | AI 广告创建 | `POST /api/ads/generate-copy` |

### 2️⃣ Admin 管理系统路由

#### 🔓 公开路由 (不需要认证)

| 前端路径 | 组件文件 | 页面功能 | 后端API |
|---------|---------|---------|---------|
| `/admin/login` | `components/auth/LoginForm.tsx` | 用户登录 | `POST /api/auth/login` |
| `/admin/register` | `components/auth/RegisterForm.tsx` | 用户注册 | `POST /api/auth/register` |

#### 🔒 受保护路由 (需要认证)

| 前端路径 | 组件文件 | 页面功能 | 后端API调用 |
|---------|---------|---------|------------|
| `/admin/dashboard` | `pages/Dashboard.tsx` | 管理仪表板 | `GET /api/dashboard/stats`<br>`GET /api/dashboard/chart`<br>`GET /api/dashboard/activities` |
| `/admin/projects` | `pages/Projects.tsx` | 项目管理 | `GET /api/projects`<br>`POST /api/projects`<br>`PUT /api/projects/:id`<br>`DELETE /api/projects/:id` |
| `/admin/teams` | `pages/Teams.tsx` | 团队管理 | `GET /api/teams`<br>`POST /api/teams`<br>`GET /api/teams/:id/members`<br>`POST /api/teams/:id/invite` |
| `/admin/billing` | `pages/Billing.tsx` | 账单中心 | `GET /api/billing/subscription`<br>`GET /api/billing/invoices`<br>`POST /api/billing/upgrade` |
| `/admin/api-keys` | `pages/ApiKeys.tsx` | API 密钥管理 | `GET /api/keys`<br>`POST /api/keys`<br>`DELETE /api/keys/:id` |
| `/admin/profile` | `pages/Profile.tsx` | 个人资料 | `GET /api/users/me`<br>`PUT /api/users/me`<br>`POST /api/users/me/avatar` |
| `/admin/settings` | `pages/Settings.tsx` | 系统设置 | `GET /api/settings`<br>`PUT /api/settings` |

---

## 🔌 后端API路由详细清单 (Backend API Routes)

### 🔐 认证服务 (Authentication Service)

**基础路径**: `/api/auth`

| 方法 | 路径 | 功能 | 请求体 | 响应 | 前端调用位置 |
|------|------|------|--------|------|------------|
| POST | `/api/auth/register` | 用户注册 | `{ email, password, name }` | `{ user, token }` | `RegisterForm.tsx` |
| POST | `/api/auth/login` | 用户登录 | `{ email, password }` | `{ user, token }` | `LoginForm.tsx` |
| POST | `/api/auth/logout` | 用户登出 | `{ token }` | `{ success }` | `useAuth.ts` |
| POST | `/api/auth/refresh` | 刷新Token | `{ refreshToken }` | `{ accessToken }` | `useAuth.ts` |
| GET | `/api/auth/verify` | 验证Token | - | `{ valid, user }` | `AuthWrapper` |
| POST | `/api/auth/forgot-password` | 忘记密码 | `{ email }` | `{ success }` | 未实现 |
| POST | `/api/auth/reset-password` | 重置密码 | `{ token, password }` | `{ success }` | 未实现 |

**技术实现**: Supabase Auth

```typescript
// 前端调用示例
// components/auth/LoginForm.tsx
const handleLogin = async (email: string, password: string) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const { user, token } = await response.json();
  localStorage.setItem('token', token);
};
```

---

### 👥 用户服务 (User Service)

**基础路径**: `/api/users`

| 方法 | 路径 | 功能 | 权限 | 前端调用位置 |
|------|------|------|------|------------|
| GET | `/api/users` | 获取用户列表 | Admin | 未实现 |
| GET | `/api/users/me` | 获取当前用户 | User | `Profile.tsx` |
| PUT | `/api/users/me` | 更新个人资料 | User | `Profile.tsx` |
| POST | `/api/users/me/avatar` | 上传头像 | User | `Profile.tsx` |
| GET | `/api/users/:id` | 获取特定用户 | User | 未实现 |
| DELETE | `/api/users/:id` | 删除用户 | Admin | 未实现 |

**数据库表**: `users`

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100),
  avatar_url TEXT,
  role VARCHAR(20) DEFAULT 'user',
  subscription_tier VARCHAR(20) DEFAULT 'free',
  ai_credits INT DEFAULT 100,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

### 📊 Dashboard 服务 (Dashboard Service)

**基础路径**: `/api/dashboard`

| 方法 | 路径 | 功能 | 响应数据结构 | 前端调用位置 |
|------|------|------|------------|------------|
| GET | `/api/dashboard/stats` | 获取统计数据 | `{ stats: StatItem[] }` | `Dashboard.tsx` |
| GET | `/api/dashboard/chart` | 获取图表数据 | `{ chartData: ChartDataItem[] }` | `Dashboard.tsx` |
| GET | `/api/dashboard/activities` | 获取活动记录 | `{ activities: ActivityItem[] }` | `Dashboard.tsx` |

**响应数据结构**:

```typescript
// GET /api/dashboard/stats 响应
{
  "stats": [
    {
      "title": "总项目数",
      "value": "156",
      "change": "+12.5%",
      "trend": "up",
      "icon": "folder",
      "color": "blue"
    },
    // ...
  ]
}

// GET /api/dashboard/chart 响应
{
  "chartData": [
    { "name": "周一", "value": 120 },
    { "name": "周二", "value": 150 },
    // ...
  ]
}

// GET /api/dashboard/activities 响应
{
  "activities": [
    {
      "user": "张三",
      "action": "创建了新项目",
      "time": "2小时前",
      "type": "create"
    },
    // ...
  ]
}
```

**前端调用示例**:

```typescript
// hooks/useDashboardData.ts (建议实现)
export const useDashboardData = () => {
  useEffect(() => {
    const fetchData = async () => {
      const [statsRes, chartRes, activitiesRes] = await Promise.all([
        fetch('/api/dashboard/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/dashboard/chart', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/dashboard/activities', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);
      
      const [stats, chartData, activities] = await Promise.all([
        statsRes.json(), chartRes.json(), activitiesRes.json()
      ]);
      
      setData({ stats, chartData, activities });
    };
    
    fetchData();
  }, []);
};
```

---

### 📁 项目服务 (Project Service)

**基础路径**: `/api/projects`

| 方法 | 路径 | 功能 | 请求体/参数 | 前端调用位置 |
|------|------|------|-----------|------------|
| GET | `/api/projects` | 获取项目列表 | `?page=1&limit=10&status=active` | `Projects.tsx` |
| POST | `/api/projects` | 创建新项目 | `{ name, description, type }` | `Projects.tsx` |
| GET | `/api/projects/:id` | 获取项目详情 | - | `Projects.tsx` |
| PUT | `/api/projects/:id` | 更新项目 | `{ name, description, status }` | `Projects.tsx` |
| DELETE | `/api/projects/:id` | 删除项目 | - | `Projects.tsx` |
| POST | `/api/projects/:id/deploy` | 部署项目 | `{ platform: 'vercel' \| 'railway' }` | `App.tsx` |

**数据库表**: `projects`

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  type VARCHAR(50),
  status VARCHAR(20) DEFAULT 'draft',
  deploy_url TEXT,
  repository_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

### 👥 团队服务 (Team Service)

**基础路径**: `/api/teams`

| 方法 | 路径 | 功能 | 前端调用位置 |
|------|------|------|------------|
| GET | `/api/teams` | 获取团队列表 | `Teams.tsx` |
| POST | `/api/teams` | 创建团队 | `Teams.tsx` |
| GET | `/api/teams/:id` | 获取团队详情 | `Teams.tsx` |
| PUT | `/api/teams/:id` | 更新团队信息 | `Teams.tsx` |
| GET | `/api/teams/:id/members` | 获取成员列表 | `Teams.tsx` |
| POST | `/api/teams/:id/invite` | 邀请成员 | `Teams.tsx` |
| DELETE | `/api/teams/:id/members/:userId` | 移除成员 | `Teams.tsx` |

---

### 💳 账单服务 (Billing Service)

**基础路径**: `/api/billing`

| 方法 | 路径 | 功能 | 技术实现 | 前端调用位置 |
|------|------|------|---------|------------|
| GET | `/api/billing/subscription` | 获取订阅信息 | Stripe API | `Billing.tsx` |
| POST | `/api/billing/upgrade` | 升级套餐 | Stripe Checkout | `Billing.tsx` |
| GET | `/api/billing/invoices` | 获取账单历史 | Stripe API | `Billing.tsx` |
| POST | `/api/billing/portal` | 打开客户门户 | Stripe Portal | `Billing.tsx` |
| POST | `/api/billing/cancel` | 取消订阅 | Stripe API | `Billing.tsx` |

**Stripe 集成流程**:

```typescript
// 前端: Billing.tsx
const handleUpgrade = async (priceId: string) => {
  // 1. 请求后端创建 Checkout Session
  const response = await fetch('/api/billing/upgrade', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ priceId })
  });
  
  const { sessionId } = await response.json();
  
  // 2. 重定向到 Stripe Checkout
  const stripe = await loadStripe(process.env.VITE_STRIPE_PUBLISHABLE_KEY);
  await stripe.redirectToCheckout({ sessionId });
};

// 后端: /api/billing/upgrade
router.post('/upgrade', async (req, res) => {
  const { priceId } = req.body;
  const userId = req.user.id;
  
  const session = await stripe.checkout.sessions.create({
    customer: userId,
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    success_url: 'https://app.com/admin/billing?success=true',
    cancel_url: 'https://app.com/admin/billing?canceled=true'
  });
  
  res.json({ sessionId: session.id });
});
```

---

### 🔑 API密钥服务 (API Key Service)

**基础路径**: `/api/keys`

| 方法 | 路径 | 功能 | 前端调用位置 |
|------|------|------|------------|
| GET | `/api/keys` | 获取密钥列表 | `ApiKeys.tsx` |
| POST | `/api/keys` | 创建新密钥 | `ApiKeys.tsx` |
| DELETE | `/api/keys/:id` | 删除密钥 | `ApiKeys.tsx` |
| PUT | `/api/keys/:id/rotate` | 轮换密钥 | `ApiKeys.tsx` |

**数据库表**: `api_keys`

```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  name VARCHAR(100),
  key_hash VARCHAR(255) NOT NULL,
  last_used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);
```

---

### ⚙️ 设置服务 (Settings Service)

**基础路径**: `/api/settings`

| 方法 | 路径 | 功能 | 前端调用位置 |
|------|------|------|------------|
| GET | `/api/settings` | 获取用户设置 | `Settings.tsx` |
| PUT | `/api/settings` | 更新设置 | `Settings.tsx` |
| PUT | `/api/settings/notifications` | 更新通知设置 | `Settings.tsx` |
| PUT | `/api/settings/security` | 更新安全设置 | `Settings.tsx` |

---

### 🤖 AI 服务 (AI Service)

**基础路径**: `/api/ai`

| 方法 | 路径 | 功能 | 技术实现 | 前端调用位置 |
|------|------|------|---------|------------|
| POST | `/api/ai/generate-project` | 生成项目代码 | Google Gemini | `App.tsx` (Creation Builder) |
| POST | `/api/ai/chat` | AI 聊天 | Google Gemini | 未实现 |
| POST | `/api/ai/image-generate` | 生成图片 | DALL-E / Stable Diffusion | 未实现 |
| POST | `/api/ai/agents/create` | 创建AI代理 | Custom | `App.tsx` (AI Agents) |
| GET | `/api/ai/agents/list` | 获取代理列表 | Custom | `App.tsx` (AI Agents) |

**项目生成流程**:

```typescript
// 前端: services/geminiService.ts
export const generateFullStackProject = async (prompt: string) => {
  const response = await fetch('/api/ai/generate-project', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      prompt,
      model: 'gemini-2.0-flash-exp',
      temperature: 0.7
    })
  });
  
  return await response.json();
};

// 后端: /api/ai/generate-project
router.post('/generate-project', async (req, res) => {
  const { prompt, model, temperature } = req.body;
  
  const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY);
  const geminiModel = genAI.getGenerativeModel({ model });
  
  const result = await geminiModel.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature,
      responseMimeType: 'application/json'
    }
  });
  
  const generatedCode = result.response.text();
  
  res.json({
    files: parseGeneratedCode(generatedCode),
    prompt,
    timestamp: new Date().toISOString()
  });
});
```

---

### 🚀 部署服务 (Deployment Service)

**基础路径**: `/api/deploy`

| 方法 | 路径 | 功能 | 平台 | 前端调用位置 |
|------|------|------|------|------------|
| POST | `/api/deploy/vercel` | 部署到Vercel | Vercel | `App.tsx` (Vercel Deploy) |
| GET | `/api/deploy/status/:id` | 查询部署状态 | Vercel | `App.tsx` |
| POST | `/api/deploy/batch` | 批量部署 | Multi | `App.tsx` (Batch Deploy) |
| POST | `/api/deploy/railway` | 部署到Railway | Railway | 未实现 |

**Vercel部署流程**:

```typescript
// 前端: services/vercelService.ts
export const deployToVercel = async (files: GeneratedFile[], token: string) => {
  const response = await fetch('/api/deploy/vercel', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({
      files,
      projectName: 'my-project',
      vercelToken: token
    })
  });
  
  return await response.json();
};

// 后端: /api/deploy/vercel
router.post('/vercel', async (req, res) => {
  const { files, projectName, vercelToken } = req.body;
  
  const deployment = await fetch('https://api.vercel.com/v13/deployments', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${vercelToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: projectName,
      files: files.map(f => ({
        file: f.path,
        data: Buffer.from(f.content).toString('base64')
      })),
      projectSettings: {
        framework: 'nextjs'
      }
    })
  });
  
  const result = await deployment.json();
  
  res.json({
    id: result.id,
    url: result.url,
    state: result.readyState
  });
});
```

---

### 🎨 Figma 服务 (Figma Service)

**基础路径**: `/api/figma`

| 方法 | 路径 | 功能 | 前端调用位置 |
|------|------|------|------------|
| GET | `/api/figma/file/:fileKey` | 获取Figma文件 | `App.tsx` (Figma Import) |
| GET | `/api/figma/images` | 导出节点图片 | `App.tsx` (Figma Import) |

**代理模式**: 前端调用后端，后端调用Figma API（避免暴露Token）

```typescript
// 前端: services/figmaService.ts
export const getFigmaFile = async (fileKey: string, token: string) => {
  const response = await fetch(`/api/figma/file/${fileKey}`, {
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'X-Figma-Token': token
    }
  });
  return await response.json();
};

// 后端: /api/figma/file/:fileKey
router.get('/file/:fileKey', async (req, res) => {
  const { fileKey } = req.params;
  const figmaToken = req.headers['x-figma-token'];
  
  const response = await fetch(`https://api.figma.com/v1/files/${fileKey}`, {
    headers: {
      'X-Figma-Token': figmaToken
    }
  });
  
  const data = await response.json();
  res.json(data);
});
```

---

### ☁️ 存储服务 (Storage Service)

**基础路径**: `/api/storage`

| 方法 | 路径 | 功能 | 平台 | 前端调用位置 |
|------|------|------|------|------------|
| POST | `/api/storage/gcs/upload` | 上传到GCS | Google Cloud | `App.tsx` (GCS Storage) |
| GET | `/api/storage/gcs/list` | 列出GCS文件 | Google Cloud | `App.tsx` (GCS Storage) |
| POST | `/api/storage/supabase/upload` | 上传到Supabase | Supabase | 未实现 |

---

### 📊 广告服务 (Ads Service)

**基础路径**: `/api/ads`

| 方法 | 路径 | 功能 | 前端调用位置 |
|------|------|------|------------|
| GET | `/api/ads/campaigns` | 获取广告活动 | `App.tsx` (Ads Manager) |
| POST | `/api/ads/campaigns` | 创建广告活动 | `App.tsx` (Ads Manager) |
| PUT | `/api/ads/campaigns/:id` | 更新广告活动 | `App.tsx` (Ads Manager) |
| DELETE | `/api/ads/campaigns/:id` | 删除广告活动 | `App.tsx` (Ads Manager) |
| POST | `/api/ads/generate-copy` | AI生成广告文案 | `App.tsx` (Ad Creator) |
| GET | `/api/ads/metrics` | 获取广告指标 | `App.tsx` (Ads Manager) |

---

## 🔄 完整数据流示例 (Complete Data Flow Example)

### 示例 1: 用户登录流程

```
1. 用户访问: http://localhost:3000/admin/login
   └─ 前端路由: RootApp → AdminApp → LoginForm 组件

2. 用户输入邮箱密码，点击登录
   └─ 前端调用: LoginForm.tsx

3. 发送请求到后端:
   POST /api/auth/login
   Body: { email: "user@example.com", password: "******" }
   
4. 后端处理:
   ├─ 验证用户凭据 (Supabase Auth)
   ├─ 生成 JWT Token
   └─ 返回: { user: {...}, token: "eyJ..." }

5. 前端接收响应:
   ├─ 保存 Token 到 localStorage
   ├─ 更新全局状态 (useAuth)
   └─ 导航到: /admin/dashboard

6. Dashboard 加载:
   ├─ AuthWrapper 验证 Token
   ├─ 并行请求 3 个 API:
   │   ├─ GET /api/dashboard/stats
   │   ├─ GET /api/dashboard/chart
   │   └─ GET /api/dashboard/activities
   └─ 渲染页面
```

### 示例 2: AI 项目生成并部署

```
1. 用户在 Studio 输入提示词
   └─ 前端: App.tsx (Creation Builder 标签)

2. 点击"生成项目"
   └─ 前端调用: geminiService.generateFullStackProject()

3. 发送到后端:
   POST /api/ai/generate-project
   Body: {
     prompt: "创建一个电商网站",
     model: "gemini-2.0-flash-exp",
     temperature: 0.7
   }

4. 后端处理:
   ├─ 调用 Google Gemini API
   ├─ 解析生成的代码
   └─ 返回: { files: [...], prompt, timestamp }

5. 前端显示结果:
   ├─ 在 Monaco Editor 中显示代码
   └─ 用户点击"部署到 Vercel"

6. 部署流程:
   POST /api/deploy/vercel
   Body: { files: [...], projectName, vercelToken }

7. 后端处理:
   ├─ 调用 Vercel Deployment API
   ├─ 上传文件
   └─ 返回: { id, url, state }

8. 前端显示:
   └─ "部署成功！访问: https://my-project.vercel.app"
```

### 示例 3: Dashboard 数据实时更新

```
1. 用户访问 /admin/dashboard
   └─ 前端: Dashboard.tsx 组件加载

2. 组件挂载后:
   └─ useDashboardData Hook 执行

3. 并行请求后端 API:
   ├─ GET /api/dashboard/stats
   │   └─ 返回: { stats: [ { title, value, change, ... }, ... ] }
   ├─ GET /api/dashboard/chart
   │   └─ 返回: { chartData: [ { name, value }, ... ] }
   └─ GET /api/dashboard/activities
       └─ 返回: { activities: [ { user, action, time }, ... ] }

4. 前端更新状态:
   └─ setData({ stats, chartData, activities })

5. 页面重新渲染:
   ├─ 统计卡片显示最新数据
   ├─ 图表更新
   └─ 活动列表刷新

6. 30秒后自动轮询:
   └─ 重复步骤 3-5 (实时更新)
```

---

## 📊 API 路由统计汇总

### 按服务分类

| 服务 | API 数量 | 实现状态 |
|------|---------|---------|
| 认证服务 (Auth) | 7 | ✅ 完成 (Supabase) |
| 用户服务 (Users) | 6 | ⚠️ 部分实现 |
| Dashboard | 3 | ⚠️ 待实现 (建议优先) |
| 项目服务 (Projects) | 6 | ⚠️ 部分实现 |
| 团队服务 (Teams) | 7 | ⚠️ 待实现 |
| 账单服务 (Billing) | 5 | ✅ 完成 (Stripe) |
| API密钥 (Keys) | 4 | ⚠️ 待实现 |
| 设置服务 (Settings) | 4 | ⚠️ 待实现 |
| AI服务 (AI) | 5 | ✅ 完成 (Gemini) |
| 部署服务 (Deploy) | 4 | ✅ 完成 (Vercel) |
| Figma服务 | 2 | ✅ 完成 |
| 存储服务 (Storage) | 3 | ✅ 完成 (GCS) |
| 广告服务 (Ads) | 6 | ⚠️ 部分实现 |

**总计**: 62 个后端API端点

### 实现状态

- ✅ **已完成**: 27 个 (43.5%)
- ⚠️ **待实现**: 35 个 (56.5%)

### 优先级建议

**高优先级** (立即实现):
1. Dashboard API (3个) - 前端已有页面，急需数据
2. Projects API (6个) - 核心功能
3. Users API (补充4个) - 个人资料管理

**中优先级** (近期实现):
4. Teams API (7个) - 团队协作功能
5. Settings API (4个) - 系统配置
6. API Keys API (4个) - 开发者功能

**低优先级** (长期规划):
7. Ads API (补充部分) - 广告系统完善

---

## 🔧 技术实现建议

### 后端架构建议

```
backend/
├── src/
│   ├── controllers/          # 控制器层
│   │   ├── AuthController.java
│   │   ├── DashboardController.java
│   │   ├── ProjectController.java
│   │   └── ...
│   ├── services/             # 业务逻辑层
│   │   ├── AuthService.java
│   │   ├── DashboardService.java
│   │   └── ...
│   ├── repositories/         # 数据访问层
│   │   ├── UserRepository.java
│   │   ├── ProjectRepository.java
│   │   └── ...
│   ├── models/              # 数据模型
│   │   ├── User.java
│   │   ├── Project.java
│   │   └── ...
│   └── config/              # 配置
│       ├── SecurityConfig.java
│       └── CorsConfig.java
```

### API 网关配置示例

```nginx
# nginx.conf
server {
  listen 80;
  server_name api.example.com;

  # 前端静态资源
  location / {
    root /var/www/dist;
    try_files $uri $uri/ /index.html;
  }

  # 后端 API 代理
  location /api/ {
    proxy_pass http://backend:8080/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }

  # Supabase 代理
  location /supabase/ {
    proxy_pass https://your-project.supabase.co/;
  }
}
```

---

## 📝 总结

本文档详细列出了 IntelliBuild Studio 的完整前后端路由映射关系：

- **前端路由**: 11 个主要路由 + 8 个内部标签页
- **后端API**: 62 个端点，分为 13 个服务模块
- **当前完成度**: 43.5% 的 API 已实现
- **优先级任务**: Dashboard、Projects、Users API 亟待实现

建议按照优先级逐步完善后端 API，确保前端功能能够正常使用动态数据。

---

**文档版本**: v1.0  
**最后更新**: 2025-12-28  
**维护者**: @copilot
