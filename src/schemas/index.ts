export {
  addressSchema,
  bankSchema,
  providerSchema,
  type ProviderInput,
  type Provider
} from './provider';

export {
  serviceDescriptionSchema,
  serviceSchema,
  emailConfigSchema,
  lineItemSchema,
  clientSchema,
  type ClientInput,
  type Client,
  type LineItem
} from './client';

import { z } from 'zod/v4';
import { providerSchema } from './provider';
import { clientSchema } from './client';

/**
 * Validate a provider config and return typed result or throw with helpful error message
 */
export function validateProvider(data: unknown): z.output<typeof providerSchema> {
  const result = providerSchema.safeParse(data);
  if (!result.success) {
    const errors = result.error.issues.map(issue =>
      `  - ${issue.path.join('.')}: ${issue.message}`
    ).join('\n');
    throw new Error(`Invalid provider.json:\n${errors}`);
  }
  return result.data;
}

/**
 * Validate a client config and return typed result or throw with helpful error message
 */
export function validateClient(data: unknown): z.output<typeof clientSchema> {
  const result = clientSchema.safeParse(data);
  if (!result.success) {
    const errors = result.error.issues.map(issue =>
      `  - ${issue.path.join('.')}: ${issue.message}`
    ).join('\n');
    throw new Error(`Invalid client config:\n${errors}`);
  }
  return result.data;
}
