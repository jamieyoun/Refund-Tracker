"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// --- Types & dummy data ---

type RefundStatus = "Pending" | "Approved" | "Received" | "Rejected";

type Card = {
  id: string;
  brand: "Visa" | "Mastercard" | "Amex";
  last4: string;
  label: string;
  method: "manual" | "ocr";
};

type Refund = {
  id: string;
  merchant: string;
  amount: number;
  date: string;
  status: RefundStatus;
  orderId: string;
  cardId: string;
  itemIcon?: string;
  reason?: string;
};

type ChatMessage = {
  id: string;
  from: "user" | "bot";
  text: string;
};

const INITIAL_CARDS: Card[] = [
  {
    id: "card-1",
    brand: "Visa",
    last4: "4242",
    label: "Personal Visa •••• 4242",
    method: "ocr",
  },
  {
    id: "card-2",
    brand: "Mastercard",
    last4: "1881",
    label: "Business Mastercard •••• 1881",
    method: "manual",
  },
];

const MERCHANT_ICONS: Record<string, string> = {
  Amazon: "📦",
  "Best Buy": "💻",
  Target: "🎯",
  Nordstrom: "🛍️",
  Walmart: "🛒",
};

const INITIAL_REFUNDS: Refund[] = [
  {
    id: "1",
    merchant: "Amazon",
    amount: 42.99,
    date: "2025-03-08",
    status: "Received",
    orderId: "#AMZ-8821",
    cardId: "card-1",
    itemIcon: MERCHANT_ICONS["Amazon"],
  },
  {
    id: "2",
    merchant: "Best Buy",
    amount: 129.0,
    date: "2025-03-07",
    status: "Approved",
    orderId: "#BB-4402",
    cardId: "card-1",
    itemIcon: MERCHANT_ICONS["Best Buy"],
  },
  {
    id: "3",
    merchant: "Target",
    amount: 34.5,
    date: "2025-03-05",
    status: "Pending",
    orderId: "#TGT-9912",
    cardId: "card-2",
    itemIcon: MERCHANT_ICONS["Target"],
  },
  {
    id: "4",
    merchant: "Nordstrom",
    amount: 89.0,
    date: "2025-03-04",
    status: "Received",
    orderId: "#NORD-5521",
    cardId: "card-2",
    itemIcon: MERCHANT_ICONS["Nordstrom"],
  },
  {
    id: "5",
    merchant: "Walmart",
    amount: 56.78,
    date: "2025-03-02",
    status: "Rejected",
    orderId: "#WM-7734",
    cardId: "card-1",
    itemIcon: MERCHANT_ICONS["Walmart"],
  },
];

const STATUS_STYLES: Record<RefundStatus, string> = {
  Pending: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
  Approved: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
  Received: "bg-zinc-500/20 text-zinc-300 border border-zinc-500/30",
  Rejected: "bg-red-500/20 text-red-400 border border-red-500/30",
};

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n);
}

function cardDisplay(card: Card): string {
  return `${card.brand} •••• ${card.last4}`;
}

// --- Routing (hash-based, single-page app) ---

type Route =
  | { name: "intro" }
  | { name: "dashboard" }
  | { name: "refunds" }
  | { name: "refund"; id: string }
  | { name: "cards" }
  | { name: "support" }
  | { name: "settings" };

function parseHash(): Route {
  if (typeof window === "undefined") return { name: "intro" };
  const hash = window.location.hash.slice(1) || "/intro";
  const path = hash.startsWith("/") ? hash : `/${hash}`;
  const parts = path.split("/").filter(Boolean);

  if (parts[0] === "dashboard") return { name: "dashboard" };
  if (parts[0] === "refunds" && parts[1]) return { name: "refund", id: parts[1] };
  if (parts[0] === "refunds") return { name: "refunds" };
  if (parts[0] === "cards") return { name: "cards" };
  if (parts[0] === "support") return { name: "support" };
  if (parts[0] === "settings") return { name: "settings" };
  return { name: "intro" };
}

function href(route: Route): string {
  switch (route.name) {
    case "intro":
      return "#/intro";
    case "dashboard":
      return "#/dashboard";
    case "refunds":
      return "#/refunds";
    case "refund":
      return `#/refunds/${route.id}`;
    case "cards":
      return "#/cards";
    case "support":
      return "#/support";
    case "settings":
      return "#/settings";
    default:
      return "#/intro";
  }
}

// --- Sidebar ---

const NAV_ITEMS: { route: Route; label: string }[] = [
  { route: { name: "intro" }, label: "Overview" },
  { route: { name: "dashboard" }, label: "Dashboard" },
  { route: { name: "refunds" }, label: "Refunds" },
  { route: { name: "cards" }, label: "Payment Methods" },
  { route: { name: "support" }, label: "Support" },
  { route: { name: "settings" }, label: "Settings" },
];

function RefundTrackerSidebar({
  current,
  onNavigate,
}: {
  current: Route;
  onNavigate: (r: Route) => void;
}) {
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-zinc-800 bg-zinc-900/90 px-4 py-6 shadow-lg">
      <div className="mb-6 space-y-1">
        <div className="text-xs font-semibold tracking-[0.22em] text-zinc-500 uppercase">
          Refund Tracker
        </div>
        <div className="text-sm font-semibold text-zinc-100">
          Card-based refunds
        </div>
      </div>
      <nav className="flex flex-col gap-0.5 text-sm">
        {NAV_ITEMS.map(({ route, label }) => {
          const active =
            current.name === route.name ||
            (route.name === "refunds" && current.name === "refund");
          return (
            <button
              key={label}
              type="button"
              onClick={() => onNavigate(route)}
              className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors ${
                active
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-300 hover:bg-zinc-800/80 hover:text-white"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  active ? "bg-emerald-400" : "bg-zinc-700"
                }`}
              />
              {label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

// --- Shared controls ---

function CardFilter({
  cards,
  selectedCardId,
  onChange,
}: {
  cards: Card[];
  selectedCardId: string | "all";
  onChange: (id: string | "all") => void;
}) {
  if (cards.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
      <span className="uppercase tracking-wide text-[11px] text-zinc-500">
        Filter by card
      </span>
      <button
        type="button"
        onClick={() => onChange("all")}
        className={`rounded-full border px-3 py-1 text-xs ${
          selectedCardId === "all"
            ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-300"
            : "border-zinc-700 bg-zinc-900/60 text-zinc-300 hover:border-zinc-500"
        }`}
      >
        All cards
      </button>
      {cards.map((card) => {
        const active = selectedCardId === card.id;
        return (
          <button
            key={card.id}
            type="button"
            onClick={() => onChange(card.id)}
            className={`rounded-full border px-3 py-1 text-xs ${
              active
                ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-300"
                : "border-zinc-700 bg-zinc-900/60 text-zinc-300 hover:border-zinc-500"
            }`}
          >
            {card.brand} •••• {card.last4}
          </button>
        );
      })}
    </div>
  );
}

// --- Intro View ---

function IntroView({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <p className="text-xs font-semibold tracking-[0.2em] text-zinc-500 uppercase">
          Overview
        </p>
        <h1 className="text-3xl font-semibold text-zinc-50">
          Refund Tracker UI
        </h1>
        <p className="max-w-xl text-sm text-zinc-400">
          Track refunds across all your credit cards in one place. Add payment
          methods, automatically see refunds tied to each card, and review
          timelines and statuses in a single dashboard.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            1 · Add cards
          </p>
          <p className="mt-2 text-sm text-zinc-300">
            Save your credit and debit cards into the tracker using{" "}
            <span className="text-emerald-300">camera capture</span> or{" "}
            <span className="text-emerald-300">manual entry</span>. We only
            store the last four digits in this prototype.
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            2 · See refunds per card
          </p>
          <p className="mt-2 text-sm text-zinc-300">
            Filter the dashboard and refund list by card to see{" "}
            <span className="text-emerald-300">all refunds tied to a card</span>{" "}
            at a glance.
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            3 · Get help fast
          </p>
          <p className="mt-2 text-sm text-zinc-300">
            Use the built-in{" "}
            <span className="text-emerald-300">FAQ &amp; support chatbot</span>{" "}
            to walk through common refund scenarios and next steps.
          </p>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-sm space-y-3">
        <h2 className="text-sm font-semibold text-zinc-100">
          What&apos;s included in this UI
        </h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-zinc-300">
          <li>Intro explaining the flows</li>
          <li>Dashboard with card-aware refund stats</li>
          <li>Refund list &amp; detail views with item icons</li>
          <li>
            Payment Methods screen with camera capture and manual entry
            simulation
          </li>
          <li>
            Support screen with refund FAQ and a guided chatbot-style assistant
          </li>
        </ul>
      </section>

      <button
        type="button"
        onClick={onGetStarted}
        className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
      >
        Get started → Go to Dashboard
      </button>
    </div>
  );
}

// --- Dashboard & Refunds ---

function DashboardView({
  refunds,
  cards,
  selectedCardId,
  onCardChange,
  onNavigate,
}: {
  refunds: Refund[];
  cards: Card[];
  selectedCardId: string | "all";
  onCardChange: (id: string | "all") => void;
  onNavigate: (r: Route) => void;
}) {
  const visibleRefunds =
    selectedCardId === "all"
      ? refunds
      : refunds.filter((r) => r.cardId === selectedCardId);

  const totalRefunded = visibleRefunds
    .filter((r) => r.status === "Received")
    .reduce((s, r) => s + r.amount, 0);
  const pendingAmount = visibleRefunds
    .filter((r) => r.status === "Pending" || r.status === "Approved")
    .reduce((s, r) => s + r.amount, 0);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold tracking-[0.2em] text-zinc-500 uppercase">
          Refund Tracker
        </p>
        <h1 className="text-2xl font-semibold text-zinc-50">Dashboard</h1>
        <p className="text-sm text-zinc-400">
          See refund activity by credit card, with quick stats and recent
          activity. Refunds are auto-tracked for the sample cards in this
          prototype.
        </p>
        <CardFilter
          cards={cards}
          selectedCardId={selectedCardId}
          onChange={onCardChange}
        />
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Total Refunded
          </p>
          <p className="mt-1 text-2xl font-semibold text-emerald-400">
            {formatCurrency(totalRefunded)}
          </p>
          <p className="mt-0.5 text-xs text-zinc-500">
            {visibleRefunds.filter((r) => r.status === "Received").length}{" "}
            refunds received
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Pending
          </p>
          <p className="mt-1 text-2xl font-semibold text-amber-400">
            {formatCurrency(pendingAmount)}
          </p>
          <p className="mt-0.5 text-xs text-zinc-500">
            Awaiting approval or transfer
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Total Requests
          </p>
          <p className="mt-1 text-2xl font-semibold text-zinc-100">
            {visibleRefunds.length}
          </p>
          <p className="mt-0.5 text-xs text-zinc-500">Within selected card</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Cards Tracked
          </p>
          <p className="mt-1 text-2xl font-semibold text-zinc-100">
            {cards.length}
          </p>
          <p className="mt-0.5 text-xs text-zinc-500">
            Manage in Payment Methods
          </p>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 shadow-sm">
        <div className="border-b border-zinc-800 px-5 py-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">
              Recent Refunds
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              Click a row to view details.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate({ name: "support" })}
            className="rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:bg-zinc-800"
          >
            Need help? Open support
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                <th className="px-5 py-3">Item</th>
                <th className="px-5 py-3">Merchant</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Card</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {visibleRefunds.slice(0, 5).map((r) => {
                const card = cards.find((c) => c.id === r.cardId);
                return (
                  <tr
                    key={r.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onNavigate({ name: "refund", id: r.id })}
                    onKeyDown={(e) =>
                      e.key === "Enter" && onNavigate({ name: "refund", id: r.id })
                    }
                    className="cursor-pointer text-zinc-300 transition-colors hover:bg-zinc-800/40 focus:bg-zinc-800/40 focus:outline-none"
                  >
                    <td className="px-5 py-3 text-lg">
                      {r.itemIcon ?? "🧾"}
                    </td>
                    <td className="px-5 py-3 font-medium text-zinc-100">
                      {r.merchant}
                    </td>
                    <td className="px-5 py-3 font-medium text-zinc-100">
                      {formatCurrency(r.amount)}
                    </td>
                    <td className="px-5 py-3 text-xs text-zinc-400">
                      {card ? cardDisplay(card) : "—"}
                    </td>
                    <td className="px-5 py-3 text-zinc-400">{r.date}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${
                          STATUS_STYLES[r.status]
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {visibleRefunds.length > 0 && (
          <div className="border-t border-zinc-800 px-5 py-3">
            <button
              type="button"
              onClick={() => onNavigate({ name: "refunds" })}
              className="text-xs font-medium text-emerald-400 hover:underline"
            >
              View all refunds →
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

function RefundsListView({
  refunds,
  cards,
  selectedCardId,
  onCardChange,
  onNavigate,
}: {
  refunds: Refund[];
  cards: Card[];
  selectedCardId: string | "all";
  onCardChange: (id: string | "all") => void;
  onNavigate: (r: Route) => void;
}) {
  const visibleRefunds =
    selectedCardId === "all"
      ? refunds
      : refunds.filter((r) => r.cardId === selectedCardId);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold tracking-[0.2em] text-zinc-500 uppercase">
          Refund Tracker
        </p>
        <h1 className="text-2xl font-semibold text-zinc-50">Refunds</h1>
        <p className="text-sm text-zinc-400">
          All refund requests and their status, filtered by card.
        </p>
        <CardFilter
          cards={cards}
          selectedCardId={selectedCardId}
          onChange={onCardChange}
        />
      </header>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                <th className="px-5 py-3">Item</th>
                <th className="px-5 py-3">Merchant</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Card</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {visibleRefunds.map((r) => {
                const card = cards.find((c) => c.id === r.cardId);
                return (
                  <tr
                    key={r.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onNavigate({ name: "refund", id: r.id })}
                    onKeyDown={(e) =>
                      e.key === "Enter" && onNavigate({ name: "refund", id: r.id })
                    }
                    className="cursor-pointer text-zinc-300 transition-colors hover:bg-zinc-800/40 focus:bg-zinc-800/40 focus:outline-none"
                  >
                    <td className="px-5 py-3 text-lg">
                      {r.itemIcon ?? "🧾"}
                    </td>
                    <td className="px-5 py-3 font-medium text-zinc-100">
                      {r.merchant}
                    </td>
                    <td className="px-5 py-3 font-medium text-zinc-100">
                      {formatCurrency(r.amount)}
                    </td>
                    <td className="px-5 py-3 text-xs text-zinc-400">
                      {card ? cardDisplay(card) : "—"}
                    </td>
                    <td className="px-5 py-3 text-zinc-400">{r.date}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${
                          STATUS_STYLES[r.status]
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function RefundDetailView({
  refund,
  card,
  onBack,
}: {
  refund: Refund | null;
  card: Card | null;
  onBack: () => void;
}) {
  if (!refund) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-zinc-400 hover:text-zinc-200"
        >
          ← Back
        </button>
        <p className="text-zinc-500">Refund not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onBack}
          className="rounded-md px-2 py-1.5 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
        >
          ← Back
        </button>
      </div>
      <header className="space-y-1">
        <p className="text-xs font-semibold tracking-[0.2em] text-zinc-500 uppercase">
          Refund details
        </p>
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-zinc-50">
          <span className="text-2xl">{refund.itemIcon ?? "🧾"}</span>
          <span>{refund.orderId}</span>
        </h1>
        <p className="text-sm text-zinc-400">{refund.merchant}</p>
      </header>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-sm">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Order ID
            </dt>
            <dd className="mt-1 font-mono text-sm text-zinc-100">
              {refund.orderId}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Merchant
            </dt>
            <dd className="mt-1 text-sm text-zinc-100">{refund.merchant}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Amount
            </dt>
            <dd className="mt-1 text-lg font-semibold text-emerald-400">
              {formatCurrency(refund.amount)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Date
            </dt>
            <dd className="mt-1 text-sm text-zinc-100">{refund.date}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Status
            </dt>
            <dd className="mt-1">
              <span
                className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${
                  STATUS_STYLES[refund.status]
                }`}
              >
                {refund.status}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Card
            </dt>
            <dd className="mt-1 text-sm text-zinc-100">
              {card ? cardDisplay(card) : "—"}
            </dd>
          </div>
          {refund.reason && (
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Reason
              </dt>
              <dd className="mt-1 text-sm text-zinc-300">{refund.reason}</dd>
            </div>
          )}
        </dl>
      </section>
    </div>
  );
}

// --- Payment Methods with camera integration ---

function PaymentMethodsView({
  cards,
  onAddCard,
}: {
  cards: Card[];
  onAddCard: (card: Card) => void;
}) {
  const [step, setStep] = useState<"idle" | "choose" | "ocr" | "manual">(
    "idle",
  );
  const [brand, setBrand] = useState<Card["brand"]>("Visa");
  const [number, setNumber] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStartingCamera, setIsStartingCamera] = useState(false);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
  }, [stream]);

  useEffect(() => {
    if (!stream || !videoRef.current) return;
    videoRef.current.srcObject = stream;
  }, [stream]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const startCamera = async () => {
    setCameraError(null);
    setIsStartingCamera(true);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("Camera access is not supported in this browser.");
        setIsStartingCamera(false);
        return;
      }
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      setStream(s);
    } catch (err) {
      setCameraError("Unable to access camera. Check permissions.");
    } finally {
      setIsStartingCamera(false);
    }
  };

  const handleCaptureFromCamera = () => {
    // In a real app this is where OCR would run on a frame from the video.
    // Here we simulate reading a test card number.
    setNumber("4242 4242 4242 4242");
    stopCamera();
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const digits = number.replace(/\D/g, "");
    if (digits.length < 4) return;
    const last4 = digits.slice(-4);
    const id = `card-${Date.now()}`;
    const method: Card["method"] = step === "ocr" ? "ocr" : "manual";
    onAddCard({
      id,
      brand,
      last4,
      label:
        (method === "ocr" ? "Scanned" : "Manual") +
        ` ${brand} •••• ${last4}`,
      method,
    });
    setStep("idle");
    setNumber("");
    stopCamera();
  };

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold tracking-[0.2em] text-zinc-500 uppercase">
          Refund Tracker
        </p>
        <h1 className="text-2xl font-semibold text-zinc-50">
          Payment Methods
        </h1>
        <p className="text-sm text-zinc-400">
          Add cards by scanning them with your camera or entering them manually.
          Refunds in this prototype are associated to these cards.
        </p>
      </header>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-zinc-100">Your cards</h2>
        {cards.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No cards yet. Add one below to start tracking refunds.
          </p>
        ) : (
          <ul className="space-y-2 text-sm text-zinc-200">
            {cards.map((card) => (
              <li
                key={card.id}
                className="flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-900/80 px-4 py-2"
              >
                <div className="flex flex-col">
                  <span className="font-medium">{cardDisplay(card)}</span>
                  <span className="text-[11px] uppercase tracking-wide text-zinc-500">
                    {card.method === "ocr"
                      ? "Captured via camera"
                      : "Entered manually"}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-zinc-100">
          Add new payment method
        </h2>
        {step === "idle" && (
          <button
            type="button"
            onClick={() => setStep("choose")}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
          >
            + Add new payment method
          </button>
        )}

        {step === "choose" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => {
                setStep("ocr");
                startCamera();
              }}
              className="flex flex-col items-start gap-2 rounded-lg border border-zinc-700 bg-zinc-900/70 px-4 py-3 text-left text-sm text-zinc-200 hover:border-emerald-500/70"
            >
              <span className="text-lg">📷</span>
              <span className="font-medium">Scan card with camera</span>
              <span className="text-xs text-zinc-500">
                Uses your device camera and simulates OCR to capture card
                details.
              </span>
            </button>
            <button
              type="button"
              onClick={() => setStep("manual")}
              className="flex flex-col items-start gap-2 rounded-lg border border-zinc-700 bg-zinc-900/70 px-4 py-3 text-left text-sm text-zinc-200 hover:border-emerald-500/70"
            >
              <span className="text-lg">✏️</span>
              <span className="font-medium">Enter card manually</span>
              <span className="text-xs text-zinc-500">
                Type a dummy card number to see how manual add works.
              </span>
            </button>
          </div>
        )}

        {(step === "ocr" || step === "manual") && (
          <form onSubmit={handleSave} className="space-y-4 pt-4 max-w-md">
            <div className="space-y-1 text-xs text-zinc-500">
              <p>
                Mode:{" "}
                <span className="font-medium text-zinc-300">
                  {step === "ocr" ? "Camera capture" : "Manual entry"}
                </span>
              </p>
              {step === "ocr" && (
                <p>
                  This demo opens your camera using{" "}
                  <code>getUserMedia</code>. When you click{" "}
                  <span className="text-emerald-300">Capture</span>, we simulate
                  reading a test card number for safety.
                </p>
              )}
            </div>

            {step === "ocr" && (
              <div className="space-y-2">
                <div className="relative overflow-hidden rounded-md border border-zinc-800 bg-black/60">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="h-48 w-full object-cover"
                  />
                  {!stream && (
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-zinc-500">
                      {cameraError
                        ? cameraError
                        : "Camera preview will appear here."}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={startCamera}
                    disabled={isStartingCamera}
                    className="rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-800 disabled:opacity-60"
                  >
                    {isStartingCamera ? "Starting camera…" : "Start camera"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCaptureFromCamera}
                    className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500"
                  >
                    Capture
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800"
                  >
                    Stop
                  </button>
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="brand"
                className="block text-xs font-medium uppercase tracking-wide text-zinc-500"
              >
                Brand
              </label>
              <select
                id="brand"
                value={brand}
                onChange={(e) => setBrand(e.target.value as Card["brand"])}
                className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-800/80 px-3 py-2 text-sm text-zinc-100 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
              >
                <option value="Visa">Visa</option>
                <option value="Mastercard">Mastercard</option>
                <option value="Amex">Amex</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="card-number"
                className="block text-xs font-medium uppercase tracking-wide text-zinc-500"
              >
                Card number (dummy)
              </label>
              <input
                id="card-number"
                type="text"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-800/80 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                placeholder="4242 4242 4242 4242"
                required
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
              >
                Save card
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep("idle");
                  setNumber("");
                  stopCamera();
                }}
                className="rounded-md border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}

// --- Support (FAQ + chatbot) ---

const FAQ_ITEMS = [
  {
    id: "q1",
    question: "How long do credit card refunds usually take?",
    answer:
      "Most card refunds appear within 5–10 business days, but some issuers can take up to one full billing cycle. If it has been more than 15 business days, contact your card issuer.",
  },
  {
    id: "q2",
    question: "Why does my refund show as Pending?",
    answer:
      "Pending means the merchant or payment network has initiated the refund, but your bank has not fully posted it yet. This is normal for the first few days after a refund is issued.",
  },
  {
    id: "q3",
    question: "Can I see which card a refund went to?",
    answer:
      "Yes. In this UI, select a card in the filter and open a refund’s details to see the card brand and last four digits the refund was applied to.",
  },
  {
    id: "q4",
    question: "What should I do if a refund never arrives?",
    answer:
      "First, confirm the merchant processed the refund and check your statements for the correct card. If it has been more than 30 days, open a dispute with your card issuer and provide the refund confirmation.",
  },
];

function getBotResponse(input: string): string {
  const text = input.toLowerCase();
  if (text.includes("how long") || text.includes("when") || text.includes("time")) {
    return "Credit card refunds typically take 5–10 business days to appear, but some banks take up to one billing cycle. If it has been more than 15 business days, contact your card issuer with the refund reference.";
  }
  if (text.includes("pending")) {
    return "A Pending refund usually means your bank has been notified but hasn’t finished posting it. This is common for the first few days. If it stays Pending for more than 10 business days, contact your bank.";
  }
  if (text.includes("which card") || text.includes("what card")) {
    return "Select a card in the filter at the top of the Dashboard or Refunds screens, then click a refund to see which card brand and last four digits were used.";
  }
  if (text.includes("dispute") || text.includes("chargeback")) {
    return "For disputes or chargebacks, you’ll need to contact your card issuer directly. Use this tracker to locate the transaction and refund status, then share those details with their support team.";
  }
  if (text.includes("add card") || text.includes("payment method")) {
    return "To add a payment method, open the Payment Methods tab and use “Add new payment method” to scan your card with the camera or enter it manually.";
  }
  return "Thanks for your question. I recommend checking the Dashboard for card-specific refunds, then your bank’s statement. If something looks off, contact your card issuer with the order ID and refund date.";
}

function SupportView({
  onNavigate,
}: {
  onNavigate: (r: Route) => void;
}) {
  const [openFaqId, setOpenFaqId] = useState<string | null>("q1");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "m1",
      from: "bot",
      text: "Hi! I’m here to help with card refunds. Ask a question or tap a suggested scenario below.",
    },
  ]);
  const [input, setInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  const sendMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      from: "user",
      text: trimmed,
    };
    setMessages((prev) => [...prev, userMsg]);
    const replyText = getBotResponse(trimmed);
    const botMsg: ChatMessage = {
      id: `b-${Date.now() + 1}`,
      from: "bot",
      text: replyText,
    };
    setMessages((prev) => [...prev, botMsg]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
    setInput("");
  };

  const quickAsk = (text: string) => {
    sendMessage(text);
  };

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold tracking-[0.2em] text-zinc-500 uppercase">
          Support
        </p>
        <h1 className="text-2xl font-semibold text-zinc-50">
          Help &amp; Refund Assistant
        </h1>
        <p className="text-sm text-zinc-400">
          Use the FAQ for quick answers, or chat with the assistant about your
          refund situation.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-2">
        {/* FAQ */}
        <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-zinc-100">FAQ</h2>
          <div className="space-y-2 text-sm">
            {FAQ_ITEMS.map((item) => {
              const open = openFaqId === item.id;
              return (
                <div
                  key={item.id}
                  className="rounded-md border border-zinc-800 bg-zinc-900/80"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setOpenFaqId(open ? null : item.id)
                    }
                    className="flex w-full items-center justify-between px-3 py-2 text-left"
                  >
                    <span className="text-xs font-medium text-zinc-200">
                      {item.question}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {open ? "−" : "+"}
                    </span>
                  </button>
                  {open && (
                    <div className="border-t border-zinc-800 px-3 py-2 text-xs text-zinc-400">
                      {item.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Chatbot */}
        <div className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-zinc-100">
            Chat with refund assistant
          </h2>
          <div className="mb-3 flex flex-wrap gap-2 text-xs">
            <button
              type="button"
              onClick={() =>
                quickAsk("Why hasn't my refund arrived yet?")
              }
              className="rounded-full border border-zinc-700 bg-zinc-900/80 px-3 py-1 text-xs text-zinc-200 hover:border-emerald-500/60"
            >
              Refund hasn&apos;t arrived
            </button>
            <button
              type="button"
              onClick={() =>
                quickAsk("Which card did this refund go to?")
              }
              className="rounded-full border border-zinc-700 bg-zinc-900/80 px-3 py-1 text-xs text-zinc-200 hover:border-emerald-500/60"
            >
              Which card was refunded?
            </button>
            <button
              type="button"
              onClick={() =>
                quickAsk("How do I dispute a charge?")
              }
              className="rounded-full border border-zinc-700 bg-zinc-900/80 px-3 py-1 text-xs text-zinc-200 hover:border-emerald-500/60"
            >
              Dispute a charge
            </button>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto rounded-md border border-zinc-800 bg-zinc-950/60 p-3 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${
                  m.from === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 ${
                    m.from === "user"
                      ? "bg-emerald-600 text-white"
                      : "bg-zinc-800 text-zinc-100"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about your refund…"
              className="flex-1 rounded-md border border-zinc-700 bg-zinc-900/80 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
            />
            <button
              type="submit"
              className="rounded-md bg-emerald-600 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-500"
            >
              Send
            </button>
          </form>
          <button
            type="button"
            onClick={() => onNavigate({ name: "dashboard" })}
            className="mt-3 self-start text-[11px] text-emerald-400 hover:underline"
          >
            ← Back to Dashboard
          </button>
        </div>
      </section>
    </div>
  );
}

// --- Settings placeholder ---

function SettingsView() {
  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <p className="text-xs font-semibold tracking-[0.2em] text-zinc-500 uppercase">
          Refund Tracker
        </p>
        <h1 className="text-2xl font-semibold text-zinc-50">Settings</h1>
        <p className="text-sm text-zinc-400">
          This screen is a placeholder to mirror a full app. It completes the
          flows described on the intro page.
        </p>
      </header>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-sm">
        <p className="text-sm text-zinc-500">
          In a production app, this is where you might manage notification
          preferences, default card selection, and export options for your
          refund history.
        </p>
      </section>
    </div>
  );
}

// --- Main app ---

export default function Page() {
  const [route, setRoute] = useState<Route>({ name: "intro" });
  const [cards, setCards] = useState<Card[]>(INITIAL_CARDS);
  const [refunds] = useState<Refund[]>(INITIAL_REFUNDS); // auto-tracked only
  const [selectedCardId, setSelectedCardId] = useState<string | "all">("all");

  useEffect(() => {
    const r = parseHash();
    setRoute(r);
    const url = href(r);
    if (!window.location.hash || window.location.hash === "#") {
      window.location.replace(url);
    }
    const onHash = () => setRoute(parseHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const navigate = useCallback((r: Route) => {
    const url = href(r);
    window.location.hash = url;
    setRoute(r);
  }, []);

  const addCard = useCallback((card: Card) => {
    setCards((prev) => [...prev, card]);
    setSelectedCardId(card.id);
  }, []);

  const currentRefund =
    route.name === "refund"
      ? refunds.find((r) => r.id === route.id) ?? null
      : null;

  const currentCard =
    currentRefund && cards.find((c) => c.id === currentRefund.cardId)
      ? cards.find((c) => c.id === currentRefund.cardId)!
      : null;

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-900">
      <RefundTrackerSidebar current={route} onNavigate={navigate} />
      <main className="flex-1 overflow-y-auto px-5 py-6 sm:px-10">
        <div className="mx-auto max-w-5xl">
          {route.name === "intro" && (
            <IntroView onGetStarted={() => navigate({ name: "dashboard" })} />
          )}
          {route.name === "dashboard" && (
            <DashboardView
              refunds={refunds}
              cards={cards}
              selectedCardId={selectedCardId}
              onCardChange={setSelectedCardId}
              onNavigate={navigate}
            />
          )}
          {route.name === "refunds" && (
            <RefundsListView
              refunds={refunds}
              cards={cards}
              selectedCardId={selectedCardId}
              onCardChange={setSelectedCardId}
              onNavigate={navigate}
            />
          )}
          {route.name === "refund" && (
            <RefundDetailView
              refund={currentRefund}
              card={currentCard}
              onBack={() => navigate({ name: "refunds" })}
            />
          )}
          {route.name === "cards" && (
            <PaymentMethodsView cards={cards} onAddCard={addCard} />
          )}
          {route.name === "support" && <SupportView onNavigate={navigate} />}
          {route.name === "settings" && <SettingsView />}
        </div>
      </main>
    </div>
  );
}

