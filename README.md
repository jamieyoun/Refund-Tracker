# Refund Tracker UI

> 📹 **[Watch the video demo](https://www.loom.com/share/964c709a7a0a4767836b07e2a2c2b84e)** — A walkthrough of the project with voiceover.

A card-based refund tracking dashboard built with **Next.js 14**, **React**, and **Tailwind CSS**.  
It simulates how cardholders can see all refunds associated with their credit cards in a single, focused UI.

---

## Features

- **Card-aware dashboard**
  - Track refunds by credit card (Visa, Mastercard, Amex).
  - Filter all stats and tables by a specific card or “All cards”.
  - Summary metrics:
    - Total refunded amount
    - Pending amount
    - Total refund requests
    - Number of cards tracked

- **Refunds list & detail views**
  - Table of refunds including:
    - Item icon (per merchant), merchant name, amount, card, date, and status.
  - Detail view per refund:
    - Shows order ID, merchant, amount, date, status, and the card (brand + last four digits).
  - Dummy data simulates real-world refunds from popular merchants.

- **Payment methods**
  - “Add new payment method” flow that:
    - Lets users **scan a card with the camera** (using `getUserMedia`) to simulate OCR capture.
    - Or **enter a card manually** as a dummy card number.
  - Stores only test card data and last four digits in memory (no real card data is persisted).
  - Dashboard card filters and “Cards Tracked” metrics update immediately after adding a new card.

- **Support (FAQ + chatbot-style assistant)**
  - **FAQ accordion** with common refund questions:
    - How long refunds take
    - Why refunds show as pending
    - How to see which card a refund went to
    - What to do if a refund never arrives
  - **Rule-based chat assistant**:
    - Simple, client-side chatbot (no external API).
    - Uses pattern matching on user messages to respond with guidance on:
      - Refund timelines
      - Pending status
      - Which card was refunded
      - Disputes / chargebacks
      - Adding payment methods
    - Includes quick-action chips for common scenarios.

- **Intro / overview screen**
  - Explains what the Refund Tracker UI does.
  - Walks through the flows:
    - Add cards → See refunds per card → Get help via Support.

---

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript + React
- **Styling**: Tailwind CSS (dark theme with zinc + emerald accents)
- **State management**: React hooks (`useState`, `useEffect`, `useCallback`)
- **Camera access**: Browser `navigator.mediaDevices.getUserMedia` (for simulated OCR)

---

## Getting Started

### Prerequisites

- Node.js 18+ (recommended)
- npm (bundled with Node) or another package manager (pnpm, yarn)

### Installation

```bash
cd ~/Desktop/refund-tracker-ui    # or wherever you cloned the repo
npm install
```

### Running the dev server

```bash
npm run dev
```

Then open `http://localhost:3000` in your browser.

You should see the **Intro** screen. Click **Get started → Go to Dashboard** to enter the app.

---

## Key Flows to Try

### 1. Explore the dashboard

- Start on the **Dashboard** tab.
- Use the **card filter pills** at the top to:
  - View all refunds across all cards.
  - Narrow to a single card to see:
    - Total refunded for that card.
    - Pending refunds.
    - Total requests tied to that card.
- Scroll the **Recent Refunds** table and click a row to open the refund detail page.

### 2. Inspect refunds per card

- Open the **Refunds** tab.
- Use the **card filter** to see only refunds for:
  - A specific card (e.g. “Visa •••• 4242”).
  - All cards.
- Click a row to open the detailed view and confirm:
  - The card used.
  - The refund status and amount.

### 3. Add payment methods

- Open **Payment Methods**.
- Click **“+ Add new payment method”**.
- Choose a flow:
  - **Scan card with camera**:
    - Browser will request camera access.
    - Start the camera and press **Capture** to simulate OCR.
    - A dummy card number is filled in for safety.
  - **Enter card manually**:
    - Pick a brand and type in a dummy card number.
- Click **Save card**:
  - A new card appears in **Your cards**.
  - The **Dashboard** and **Refunds** card filters now include that card.
  - “Cards Tracked” count updates.

> Note: This is a UI-only prototype. Card numbers are dummy values and never leave the browser.

### 4. Use Support (FAQ + chatbot)

- Open **Support**.
- Expand a few FAQ items to understand:
  - Timelines, pending status, and troubleshooting steps.
- Use the chat:
  - Click quick chips like **“Refund hasn’t arrived”**, **“Which card was refunded?”**, or **“Dispute a charge”**.
  - Type your own question about refunds; the assistant responds with pre-defined guidance.

---

## Project Structure (high level)

- `app/layout.tsx` – Root layout, imports global styles and sets metadata.
- `app/page.tsx` – Entire Refund Tracker UI:
  - In-app routing via `window.location.hash`.
  - Sidebar navigation.
  - Views: Intro, Dashboard, Refunds, Refund detail, Payment Methods, Support, Settings.
- `app/globals.css` – Tailwind base + global typography and dark theme styles.
- `next.config.mjs` – Minimal Next.js config (strict mode enabled).
- `tailwind.config.ts` – Tailwind configuration (scans `app/**`).

---

## Notes & Limitations

- **No real banking connection**: All refunds and cards are in-memory dummy data.
- **No persistence**: State resets on page reload; this is intentional to keep the demo self-contained.
- **Camera + OCR is simulated**:
  - Camera access is real (via `getUserMedia`), but OCR is mocked by inserting a known test card number when you click **Capture**.

These constraints make it safe to run locally while still demonstrating a realistic card-based refund tracker workflow.

---

## License

MIT © 2026 Jamie Youn

