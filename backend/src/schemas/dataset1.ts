import { z } from 'zod';

const ColDataItemSchema = z.object({
  id: z.string().optional(),
  value: z.string().optional(),
});

export type ColDataItem = z.infer<typeof ColDataItemSchema>;

export type SectionRow = {
  type: 'Section';
  group?: string;
  Header?: { ColData: ColDataItem[] };
  Rows?: { Row: Dataset1Row[] };
};

export type LeafRow = {
  type?: string;
  group?: string;
  ColData?: ColDataItem[];
};

export type Dataset1Row = SectionRow | LeafRow;

const RowSchema: z.ZodType<Dataset1Row> = z.lazy(() =>
  z.union([
    z.object({
      type: z.literal('Section'),
      group: z.string().optional(),
      Header: z.object({ ColData: z.array(ColDataItemSchema) }).optional(),
      Rows: z.object({ Row: z.array(RowSchema) }).optional(),
    }),
    z.object({
      type: z.string().optional(),
      group: z.string().optional(),
      ColData: z.array(ColDataItemSchema).optional(),
    }),
  ])
);

const ColumnSchema = z.object({
  ColType: z.string(),
  ColTitle: z.string().optional(),
  MetaData: z.array(z.object({ Name: z.string(), Value: z.string() })).optional(),
});

export type Dataset1Column = z.infer<typeof ColumnSchema>;

export const Dataset1Schema = z.object({
  data: z.object({
    Header: z.object({ Currency: z.string().optional() }).catchall(z.unknown()),
    Columns: z.object({ Column: z.array(ColumnSchema) }).optional(),
    Rows: z.object({ Row: z.array(RowSchema) }),
  }),
});

export type Dataset1 = z.infer<typeof Dataset1Schema>;

export function isSectionRow(row: Dataset1Row): row is SectionRow {
  return row.type === 'Section';
}
