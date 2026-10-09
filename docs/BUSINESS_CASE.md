# Business Case

## 1. Context

Ukrainian sole proprietors (FOPs) often need to combine bank statements, manually classified income and expenses, tax rules, reporting calendars, and accountant communication. The information exists, but the workflow is fragmented and reconciliation is repetitive.

Kasyr.ai is an independent MVP that tests a single-workspace approach: collect financial activity, support classification and review, calculate indicative tax amounts, surface deadlines, and prepare supporting exports.

## 2. Primary users and stakeholders

| Role | Need in this MVP |
| --- | --- |
| FOP owner | Understand recent activity, review classification, see indicative obligations, and avoid missing a deadline |
| Accountant | Receive a structured quarterly/yearly transaction export rather than an unstructured statement |
| Product/operator | Maintain annual tax constants, monitor integrations, and control optional AI/email/Telegram services |
| External providers | Supply bank data, exchange rates, identity, notifications, AI responses, and payment processing |

The implemented product is single-user-per-FOP. Multi-user accountant access and portfolio management are outside the current scope.

## 3. Problem statement

The target user has no consolidated operational view connecting:

- bank transactions and manual operations;
- transaction classification and tax-relevant income;
- tax-profile-specific calculations;
- upcoming payment/reporting deadlines;
- documents prepared for review or an accountant.

This increases manual effort and makes omissions harder to notice. Kasyr.ai does not attempt to replace official systems; it reduces fragmentation before the user verifies and acts in those systems.

## 4. Proposed value

- One flow from transaction capture to review and export.
- Automatic import from the currently supported bank, with duplicate prevention.
- Rule-based classification that continues working without an AI provider.
- Tax estimates and deadline generation tailored to the selected FOP group.
- Supporting PDF/CSV artifacts that are easier to review or send to an accountant.
- Reminders through configured email and Telegram channels.

No adoption, accuracy, time-saving, or revenue metric is claimed by this repository; the code contains no evidence for such results.

## 5. MVP scope

### In scope and implemented

- Email/password authentication, email verification, and optional Google OAuth.
- Onboarding for FOP groups 1, 2, and 3.
- User-entered tax identity, registration date, KVEDs, VAT status, and local EP rate where applicable.
- Monobank connection, a demo-token flow, transaction import, and scheduled synchronization.
- Manual transaction entry, filtering, editing, and classification.
- Dashboard summaries, tax estimates, exchange-rate display, and deadline visibility.
- Generated deadlines and user-managed completion state.
- Supporting income-book PDF, quarterly PDF, and accountant CSV.
- Optional email/Telegram reminders, help chat, feedback, and payment integration.

### Explicitly out of scope

- Submission of declarations or payments to the State Tax Service.
- Automatic VAT liability or tax-credit accounting.
- Legal or tax advice and guaranteed legal correctness.
- Government-register verification of the user-entered FOP profile.
- Banks other than Monobank.
- Multi-user organizations, accountant workspaces, approvals, or role-based access.
- Full production enforcement of subscription entitlements.
- Password reset, audit-grade accounting, and immutable document history.

## 6. Business rules verified in code

- A protected product workspace requires an authenticated, verified user and an existing entrepreneur profile.
- Tax group must be 1, 2, or 3; the tax ID must contain 10 digits.
- Group 3 uses a 3% EP rate when VAT payer is selected and 5% otherwise.
- Groups 1–2 accept an integer local EP rate within their configured maximum; the application uses the maximum when no local rate is supplied and labels the result as estimated.
- Monobank imports at most the preceding 31 days per request and avoids inserting an existing external transaction ID for the same account.
- AI calls are optional and limited per user per day; deterministic rules are the fallback.
- Generated reports are marked as supporting documents and are not submitted automatically.
- Deadline status can be tracked locally; reminder jobs check configured notification channels.

## 7. Assumptions and dependencies

- Users provide correct profile data and reconcile bank data with primary documents.
- Tax constants and calendars are reviewed whenever legislation or administrative practice changes.
- External APIs remain available and their credentials are configured correctly.
- SQLite is adequate for the current MVP deployment and usage pattern.
- Production secrets, retention rules, backups, monitoring, and incident handling are deployment responsibilities not completed by this repository alone.

## 8. Main risks and responses

| Risk | Current response | Residual gap |
| --- | --- | --- |
| Tax rules become outdated | Year-based configuration and official-source checklist | No automated legal update or independent validation |
| AI provider is unavailable or wrong | Rule-based fallback and daily quota | Classification still requires user review |
| Bank API fails or rate-limits requests | Specific error handling, local cache, 31-day window, duplicate check | No durable retry queue or sync observability dashboard |
| User treats output as an official filing | UI/PDF disclaimers and supporting-document labels | Product messaging cannot replace user verification |
| Sensitive financial data is exposed | Encrypted bank token, authentication, ignored local DB/env files | MVP needs production hardening, retention policy, and security review |
| Subscription rights are bypassed | Plan model and payment flow exist | Beta access paths and client-controlled preference logic must be hardened |

## 9. Suggested validation criteria for the next phase

- Users can complete onboarding and obtain a useful first dashboard without support.
- Repeated bank syncs do not create duplicate transaction records.
- Users can trace every dashboard total and export row back to stored transactions.
- Tax estimates display the assumptions and configured year used in the calculation.
- Every external integration has a visible unavailable/error state and an operator diagnostic path.
- Subscription entitlements are enforced server-side and covered by authorization tests before paid launch.

