# Verified Functional Requirements

This catalogue describes behavior found in the current codebase. “Conditional” means the implementation exists but needs environment configuration. “Beta” means the route or UI exists while entitlement behavior is intentionally relaxed or incomplete.

## 1. Account and onboarding

| ID | Requirement | Status | Implementation evidence |
| --- | --- | --- | --- |
| FR-A01 | The user can register with email and a password of 8–128 characters containing an uppercase letter and a digit. | Implemented | `server/routes/auth.ts`, `src/pages/Onboarding.tsx` |
| FR-A02 | The user can sign in and sign out; authenticated routes reject an invalid or missing token. | Implemented | `server/routes/auth.ts`, `server/middleware/auth.ts`, `src/App.tsx` |
| FR-A03 | The product can require email verification before protected pages are available. | Conditional | `server/routes/auth.ts`, `src/components/auth/EmailVerificationGate.tsx` |
| FR-A04 | The user can authenticate through Google OAuth when provider credentials are configured. | Conditional | `server/routes/auth.ts`, `src/pages/Onboarding.tsx` |
| FR-A05 | The user can create one FOP profile with tax ID, registration date, group, VAT/local-rate settings, and KVEDs. | Implemented | `server/routes/entrepreneur.ts`, `src/pages/Onboarding.tsx` |
| FR-A06 | The system regenerates relevant deadline records after profile creation or tax-profile changes. | Implemented | `server/routes/entrepreneur.ts`, `server/services/deadlinesService.ts` |

## 2. Bank accounts and transactions

| ID | Requirement | Status | Implementation evidence |
| --- | --- | --- | --- |
| FR-B01 | The user can connect a Monobank account with a personal API token. | Implemented | `server/routes/monobank.ts`, `server/services/monobankService.ts` |
| FR-B02 | The system verifies the token, selects a UAH account when available, encrypts the token, and warns when the detected account is not a FOP account. | Implemented | `server/routes/monobank.ts`, `server/utils/crypto.ts` |
| FR-B03 | The user can run synchronization; the server imports up to 31 days and skips an external transaction already stored for that account. | Implemented | `server/routes/monobank.ts`, `server/services/monobankService.ts` |
| FR-B04 | The system runs scheduled Monobank synchronization every four hours without consuming AI quota. | Implemented | `server/index.ts` |
| FR-B05 | The user can list and disconnect their own connected bank accounts. | Implemented | `server/routes/monobank.ts`, `src/pages/Settings.tsx` |
| FR-T01 | The user can add a manual UAH transaction with date, amount, description, category, client reference, and comment. | Implemented | `server/routes/transactions.ts`, `src/components/transactions/AddTransactionModal.tsx` |
| FR-T02 | The user can page, search, date-filter, and category-filter transactions belonging to their accounts. | Implemented | `server/routes/transactions.ts`, `src/pages/Transactions.tsx` |
| FR-T03 | The user can update category, client reference, and comment for a transaction they own. | Implemented | `server/routes/transactions.ts`, `src/components/transactions/TransactionDetail.tsx` |
| FR-T04 | The user can request classification; Grok is used when configured and within quota, otherwise local rules are used. | Implemented | `server/services/aiClassifier.ts`, `server/services/aiQuotaService.ts` |

## 3. Dashboard, tax estimates, and deadlines

| ID | Requirement | Status | Implementation evidence |
| --- | --- | --- | --- |
| FR-D01 | The dashboard displays income, estimated EP/ESV/VZ, recent transactions, book readiness, and the next deadline. | Implemented | `server/routes/dashboard.ts`, `src/pages/Dashboard.tsx` |
| FR-D02 | The dashboard provides monthly income-series data for a selected year. | Implemented | `server/routes/dashboard.ts`, `src/components/dashboard/IncomeChart.tsx` |
| FR-D03 | The dashboard can display Monobank currency rates; the API caches provider results for one hour. | Implemented | `server/services/monobankRateService.ts`, `src/components/dashboard/CurrencyRates.tsx` |
| FR-X01 | The system calculates indicative EP, ESV, and VZ from a tax profile and configured annual constants. | Implemented | `server/services/taxService.ts` |
| FR-X02 | For groups 1–2, a missing local EP rate is replaced with the configured maximum and disclosed as estimated. | Implemented | `server/services/taxService.ts` |
| FR-L01 | The system generates deadlines by year and tax profile and keeps final user statuses when resynchronizing. | Implemented | `server/services/taxService.ts`, `server/services/deadlinesService.ts` |
| FR-L02 | The user can filter deadlines and mark a deadline as paid. | Implemented | `server/routes/deadlines.ts`, `src/pages/Deadlines.tsx` |
| FR-L03 | A daily job can send reminders 7, 3, 1, or 0 days before a pending deadline through enabled channels. | Conditional | `server/index.ts`, `server/services/emailService.ts`, `server/services/telegramService.ts` |

## 4. Reports and export

| ID | Requirement | Status | Implementation evidence |
| --- | --- | --- | --- |
| FR-R01 | The user can create a report record for a quarter and mark it as exported/submitted in the local workflow. | Implemented | `server/routes/reports.ts`, `src/pages/Reports.tsx` |
| FR-R02 | The user can download a supporting quarterly financial PDF built from owned transactions and their tax profile. | Implemented | `server/routes/reports.ts`, `server/services/pdfService.ts` |
| FR-R03 | The user can download a supporting income-book PDF for a valid period. | Implemented with known amount-unit defect | `server/routes/reports.ts`, `server/services/pdfService.ts` |
| FR-R04 | The user can export owned transactions for a year or quarter as UTF-8 CSV with an Excel-compatible BOM. | Implemented, beta access | `server/routes/exports.ts`, `src/pages/Reports.tsx` |
| FR-R05 | Every generated PDF states that it is informational/supporting and not an official declaration. | Implemented | `server/services/pdfService.ts` |

## 5. Notifications, support, and subscriptions

| ID | Requirement | Status | Implementation evidence |
| --- | --- | --- | --- |
| FR-N01 | The user can enable or disable email and Telegram notification preferences. | Implemented | `server/routes/entrepreneur.ts`, `src/pages/Settings.tsx` |
| FR-N02 | The user can create a Telegram deep link, connect through `/start`, and disconnect the chat. | Conditional | `server/routes/telegram.ts`, `server/services/telegramService.ts` |
| FR-S01 | The user can browse FAQ/help content and submit authenticated feedback subject to rate limiting. | Implemented; email delivery conditional | `src/pages/Help.tsx`, `server/routes/feedback.ts` |
| FR-S02 | The authenticated help chat uses Grok when available and a local tax-domain response otherwise. | Implemented | `server/routes/help.ts` |
| FR-P01 | The API exposes Free, Pro, and Business plan definitions. | Implemented | `server/config/plans.ts`, `server/routes/subscription.ts` |
| FR-P02 | The user can initiate a WayForPay checkout and the webhook can update a subscription after a valid approved event. | Conditional / beta | `server/routes/subscription.ts`, `src/api/subscription.ts` |
| FR-P03 | Plan entitlements are enforced consistently on every protected feature. | Not satisfied | `server/middleware/planCheck.ts` exists but is not applied; beta full-access paths remain |

## 6. Non-functional requirements observed in the implementation

| ID | Requirement | Current implementation |
| --- | --- | --- |
| NFR-01 | Protect stored credentials. | bcrypt password hashes; AES-256-GCM for Monobank tokens; local secret files ignored by Git |
| NFR-02 | Isolate user data. | Most reads and mutations derive ownership through the authenticated user's entrepreneur and accounts |
| NFR-03 | Limit abuse. | Rate limits on auth, bank connect/sync, and feedback; 1 MB JSON body limit; AI daily quota |
| NFR-04 | Degrade optional integrations gracefully. | Rule-based AI fallback, log-only email fallback, null Telegram URL, payment “not configured” response |
| NFR-05 | Support desktop and mobile use. | Responsive sidebar/header/bottom navigation and responsive page layouts |
| NFR-06 | Keep tax logic maintainable. | Central year-based constants, generated deadline functions, and an official-source maintenance checklist |
| NFR-07 | Provide auditability of financial results. | Transactions and raw bank payloads are stored, but there is no immutable audit log or versioned calculation ledger |

## 7. Requirements not evidenced by the code

The current repository does not evidence automatic State Tax Service filing, payment execution, official declaration generation, automated VAT accounting, multi-user roles, accountant approvals, password reset, universal bank aggregation, or production-grade subscription enforcement. These capabilities must not be claimed in product or portfolio materials.
