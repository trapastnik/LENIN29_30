# Deploy

## Окружения

| Окружение | Where | URL | Назначение |
|---|---|---|---|
| Dev | локально на Mac | http://127.0.0.1:5173 | разработка (`npm run dev`) |
| Preview | локально на Mac | http://127.0.0.1:4173 | проверка прод-бандла (`npm run preview`) |
| Stage | ostrov (VPS) | http://212.113.117.186:8091/ | показ заказчику (nginx:alpine в docker, контейнер `mtk29-web`) |
| Prod | целевой киоск | `file:///opt/mtk29/dist/index.html` | финал, chromium --kiosk |

## Прод-сборка

```bash
cd mtk29/
npm install          # первый раз
npm run build        # → dist/ (~17 МБ)
```

Содержимое `dist/`:
- `index.html` — редирект на `/expo/`
- `parties.html`, `states.html`, `sections.html`, `demo.html` — страницы разделов
- `assets/` — бандлы JS/CSS (с хешами имён)
- `content/` — весь каталог контента (JSON + медиа), скопирован из `public/`
- `expo/` — импортированный design pass (React + Babel), скопирован из `public/`
- `decor/` — декоративные картинки

Всё статика, серверы/базы не нужны. Любой static file server отдаёт — от nginx до `python -m http.server`.

## Deploy на ostrov (stage)

Адреса:
- SSH: `ssh ostrov` (алиас: root@212.113.117.186:49222)
- Путь: `/var/www/mtk29/`
- URL: http://212.113.117.186:8091 (или как настроим)

На сервере уже есть `/var/www/map/` с legacy `viewer.html` (map_v6) — **не трогаем**, остаётся для обратной совместимости.

### Первый деплой

```bash
# Локально — закоммитить и запушить
cd mtk29/
git push origin main

# На сервере — клонировать в /root/mtk29-src/, поставить deps, собрать
ssh ostrov 'git clone https://github.com/trapastnik/LENIN29_30.git /root/mtk29-src
            && cd /root/mtk29-src && npm install && npm run build
            && mkdir -p /var/www/mtk29
            && rsync -a --delete dist/ /var/www/mtk29/'

# Поднять docker-compose контейнер mtk29-web (см. ниже)
```

### Nginx конфиг

На сервере nginx:alpine крутится в docker-compose отдельно для каждого проекта. Старый map_v6 — на `:8089` через `/var/www/map/`. Для mtk29 — отдельный контейнер `mtk29-web` на `:8091` (см. ниже).

`/var/www/mtk29/nginx.conf`:

```nginx
server {
  listen 80 default_server;
  listen [::]:80 default_server;
  server_name _;

  root /var/www/mtk29;
  index index.html;

  # Корректные MIME для наших ресурсов
  types {
    application/javascript js mjs;
    application/json       json;
    image/svg+xml          svg;
    image/jpeg             jpg jpeg;
    image/png              png;
    image/webp             webp;
    video/mp4              mp4;
    video/webm             webm;
  }

  # SPA-ландинг / → /expo/
  location = / {
    return 302 /expo/;
  }

  # Кеш для статики (контент меняется редко)
  location ~* \.(png|jpg|jpeg|webp|svg|mp4|webm|woff2|json)$ {
    expires 7d;
    add_header Cache-Control "public, must-revalidate";
  }

  # HTML — без кеша
  location ~* \.html?$ {
    add_header Cache-Control "no-cache";
  }

  # React+Babel bootstrap в /expo/ берёт CDN, нужны CORS
  location /expo/ {
    try_files $uri $uri/ =404;
  }
}
```

Применить:
```bash
ssh ostrov "docker exec nginx-map nginx -s reload"
# или, если nginx systemd: ssh ostrov "systemctl reload nginx"
```

Порт 8091 проброшен на хост через docker-compose; firewall открывает его наружу.

Проверка:
```bash
curl -I http://212.113.117.186:8091/               # 302 Location: /expo/
curl -I http://212.113.117.186:8091/expo/          # 200
curl -I http://212.113.117.186:8091/parties.html   # 200
curl -I http://212.113.117.186:8091/content/maps/komuch/layers.svg  # 200
```

### Обновление (только через git, см. memory `feedback_deploy_via_git.md`)

```bash
# Локально — закоммитить и запушить (без локального rsync!)
cd mtk29/
git push origin main

# На сервере — pull + build + копирование в nginx-папку
ssh ostrov 'cd /root/mtk29-src && git pull --ff-only && npm install
            && npm run build
            && rsync -a --delete --exclude=nginx.conf --exclude=content/media/ dist/ /var/www/mtk29/
            && cp deploy/nginx.conf /var/www/mtk29/nginx.conf
            && docker exec mtk29-web nginx -s reload
            && find /var/www/mtk29 -name .DS_Store -delete'
```

`--exclude=nginx.conf` обязательно — иначе rsync `--delete` снесёт конфиг
nginx, который маунтится в контейнер. После копирования свежего
`deploy/nginx.conf` обязательно `nginx -s reload` (иначе изменения
в правилах кеширования не применятся).

**Никогда** не делать `rsync dist/ ostrov:/var/www/mtk29/` напрямую с локальной машины — теряется история деплоев, нельзя откатиться.

### Поднят контейнер nginx:alpine

```bash
# /var/www/mtk29/docker-compose.yml
services:
  web:
    image: nginx:alpine
    container_name: mtk29-web
    volumes:
      - .:/usr/share/nginx/html:ro
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
    ports:
      - "8091:80"
    restart: always
```

nginx.conf — рядом, отдаёт `/expo/` через редирект на корень, MIME для шрифтов/JSON,
кеш статики 7 дней, HTML без кеша.

Stage-URL: http://212.113.117.186:8091/

## Deploy на целевой киоск (prod)

Целевой железо: NUC-класс Windows/Linux-бокс с 4K touch-дисплеем 3840×2160.

### Linux kiosk (рекомендовано)

### Почему киоск ходит через localhost, а не по `file://`

До 2026-08-03 стенд открывался как `file:///opt/mtk29/dist/index.html`. Так
делать нельзя, и это выяснилось дорого — тремя дефектами за один день, каждый
из которых **не виден на stage по http и убивает раздел молча**:

| Что | Симптом под `file://` |
|---|---|
| Абсолютные `/assets/…` | резолвятся в корень ФС, страница без стилей и кода |
| `crossorigin` на `<link>` | CORS для непрозрачного origin, стиль не применяется |
| `<script type=module>` и `fetch` | не исполняются и блокируются |

Замер по последнему: `parties.html` 3 338 → 23 331 байт DOM,
`expo/people.html` 6 629 → 231 468.

Флаг `--allow-file-access-from-files` лечил симптом, но оставлял класс: любой
будущий код на модулях или `fetch` работал бы только там, где флаг не забыли
прописать. Соседний проект 38-42 (пять киоск-МТК того же музея) запретил
`file://` каноном по той же причине — независимое подтверждение.

Локальный статик-сервер убирает причину: у страницы появляется нормальный
origin, и **киоск исполняет ровно то же, что проверено на stage**. Ноль
внешних запросов при этом сохраняется — сервер слушает только `127.0.0.1`.

`/etc/systemd/system/mtk29-server.service`:

```ini
[Unit]
Description=МТК 29 — локальный статик-сервер стенда
After=network.target

[Service]
Type=simple
User=kiosk
# http.server с Python 3.7 многопоточный (ThreadingHTTPServer), одного
# локального клиента держит с запасом. Отдельной зависимости не добавляет:
# python3 есть в любой десктопной сборке Linux.
ExecStart=/usr/bin/python3 -m http.server 8080 --bind 127.0.0.1 --directory /opt/mtk29/dist
Restart=always
RestartSec=2

[Install]
WantedBy=graphical.target
```

`/etc/systemd/system/mtk29-kiosk.service`:

```ini
[Unit]
Description=МТК 29 — Гражданская война
After=graphical.target mtk29-server.service
Requires=mtk29-server.service

[Service]
Type=simple
User=kiosk
Environment="DISPLAY=:0"
ExecStart=/usr/bin/chromium \
  --kiosk \
  --app=http://127.0.0.1:8080/ \
  --window-size=1920,1080 \
  --force-device-scale-factor=2 \
  --start-fullscreen \
  --disable-session-crashed-bubble \
  --disable-infobars \
  --noerrdialogs \
  --overscroll-history-navigation=0 \
  --touch-events=enabled
Restart=on-failure
RestartSec=2

[Install]
WantedBy=graphical.target
```

```bash
sudo systemctl enable --now mtk29-kiosk
```

⚠️ **Окно 1920 плюс фактор 2, а не окно 3840.** Замерено зоной `maps`
на собранном `dist`, оба режима:

| Запуск | Холст CSS | Физически | Строка панели слоёв |
|---|---|---|---|
| `1920` + `--force-device-scale-factor=2` | 1920×993 | 3840×1986 | 26 CSS = **52 физ.** |
| `3840` без фактора | 3840×2073 | 3840×2073 | 26 CSS = **26 физ.** |

Во втором режиме `--ui-scale` не срабатывает по своему условию, и всё
оказывается вдвое мельче физически при том же CSS: на 55-дюймовой панели
подпись становится нечитаемой, а тач-цель — ненажимаемой. До 2026-08-04
здесь стояло именно окно 3840 без фактора; это был вывод из конфига,
а не замер, и он оказался неверным.

### Обновление на киоске

1. Собрать `dist/` локально.
2. Залить через USB-флешку или scp:
   ```bash
   scp -r dist kiosk@киоск-ip:/opt/mtk29/
   ```
3. `sudo systemctl restart mtk29-kiosk` на киоске.

### Windows kiosk

Chromium в kiosk-режиме: shortcut с флагами
```
1. Запустить статик-сервер (Python 3 должен быть установлен):
```
python -m http.server 8080 --bind 127.0.0.1 --directory C:\mtk29\dist
```
2. Ярлык браузера:
```
"C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk --app="http://127.0.0.1:8080/"
```
```
Добавить в автозапуск через Task Scheduler → On Logon.

## Верификация после deploy

- [ ] Главная `/` редиректит на `/expo/`
- [ ] TopBar → Партіи открывает iframe без перезагрузки, закрывает по × и Esc
- [ ] `/parties.html` → Венн + переключатель Диаграмма/Список
- [ ] `/states.html` → 4 блока групп, drill-down в Красные → 11 образований
- [ ] `/states.html` → клик по Комуч → модалка с живой картой, pan/zoom/pinch работает
- [ ] Верньер времени в `/expo/` крутится пальцем, меняет годы 1918-1922
- [ ] Touch-жесты: pinch-zoom на карте, tap везде ≥ 120 px хитбокс
- [ ] Cold start ≤ 5 сек от запуска chromium до интерактивной главной
- [ ] 10 минут непрерывного использования — FPS ≥ 30, нет крашей

## Артефакты для МТК 30 (позже)

После реализации Phase D (мост в МТК 30) появится CLI:
```bash
npm run export -- --sequence scene-09-komuch --profile broadcast
# → export/out/scene-09-komuch-broadcast.mov (1920×1080 @60fps ProRes)
```

Эти файлы **не пакуются в dist**. Передаются монтажёру отдельно.
