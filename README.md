# Ecom Hub

Ecom Hub is a $299 limited-time e-commerce education platform with a premium
sales page and a complete interactive student workspace.

## Included

- 10 modules and 40 structured lessons
- Embedded YouTube lesson player
- Quizzes and flashcard study mode
- Automatic course-progress saving
- Product Lab with curated training examples and live research links
- Inventory and supplier tracker
- Contribution-margin and break-even ROAS calculator
- Founder journal with prompts
- Downloadable checklists, scripts and SOP templates
- Responsive desktop, tablet and mobile layouts
- Stripe Payment Link checkout and Supabase member gate

## Launch checklist

1. Create a Stripe Payment Link for a one-time **$299** product. Require the
   customer's email. Set its post-payment redirect to your course URL.
2. Add its URL and your Supabase public values to the deployed environment:

```env
NEXT_PUBLIC_STRIPE_PAYMENT_LINK=https://buy.stripe.com/your-link
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your-key
```

3. Run `supabase/migrations/20260828000000_course_access.sql` in Supabase.
4. Deploy the `stripe-webhook` Edge Function with JWT verification disabled.
   Set these function secrets: `STRIPE_SECRET_KEY`,
   `STRIPE_WEBHOOK_SIGNING_SECRET`, and `SUPABASE_SERVICE_ROLE_KEY`.
5. In Stripe, create a `checkout.session.completed` webhook pointing to that
   function's URL. Use the signing secret from Stripe for the function secret.
6. In Supabase Auth, set the Site URL and allowed redirect URL to the deployed
   course URL. Use the same email at Stripe checkout and member login.

Until those values are connected, checkout buttons show a setup message and
the full course remains locked. Never place a Stripe secret or Supabase
service-role key in a `NEXT_PUBLIC_` variable.

## Run locally

```bash
npm install
npm run dev
```

Open the local address shown in the terminal.

## Production note

Paid access is checked against the secure purchase record created by the
Stripe webhook. Student progress, inventory and journal entries intentionally
stay on the student's device; no personal course-work data is collected.

## Course disclaimer

Ecom Hub is educational. It does not promise revenue or profit. Product demand,
platform policies, supplier performance and advertising economics change over
time, so students should validate current conditions before spending capital.
