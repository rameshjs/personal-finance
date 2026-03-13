// Matches the Rust OtherInvestment struct (serde camelCase renames)
export interface OtherInvestment {
  id: string;
  name: string;
  type: 'savings' | 'gold' | 'fd' | 'rd';

  // Savings/FD: principal invested; RD: monthly installment; Gold: grams
  principal: number;

  // Annual interest rate % (savings, fd, rd only)
  interestRate?: number;

  // ISO date YYYY-MM-DD
  startDate: string;

  // FD only
  maturityDate?: string;
  compoundingFrequency?: number; // times per year, default 4 (quarterly)

  // RD only
  totalMonths?: number;

  // Gold only: purchase price per gram in INR
  purchasePricePerUnit?: number;

  // Gold: current market price per gram (fetched from API)
  currentPrice?: number;
  lastUpdated?: number;
  fetchError: boolean;
}

// Payload sent to add_other_investment — Rust handles price/error after insert
export type NewOtherInvestment = Omit<OtherInvestment, 'currentPrice' | 'lastUpdated' | 'fetchError'>;

// ── Interest calculation helpers (Indian market) ──────────────────────────────

/**
 * Calculates the current value of a Savings Account.
 * Indian savings accounts compound quarterly.
 * A = P × (1 + r / (4 × 100))^(4t)
 */
export function calcSavingsValue(principal: number, annualRatePercent: number, startDate: string): number {
  const t = yearsElapsed(startDate);
  return principal * Math.pow(1 + annualRatePercent / 400, 4 * t);
}

/**
 * Calculates the current/maturity value of a Fixed Deposit.
 * A = P × (1 + r / (n × 100))^(n × t)
 * If already matured, returns the maturity amount.
 */
export function calcFDValue(
  principal: number,
  annualRatePercent: number,
  startDate: string,
  maturityDate: string | undefined,
  compoundingFrequency: number = 4,
): number {
  const today = new Date();
  const end = maturityDate ? new Date(maturityDate) : null;
  const effectiveEnd = end && end < today ? end : today;
  const t = daysBetween(startDate, effectiveEnd.toISOString().slice(0, 10)) / 365;
  return principal * Math.pow(1 + annualRatePercent / (compoundingFrequency * 100), compoundingFrequency * t);
}

/**
 * Calculates the current accrued value of a Recurring Deposit.
 * Uses the standard Indian bank formula with quarterly compounding.
 * Each monthly installment earns: M × (1 + r/400)^(elapsed_quarters_for_that_installment)
 */
export function calcRDValue(
  monthlyInstallment: number,
  annualRatePercent: number,
  startDate: string,
  totalMonths: number,
): number {
  const r = annualRatePercent / 400; // quarterly rate as decimal
  const start = new Date(startDate);
  const today = new Date();
  const monthsElapsedRaw =
    (today.getFullYear() - start.getFullYear()) * 12 + (today.getMonth() - start.getMonth());
  const monthsElapsed = Math.min(Math.max(monthsElapsedRaw, 0), totalMonths);

  let total = 0;
  for (let i = 1; i <= monthsElapsed; i++) {
    const remainingMonths = monthsElapsed - i + 1;
    const quarters = remainingMonths / 3;
    total += monthlyInstallment * Math.pow(1 + r, quarters);
  }
  return total;
}

/**
 * Total principal invested so far in a Recurring Deposit.
 */
export function calcRDInvestedSoFar(monthlyInstallment: number, startDate: string, totalMonths: number): number {
  const start = new Date(startDate);
  const today = new Date();
  const elapsed =
    (today.getFullYear() - start.getFullYear()) * 12 + (today.getMonth() - start.getMonth());
  return monthlyInstallment * Math.min(Math.max(elapsed, 0), totalMonths);
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function yearsElapsed(startDate: string): number {
  return daysBetween(startDate, new Date().toISOString().slice(0, 10)) / 365;
}

function daysBetween(a: string, b: string): number {
  return Math.max(0, (new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
}
