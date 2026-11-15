# Сайт Abdulloh Zokirov

Финальная версия варианта «Кино»: хромированный компьютер, камера на прокрутке, молния, показ работ и роликов, сборщик задачи для Telegram.

## Команды

```bash
npm install        # один раз, ставит Vite, Three.js, GSAP, Lenis
npm run dev        # разработка: http://localhost:5173 (и адрес в сети для телефона)
npm run build      # готовый сайт в папке dist/
npm run preview    # посмотреть собранный сайт: http://localhost:4180
```

## Что где

- `index.html` — разметка страницы, SEO-теги, тексты подписей и блока связи
- `src/main.js` — 3D-сцена (Three.js), камера и переходы (GSAP ScrollTrigger), молния, сборщик задачи
- `src/lib/` — данные проектов (`data.js`), кейс, плеер, пружины, геометрия
- `src/styles/` — стили страницы и кейса
- `public/media`, `public/img` — ролики и обложки (веб-версии из `site/`)
- `public/og.jpg` — картинка для превью ссылки в Telegram и соцсетях

## Публикация

Сайт опубликован на GitHub Pages: https://abdullohzokirov.github.io/portfolio/

Обновить сайт после изменений:

```bash
npm run build
npm run deploy
```

`deploy` отправляет содержимое `dist/` в ветку `gh-pages` этого репозитория.
