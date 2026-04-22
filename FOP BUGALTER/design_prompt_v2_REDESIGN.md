# 🔄 REDESIGN PROMPT — Kasyr.ai v2
## Завдання: Повний редизайн з нуля

Попередній дизайн (що ти вже зробив) потребує кардинального переосмислення.
Головна проблема: він виглядає як **покращений Taxer**, а не як **преміум tech-продукт**.
Нам потрібен рівень Revolut Black × Linear × Vercel — але для українського ФОП.

---

## ЩО НЕ ТАК З ПОПЕРЕДНІМ ВАРІАНТОМ (критика)

1. **Кольори** — помаранчевий акцент + білий фон = Taxer.ua 2.0. Це вже є на ринку і це не те.
2. **Картки** — плоскі білі прямокутники з тонкою рамкою — немає глибини, немає преміум-відчуття.
3. **Типографіка** — цифри недостатньо великі та домінуючі. У фінтех-дашборді число — це герой.
4. **Загальний настрій** — занадто "бізнес-soft", занадто схоже на звичайний SaaS. Не вистачає характеру.
5. **Мобайл** — виглядає як зменшений desktop, а не як нативний мобільний продукт.

---

## НОВА ДИЗАЙН-СИСТЕМА

### Режим: Dark-first (обов'язково)
Основний режим — темний. Light mode — опція (не пріоритет зараз).

### Кольорова палітра (точні значення)

**Фони (layered dark):**
```
Background:   #0C0C0F  (майже чорний, але не чистий)
Surface:      #141418  (картки, панелі)
Surface-2:    #1C1C22  (вкладені елементи, inputs)
Border:       #2A2A35  (тонкі розділювачі)
Border-hover: #3D3D4E
```

**Акцентний колір — Indigo (основний):**
```
Indigo-400:   #818CF8  (текст на темному, іконки)
Indigo-500:   #6366F1  (основні кнопки, активні стани)
Indigo-600:   #4F46E5  (hover стан кнопок)
Indigo-glow:  rgba(99, 102, 241, 0.15)  (glow ефекти, subtle highlights)
```

**Семантичні кольори:**
```
Success:      #10B981  (Emerald — дохід, сплачено)
Warning:      #F59E0B  (Amber — дедлайн наближається, <7 днів)
Danger:       #EF4444  (Red — прострочено, штраф)
Info:         #38BDF8  (Sky — підказки, нейтральна інфо)
```

**Текст:**
```
Text-primary:    #F1F1F3  (основний текст)
Text-secondary:  #8B8B9E  (підписи, мета)
Text-muted:      #4F4F61  (placeholder, disabled)
```

### Типографіка — Inter (обов'язково)

Підключити через Google Fonts: `Inter` з варіантами 400/500/600/700/800.
Для цифр увімкнути: `font-variant-numeric: tabular-nums`.

**Шкала:**
```
Display:   56px / weight 800 / tracking -0.03em  → головна сума на дашборді
H1:        36px / weight 700 / tracking -0.02em
H2:        24px / weight 600 / tracking -0.01em
H3:        18px / weight 600
Body:      15px / weight 400 / line-height 1.6
Small:     13px / weight 400
Label:     11px / weight 500 / tracking 0.06em / uppercase → підписи над секціями
```

### Елементи стилю

**Border-radius:**
```
Cards:    16px
Buttons:  10px
Inputs:   10px
Badges:   6px
```

**Тіні та глибина:**
- Картки не мають звичайної тіні — замість цього: тонка межа `1px solid #2A2A35` + `backdrop-filter: blur(12px)` для glass-ефекту де потрібно
- Hero-card: легке `box-shadow: 0 0 40px rgba(99, 102, 241, 0.2)` — ледь помітне indigo glow

**Мікро-деталі (обов'язково):**
- Іконки: Lucide Icons (16/20px, stroke 1.5)
- Числа з пробілами-розділювачами: `11 549` а не `11549`
- Валюта — сірим кольором поруч: `₴ 11 549` де `₴` — text-muted
- Статус-точки: `8px` кружок з кольором + label

---

## ГОЛОВНИЙ ЕКРАН — МОБАЙЛ (переробити повністю)

### Структура екрану (top → bottom):

**1. Header (56px висота):**
- Зліва: аватар (ініціали в indigo-крузі) + "Привіт, Маріє 👋"
- Справа: іконка дзвінка (нотифікації) + іконка налаштувань

**2. Hero Payment Card (найважливіший елемент):**

Картка на повну ширину (margin: 16px), висота ~180px.

**Фон картки:** gradient від `#1C1C22` до `#1A1A2E` з легким indigo glow по краях.
Або варіант: gradient `135deg, #1e1b4b → #312e81` (дуже темний indigo).

**Вміст:**
```
[label]  ДО СПЛАТИ  •  Q2 2026        [badge] 19 днів
[число]  11 549 ₴                               (56px, 800, white)
[row]    ЄП 1 729  ·  ЄСВ 5 706  ·  ВЗ 4 114  (13px, мuted)
[buttons] [Деталі →]          [Сплатити ↗]
```
- "Деталі" — ghost button (border indigo)
- "Сплатити" — filled button (indigo-500, з легкою тінню)

**3. Income Section:**

Заголовок (Label-style): "ДОХІД ЦЬОГО КВАРТАЛУ"

```
₴ 256 680          +$6 200 USD
(28px, 700, white)  (13px, emerald, з іконкою ↑)
```

Mini bar chart — 4 бари (квітень/травень/червень/липень).
Бари: active = indigo-500, inactive = surface-2.
Висота chart: ~64px. Мінімалістичний, без осей і підписів (тільки hover).

**4. Status Row (Книга обліку):**

Рядок між графіком і транзакціями:
```
[🟢 іконка]  Книга обліку актуальна    [>]
              Синхронізовано 2 хв тому
```
Якщо є некласифіковані: `[🟡]  3 транзакції потребують уваги`

**5. Останні транзакції:**

Заголовок: "ОСТАННІ ТРАНЗАКЦІЇ" + кнопка "Всі →" (indigo, 13px)

Кожна транзакція — рядок (68px висота):
```
[avatar/logo]  Назва клієнта/банку        + 45 360 ₴
               22 квітня · Monobank      [badge: Дохід]
```
- Аватар: 36px коло — або логотип банку, або ініціали клієнта
- Сума: завжди виділена (white, 600)
- Badge "Дохід" — emerald, дрібний
- Badge "Не класифіковано" — amber, кликабельний

Роздільник між транзакціями: `1px solid #1C1C22` (дуже тонкий, майже непомітний)

**6. Bottom Navigation:**

Fixed bottom, height 80px (+ safe area):
```
[🏠 Огляд]  [↕ Транзакції]  [＋]  [📄 Звіти]  [👤 Профіль]
```
- Активна вкладка: indigo-400 іконка + підпис
- Неактивна: text-muted
- Центральна кнопка [＋]: indigo-500 коло 56px, трохи підведене над навбаром — "додати транзакцію вручну"

---

## DESKTOP ДАШБОРД (sidebar layout)

**Sidebar (240px, dark):**
```
[Kasyr.ai logo]           ← 32px, wordmark

ГОЛОВНЕ
  🏠  Огляд              ← активна, indigo highlight
  ↕   Транзакції
  📚  Книга обліку
  📄  Звіти

ФІНАНСИ
  🏦  Рахунки
  📅  Дедлайни

[separator]
  ⚙️  Налаштування
  ❓  Допомога

[bottom]
  [avatar]  Марія К.
            ФОП 3 гр.     ← 11px, muted
```

**Main content area:**

Top row — 3 summary cards:
```
[Card 1]               [Card 2]              [Card 3]
До сплати              Дохід кварталу        Статус Книги
11 549 ₴              256 680 ₴             ● Актуальна
За 19 днів            +12% до минулого       оновлено щойно
[Сплатити →]          $6 200 USD
```

Картки однакової висоти (~140px), з тонким border, hover — легка border-color зміна.

Другий рядок — два блоки:
- **Зліва (60%):** Графік доходів (line chart або bar chart по місяцях за рік, indigo line + emerald fill)
- **Справа (40%):** Найближчі дедлайни (список 3–4 штуки з датою, сумою і статусом)

Третій рядок — таблиця транзакцій (повна ширина):
- Колонки: Дата / Опис / Клієнт / Сума / Джерело / Статус / [дія]
- Рядки з hover highlight (surface-2)
- Bulk checkbox зліва

---

## КОМПОНЕНТИ ЩО ТРЕБА ПЕРЕРОБИТИ

### Кнопки:
```
Primary:   bg indigo-500, text white, hover indigo-600, active scale(0.98)
Secondary: bg surface-2, text text-primary, border border, hover border-indigo
Ghost:     bg transparent, text indigo-400, hover bg indigo-glow
Danger:    bg transparent, text red-400, hover bg rgba(239,68,68,0.1)
Disabled:  opacity 0.4, cursor not-allowed
Loading:   spinner зліва + opacity 0.8
```

### Inputs:
```
Default:   bg surface-2, border border, text text-primary, radius 10px, height 44px
Focus:     border indigo-500 + glow: 0 0 0 3px rgba(99,102,241,0.2)
Error:     border red-400 + message нижче (red-400, 12px)
Success:   border emerald-500
```

### Badges/Статуси:
```
Дохід:           bg emerald з opacity 0.15, text emerald-400
Повернення:      bg red з opacity 0.15, text red-400
Переказ (свій):  bg surface-2, text text-secondary
Комісія:         bg amber з opacity 0.15, text amber-400
Не класифіковано: bg amber з opacity 0.15, text amber-300, border dashed
```

---

## ОНБОРДИНГ — СТИЛЬ

Кожен екран онбордингу — centered layout, max-width 420px, на темному фоні.

Прогрес: тонка лінія зверху (indigo, від 0 до 100% по 3 кроках). Не numbered dots.

Welcome screen: великий заголовок (H1, white), підзаголовок (body, text-secondary), одна CTA-кнопка (primary, full-width).

Кнопки вибору (група ЄП, вибір банку): великі плитки 100% width, висота ~72px, з іконкою зліва і стрілкою справа. Selected state: border indigo-500 + bg indigo-glow.

---

## АНАЛОГИ ЩО ТРЕБА ВИВЧИТИ ПЕРЕД ПОЧАТКОМ

**Обов'язково подивитись:**
1. **Revolut app** (dark mode) — як вони роблять hero payment card і транзакції
2. **Linear.app** — sidebar, компоненти, загальний рівень polish
3. **Vercel Dashboard** — темна тема, статуси, typography scale
4. **Mercury Bank** (mercuryhq.com) — фінтех з характером, не нудний

**Скріншоти для референсу можна знайти:** dribbble.com/tags/fintech-dark, mobbin.com (Revolut / N26 / Wise screens)

---

## DELIVERABLES ЦЬОго ІТЕРАЦІЇ

**Пріоритет 1 — Mobile Dashboard (переробити повністю):**
- Dark theme, indigo акцент
- Hero payment card з gradient
- Income section з mini bar chart
- Список транзакцій
- Bottom navigation

**Пріоритет 2 — Design Tokens файл:**
Всі змінні (кольори, розміри, радіуси) у форматі CSS variables або Figma Tokens JSON

**Пріоритет 3 — Component update:**
Кнопки і badges у новій кольоровій схемі

---

## ФІНАЛЬНА ПЕРЕВІРКА (checklist)

Перед здачею перевір:
- [ ] Чи виглядає це як Taxer/iFin? Якщо так — переробляй
- [ ] Чи чіпляє за 3 секунди? Показав незнайомцю — зрозумів без пояснень?
- [ ] Чи всі числа великі і чіткі?
- [ ] Чи є відчуття "я хочу це встановити"?
- [ ] Чи помітно відрізняється від того що вже є?

Якщо на всі питання відповідь "так" — це і є що потрібно. 🎯
