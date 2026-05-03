#!/bin/bash
set -e

echo "============================================"
echo " StarKids - Docker 部署"
echo "============================================"
echo ""

echo "[1/2] 构建镜像..."
docker compose build

echo ""
echo "[2/2] 启动服务..."
docker compose up -d

echo ""
echo "============================================"
echo " 部署完成！"
echo " 访问: http://localhost:3000"
echo ""
echo " 常用命令:"
echo "   docker compose logs -f    查看日志"
echo "   docker compose down       停止服务"
echo "   docker compose up -d      启动服务"
echo "============================================"
