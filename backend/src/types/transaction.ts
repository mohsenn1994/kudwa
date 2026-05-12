import { z } from 'zod';

export const NormalizedTransactionSchema = z.object({
  external_id: z.string(),
  source: z.string(),
  date: z.string(),
  period_end: z.string(),
  amount: z.number(),
  currency: z.string(),
  description: z.string(),
  transaction_type: z.enum(['credit', 'debit']),
  pl_group: z.string(),
  pl_category: z.string(),
  raw_data: z.record(z.string(), z.unknown()),
});

export type NormalizedTransaction = z.infer<typeof NormalizedTransactionSchema>;
