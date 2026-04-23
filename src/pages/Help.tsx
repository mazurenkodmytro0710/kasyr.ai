const faqItems = [
  {
    title: 'Як отримати токен Monobank?',
    answer: 'Перейди на api.monobank.ua, створи personal token і підтвердь доступ у застосунку Monobank через push-сповіщення.',
  },
  {
    title: 'Як розраховуються податки для 3-ї групи?',
    answer: 'Kasyr.ai підсумовує доходи за квартал і рахує ЄП, ЄСВ та військовий збір на основі поточної групи ФОП.',
  },
  {
    title: 'Що таке ЄСВ і ВЗ?',
    answer: 'ЄСВ — єдиний соціальний внесок, ВЗ — військовий збір. Обидва платежі мають окремі дедлайни та реквізити.',
  },
  {
    title: 'Коли треба подавати декларацію?',
    answer: 'Залежить від групи та періоду. У розділі "Дедлайни" Kasyr.ai показує актуальні строки на поточний і наступний рік.',
  },
  {
    title: 'Як завантажити книгу обліку?',
    answer: 'Відкрий сторінку "Транзакції", вкладку "Книга обліку" і натисни "Завантажити PDF".',
  },
  {
    title: 'Як підключити Telegram-бота?',
    answer: 'У "Налаштуваннях" відкрий секцію Telegram, згенеруй посилання і натисни "Підключити Telegram".',
  },
]

export function Help() {
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px', maxWidth: 960 }}>
      <div style={{ marginBottom: 28 }}>
        <div className="label" style={{ color: 'var(--indigo-400)' }}>Довідка</div>
        <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.025em', margin: '6px 0 10px', color: 'var(--text)' }}>
          FAQ та швидкі відповіді
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-3)', margin: 0, maxWidth: 620, lineHeight: 1.6 }}>
          Тут зібрані базові відповіді по Monobank, податках ФОП, книзі обліку, дедлайнах і Telegram-боту.
        </p>
      </div>

      <div style={{ display: 'grid', gap: 14 }}>
        {faqItems.map((item) => (
          <div
            key={item.title}
            style={{
              padding: '18px 20px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 16,
            }}
          >
            <h2 style={{ margin: '0 0 10px', fontSize: 17, fontWeight: 600, color: 'var(--text)' }}>
              {item.title}
            </h2>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--text-2)', lineHeight: 1.65 }}>
              {item.answer}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
