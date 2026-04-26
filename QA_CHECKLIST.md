# QA Checklist (Guest / User / Admin)

Use this checklist before each production deploy.

## 1) Guest (logged out)

- Open site in private/incognito mode.
- Confirm questions and answers are visible in Educational and General sections.
- Confirm posting controls are disabled with a clear "login to post" message.
- Confirm Admin tab is hidden.

## 2) Email/Password signup and verification

- Signup with a new real email.
- Confirm verification modal opens with clear steps.
- Click `Open Inbox`, verify link from email.
- Return and click `I've Verified`.
- Login should succeed after verification.

## 3) Unverified user behavior

- Login with an unverified email/password account.
- Confirm top hint says verification is required.
- Confirm posting question/answer is blocked in UI.
- Confirm `Resend Email` in verify modal works.

## 4) Verified user behavior

- Login with a verified email/password account.
- Post one question in each section.
- Post one answer on an existing question.
- Confirm new posts appear in realtime.
- Confirm Saved/Bookmarks, My Activity, and Dashboard stats update.

## 5) Google sign-in behavior

- Login with Google.
- Confirm account can read and post without email verification block.
- Confirm provider-aware messages for wrong login method still work.

## 6) Admin access behavior

- Login with non-admin account: Admin tab must stay hidden.
- Login with admin-claim account (`admin: true`): Admin tab should appear.
- Admin page should load question/user details.
- Admin page should list submitted reports.

## 7) Pagination + moderation hooks

- In Educational/General sections, confirm only initial page of questions loads.
- Click `Load More` and confirm additional items render.
- Use `Report` on a question while logged in and confirm success toast.
- Confirm report appears in Admin panel.

## 8) Firestore security checks

- As guest: reads allowed, writes denied.
- As unverified email/password user: writes denied.
- As verified user: create question/answer allowed.
- `/users/{uid}` read allowed only for owner/admin.

## 9) Smoke checks

- Mobile layout (sidebar/nav/topbar/forms) remains usable.
- No console errors during normal flows.
- Page refresh keeps session state correctly.
