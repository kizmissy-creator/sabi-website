Exit code: 0
Wall time: 1.1 seconds
Output:
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const source = join(repo, "client", "cl-2026-001");
const output = join(here, "dist");
const sandboxPaymentLink = "https://buy.stripe.com/test_fZu6oH0t3gQN7my7Mh7Zu01";

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(source, output, { recursive: true });
await mkdir(join(output, "images"), { recursive: true });
await cp(join(repo, "images", "favicon.png"), join(output, "images", "favicon.png"));
await cp(join(repo, "images", "sabi-mark-complete.png"), join(output, "images", "sabi-mark-complete.png"));

const textExtensions = new Set([".html", ".css", ".js"]);

async function transformFile(path) {
  if (!textExtensions.has(extname(path))) return;
  let text = await readFile(path, "utf8");
  text = text
    .replaceAll("CL-2026-001", "TEST-CAREER-PARTNER")
    .replaceAll("Bronagh", "Tester")
    .replaceAll("bronagh", "tester")
    .replaceAll("https://buy.stripe.com/4gMaEX0t36c9dKW8Ql7Zu00", sandboxPaymentLink)
    .replaceAll("Private client page", "Tester page")
    .replaceAll("Private SABI client page", "SABI tester page")
    .replaceAll("Uploaded securely", "Selected for this test only")
    .replaceAll("Uploading securely…", "Preparing test file…")
    .replaceAll("Confirming secure upload…", "Checking test file…");
  await writeFile(path, text);
}

async function walk(path) {
  const { readdir } = await import("node:fs/promises");
  const entries = await readdir(path, { withFileTypes: true });
  for (const entry of entries) {
    const child = join(path, entry.name);
    if (entry.isDirectory()) await walk(child);
    else await transformFile(child);
  }
}

await walk(output);

await writeFile(join(output, "config.js"), await readFile(join(here, "test-config.js"), "utf8"));

const rootPages = ["index.html", "payment.html", "confirmation.html", "payment-confirmation.html"];
for (const name of rootPages) {
  const path = join(output, name);
  let html = await readFile(path, "utf8");
  html = html.replace("</head>", '  <link rel="stylesheet" href="./tester.css">\n</head>');
  html = html.replace(/<body([^>]*)>/, '<body$1><div class="tester-banner" role="status">TEST MODE · No real payment or client record will be created</div>');
  await writeFile(path, html);
}

const confirmationPath = join(output, "confirmation.html");
let confirmation = await readFile(confirmationPath, "utf8");
confirmation = confirmation
  .replace("ONBOARDING RECEIVED", "TEST SUBMISSION COMPLETED")
  .replace("Your Career Partner onboarding has been received by SABI.", "This test completed in your browser. Nothing was sent to SABI or saved in Google Drive.")
  .replace(/<div class="info-box">[\s\S]*?<\/div>/, '<div class="info-box"><h2>Thank you for testing</h2><p>Please tell SABI what felt clear, confusing, tiring or difficult to use. Close this page when you have finished.</p></div>')
  .replace("Please keep this submission reference:", "Test reference:")
  .replace("If you need to add or correct something, email", "To share feedback, email");
await writeFile(confirmationPath, confirmation);

const paymentConfirmationPath = join(output, "payment-confirmation.html");
let paymentConfirmation = await readFile(paymentConfirmationPath, "utf8");
paymentConfirmation = paymentConfirmation
  .replace("PAYMENT RECEIVED", "TEST PAYMENT COMPLETED")
  .replace("Your payment has been received. You’re ready to begin your SABI Career Partner onboarding.", "Stripe Sandbox accepted the test payment. No money was taken.")
  .replace("Open your private onboarding form using the button below.", "Open the tester onboarding form using the button below.")
  .replace("Your private onboarding link will also be sent to you by email.", "No onboarding email will be sent during this test.")
  .replace("Complete it in your own time. Your answers save on this browser and device.", "Try as much or as little as you like. Test answers stay on this browser and device.")
  .replace("When you send it, SABI will review everything and email any focused follow-up questions.", "Sending the tester form only simulates a submission. Nothing is sent to SABI or Google Drive.")
  .replace("Stripe will send your payment receipt separately by email.", "This was a Sandbox payment, so no real receipt or charge will be created.");
await writeFile(paymentConfirmationPath, paymentConfirmation);

await writeFile(join(output, "tester.css"), `
.tester-banner{position:relative;z-index:1000;padding:.55rem 1rem;background:#fff1b8;color:#543f00;border-bottom:1px solid #e0b928;text-align:center;font:800 .82rem/1.35 Arial,sans-serif;letter-spacing:.04em}
.site-header{top:0}
`);

console.log(`Built safe tester site in ${output}`);

