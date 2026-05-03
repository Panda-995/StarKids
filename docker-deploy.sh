#!/bin/bash
set -e

IMAGE_TAG=${IMAGE_TAG:-latest}

echo "============================================"
echo " StarKids - Docker 部署"
echo " 镜像: ghcr.io/panda-995/starkids:$IMAGE_TAG"
echo "============================================"
echo ""

echo "[1/2] 拉取镜像..."
docker compose pull

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
echo ""
echo " 切换镜像标签:"
echo "   IMAGE_TAG=arm docker compose up -d  (ARM架构)"
echo "   IMAGE_TAG=latest docker compose up -d  (x86架构)"
echo "============================================"