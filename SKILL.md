---
name: dashboard-service
description: 莫殇的像素状态看板服务，同时代理 Star Office UI
---

# Dashboard Service

莫殇的实时状态看板 + Star Office UI 代理服务

## 功能

- 莫殇状态看板（心率、任务、对话）
- Star Office UI 代理
- 实时数据更新

## 启动

```bash
node ~/.openclaw/workspace/skills/dashboard-service/scripts/server.js &
```

## 访问

- 看板: http://localhost:19000
- Star Office UI: http://localhost:19000/star
- 健康检查: http://localhost:19000/health

## 外网访问

通过 Gateway 配置端口转发：
- https://oclaw.mochencloud.cn:1443/onboard → localhost:19000
