# Kasyr.ai MVP

Dark-mode MVP для ФОП-бухгалтерії: onboarding, dashboard, транзакції, звіти, дедлайни, налаштування та Express API.

## Запуск

```bash
npm install
cp .env.example .env
npm run dev
```

Frontend: `http://localhost:5173`
Backend: `http://localhost:3001`

Для локальної перевірки Monobank у кроці підключення можна ввести `demo-token`. Реальний токен також підтримується через Monobank API.

AI-класифікація транзакцій використовує Grok (xAI), якщо в `.env` заповнено `GROK_API_KEY`.
Якщо ключ порожній або Grok недоступний, застосунок автоматично переходить на локальні правила класифікації.
Щоб одна людина не витратила всі кредити, є денний ліміт AI-викликів на користувача: `AI_DAILY_LIMIT` (рекомендовано 10-20).

## Документація

- `docs/ROADMAP.md` — наступні кроки розвитку продукту
- `docs/OFFICIAL_SOURCES_UA.md` — держсайти/офіційні джерела для звірки правил ФОП
- `docs/TAX_CONFIG_UPDATE_GUIDE.md` — як оновлювати податкові параметри в коді

## Команди

```bash
npm run build
npm run db:migrate
npm run db:studio
```

Сервер сам створює SQLite-таблиці при старті через `initDb()`, тому MVP запускається без попередніх міграцій.
