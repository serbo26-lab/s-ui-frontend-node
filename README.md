# s-ui-frontend-node

Веб-интерфейс для [s-ui-node](https://github.com/serbo26-lab/s-ui-node).

Проект основан на [alireza0/s-ui-frontend](https://github.com/alireza0/s-ui-frontend). Исходный интерфейс и его авторство сохранены в истории Git.

## Локальная разработка

Требуется Node.js 26 и npm.

```bash
npm ci
npm run dev
```

Для проверки изменений:

```bash
npm run lint -- --max-warnings=0
npx vue-tsc --noEmit
npm test
npm run build
```

В режиме разработки Vite направляет запросы `/app/api` на `http://localhost:2095`. Для работы интерфейса с API требуется запущенный backend.

## Связь с backend

Репозиторий [s-ui-node](https://github.com/serbo26-lab/s-ui-node) использует этот frontend как Git submodule в каталоге `frontend/`. Backend фиксирует конкретный коммит интерфейса: изменения в `main` здесь не попадают в готовую панель до отдельного обновления указателя подмодуля.

## Лицензия и происхождение

GNU General Public License v3.0 — см. [LICENSE](LICENSE).

Оригинальный проект: [alireza0/s-ui-frontend](https://github.com/alireza0/s-ui-frontend). Серверная часть оригинала: [alireza0/s-ui](https://github.com/alireza0/s-ui).

Это самостоятельная ветка разработки на основе открытого исходного кода. Проект не заявляет об официальной поддержке первоначальным автором.
