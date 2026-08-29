"use client";

import { useEffect, useState } from "react";
import { createClient, type User } from "@supabase/supabase-js";
import { flashcards, modules, type Lesson, type ResearchCandidate } from "./course-data";

type View = "overview" | "course" | "lesson" | "research" | "inventory" | "profit" | "journal" | "resources";
type InventoryItem = { id: string; product: string; sku: string; supplier: string; cost: number; price: number; stock: number; status: string };
type Note = { id: string; title: string; body: string; date: string };

const starterInventory: InventoryItem[] = [
  { id: "seed-1", product: "Portable heat sealer", sku: "HS-001", supplier: "Sample supplier", cost: 6.4, price: 24.99, stock: 42, status: "Testing" },
  { id: "seed-2", product: "Compression cube set", sku: "TC-002", supplier: "Sample supplier", cost: 11.2, price: 39.99, stock: 18, status: "Active" },
  { id: "seed-3", product: "Fabric shaver", sku: "FS-003", supplier: "Sample supplier", cost: 9.75, price: 29.99, stock: 7, status: "Pause" },
];

const nav: { id: View; label: string; icon: string }[] = [
  { id: "overview", label: "Overview", icon: "⌂" },
  { id: "course", label: "Course", icon: "▶" },
  { id: "research", label: "Product Lab", icon: "⌕" },
  { id: "inventory", label: "Inventory", icon: "□" },
  { id: "profit", label: "Profit Tracker", icon: "↗" },
  { id: "journal", label: "Journal", icon: "✎" },
  { id: "resources", label: "Resource Vault", icon: "◇" },
];

const cash = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value || 0);

// Public browser values are intentionally safe to ship. Environment variables
// override these defaults in Vercel; the fallback prevents the member screen
// from becoming a dead-end when the public values were not copied yet.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hvuiegruaoupbkhbceev.supabase.co";
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_mz8wxfXNrSW6aCAEfdFm0A_EpxrMAv5";
const supabase = createClient(supabaseUrl, supabasePublishableKey);
const previewMemberEmails = new Set(["ecomjay@gmail.com", "jayecom@gmail.com"]);

function usePersistentState<T>(key: string, initial: T) {
  const [state, setState] = useState<T>(initial);
  useEffect(() => {
    const saved = window.localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const timer = window.setTimeout(() => setState(parsed), 0);
        return () => window.clearTimeout(timer);
      } catch { /* keep safe defaults */ }
    }
  }, [key]);
  useEffect(() => { window.localStorage.setItem(key, JSON.stringify(state)); }, [key, state]);
  return [state, setState] as const;
}

export default function EcomHub() {
  const [inside, setInside] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [access, setAccess] = useState<"checking" | "granted" | "not-granted">("checking");
  const [memberOpen, setMemberOpen] = useState(false);
  const [view, setView] = useState<View>("overview");
  const [lessonId, setLessonId] = useState("1-1");
  const [completed, setCompleted] = usePersistentState<string[]>("ecomhub-progress", ["1-1", "1-2", "2-1", "3-1"]);
  const [inventory, setInventory] = usePersistentState<InventoryItem[]>("ecomhub-inventory", starterInventory);
  const [notes, setNotes] = usePersistentState<Note[]>("ecomhub-journal", [{ id: "n1", title: "My launch promise", body: "One product. One customer. One honest offer. Validate before scaling.", date: "Today" }]);
  const [menu, setMenu] = useState(false);
  const [toast, setToast] = useState("");

  const notify = (text: string) => { setToast(text); window.setTimeout(() => setToast(""), 1800); };
  const go = (next: View) => { setView(next); setMenu(false); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const openLesson = (id: string) => { setLessonId(id); go("lesson"); };
  const buy = () => {
    const url = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK;
    if (url) window.open(url, "_blank", "noopener,noreferrer");
    else setMemberOpen(true);
  };
  const refreshAccess = async (currentUser: User | null) => {
    if (!currentUser?.email) { setAccess("not-granted"); return; }
    setAccess("checking");
    const email = currentUser.email.toLowerCase();
    if (previewMemberEmails.has(email)) { setAccess("granted"); setInside(true); return; }
    const { data, error } = await supabase.from("ecom_course_purchases").select("stripe_session_id").eq("email", currentUser.email.toLowerCase()).limit(1);
    const granted = !error && (data?.length ?? 0) > 0;
    setAccess(granted ? "granted" : "not-granted");
    if (granted) setInside(true);
  };
  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setUser(data.user);
      void refreshAccess(data.user);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      void refreshAccess(session?.user ?? null);
    });
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, []);
  const openCourse = () => {
    if (access === "granted") setInside(true);
    else setMemberOpen(true);
  };
  const signOut = async () => { await supabase?.auth.signOut(); setInside(false); notify("Signed out"); };
  const toggleLesson = (id: string) => {
    setCompleted(completed.includes(id) ? completed.filter((item) => item !== id) : [...completed, id]);
    notify(completed.includes(id) ? "Lesson reopened" : "Lesson completed");
  };

  if (!inside) return <Landing onCourse={openCourse} onBuy={buy} memberOpen={memberOpen} closeMember={() => setMemberOpen(false)} access={access} user={user} refreshAccess={() => void refreshAccess(user)} />;

  const total = modules.length * 4;
  const progress = Math.round((completed.length / total) * 100);
  return (
    <div className="shell">
      <aside className={`sidebar ${menu ? "open" : ""}`}>
        <button className="logo logo-button" onClick={() => go("overview")}><i>E</i><b>Ecom Hub</b></button>
        <small className="nav-label">LEARN & BUILD</small>
        <nav>{nav.map((item) => <button key={item.id} className={view === item.id || (view === "lesson" && item.id === "course") ? "active" : ""} onClick={() => go(item.id)}><i>{item.icon}</i>{item.label}</button>)}</nav>
        <div className="side-meter"><div style={{ "--p": `${progress * 3.6}deg` } as React.CSSProperties}><span>{progress}%</span></div><p><b>Your progress</b><small>{completed.length} of {total} lessons</small></p></div>
        <div className="profile"><i /><p><b>{user?.email ?? "Ecom Hub student"}</b><small>Member access</small></p><button onClick={signOut}>Sign out</button></div>
      </aside>
      {menu && <button className="scrim" onClick={() => setMenu(false)} aria-label="Close menu" />}
      <main className="work">
        <header><button className="hamburger" onClick={() => setMenu(!menu)}>☰</button><button className="search" onClick={() => go("research")}>⌕ <span>Search products, lessons, resources...</span><kbd>⌘ K</kbd></button><div className="avatar">EH</div></header>
        <div className="content">
          {view === "overview" && <Dashboard progress={progress} done={completed.length} total={total} go={go} openLesson={openLesson} />}
          {view === "course" && <Curriculum completed={completed} openLesson={openLesson} />}
          {view === "lesson" && <LessonPlayer id={lessonId} completed={completed} toggle={toggleLesson} back={() => go("course")} change={setLessonId} />}
          {view === "research" && <ProductLab add={(product) => { const item = { id: crypto.randomUUID(), product: product.name, sku: `TEST-${inventory.length + 1}`, supplier: "Research needed", cost: product.cost, price: product.price, stock: 0, status: "Testing" }; setInventory([item, ...inventory]); notify("Added to inventory tracker"); }} />}
          {view === "inventory" && <Inventory items={inventory} setItems={setInventory} notify={notify} />}
          {view === "profit" && <Profit inventory={inventory} />}
          {view === "journal" && <Journal notes={notes} setNotes={setNotes} notify={notify} />}
          {view === "resources" && <Resources />}
        </div>
      </main>
      {toast && <div className="toast">✓ {toast}</div>}
    </div>
  );
}

function Landing({ onCourse, onBuy, memberOpen, closeMember, access, user, refreshAccess }: { onCourse: () => void; onBuy: () => void; memberOpen: boolean; closeMember: () => void; access: "checking" | "granted" | "not-granted"; user: User | null; refreshAccess: () => void }) {
  return (
    <main className="landing landing-editorial">
      <nav className="editorial-nav"><button className="editorial-brand" onClick={onCourse}><i>E</i><b>Ecom Hub</b></button><div className="editorial-links"><a href="#curriculum">Curriculum</a><a href="#tools">Tools</a><a href="#pricing">Pricing</a></div><button className="editorial-nav-cta" onClick={onCourse}>{access === "granted" ? "Open workspace ↗" : "Member login ↗"}</button></nav>
      <section className="editorial-hero">
        <div className="editorial-copy"><p className="editorial-eyebrow"><i /> THE COMPLETE E-COMMERCE OPERATING SYSTEM</p><h1>Build the store.<em>Learn the business.</em></h1><p className="editorial-summary">From first product idea to a store that can scale—Ecom Hub gives you the course, research system and operating tools to build with confidence.</p><div className="editorial-actions"><button className="editorial-primary" onClick={onBuy}>Get lifetime access <span>— $299</span> <b>→</b></button><button className="editorial-secondary" onClick={onCourse}>Member login <i>↗</i></button></div><div className="editorial-signals"><article><i>◉</i><span><b>40 guided lessons</b><small>Clear steps, no filler</small></span></article><article><i>✓</i><span><b>7 founder tools</b><small>Research to real numbers</small></span></article><article><i>⌁</i><span><b>Lifetime access</b><small>One payment, always yours</small></span></article></div></div>
        <div className="editorial-preview" aria-label="Ecom Hub command center preview"><div className="preview-top"><span><i /> ECOM HUB / COMMAND CENTER</span><b>Live workspace</b></div><div className="preview-body"><aside><small>WEEKLY FOCUS</small><strong>01</strong><p>Validate a product worth building.</p><button onClick={onCourse}>Open plan →</button></aside><section><header><div><small>LAUNCH READINESS</small><b>72%</b></div><span>↑ On track</span></header><div className="preview-chart"><svg viewBox="0 0 500 180" aria-hidden="true"><path d="M0 145 C42 144 57 116 95 122 S151 86 190 101 S243 54 279 70 S343 39 379 52 S435 12 500 27" fill="none" stroke="currentColor" strokeWidth="5"/><path d="M0 180V145 C42 144 57 116 95 122 S151 86 190 101 S243 54 279 70 S343 39 379 52 S435 12 500 27V180Z" fill="currentColor" opacity=".1"/></svg><div><span>Product research</span><span>Store setup</span><span>Launch plan</span></div></div><footer><article><small>BREAK-EVEN ROAS</small><b>1.84×</b></article><article><small>EST. MARGIN</small><b>64%</b></article><article><small>NEXT ACTION</small><b>Order sample</b></article></footer></section></div><div className="preview-note"><i /> Your next decision is ready for review <b>↗</b></div></div>
      </section>
      <section className="proof-strip"><p>RESEARCH <i>✦</i> BUILD <i>✦</i> TEST <i>✦</i> SCALE</p><span>DESIGNED FOR FOUNDERS WHO EXECUTE</span></section>
      <section className="features" id="tools"><small>MORE THAN A COURSE</small><h2>Your entire e-commerce<br />workspace, in one place.</h2><div>{[
        ["01", "⌕", "Product Lab", "Score ideas and open real research sources before committing capital."],
        ["02", "□", "Inventory Control", "Track supplier, landed cost, price, stock and product status."],
        ["03", "↗", "Profit Calculator", "Know break-even ROAS, margin and profit before ad spend."],
        ["04", "✎", "Founder Journal", "Turn lessons into decisions, commitments and an operating record."],
      ].map(([n, icon, title, text]) => <article key={n}><small>{n}</small><i>{icon}</i><h3>{title}</h3><p>{text}</p></article>)}</div></section>
      <section className="land-course" id="curriculum"><div><small>ZERO TO LAUNCH</small><h2>A complete path.<br />No missing steps.</h2></div><div>{modules.slice(0, 6).map((m) => <p key={m.id}><span>{String(m.id).padStart(2, "0")}</span><b>{m.title}</b><small>4 lessons</small></p>)}<button onClick={onCourse}>Member access →</button></div></section>
      <section className="pricing" id="pricing"><div><small>LIMITED-TIME FOUNDING OFFER</small><h2>Everything you need<br />to build it right.</h2><p>One payment. No monthly course fee. Keep every lesson, template and tool.</p></div><article><small>ECOM HUB · FOUNDING ACCESS</small><p className="price-was">Regularly $500</p><h3><sup>$</sup>299 <span>one time</span></h3><ul><li>40 lessons across 10 modules</li><li>Quizzes + flashcard study</li><li>Product research workspace</li><li>Inventory + profit trackers</li><li>Templates, scripts and SOPs</li><li>Lifetime curriculum updates</li></ul><button className="acid" onClick={onBuy}>Get Ecom Hub for $299 →</button><p>Educational program. Results depend on execution and market conditions.</p></article></section>
      <footer className="land-footer"><div className="logo"><i>E</i><b>Ecom Hub</b></div><p>Build intelligently. Sell responsibly. Scale what works.</p><span>© 2026 Ecom Hub</span></footer>
      {memberOpen && <MemberAccess close={closeMember} access={access} user={user} onOpenCourse={onCourse} />}
    </main>
  );
}

function MemberAccess({ close, access, user, onOpenCourse }: { close: () => void; access: "checking" | "granted" | "not-granted"; user: User | null; onOpenCourse: () => void }) {
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"password" | "link" | "create">("password");
  const [message, setMessage] = useState("");
  const sendLink = async () => {
    if (!email) return;
    setMessage("Sending secure sign-in link…");
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin, shouldCreateUser: true } });
    setMessage(error ? error.message : "Check your inbox for your secure sign-in link.");
  };
  const submitPassword = async () => {
    if (!email || !password) return;
    setMessage(mode === "create" ? "Creating your account…" : "Signing you in…");
    const result = mode === "create"
      ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } })
      : await supabase.auth.signInWithPassword({ email, password });
    const errorMessage = result.error?.message.includes("Database error")
      ? "Sign-in could not be completed. Use Email link or reset this account in Supabase Auth."
      : result.error?.message;
    setMessage(errorMessage ?? (mode === "create" ? "Account created. Check your email if confirmation is required, then log in." : "Signed in. Checking your course access…"));
  };
  const resetPassword = async () => {
    if (!email) return;
    setMessage("Sending password reset link…");
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
    setMessage(error ? error.message : "Check your inbox for the password reset link.");
  };
  return <div className="modal" onMouseDown={close}><article className="member-card" onMouseDown={(event) => event.stopPropagation()}><button onClick={close}>×</button><i>⌁</i><h2>{access === "granted" ? "Your course is ready." : mode === "create" ? "Create your member account" : "Member access"}</h2>{access === "granted" ? <button className="acid" onClick={onOpenCourse}>Open Ecom Hub →</button> : <><p>{mode === "create" ? "Create your password once, then use it anytime you log in." : "Log in with the email and password tied to your Ecom Hub access."}</p><div className="login-tabs"><button className={mode === "password" ? "active" : ""} onClick={() => setMode("password")}>Password</button><button className={mode === "link" ? "active" : ""} onClick={() => setMode("link")}>Email link</button></div><input aria-label="Email address" type="email" placeholder="you@email.com" value={email} onChange={(event) => setEmail(event.target.value)} />{mode !== "link" && <input aria-label="Password" type="password" placeholder="Password" value={password} onChange={(event) => setPassword(event.target.value)} />} {mode === "link" ? <button className="acid" onClick={sendLink}>Email my sign-in link →</button> : <button className="acid" onClick={submitPassword}>{mode === "create" ? "Create account →" : "Log in →"}</button>}<div className="member-actions"><button className="text-action" onClick={() => setMode(mode === "create" ? "password" : "create")}>{mode === "create" ? "Already have an account? Log in" : "First time using a password? Create your account"}</button>{mode === "password" && <button className="text-action" onClick={resetPassword}>Forgot password?</button>}</div>{message && <p className="auth-message">{message}</p>}</>}</article></div>;
}

function Title({ eyebrow, title, text, action }: { eyebrow: string; title: string; text: string; action?: React.ReactNode }) {
  return <div className="title"><div><small>{eyebrow}</small><h1>{title}</h1><p>{text}</p></div>{action}</div>;
}

function Dashboard({ progress, done, total, go, openLesson }: { progress: number; done: number; total: number; go: (v: View) => void; openLesson: (id: string) => void }) {
  return <>
    <Title eyebrow="WEEK 1 · BUILD YOUR FOUNDATION" title="Good morning, founder." text="Your next milestone is one focused lesson away." />
    <section className="dash-hero"><article className="continue"><div><small>MODULE 01</small><i /><b>ECOM<br />FOUNDATION</b></div><section><small>CONTINUE LEARNING · 12 MIN</small><h2>The modern<br />e-commerce map</h2><p>Understand the major business models and choose the right starting point.</p><button onClick={() => openLesson("1-1")}>Resume lesson →</button></section></article><article className="readiness"><div><small>LAUNCH READINESS</small><b>{progress}%</b></div><i><span style={{ width: `${progress}%` }} /></i><p>{done} of {total} course steps complete</p>{["✓ Niche selected", "✓ Model chosen", "○ Supplier approved", "○ Store published"].map((x) => <span key={x}>{x}</span>)}</article></section>
    <section className="metrics"><article><small>PRODUCTS SAVED</small><b>6</b><span>↑ 2 this week</span></article><article><small>EST. TEST MARGIN</small><b>64%</b><span>Across shortlist</span></article><article><small>JOURNAL STREAK</small><b>3 days</b><span>Personal best: 8</span></article><article><small>COURSE PROGRESS</small><b>{progress}%</b><span>{done} lessons complete</span></article></section>
    <section className="dash-bottom"><article className="panel"><header><div><small>YOUR ROADMAP</small><h3>Next milestones</h3></div><button onClick={() => go("course")}>View course →</button></header>{modules.slice(0, 4).map((m, i) => <button className="road" key={m.id} onClick={() => openLesson(m.lessons[0].id)}><i>{i < 2 ? "✓" : m.id}</i><p><b>{m.title}</b><small>{m.summary}</small></p><span>4 lessons</span><strong>→</strong></button>)}</article><article className="panel"><header><div><small>QUICK TOOLS</small><h3>Operate smarter</h3></div></header>{[["research", "⌕", "Find a product", "Research demand signals"], ["profit", "↗", "Check your margin", "Calculate true profit"], ["journal", "✎", "Write a decision", "Keep your founder log"]].map(([id, icon, name, text]) => <button className="quick" key={id} onClick={() => go(id as View)}><i>{icon}</i><p><b>{name}</b><small>{text}</small></p><span>→</span></button>)}</article></section>
  </>;
}

function Curriculum({ completed, openLesson }: { completed: string[]; openLesson: (id: string) => void }) {
  const [open, setOpen] = useState(1);
  return <><Title eyebrow="THE COMPLETE ROADMAP" title="Course curriculum" text="Ten modules. Forty practical steps. Follow the sequence or jump to the problem you need to solve." /><div className="course-stats"><span><b>10</b> modules</span><span><b>40</b> lessons</span><span><b>9.5h</b> learning</span><span><b>Lifetime</b> access</span></div><div className="modules">{modules.map((m) => <article className={open === m.id ? "expanded" : ""} key={m.id}><button className="module" onClick={() => setOpen(open === m.id ? 0 : m.id)}><i style={{ background: m.color }}>{String(m.id).padStart(2, "0")}</i><p><small>MODULE {String(m.id).padStart(2, "0")}</small><b>{m.title}</b><span>{m.summary}</span></p><em>{m.lessons.filter((l) => completed.includes(l.id)).length}/4</em><strong>{open === m.id ? "−" : "+"}</strong></button>{open === m.id && <div className="lessons">{m.lessons.map((l, n) => <button key={l.id} onClick={() => openLesson(l.id)}><i className={completed.includes(l.id) ? "done" : ""}>{completed.includes(l.id) ? "✓" : l.kind === "Quiz" ? "?" : "▶"}</i><p><small>LESSON {m.id}.{n + 1} · {l.kind.toUpperCase()}</small><b>{l.title}</b></p><span>{l.minutes}</span><strong>→</strong></button>)}</div>}</article>)}</div></>;
}

function LessonPlayer({ id, completed, toggle, back, change }: { id: string; completed: string[]; toggle: (id: string) => void; back: () => void; change: (id: string) => void }) {
  const all = modules.flatMap((m) => m.lessons.map((l) => ({ ...l, module: m })));
  const index = Math.max(0, all.findIndex((l) => l.id === id));
  const current = all[index];
  const [tab, setTab] = useState<"Notes" | "Flashcards" | "Quiz">("Notes");
  const [card, setCard] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [actionDone, setActionDone] = useState<boolean[]>([false, false, false]);
  useEffect(() => { setAnswers({}); setActionDone([false, false, false]); setCard(0); setFlipped(false); }, [id]);
  const navLesson = (lesson?: Lesson) => { if (!lesson) return; change(lesson.id); setTab(lesson.kind === "Quiz" ? "Quiz" : "Notes"); };
  const score = Object.entries(answers).filter(([q, a]) => current.quiz[Number(q)].correct === a).length;
  const completeQuiz = Object.keys(answers).length === current.quiz.length && score === current.quiz.length;
  return <><button className="back" onClick={back}>← Back to curriculum</button><div className="lesson-layout"><main><div className="video"><iframe src={`https://www.youtube-nocookie.com/embed/${current.video}?rel=0&modestbranding=1`} title={current.title} allowFullScreen /></div><div className="lesson-title"><small>MODULE {String(current.module.id).padStart(2, "0")} · {current.kind.toUpperCase()}</small><h1>{current.title}</h1><p>{current.goal}</p></div><div className="lesson-meta"><span>WATCH / APPLY</span><b>DELIVERABLE · {current.deliverable}</b></div><div className="tabs">{(["Notes", "Flashcards", "Quiz"] as const).map((t) => <button className={tab === t ? "active" : ""} key={t} onClick={() => setTab(t)}>{t}</button>)}</div>
      {tab === "Notes" && <section className="notes"><header><div><small>EXECUTION SPRINT</small><h3>Finish the work, not just the video.</h3></div><b>{actionDone.filter(Boolean).length}/3</b></header>{current.action.map((step, n) => <button className={actionDone[n] ? "step done" : "step"} key={step} onClick={() => setActionDone(actionDone.map((value, index) => index === n ? !value : value))}><i>{actionDone[n] ? "✓" : n + 1}</i><span><b>{step}</b><small>{actionDone[n] ? "Done — click to reopen" : "Click when complete"}</small></span></button>)}<blockquote><small>OUTPUT</small>{current.deliverable}</blockquote></section>}
      {tab === "Flashcards" && <section className="flash"><button className={flipped ? "flipped" : ""} onClick={() => setFlipped(!flipped)}><small>{flipped ? "DEFINITION" : "TERM"} · {card + 1}/{flashcards.length}</small><b>{flipped ? flashcards[card][1] : flashcards[card][0]}</b><span>Click to flip</span></button><footer><button onClick={() => { setCard((card - 1 + flashcards.length) % flashcards.length); setFlipped(false); }}>← Previous</button><button onClick={() => { setCard((card + 1) % flashcards.length); setFlipped(false); }}>Next →</button></footer></section>}
      {tab === "Quiz" && <section className="quiz">{current.quiz.map((q, qi) => <article key={q.q}><small>QUESTION {qi + 1}</small><h3>{q.q}</h3><div>{q.a.map((a, ai) => <button className={answers[qi] === ai ? "selected" : ""} key={a} onClick={() => setAnswers({ ...answers, [qi]: ai })}><i>{String.fromCharCode(65 + ai)}</i>{a}</button>)}</div></article>)}{Object.keys(answers).length === current.quiz.length && <footer><b>{score}/{current.quiz.length}</b><span>{completeQuiz ? "Perfect. Your checkpoint is ready to complete." : "Review the lesson, then change the answers that missed."}</span></footer>}</section>}
      <footer className="lesson-nav"><button disabled={index === 0} onClick={() => navLesson(all[index - 1])}>← Previous</button><button disabled={current.kind === "Quiz" && !completeQuiz} className={completed.includes(id) ? "done" : "dark"} onClick={() => toggle(id)}>{completed.includes(id) ? "✓ Completed" : current.kind === "Quiz" && !completeQuiz ? "Pass quiz to complete" : "Mark complete"}</button><button disabled={index === all.length - 1} onClick={() => navLesson(all[index + 1])}>Next →</button></footer>
    </main><aside className="outline"><small>IN THIS MODULE</small><h3>{current.module.title}</h3>{current.module.lessons.map((l, n) => <button className={l.id === id ? "active" : ""} key={l.id} onClick={() => navLesson(l)}><i>{completed.includes(l.id) ? "✓" : n + 1}</i><p><b>{l.title}</b><small>{l.minutes}</small></p></button>)}</aside></div></>;
}

function ProductLab({ add }: { add: (product: ResearchCandidate) => void }) {
  const [q, setQ] = useState("");
  const [score, setScore] = useState({ demand: 7, margin: 7, creative: 7, competition: 5 });
  const encoded = encodeURIComponent(q || "trending products");
  const totalScore = Math.round((score.demand + score.margin + score.creative + (10 - score.competition)) * 2.5);
  const addCandidate = () => { if (!q.trim()) return; add({ name: q.trim(), category: "Live trend research", score: totalScore, cost: 0, price: 0, velocity: "Verify live", saturation: "Verify live" }); };
  return <><Title eyebrow="LIVE TREND RESEARCH" title="Product Lab" text="Search the live platforms first. Nothing is preloaded as a fake winner, and none of your other store products appear here." action={<a className="dark-btn" target="_blank" rel="noreferrer" href={`https://trends.google.com/trends/explore?q=${encoded}`}>Open Google Trends ↗</a>} /><div className="product-search">⌕<input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Enter a product, problem, or niche to research live..." /></div><div className="sources"><a target="_blank" rel="noreferrer" href={`https://trends.google.com/trends/explore?q=${encoded}`}>google <b>Google Trends</b> ↗</a><a target="_blank" rel="noreferrer" href="https://ads.tiktok.com/business/creativecenter/inspiration/popular/pc/en">tt <b>TikTok Creative Center</b> ↗</a><a target="_blank" rel="noreferrer" href={`https://www.facebook.com/ads/library/?q=${encoded}`}>meta <b>Meta Ad Library</b> ↗</a><a target="_blank" rel="noreferrer" href={`https://www.amazon.com/s?k=${encoded}`}>amz <b>Amazon live search</b> ↗</a><a target="_blank" rel="noreferrer" href={`https://www.aliexpress.us/w/wholesale-${encoded}.html`}>ali <b>Supplier search</b> ↗</a></div><section className="signal-score"><div><small>LIVE RESEARCH WORKFLOW</small><h3>Find a real trend. Prove it before buying.</h3><p>Open each live source for your search, then score the evidence you found. This is a research desk, not a preloaded product catalog.</p><button className="dark-btn" onClick={addCandidate} disabled={!q.trim()}>Add this live candidate to tracker →</button></div><article><small>OPPORTUNITY SCORE</small><b>{totalScore}<span>/100</span></b><p>{totalScore >= 70 ? "Worth a controlled test" : "Gather stronger proof first"}</p></article><div className="score-fields">{([['Demand', 'demand'], ['Margin room', 'margin'], ['Creative potential', 'creative'], ['Competition', 'competition']] as const).map(([label, key]) => <label key={key}><span>{label}<b>{score[key]}/10</b></span><input type="range" min="0" max="10" value={score[key]} onChange={(event) => setScore({ ...score, [key]: Number(event.target.value) })} /></label>)}</div></section><p className="data-note"><i>i</i><span><b>How it works</b> · Search an actual product or category above, open the live trend and ad sources, record proof in the score, then add only candidates you want to test.</span></p><section className="trend-empty"><small>NO PRELOADED “WINNERS”</small><h3>Your trend shortlist starts with live evidence.</h3><p>Type a product or customer problem above. Ecom Hub will carry only the candidate you choose into Inventory.</p></section></>;
}

function Inventory({ items, setItems, notify }: { items: InventoryItem[]; setItems: (v: InventoryItem[]) => void; notify: (s: string) => void }) {
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ product: "", sku: "", supplier: "", cost: "", price: "", stock: "" });
  const add = () => { if (!form.product) return; setItems([{ id: crypto.randomUUID(), product: form.product, sku: form.sku || "NEW-SKU", supplier: form.supplier || "Unassigned", cost: Number(form.cost), price: Number(form.price), stock: Number(form.stock), status: "Testing" }, ...items]); setShow(false); setForm({ product: "", sku: "", supplier: "", cost: "", price: "", stock: "" }); notify("Inventory item saved"); };
  return <><Title eyebrow="OPERATIONS" title="Inventory control" text="Track every test product, supplier, unit and dollar in one clean operating view." action={<button className="dark-btn" onClick={() => setShow(!show)}>{show ? "Cancel" : "+ Add product"}</button>} /><section className="metrics"><article><small>ACTIVE PRODUCTS</small><b>{items.filter((x) => x.status === "Active").length}</b><span>{items.length} tracked</span></article><article><small>UNITS ON HAND</small><b>{items.reduce((s, x) => s + x.stock, 0)}</b><span>Across all SKUs</span></article><article><small>INVENTORY VALUE</small><b>{cash(items.reduce((s, x) => s + x.cost * x.stock, 0))}</b><span>At landed cost</span></article><article><small>POTENTIAL REVENUE</small><b>{cash(items.reduce((s, x) => s + x.price * x.stock, 0))}</b><span>At current price</span></article></section>{show && <div className="add-form">{Object.keys(form).map((key) => <input key={key} type={["cost", "price", "stock"].includes(key) ? "number" : "text"} placeholder={key[0].toUpperCase() + key.slice(1)} value={form[key as keyof typeof form]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />)}<button onClick={add}>Save product</button></div>}<div className="inventory"><header><span>PRODUCT / SKU</span><span>SUPPLIER</span><span>COST</span><span>PRICE</span><span>STOCK</span><span>STATUS</span><span /></header>{items.map((x) => <article key={x.id}><p><i>{x.product[0]}</i><span><b>{x.product}</b><small>{x.sku}</small></span></p><span>{x.supplier}</span><b>{cash(x.cost)}</b><b>{cash(x.price)}</b><strong className={x.stock < 10 ? "red" : ""}>{x.stock}</strong><em>{x.status}</em><button onClick={() => { setItems(items.filter((i) => i.id !== x.id)); notify("Item removed"); }}>×</button></article>)}</div></>;
}

function Profit({ inventory }: { inventory: InventoryItem[] }) {
  const [price, setPrice] = useState(39.99), [cost, setCost] = useState(11.2), [shipping, setShipping] = useState(4.5), [fees, setFees] = useState(3.2), [ads, setAds] = useState(12);
  const profit = price - cost - shipping - fees - ads;
  const margin = price ? profit / price * 100 : 0;
  const roas = price / Math.max(price - cost - shipping - fees, .01);
  const fields: [string, number, (n: number) => void][] = [["Selling price", price, setPrice], ["Product cost", cost, setCost], ["Shipping", shipping, setShipping], ["Payment + app fees", fees, setFees], ["Ad cost per order", ads, setAds]];
  return <><Title eyebrow="UNIT ECONOMICS" title="Profit tracker" text="Know the real profit in every order before raising budgets or buying inventory." /><section className="calculator"><article><small>ORDER ECONOMICS</small><h2>Enter your numbers</h2>{fields.map(([name, value, setter]) => <label key={name}><span>{name}</span><div>$ <input type="number" value={value} step=".01" onChange={(e) => setter(Number(e.target.value))} /></div></label>)}</article><article><small>PROFIT PER ORDER</small><h2 className={profit < 0 ? "red" : ""}>{cash(profit)}</h2><i><span style={{ width: `${Math.max(0, Math.min(100, margin))}%` }} /></i><p><b>{margin.toFixed(1)}%</b> contribution margin</p><div><span>BREAK-EVEN ROAS<b>{roas.toFixed(2)}x</b></span><span>MAX ACQUISITION<b>{cash(price - cost - shipping - fees)}</b></span><span>PROFIT AT 100 ORDERS<b>{cash(profit * 100)}</b></span><span>STATUS<b className={profit > 8 ? "green" : profit < 0 ? "red" : ""}>{profit > 8 ? "Healthy" : profit < 0 ? "Losing" : "Thin"}</b></span></div></article></section><section className="panel econ"><header><div><small>TRACKED PRODUCTS</small><h3>Current margin snapshot</h3></div></header>{inventory.map((x) => <p key={x.id}><span>{x.product}</span><b>{cash(x.cost)} cost</b><strong>{x.price ? ((x.price - x.cost) / x.price * 100).toFixed(0) : 0}% gross margin</strong></p>)}</section></>;
}

function Journal({ notes, setNotes, notify }: { notes: Note[]; setNotes: (v: Note[]) => void; notify: (s: string) => void }) {
  const [title, setTitle] = useState(""), [body, setBody] = useState("");
  const save = () => { if (!title || !body) return; setNotes([{ id: crypto.randomUUID(), title, body, date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }) }, ...notes]); setTitle(""); setBody(""); notify("Journal entry saved"); };
  return <><Title eyebrow="FOUNDER OPERATING LOG" title="Journal" text="Capture decisions, lessons and evidence so every week makes the next one smarter." /><section className="journal"><article><small>NEW ENTRY</small><input placeholder="Give this decision a title..." value={title} onChange={(e) => setTitle(e.target.value)} /><textarea placeholder="What did you learn? What evidence supports it? What will you do next?" value={body} onChange={(e) => setBody(e.target.value)} /><div>{["What evidence did I gather?", "What is the smallest next test?", "What will I stop doing?"].map((x) => <button key={x} onClick={() => setBody(body ? `${body}\n\n${x}\n` : `${x}\n`)}>{x}</button>)}</div><button className="dark-btn" onClick={save}>Save journal entry →</button></article><aside><small>CURRENT STREAK</small><b>3</b><span>days of reflection</span><div>{["M", "T", "W", "T", "F", "S", "S"].map((x, n) => <i className={n < 3 ? "done" : ""} key={n}>{x}</i>)}</div><p>Consistency turns activity into pattern recognition.</p></aside></section><section className="entries"><header><small>YOUR RECORD</small><h3>Recent entries</h3></header>{notes.map((n) => <article key={n.id}><small>{n.date}</small><div><b>{n.title}</b><p>{n.body}</p></div><button onClick={() => setNotes(notes.filter((x) => x.id !== n.id))}>×</button></article>)}</section></>;
}

function Resources() {
  const files = [["PDF", "100-point Shopify launch checklist", "A branded pre-publish quality gate.", "ecom-hub-shopify-launch-checklist.pdf"], ["PDF", "Product validation scorecard", "Score demand, margin, saturation and supplier risk.", "ecom-hub-product-validation-scorecard.pdf"], ["PDF", "Supplier outreach pack", "Sample request and negotiation follow-up.", "ecom-hub-supplier-outreach-pack.pdf"], ["PDF", "UGC creator brief", "Script, shot list and usage-rights checklist.", "ecom-hub-ugc-creator-brief.pdf"], ["PDF", "30-day organic content plan", "Daily hooks, formats and review prompts.", "ecom-hub-30-day-content-plan.pdf"], ["PDF", "Customer support playbook", "Human response templates for common issues.", "ecom-hub-customer-support-playbook.pdf"]];
  return <><Title eyebrow="TEMPLATES & SYSTEMS" title="Resource vault" text="Every download is a designed Ecom Hub PDF workbook - no more text-file placeholders." /><div className="resources">{files.map(([type, name, text, file], n) => <article key={name}><header><i>{type}</i><span>0{n + 1}</span></header><h3>{name}</h3><p>{text}</p><a href={`/resources/${file}`} download>Download PDF ↓</a></article>)}</div><section className="resource-banner"><div><small>90-DAY PLAN</small><h2>Ready to turn learning into a launch?</h2><p>Follow the weekly build sequence and finish with a measured, customer-ready store.</p></div><a href="/resources/ecom-hub-90-day-launch-plan.pdf" download>Download the plan ↓</a></section></>;
}
