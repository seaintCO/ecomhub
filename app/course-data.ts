export type Lesson = { id: string; title: string; minutes: string; kind: "Video" | "Workshop" | "Quiz" };
export type Module = { id: number; title: string; summary: string; color: string; lessons: Lesson[] };

const lessonSets = [
  ["The Modern E-commerce Map", "Dropshipping vs. Inventory", "Choose Your Business Model", "Foundation Checkpoint"],
  ["The Five-Signal Product Scorecard", "Find Demand Before You Spend", "Supplier Validation Lab", "Build Your Test List"],
  ["Name, Position & Promise", "Bundle and Price the Offer", "Trust Architecture", "Offer Teardown Quiz"],
  ["Shopify Setup & Settings", "Theme and Navigation", "The Product Page That Converts", "Payments, Taxes & Policies"],
  ["Supplier Outreach System", "Samples and Quality Control", "Shipping, Returns & Tracking", "Fulfillment Failure Drill"],
  ["Hooks, Angles & Awareness", "The UGC Shot List", "Product Photo System", "Build a Ten-Ad Creative Bank"],
  ["Your 30-Day Content Calendar", "Short-form Retention Formula", "Creator Seeding Outreach", "Organic Launch Checkpoint"],
  ["Tracking and Attribution", "The First $100 Test Plan", "Creative Testing Matrix", "Kill, Keep or Scale"],
  ["Daily Operator Checklist", "Customer Support Macros", "Refunds, Disputes & Fraud", "Profit and Inventory Control"],
  ["Scale Readiness Scorecard", "Email and Retention Flows", "Team, SOPs & Automation", "Your 90-Day Growth Plan"],
];

const moduleInfo = [
  ["E-commerce Foundations", "Choose the right model, niche and launch target.", "#c9ff54"],
  ["Winning Product Research", "Find demand before spending on ads or inventory.", "#8fe3ff"],
  ["Brand & Offer Design", "Create an offer customers understand and remember.", "#f2acff"],
  ["Build Your Shopify Store", "Go from blank account to conversion-ready storefront.", "#c9ff54"],
  ["Supplier & Fulfillment OS", "Source responsibly and protect the customer experience.", "#ffb976"],
  ["Creative That Sells", "Turn benefits into scroll-stopping assets.", "#8fe3ff"],
  ["Organic Launch Engine", "Validate messaging with TikTok, Reels and Shorts.", "#f2acff"],
  ["Paid Ads Without Guessing", "Test small, read the numbers and protect capital.", "#ffb976"],
  ["Operations & Customer Care", "Run orders, support and cash flow with confidence.", "#c9ff54"],
  ["Scale Into a Real Brand", "Systemize what works and build the next growth loop.", "#8fe3ff"],
];

export const modules: Module[] = moduleInfo.map(([title, summary, color], moduleIndex) => ({
  id: moduleIndex + 1,
  title,
  summary,
  color,
  lessons: lessonSets[moduleIndex].map((lessonTitle, lessonIndex) => ({
    id: `${moduleIndex + 1}-${lessonIndex + 1}`,
    title: lessonTitle,
    minutes: lessonIndex === 3 ? "8 questions" : `${12 + moduleIndex + lessonIndex * 4} min`,
    kind: lessonIndex === 3 && moduleIndex % 2 === 0 ? "Quiz" : lessonIndex === 1 || lessonIndex === 2 ? "Workshop" : "Video",
  })),
}));

export const researchProducts = [
  { name: "Portable heat sealer", category: "Kitchen", score: 92, cost: 6.4, price: 24.99, velocity: "+38%", saturation: "Low" },
  { name: "Travel compression cubes", category: "Travel", score: 89, cost: 11.2, price: 39.99, velocity: "+29%", saturation: "Medium" },
  { name: "Rechargeable fabric shaver", category: "Home", score: 87, cost: 9.75, price: 29.99, velocity: "+24%", saturation: "Medium" },
  { name: "Desk cable organizer kit", category: "Office", score: 84, cost: 4.2, price: 19.99, velocity: "+19%", saturation: "Low" },
  { name: "Silicone scalp massager", category: "Beauty", score: 81, cost: 2.9, price: 14.99, velocity: "+17%", saturation: "High" },
  { name: "Collapsible pet water bottle", category: "Pets", score: 79, cost: 7.1, price: 21.99, velocity: "+14%", saturation: "Medium" },
];

export const flashcards = [
  ["Contribution margin", "Revenue left after variable costs: product, shipping, fees and ad spend."],
  ["AOV", "Average order value: total revenue divided by total orders."],
  ["Break-even ROAS", "The return on ad spend where an order neither gains nor loses money."],
  ["Landed cost", "Product cost plus freight, duties, packaging and handling."],
  ["Conversion rate", "The percentage of store sessions that become orders."],
];
