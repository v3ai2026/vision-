#!/bin/bash

# Vercel Deployment Script for Vision PaaS
# This script deploys the frontend to Vercel

set -e

echo "🚀 Vision PaaS - Vercel 部署脚本"
echo "================================"
echo ""

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}⚠️  Vercel CLI 未安装${NC}"
    echo "正在安装 Vercel CLI..."
    npm install -g vercel
    echo -e "${GREEN}✓${NC} Vercel CLI 安装完成"
fi

echo -e "${GREEN}✓${NC} Vercel CLI 版本: $(vercel --version)"
echo ""

# Check for Vercel token
if [ -z "$VERCEL_TOKEN" ]; then
    echo -e "${YELLOW}⚠️  未找到 VERCEL_TOKEN 环境变量${NC}"
    echo ""
    echo "请按照以下步骤操作:"
    echo "1. 访问 https://vercel.com/account/tokens"
    echo "2. 创建一个新的 token"
    echo "3. 设置环境变量: export VERCEL_TOKEN=your_token_here"
    echo ""
    read -p "是否使用交互式登录? (y/n): " use_interactive
    
    if [ "$use_interactive" != "y" ]; then
        echo -e "${RED}❌ 部署已取消${NC}"
        exit 1
    fi
    
    echo ""
    echo "正在启动交互式登录..."
    vercel login
else
    echo -e "${GREEN}✓${NC} 找到 VERCEL_TOKEN"
fi

echo ""
echo "📦 准备部署..."
echo "--------------------------------"

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${YELLOW}⚠️  未找到 .env.local 文件${NC}"
    echo "创建 .env.local 模板..."
    cp .env.example .env.local
    echo -e "${BLUE}ℹ️  请编辑 .env.local 文件并填入必要的环境变量${NC}"
    read -p "按 Enter 键继续..."
fi

# Deployment mode selection
echo ""
echo "请选择部署模式:"
echo "1) 生产部署 (Production)"
echo "2) 预览部署 (Preview)"
read -p "选择 [1-2] (默认: 2): " deploy_mode
deploy_mode=${deploy_mode:-2}

# Set deployment flags
if [ "$deploy_mode" = "1" ]; then
    DEPLOY_FLAGS="--prod"
    echo -e "${BLUE}ℹ️  生产部署模式${NC}"
else
    DEPLOY_FLAGS=""
    echo -e "${BLUE}ℹ️  预览部署模式${NC}"
fi

# Deploy to Vercel
echo ""
echo "🚀 正在部署到 Vercel..."
echo "--------------------------------"

if [ -n "$VERCEL_TOKEN" ]; then
    # Use token for non-interactive deployment
    vercel --token="$VERCEL_TOKEN" $DEPLOY_FLAGS --yes
else
    # Interactive deployment
    vercel $DEPLOY_FLAGS
fi

echo ""
echo -e "${GREEN}✅ 部署成功！${NC}"
echo ""
echo "📋 后续步骤:"
echo "1. 在 Vercel Dashboard 中配置环境变量:"
echo "   - VITE_GEMINI_API_KEY"
echo "   - VITE_SUPABASE_URL"
echo "   - VITE_SUPABASE_ANON_KEY"
echo "   - VITE_STRIPE_PUBLISHABLE_KEY"
echo "   - 其他必要的环境变量"
echo ""
echo "2. 访问 Vercel Dashboard: https://vercel.com/dashboard"
echo "3. 配置自定义域名 (可选)"
echo ""
echo "📚 更多信息:"
echo "  - Vercel 文档: https://vercel.com/docs"
echo "  - 本地测试: npm run dev"
echo "  - 本地构建: npm run build"
echo ""
