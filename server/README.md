# Vision Backend - SpringBlade 微服务系统

## 📋 项目介绍

基于 SpringBlade 微服务框架构建的完整后端 API 系统，支持用户认证、项目管理、团队协作、API 密钥管理和 Stripe 支付功能。

## 🛠 技术栈

- **框架**: Spring Boot 3.3.5 + Spring Cloud 2023.x
- **微服务治理**: Spring Cloud Alibaba (Nacos)
- **数据库**: PostgreSQL (Supabase)
- **认证**: JWT + Spring Security
- **ORM**: MyBatis-Plus 3.5.5
- **支付**: Stripe Java SDK 24.0.0
- **API 网关**: Spring Cloud Gateway
- **服务注册**: Nacos 2.3.0

## 🏗 系统架构

```
server/
├── blade-common/          # 公共模块 (工具类、配置、异常处理)
├── blade-gateway/         # API 网关 (端口 9999)
├── blade-auth/            # 认证中心 (端口 8100)
├── vision-user/           # 用户服务 (端口 8101)
├── vision-project/        # 项目服务 (端口 8102)
└── vision-payment/        # 支付服务 (端口 8103)
```

## 📦 前置要求

- **Java**: JDK 17 或更高版本
- **Maven**: 3.6+ 
- **PostgreSQL**: Supabase 数据库
- **Nacos**: 2.3.0 (可选，用于本地开发)

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd server/
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并填写配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```bash
# Supabase 配置
SUPABASE_DB_HOST=db.your-project.supabase.co
SUPABASE_DB_PORT=5432
SUPABASE_DB_NAME=postgres
SUPABASE_DB_USER=postgres
SUPABASE_DB_PASSWORD=your-password

# JWT 配置
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRATION=604800000

# Stripe 配置
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret
STRIPE_PRO_PRICE_ID=price_xxx
STRIPE_ENTERPRISE_PRICE_ID=price_yyy

# Nacos 配置
NACOS_SERVER_ADDR=localhost:8848

# 前端地址
FRONTEND_URL=http://localhost:5173
```

### 3. 启动 Nacos (本地开发)

#### 使用 Docker:

```bash
docker run --name nacos -d \
  -p 8848:8848 \
  -p 9848:9848 \
  -e MODE=standalone \
  nacos/nacos-server:v2.3.0
```

#### 或使用 Docker Compose:

```bash
docker-compose up -d nacos
```

访问 Nacos 控制台: http://localhost:8848/nacos (用户名/密码: nacos/nacos)

### 4. 构建项目

在 `server/` 目录下执行：

```bash
mvn clean install
```

### 5. 启动服务

按照以下顺序启动各服务：

#### 1) 启动网关服务

```bash
cd blade-gateway
mvn spring-boot:run
```

#### 2) 启动认证服务

```bash
cd blade-auth
mvn spring-boot:run
```

#### 3) 启动用户服务

```bash
cd vision-user
mvn spring-boot:run
```

#### 4) 启动项目服务

```bash
cd vision-project
mvn spring-boot:run
```

#### 5) 启动支付服务

```bash
cd vision-payment
mvn spring-boot:run
```

### 6. 验证服务状态

访问 Nacos 控制台查看所有服务是否注册成功：
http://localhost:8848/nacos

所有服务应该显示为 **UP** 状态。

## 🌐 API 接口文档

### 认证服务 (blade-auth)

基础路径: `http://localhost:9999/blade-auth`

#### 登录
```http
POST /blade-auth/oauth/token
Content-Type: application/json

{
  "username": "user@example.com",
  "password": "password123"
}
```

#### 注册
```http
POST /blade-auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "fullName": "John Doe"
}
```

#### 刷新 Token
```http
POST /blade-auth/oauth/refresh
Authorization: Bearer <token>
```

#### 登出
```http
POST /blade-auth/oauth/logout
Authorization: Bearer <token>
```

### 用户服务 (vision-user)

基础路径: `http://localhost:9999/api/user`

#### 获取用户信息
```http
GET /api/user/info
Authorization: Bearer <token>
```

#### 更新用户信息
```http
PUT /api/user/info
Authorization: Bearer <token>
Content-Type: application/json

{
  "fullName": "John Doe",
  "avatarUrl": "https://..."
}
```

#### 删除账号
```http
DELETE /api/user/account
Authorization: Bearer <token>
```

### 项目服务 (vision-project)

基础路径: `http://localhost:9999/api`

#### 项目管理

```http
# 获取项目列表
GET /api/projects?page=1&size=10
Authorization: Bearer <token>

# 创建项目
POST /api/projects
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "My Project",
  "description": "Project description"
}

# 获取项目详情
GET /api/projects/{id}
Authorization: Bearer <token>

# 更新项目
PUT /api/projects/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Project"
}

# 删除项目
DELETE /api/projects/{id}
Authorization: Bearer <token>
```

#### 团队管理

```http
# 获取团队列表
GET /api/teams
Authorization: Bearer <token>

# 创建团队
POST /api/teams
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "My Team"
}

# 添加成员
POST /api/teams/{id}/members
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "user-id",
  "role": "member"
}

# 移除成员
DELETE /api/teams/{id}/members/{userId}
Authorization: Bearer <token>

# 修改成员角色
PUT /api/teams/{id}/members/{userId}/role
Authorization: Bearer <token>
Content-Type: application/json

{
  "role": "admin"
}
```

#### API 密钥管理

```http
# 获取 API 密钥列表
GET /api/api-keys
Authorization: Bearer <token>

# 生成新密钥
POST /api/api-keys
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Production Key"
}

# 删除密钥
DELETE /api/api-keys/{id}
Authorization: Bearer <token>

# 重新生成密钥
PUT /api/api-keys/{id}/regenerate
Authorization: Bearer <token>
```

### 支付服务 (vision-payment)

基础路径: `http://localhost:9999/api/payment`

#### 创建支付会话
```http
POST /api/payment/checkout
Authorization: Bearer <token>
Content-Type: application/json

{
  "priceId": "price_xxx"
}
```

#### 创建客户门户
```http
POST /api/payment/portal
Authorization: Bearer <token>
Content-Type: application/json

{
  "customerId": "cus_xxx"
}
```

#### Webhook (由 Stripe 调用)
```http
POST /api/payment/webhook
Stripe-Signature: t=xxx,v1=xxx
```

#### 获取订阅状态
```http
GET /api/payment/subscription
Authorization: Bearer <token>
```

#### 取消订阅
```http
DELETE /api/payment/subscription
Authorization: Bearer <token>
```

## 🔧 配置说明

### JWT 配置

- `JWT_SECRET`: JWT 签名密钥 (生产环境必须修改)
- `JWT_EXPIRATION`: Token 过期时间 (毫秒，默认 7 天)

### Stripe 配置

1. 登录 [Stripe Dashboard](https://dashboard.stripe.com)
2. 获取 API 密钥 (测试/生产)
3. 创建产品和价格
4. 配置 Webhook 端点: `https://your-domain.com/api/payment/webhook`
5. 选择监听事件:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

### 数据库配置

确保 Supabase 数据库中已创建以下表：

```sql
-- 参见项目根目录的 supabase-schema.sql
```

## 🐳 Docker 部署

### 构建镜像

为每个服务创建 Dockerfile:

```dockerfile
# 示例 Dockerfile (blade-gateway/Dockerfile)
FROM openjdk:17-slim
WORKDIR /app
COPY target/*.jar app.jar
EXPOSE 9999
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### 使用 Docker Compose

```bash
# 构建并启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止所有服务
docker-compose down
```

## 🔍 前端对接示例

### TypeScript 示例

```typescript
const API_BASE = 'http://localhost:9999';

// 登录
async function login(email: string, password: string) {
  const response = await fetch(`${API_BASE}/blade-auth/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: email, password }),
  });
  const data = await response.json();
  return data.data.accessToken;
}

// 获取项目列表
async function getProjects(token: string) {
  const response = await fetch(`${API_BASE}/api/projects`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const data = await response.json();
  return data.data;
}

// 创建支付会话
async function createCheckout(token: string, priceId: string) {
  const response = await fetch(`${API_BASE}/api/payment/checkout`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ priceId }),
  });
  const data = await response.json();
  window.location.href = data.data.sessionUrl;
}
```

## 📝 开发规范

### 代码风格

- 遵循 SpringBlade 命名规范
- 数据库字段使用 snake_case
- Java 类使用 CamelCase
- 接口以 `I` 开头 (如 `IUserService`)

### 异常处理

使用 `BusinessException` 抛出业务异常：

```java
throw new BusinessException(404, "资源不存在");
throw new BusinessException("操作失败");
```

### 响应格式

所有 API 返回统一格式：

```json
{
  "code": 200,
  "success": true,
  "msg": "操作成功",
  "data": { ... }
}
```

## ❓ 常见问题

### 1. Nacos 连接失败

**问题**: 服务无法注册到 Nacos

**解决**:
- 确认 Nacos 是否启动: `docker ps`
- 检查防火墙是否开放 8848 端口
- 验证 `NACOS_SERVER_ADDR` 配置

### 2. 数据库连接失败

**问题**: 无法连接 Supabase

**解决**:
- 检查 Supabase 连接字符串
- 确认 IP 白名单配置
- 验证数据库凭据

### 3. JWT Token 无效

**问题**: Token 验证失败

**解决**:
- 确认 `JWT_SECRET` 在所有服务中一致
- 检查 Token 是否过期
- 验证请求头格式: `Authorization: Bearer <token>`

### 4. Stripe Webhook 失败

**问题**: Webhook 签名验证失败

**解决**:
- 确认 `STRIPE_WEBHOOK_SECRET` 正确
- 使用 Stripe CLI 测试: `stripe listen --forward-to localhost:9999/api/payment/webhook`
- 检查 webhook 端点是否可公开访问

### 5. 端口冲突

**问题**: 端口已被占用

**解决**:
```bash
# 查找占用端口的进程
lsof -i :8100

# 终止进程
kill -9 <PID>
```

## 📖 相关文档

- [Spring Boot 文档](https://spring.io/projects/spring-boot)
- [Spring Cloud 文档](https://spring.io/projects/spring-cloud)
- [Nacos 文档](https://nacos.io/zh-cn/docs/what-is-nacos.html)
- [MyBatis-Plus 文档](https://baomidou.com/)
- [Stripe API 文档](https://stripe.com/docs/api)

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

**构建时间**: 2024-12
**版本**: 1.0.0
