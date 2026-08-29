from pathlib import Path
from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen.canvas import Canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

OUT = Path(__file__).resolve().parents[1] / "public" / "resources"
W, H = letter
INK, ACID, MIST, GREY = HexColor("#111611"), HexColor("#c9ff54"), HexColor("#f3f6ee"), HexColor("#697169")
pdfmetrics.registerFont(TTFont("EcomSans", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"))
pdfmetrics.registerFont(TTFont("EcomSansBold", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"))

resources = [
    ("ecom-hub-shopify-launch-checklist.pdf", "100-Point Shopify Launch Checklist", "Launch confidently. Check every customer-facing detail before you publish.", [
        ("Store foundation", ["Business email and sender identity are visible.", "Primary market, currency and checkout settings are correct.", "Domain, favicon and mobile browser title are working."]),
        ("Product page", ["The customer benefit is clear above the fold.", "Price, variant, shipping expectation and return policy are easy to find.", "Product imagery explains use, scale and proof."]),
        ("Trust and conversion", ["Contact, shipping, refund and privacy pages are live.", "Every main button works on mobile.", "A test order completed from product page to confirmation email."]),
    ]),
    ("ecom-hub-product-validation-scorecard.pdf", "Product Validation Scorecard", "Score the evidence before you spend on a sample, inventory or advertising.", [
        ("Demand signals", ["Search interest is stable or rising.", "Short-form creative shows real customer attention.", "The product solves a visible or recurring problem."]),
        ("Economics", ["Landed cost leaves room for delivery, fees and acquisition.", "The offer can support a healthy contribution margin.", "A controlled test can be run within your capital limit."]),
        ("Execution risk", ["Three suppliers have been compared.", "The product can be demonstrated quickly on video.", "Returns, claims and delivery expectations are manageable."]),
    ]),
    ("ecom-hub-supplier-outreach-pack.pdf", "Supplier Outreach Pack", "Use the same clear brief with every supplier so you can compare real answers.", [
        ("Your brief", ["Product or reference link:", "Desired quantity, destination and delivery window:", "Required material, packaging or customization:"]),
        ("Questions to send", ["What is your sample cost and lead time?", "What are your MOQ, unit price and payment terms?", "Can you share packaging, defect and production details?"]),
        ("Decision record", ["Supplier A / B / C:", "Sample result and communication quality:", "Next action, owner and deadline:"]),
    ]),
    ("ecom-hub-ugc-creator-brief.pdf", "UGC Creator Brief", "Create useful footage that sells the benefit, answers objections and can be edited into multiple ads.", [
        ("Creative objective", ["Who is this for?", "What problem or desired outcome should the first second communicate?", "What is the single call to action?"]),
        ("Required footage", ["Hook, product in use, detail shot and outcome.", "One objection addressed naturally on camera.", "One reaction, testimonial or proof moment."]),
        ("Delivery checklist", ["Vertical 9:16 footage, clean audio and natural lighting.", "Raw clips and one edited version delivered.", "Usage rights and deadline confirmed in writing."]),
    ]),
    ("ecom-hub-30-day-content-plan.pdf", "30-Day Organic Content Plan", "Build a repeatable publishing system instead of hoping one video goes viral.", [
        ("Week 1 - Understand the problem", ["Film customer pain points, product demos and common questions.", "Review saves, comments and watch time.", "Keep the hook format that earns attention."]),
        ("Week 2 - Prove the outcome", ["Publish comparison, before/after and use-case content.", "Ask creators or customers for proof clips.", "Document objections in your journal."]),
        ("Weeks 3 and 4 - Repeat what works", ["Make three variations of the strongest angle.", "Use questions from comments as new hooks.", "Review the system weekly, not emotionally after one post."]),
    ]),
    ("ecom-hub-customer-support-playbook.pdf", "Customer Support Playbook", "Fast, human responses that protect the customer experience and the brand.", [
        ("Response standard", ["Acknowledge the issue in the first sentence.", "State the action you are taking and when the customer will hear back.", "Never promise a timeline you cannot control."]),
        ("Common macros", ["Order update: confirm status, tracking and next check-in.", "Damaged item: request evidence, explain replacement or refund path.", "Refund request: restate policy, review order and provide next step."]),
        ("Escalation", ["Flag safety, fraud, chargeback or supplier issues same day.", "Save order details, customer communication and evidence.", "Record the root cause and change the process if needed."]),
    ]),
    ("ecom-hub-90-day-launch-plan.pdf", "90-Day E-commerce Launch Plan", "A focused sequence from evidence to a controlled product launch.", [
        ("Days 1-30 - Research and proof", ["Choose one customer problem and product category.", "Score live demand, suppliers and margin.", "Order or validate one sample before building wide."]),
        ("Days 31-60 - Build and prepare", ["Build the store, product page, policies and support workflow.", "Create a small bank of useful product creative.", "Complete a test order and mobile quality check."]),
        ("Days 61-90 - Launch and learn", ["Run a controlled organic and/or paid test.", "Review evidence weekly: creative, conversion, support and margin.", "Kill, keep or scale based on pre-set decision rules."]),
    ]),
]

def header(c, page, label):
    c.setFillColor(INK); c.rect(0, H-58, W, 58, fill=1, stroke=0)
    c.setFillColor(ACID); c.roundRect(42, H-43, 24, 24, 6, fill=1, stroke=0)
    c.setFillColor(INK); c.setFont("EcomSansBold", 12); c.drawCentredString(54, H-35, "E")
    c.setFillColor(white); c.setFont("EcomSansBold", 11); c.drawString(78, H-34, "ECOM HUB")
    c.setFillColor(HexColor("#bdd0b4")); c.setFont("EcomSansBold", 6.5); c.drawRightString(W-42, H-33, label.upper())
    c.setFillColor(GREY); c.setFont("EcomSans", 7); c.drawString(42, 28, "ECOM HUB  |  BUILD INTELLIGENTLY. SELL RESPONSIBLY. SCALE WHAT WORKS.")
    c.drawRightString(W-42, 28, f"{page:02d}")

def section(c, title, lines, y):
    c.setFillColor(INK); c.setFont("EcomSansBold", 12); c.drawString(48, y, title)
    y -= 18
    for line in lines:
        c.setFillColor(ACID); c.circle(54, y+2, 3, fill=1, stroke=0)
        c.setFillColor(INK); c.setFont("EcomSans", 9.2); c.drawString(68, y, line)
        c.setStrokeColor(HexColor("#dfe5d9")); c.line(68, y-12, W-48, y-12)
        y -= 28
    return y - 12

def write_resource(filename, title, subtitle, groups):
    c = Canvas(str(OUT / filename), pagesize=letter)
    c.setTitle(title + " | Ecom Hub")
    header(c, 1, "Ecom Hub Resource")
    c.setFillColor(MIST); c.roundRect(42, H-202, W-84, 108, 14, fill=1, stroke=0)
    c.setFillColor(INK); c.setFont("EcomSansBold", 24); c.drawString(48, H-126, title)
    c.setFillColor(GREY); c.setFont("EcomSans", 10.5); c.drawString(48, H-151, subtitle)
    c.setFillColor(HexColor("#55752e")); c.setFont("EcomSansBold", 7); c.drawString(48, H-177, "WORKBOOK  |  WRITE DIRECTLY IN THIS PDF OR PRINT IT")
    y = H-238
    for title_, lines in groups:
        y = section(c, title_, lines, y)
    c.setFillColor(INK); c.roundRect(42, 58, W-84, 48, 10, fill=1, stroke=0)
    c.setFillColor(ACID); c.setFont("EcomSansBold", 7); c.drawString(58, 87, "FOUNDER NOTE")
    c.setFillColor(white); c.setFont("EcomSans", 9); c.drawString(58, 70, "Evidence first. Make the smallest useful decision. Then run the next controlled test.")
    c.save()

OUT.mkdir(parents=True, exist_ok=True)
for resource in resources:
    write_resource(*resource)
