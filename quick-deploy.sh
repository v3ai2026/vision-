#!/bin/bash

# 🚀 一键部署到 Vercel 脚本
# 使用方法: ./quick-deploy.sh

set -e

echo "🔍 检查依赖..."
if ! command -v vercel &> /dev/null; then
    echo "📦 安装 Vercel CLI..."
    npm install -g vercel
fi

echo "🧹 清理旧构建..."
rm -rf dist node_modules/.vite

echo "📦 安装依赖..."
npm install --legacy-peer-deps

echo "🔨 构建项目..."
npm run build

echo "✅ 构建成功！"
echo "📊 构建产物:"
ls -lh dist/

echo ""
echo "🚀 现在可以部署了！"
echo ""
echo "选择部署方式："
echo "1. 自动部署: 合并此PR到main分支，GitHub Actions会自动部署"
echo "2. 手动部署: 运行 'vercel --prod' (需要先 'vercel login')"
echo ""
echo "构建完成，准备部署！✨"
