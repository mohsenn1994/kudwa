import { z } from 'zod';

export type Dataset2LineItem = {
  account_id?: string;
  name?: string;
  value?: string;
  line_items?: Dataset2LineItem[];
};

const LineItemSchema: z.ZodType<Dataset2LineItem> = z.lazy(() =>
  z.object({
    account_id: z.string().optional(),
    name: z.string().optional(),
    // Real data has numeric values (floats); coerce to string for consistent downstream handling.
    value: z.coerce.string().optional(),
    line_items: z.array(LineItemSchema).optional(),
  })
);

const CategorySchema = z.object({
  name: z.string().optional(),
  line_items: z.array(LineItemSchema).optional(),
});

const PeriodRecordSchema = z.object({
  period_start: z.string(),
  period_end: z.string(),
  revenue: z.array(CategorySchema).optional(),
  cost_of_goods_sold: z.array(CategorySchema).optional(),
  operating_expenses: z.array(CategorySchema).optional(),
  non_operating_revenue: z.array(CategorySchema).optional(),
  non_operating_expenses: z.array(CategorySchema).optional(),
});

export type Dataset2PeriodRecord = z.infer<typeof PeriodRecordSchema>;

export const Dataset2Schema = z.object({
  data: z.array(PeriodRecordSchema),
});

export type Dataset2 = z.infer<typeof Dataset2Schema>;
