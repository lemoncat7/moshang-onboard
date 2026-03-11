#!/usr/bin/env python3
"""Dashboard Service - 莫殇状态看板 + Star Office UI 代理"""

import http.server
import socketserver
import os
import json
from urllib.parse import urlparse

PORT = 19000

DASHBOARD_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend/index.html')
STAR_OFFICE_DIR = '/workspace/Star-Office-UI/frontend'

class DashboardHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        path = urlparse(self.path).path
        
        # 健康检查
        if path == '/health':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                'status': 'ok',
                'service': 'dashboard',
                'time': '2026-03-11'
            }).encode())
            return
        
        # Star Office UI
        if path.startswith('/star') or path.startswith('/office'):
            file_path = path.replace('/star', '').replace('/office', '')
            if not file_path or file_path == '/':
                file_path = '/index.html'
            full_path = os.path.join(STAR_OFFICE_DIR, file_path.lstrip('/'))
            
            if os.path.exists(full_path):
                self.serve_file(full_path)
            else:
                # 尝试 index.html
                index_path = os.path.join(STAR_OFFICE_DIR, 'index.html')
                if os.path.exists(index_path):
                    self.serve_file(index_path)
                else:
                    self.send_error(404, 'Not Found')
            return
        
        # 默认显示看板
        if os.path.exists(DASHBOARD_FILE):
            self.serve_file(DASHBOARD_FILE)
        else:
            self.send_error(404, 'Dashboard not found')
    
    def serve_file(self, file_path):
        ext = os.path.splitext(file_path)[1]
        content_types = {
            '.html': 'text/html',
            '.js': 'application/javascript',
            '.css': 'text/css',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.webp': 'image/webp',
            '.woff': 'font/woff2',
            '.woff2': 'font/woff2',
        }
        
        content_type = content_types.get(ext, 'text/plain')
        
        with open(file_path, 'rb') as f:
            content = f.read()
        
        self.send_response(200)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', len(content))
        self.end_headers()
        self.wfile.write(content)
    
    def log_message(self, format, *args):
        print(f"[Dashboard] {args[0]}")

print(f"🚀 Dashboard 服务启动中: http://localhost:{PORT}")
print(f"📊 看板: http://localhost:{PORT}/")
print(f"🏢 Star Office: http://localhost:{PORT}/star")

socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("", PORT), DashboardHandler) as httpd:
    httpd.serve_forever()
