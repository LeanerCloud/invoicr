export function formatDate(date: Date, lang: string): string {
  if (lang === 'de') {
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatCurrency(amount: number, currency: string, lang: string): string {
  if (currency === 'USD') {
    return '$' + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  if (lang === 'en') {
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
  }
  return amount.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

export function formatQuantity(qty: number, lang: string): string {
  if (lang === 'en') {
    return qty.toString();
  }
  return qty.toString().replace('.', ',');
}

export function getServiceDescription(description: string | { de?: string; en?: string }, lang: string): string {
  if (typeof description === 'string') {
    return description;
  }
  return description[lang as 'de' | 'en'] || description.de || description.en || '';
}

export function getTranslatedCountry(country: string | { de?: string; en?: string } | undefined, lang: string): string | undefined {
  if (!country) return undefined;
  if (typeof country === 'string') {
    return country;
  }
  return country[lang as 'de' | 'en'] || country.de || country.en || '';
}

