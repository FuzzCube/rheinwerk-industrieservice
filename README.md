# RheinWerk Industrieservice

Полная версия исходного сайта на Next.js 16, App Router, TypeScript и Tailwind CSS. Исходные HTML-файлы сохранены в корне проекта как референс; CSS-токены из исходной дизайн-системы используются приложением напрямую.

## Что реализовано

- Все страницы, навигация, мобильное меню, адаптивные состояния и информационный ассистент.
- Пятишаговая немецкая форма с сохранением черновика в `sessionStorage`.
- Проверка обязательных полей на клиенте и сервере с перечнем полей, которые надо исправить.
- Детерминированный `human_review: true` для Produktionsstillstand, а также для Sicherheitsgefahr `Ja` или `Unklar`.
- Ответы Make `201`, `400` и `409`; повторная заявка показывается как уже успешно переданная.
- До трех приватных PDF/JPG/PNG-файлов по 5 MB через Vercel Blob.
- Cloudflare Turnstile, базовое ограничение частоты заявок и загрузок, серверный прокси к Make.

## Локальный запуск

```bash
npm install
cp .env.example .env.local
npm run dev
```

Проверки:

```bash
npm run lint
npm run typecheck
npm run build
```

Production-сборка использует Webpack, потому что в изолированных средах Turbopack может пытаться открыть внутренний служебный порт.

## Переменные окружения

Скопируйте значения из [.env.example](./.env.example):

- `MAKE_WEBHOOK_URL`: URL Custom Webhook из Make.
- `MAKE_API_KEY`: необязательно; отправляется Make в заголовке `x-make-apikey`.
- `BLOB_READ_WRITE_TOKEN`: создается при подключении Vercel Blob к проекту.
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`: публичный ключ Cloudflare Turnstile.
- `TURNSTILE_SECRET_KEY`: секретный ключ Cloudflare Turnstile.

Эти же переменные надо добавить в Vercel в `Project Settings > Environment Variables`. Секреты не должны начинаться с `NEXT_PUBLIC_`.

## Контракт с Make

Браузер отправляет JSON только на `/api/service-request`. Сервер проверяет форму и Turnstile, создает временные ссылки для приватных файлов, удаляет Turnstile-токен и пересылает запрос в Make.

Основные поля запроса:

```json
{
  "schema_version": "1.0",
  "submission_id": "uuid",
  "source": "rheinwerk_website_service_request",
  "locale": "de-DE",
  "submitted_at": "ISO-8601",
  "contact": {},
  "site_and_equipment": {},
  "request": {
    "service_type": "inspection",
    "preferred_service_date": "2026-09-10",
    "requires_human_review": false
  },
  "contract_and_attachments": {
    "attachments": [
      {
        "file_name": "foto.jpg",
        "pathname": "service-requests/uuid/foto-random.jpg",
        "mime_type": "image/jpeg",
        "size_bytes": 123456,
        "upload_status": "uploaded",
        "download_url": "временная приватная ссылка"
      }
    ]
  },
  "privacy_consent": true
}
```

Временная ссылка на файл действует один час. Make должен скачать файл для классификации в течение этого времени. Сам Blob остается приватным.

В конце сценария Make нужен модуль `Webhook response`, который возвращает один из согласованных вариантов:

```json
// HTTP 201
{
  "status": "created",
  "ticket_key": "KEY-123",
  "human_review": false
}
```

```json
// HTTP 400
{
  "status": "invalid",
  "message": "Required fields are missing or privacy consent was not given."
}
```

```json
// HTTP 409
{
  "status": "duplicate",
  "message": "This service request has already been submitted."
}
```

Для критической заявки сервер сам передает `request.requires_human_review: true` и не позволит ответу `201` изменить это значение обратно на `false`.

## Где находится логика

- [app/[[...slug]]/page.tsx](./app/[[...slug]]/page.tsx): маршрутизация страниц.
- [components/pages.tsx](./components/pages.tsx): контент основных страниц.
- [components/service-form.tsx](./components/service-form.tsx): форма, ошибки, загрузка файлов и обработка `201/400/409`.
- [app/api/service-request/route.ts](./app/api/service-request/route.ts): проверка, Turnstile, временные Blob-ссылки и прокси к Make.
- [app/api/upload/route.ts](./app/api/upload/route.ts): разрешения для прямой загрузки в Vercel Blob.
- [lib/form-contract.ts](./lib/form-contract.ts): TypeScript-контракт и серверная валидация.
- [app/globals.css](./app/globals.css): перенесенная дизайн-система и адаптивная верстка.

## Перед production

Текущий лимит запросов хранится в памяти отдельной serverless-функции и подходит как дополнительный слой для небольшого демо. Для общего лимита между всеми инстансами подключите Vercel Firewall или внешнее хранилище лимитов. Также задайте срок хранения Blob-файлов и удаляйте их после классификации или завершения проверки согласно политике конфиденциальности.
