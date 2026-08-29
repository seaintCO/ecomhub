// @ts-nocheck
// This is a Deno/Supabase Edge Function, not part of the Vercel application build.
import Stripe from "npm:stripe@22.0.0";
import { createClient } from "npm:@supabase/supabase-js@2.98.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { httpClient: Stripe.createFetchHttpClient() });
const cryptoProvider = Stripe.createSubtleCryptoProvider();

const grantCourseAccess = async (session: Stripe.Checkout.Session) => {
  if (session.payment_status !== "paid") return new Response("Payment not complete", { status: 202 });
  const expectedAmount = Number(Deno.env.get("COURSE_PRICE_CENTS") ?? "29900");
  const expectedCurrency = (Deno.env.get("COURSE_CURRENCY") ?? "usd").toLowerCase();
  if (session.amount_total !== expectedAmount || session.currency?.toLowerCase() !== expectedCurrency) return new Response("Unexpected checkout amount", { status: 400 });
  const email = session.customer_details?.email ?? session.customer_email;
  if (!email) return new Response("Checkout email missing", { status: 400 });
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { error } = await db.from("ecom_course_purchases").upsert({ stripe_session_id: session.id, email: email.toLowerCase(), amount_cents: session.amount_total, currency: session.currency, paid_at: new Date().toISOString() }, { onConflict: "stripe_session_id" });
  return error ? new Response("Could not grant course access", { status: 500 }) : null;
};

Deno.serve(async (request) => {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const signature = request.headers.get("Stripe-Signature");
  if (!signature) return new Response("Missing Stripe signature", { status: 400 });
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(await request.text(), signature, Deno.env.get("STRIPE_WEBHOOK_SIGNING_SECRET")!, undefined, cryptoProvider);
  } catch { return new Response("Invalid Stripe signature", { status: 400 }); }
  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object as Stripe.Checkout.Session;
    const result = await grantCourseAccess(session);
    if (result) return result;
  }
  return Response.json({ received: true });
});
