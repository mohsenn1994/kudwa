import { z } from 'zod';

export const NormalizedAccountSchema = z.object({
  external_id: z.string(),
  source: z.string(),
  name: z.string(),
  account_type: z.string(),
  pl_group: z.string(),
  currency: z.string(),
  depth: z.number().int().min(0),
  parent_external_id: z.string().nullable(),
  raw_data: z.record(z.string(), z.unknown()),
});

export type NormalizedAccount = z.infer<typeof NormalizedAccountSchema>;
