#!/usr/bin/env bash
# 淡茶半盏（dcbztea）一键部署脚本：本地构建 → 上传 dist 到阿里云 ECS/轻量服务器 → 重载 Nginx
#
# 用法：
#   1. 修改下方 SERVER（服务器公网 IP 或域名）与 REMOTE_DIR
#   2. 首次部署：先在服务器配置好 Nginx（见 deploy/nginx.conf）并建好目录
#   3. 执行：bash deploy/deploy.sh
set -euo pipefail

# ── 配置（按需修改） ──
SERVER="root@your-server-ip"        # 服务器（ssh 免密或会提示输密码）
REMOTE_DIR="/var/www/dcbztea"       # 站点根目录（与 nginx.conf root 一致）

echo "▶ 构建生产包..."
npm run build

echo "▶ 上传 dist/ → ${SERVER}:${REMOTE_DIR} ..."
# rsync 增量上传并删除远端多余文件（保留旧 hash 文件可去掉 --delete-after）
rsync -avz --delete-after dist/ "${SERVER}:${REMOTE_DIR}/"

echo "▶ 重载 Nginx..."
ssh "${SERVER}" "nginx -t && nginx -s reload"

echo "✅ 部署完成。"
