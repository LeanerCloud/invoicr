/**
 * Exchange Rate
 * Fetches daily currency conversion rates for invoices billed in one
 * currency but displayed in another (e.g. rate agreed in USD, invoice in EUR).
 */

export interface ExchangeRate {
  rate: number;
  /** Date the rate applies to, as returned by the rate provider (YYYY-MM-DD) */
  date: string;
}

const cache = new Map<string, ExchangeRate>();

/**
 * Get the exchange rate to convert `from` currency into `to` currency.
 * Rates are cached per process run, so bulk invoice generation only
 * fetches once per currency pair per day.
 */
export async function getExchangeRate(from: string, to: string): Promise<ExchangeRate> {
  if (from === to) {
    return { rate: 1, date: new Date().toISOString().split('T')[0] };
  }

  const cacheKey = `${from}_${to}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const url = `https://api.frankfurter.dev/v1/latest?base=${from}&symbols=${to}`;
  let response: Response;
  try {
    response = await fetch(url);
  } catch (err) {
    throw new Error(
      `Failed to reach exchange rate service for ${from}->${to}: ${err instanceof Error ? err.message : 'network error'}`
    );
  }

  if (!response.ok) {
    throw new Error(`Exchange rate service returned HTTP ${response.status} for ${from}->${to}`);
  }

  const data = await response.json() as { date?: string; rates?: Record<string, number> };
  const rate = data.rates?.[to];
  if (typeof rate !== 'number') {
    throw new Error(`Exchange rate service did not return a rate for ${from}->${to}`);
  }

  const result: ExchangeRate = { rate, date: data.date || new Date().toISOString().split('T')[0] };
  cache.set(cacheKey, result);
  return result;
}

/**
 * Build the human-readable disclosure line shown on the invoice explaining
 * how the converted total was derived.
 */
export function formatConversionNote(
  originalAmount: number,
  from: string,
  to: string,
  rate: number,
  date: string,
  lang: 'de' | 'en'
): string {
  const convertedAmount = originalAmount * rate;
  if (lang === 'de') {
    return `Umrechnung: ${originalAmount.toFixed(2)} ${from} = ${convertedAmount.toFixed(2)} ${to} (Kurs: 1 ${from} = ${rate.toFixed(4)} ${to}, Stand: ${date}).`;
  }
  return `Converted: ${originalAmount.toFixed(2)} ${from} = ${convertedAmount.toFixed(2)} ${to} (rate: 1 ${from} = ${rate.toFixed(4)} ${to}, as of ${date}).`;
}

/** Clear the in-process rate cache. Exposed for tests. */
export function clearExchangeRateCache(): void {
  cache.clear();
}
