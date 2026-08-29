# Ecom Hub launch setup

## Required before charging customers

1. Run `supabase/migrations/20260828000000_course_access.sql` in the Supabase SQL Editor.
2. In Supabase Authentication, turn on Email + Password and configure a production SMTP sender plus the Vercel domain in URL Configuration.
3. In Stripe, create a one-time USD $299 Payment Link and put that URL in Vercel as `NEXT_PUBLIC_STRIPE_PAYMENT_LINK`.
4. Deploy the `stripe-webhook` Supabase Edge Function. Add `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SIGNING_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `COURSE_PRICE_CENTS=29900`, and `COURSE_CURRENCY=usd` to its secrets.
5. In Stripe, point the webhook at the deployed function and subscribe to `checkout.session.completed` and `checkout.session.async_payment_succeeded`.
6. Make one Stripe test purchase using a new email. Create the password through the member-access screen, then confirm that the workspace opens.

## Test account reset

Do not insert directly into `auth.users`. In Supabase Authentication → Users, delete the broken test user, then use **Add user → Create new user → Auto confirm user**. Add the matching email to `public.ecom_course_purchases` using a test `stripe_session_id`.

## Product Lab

The Product Lab opens live, public sources: TikTok Creative Center, Amazon Movers & Shakers, Google Trends, Meta Ad Library, and an AliExpress supplier search. It does not claim to scrape or guarantee TikTok Shop sales data; those sources require their own approved data access.
