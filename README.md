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

AI-класифікація транзакцій використовує OpenAI, якщо в `.env` заповнено `OPENAI_API_KEY`.
Якщо ключ порожній або API недоступний, MVP автоматично переходить на локальні правила класифікації.

## Команди

```bash
npm run build
npm run db:migrate
npm run db:studio
```

Сервер сам створює SQLite-таблиці при старті через `initDb()`, тому MVP запускається без попередніх міграцій.
