#!/usr/bin/env bash
# 部署 learn-x 到 buynao 服务器（39.106.15.209）
# 访问地址: https://aipath.buynao.com
set -euo pipefail
cd "$(dirname "$0")"

npm run build
rsync -az --delete dist/ buynao:/opt/learn-x/dist/
echo "✅ 已部署: https://aipath.buynao.com"
