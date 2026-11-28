#!/usr/bin/env python3
# Локальный предпросмотр сайта: python3 build/dev-server.py [порт]
# Отдаёт файлы из папки сайта. Тяжёлых роликов и картинок (media/) в рабочей копии нет —
# их сервер один раз скачивает с pavelbach.com в .devcache/ и дальше отдаёт оттуда (с поддержкой перемотки видео).
import http.server, os, sys, urllib.request, urllib.parse, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, '.devcache')
LIVE = 'https://pavelbach.com'

class H(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        p = urllib.parse.unquote(urllib.parse.urlsplit(path).path).lstrip('/')
        local = os.path.normpath(os.path.join(ROOT, p))
        if not local.startswith(ROOT): return ROOT
        if os.path.isdir(local) or os.path.exists(local): return local
        if p.startswith('media/'):
            cached = os.path.normpath(os.path.join(CACHE, p))
            if not cached.startswith(CACHE): return local
            if not os.path.exists(cached):
                os.makedirs(os.path.dirname(cached), exist_ok=True)
                try:
                    req = urllib.request.Request(f'{LIVE}/{urllib.parse.quote(p)}', headers={'User-Agent': 'dev-preview'})
                    with urllib.request.urlopen(req, timeout=60) as r, open(cached + '.part', 'wb') as f: f.write(r.read())
                    os.replace(cached + '.part', cached)
                except Exception as e:
                    sys.stderr.write(f'нет на сайте: {p} ({e})\n')
                    return local
            return cached
        return local

    def send_head(self):  # перемотка видео: отвечаем на Range
        path = self.translate_path(self.path)
        rng = self.headers.get('Range')
        if rng and os.path.isfile(path):
            m = re.match(r'bytes=(\d*)-(\d*)', rng)
            size = os.path.getsize(path)
            if m:
                a = int(m.group(1)) if m.group(1) else 0
                b = min(int(m.group(2)) if m.group(2) else size - 1, size - 1)
                if a <= b:
                    f = open(path, 'rb'); f.seek(a)
                    self.send_response(206)
                    self.send_header('Content-Type', self.guess_type(path))
                    self.send_header('Content-Range', f'bytes {a}-{b}/{size}')
                    self.send_header('Content-Length', str(b - a + 1))
                    self.send_header('Accept-Ranges', 'bytes')
                    self.end_headers()
                    self._left = b - a + 1
                    return f
        self._left = None
        return super().send_head()

    def copyfile(self, src, dst):
        left = getattr(self, '_left', None)
        if left is None: return super().copyfile(src, dst)
        while left > 0:
            buf = src.read(min(65536, left))
            if not buf: break
            dst.write(buf); left -= len(buf)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def log_message(self, *a): pass

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 4173
    os.chdir(ROOT)
    http.server.ThreadingHTTPServer(('127.0.0.1', port), H).serve_forever()
