import { describe, it, expect, vi, afterEach } from 'vitest';
import { getExchangeRate, formatConversionNote, clearExchangeRateCache } from '../src/lib/exchange-rate.js';

describe('exchange-rate', () => {
  afterEach(() => {
    clearExchangeRateCache();
    vi.unstubAllGlobals();
  });

  describe('getExchangeRate', () => {
    it('returns a rate of 1 without calling fetch when currencies match', async () => {
      const fetchMock = vi.fn();
      vi.stubGlobal('fetch', fetchMock);

      const result = await getExchangeRate('EUR', 'EUR');

      expect(result.rate).toBe(1);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('fetches and returns the rate for a currency pair', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ date: '2024-03-15', rates: { EUR: 0.92 } })
      });
      vi.stubGlobal('fetch', fetchMock);

      const result = await getExchangeRate('USD', 'EUR');

      expect(result).toEqual({ rate: 0.92, date: '2024-03-15' });
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock.mock.calls[0][0]).toContain('base=USD');
      expect(fetchMock.mock.calls[0][0]).toContain('symbols=EUR');
    });

    it('caches the rate for repeated calls with the same currency pair', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ date: '2024-03-15', rates: { EUR: 0.92 } })
      });
      vi.stubGlobal('fetch', fetchMock);

      await getExchangeRate('USD', 'EUR');
      await getExchangeRate('USD', 'EUR');

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('throws when the network request fails', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

      await expect(getExchangeRate('USD', 'EUR')).rejects.toThrow(/Failed to reach exchange rate service/);
    });

    it('throws when the response is not ok', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));

      await expect(getExchangeRate('USD', 'EUR')).rejects.toThrow(/HTTP 500/);
    });

    it('throws when the response has no rate for the target currency', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ date: '2024-03-15', rates: {} })
      }));

      await expect(getExchangeRate('USD', 'EUR')).rejects.toThrow(/did not return a rate/);
    });
  });

  describe('formatConversionNote', () => {
    it('formats an English disclosure line', () => {
      const note = formatConversionNote(1000, 'USD', 'EUR', 0.92, '2024-03-15', 'en');
      expect(note).toBe(
        'Converted: 1000.00 USD = 920.00 EUR (rate: 1 USD = 0.9200 EUR, as of 2024-03-15).'
      );
    });

    it('formats a German disclosure line', () => {
      const note = formatConversionNote(1000, 'USD', 'EUR', 0.92, '2024-03-15', 'de');
      expect(note).toBe(
        'Umrechnung: 1000.00 USD = 920.00 EUR (Kurs: 1 USD = 0.9200 EUR, Stand: 2024-03-15).'
      );
    });
  });
});
