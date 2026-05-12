import { useEffect, useState, useCallback } from 'react';
import { Box, CircularProgress, Alert, Paper, Typography, Stack } from '@mui/material';
import Grid from '@mui/material/Grid2';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import IntegrationControls from '../components/IntegrationControls';
import EmptyState from '../components/EmptyState';
import { api, ApiClientError } from '../api/client';
import type { ReportSummary } from '../types/backend';
import type { PageSlots } from '../types/page';
import { formatMoney, formatMoneyCompact } from '../api/format';
import { designTokens } from '../theme/theme';

const BAR_COLORS = [
  '#2d8659', // Revenue — green
  '#4a7fd4', // Gross Profit — blue
  '#b8770f', // Operating Income — amber
  '#0d0d0d', // Net Income — dark
];

export function useDashboardPage(): PageSlots {
  const [report, setReport] = useState<ReportSummary | null>(null);
  const [state, setState] = useState<'loading' | 'empty' | 'error' | 'ready'>('loading');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setState('loading');
    setError(null);
    try {
      const result = await api.listReports(1, 0);
      const latest = result.reports.find(r => r.status === 'complete');
      if (!latest) {
        setReport(null);
        setState('empty');
        return;
      }
      setReport(latest);
      setState('ready');
    } catch (e) {
      if (e instanceof ApiClientError && e.code === 'NOT_FOUND') {
        setState('empty');
        return;
      }
      setError(e instanceof Error ? e.message : 'Unknown error');
      setState('error');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const actions = <IntegrationControls onCompleted={() => void load()} />;

  const chartData = report
    ? [
        { label: 'Revenue', value: Number(report.total_revenue) },
        { label: 'Gross Profit', value: Number(report.gross_profit) },
        { label: 'Total Expenses', value: Number(report.total_expenses) },
        { label: 'Net Income', value: Number(report.net_profit) },
      ]
    : [];

  const body = (
    <Stack spacing={2.5}>
      {state === 'loading' && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={28} />
        </Box>
      )}
      {state === 'error' && <Alert severity="error">{error ?? 'Failed to load dashboard.'}</Alert>}
      {state === 'empty' && <EmptyState />}

      {state === 'ready' && report && (
        <>
          {/* KPI strip */}
          <Grid container spacing={2}>
            <InfoCard label="Total Revenue" value={Number(report.total_revenue)} currency={report.currency} />
            <InfoCard
              label="Gross Profit"
              value={Number(report.gross_profit)}
              currency={report.currency}
              sub={
                Number(report.total_revenue) !== 0
                  ? `${((Number(report.gross_profit) / Number(report.total_revenue)) * 100).toFixed(1)}% margin`
                  : undefined
              }
            />
            <InfoCard label="Total Expenses" value={Number(report.total_expenses)} currency={report.currency} />
            <InfoCard label="Net Income" value={Number(report.net_profit)} currency={report.currency} highlight />
          </Grid>

          {/* Bar chart */}
          <Paper sx={{ p: 2.5 }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                P&amp;L Breakdown
              </Typography>
              <Typography variant="caption" sx={{ color: designTokens.ink2 }}>
                {report.period_label} · {report.currency}
              </Typography>
            </Box>
            <Box sx={{ width: '100%', height: 320 }}>
              <ResponsiveContainer>
                <BarChart data={chartData} margin={{ top: 10, right: 24, left: 0, bottom: 0 }} barCategoryGap="45%">
                  <CartesianGrid stroke={designTokens.rule} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: designTokens.ink2 }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v: number) => formatMoneyCompact(v, report.currency)} tick={{ fontSize: 11, fill: designTokens.ink2 }} width={72} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(v: number) => [formatMoney(v, report.currency), '']}
                    contentStyle={tooltipStyle}
                    cursor={{ fill: designTokens.cardAlt }}
                  />
                  <Bar dataKey="value" radius={[5, 5, 0, 0]}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </>
      )}
    </Stack>
  );

  return { actions, body };
}

// -- Info card
interface InfoCardProps {
  label: string;
  value: number;
  currency: string;
  sub?: string;
  highlight?: boolean;
}

function InfoCard({ label, value, currency, sub, highlight }: InfoCardProps) {
  const isNeg = value < 0;
  return (
    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
      <Paper
        sx={{
          p: 2.5,
          height: '100%',
          borderLeft: highlight ? `3px solid ${designTokens.chartreuse}` : undefined,
        }}
      >
        <Typography variant="overline">{label}</Typography>
        <Typography
          sx={{
            fontSize: '1.65rem',
            fontWeight: 700,
            mt: 0.5,
            letterSpacing: '-0.02em',
            fontVariantNumeric: 'tabular-nums',
            color: isNeg ? designTokens.negative : designTokens.ink,
          }}
        >
          {formatMoney(value, currency)}
        </Typography>
        {sub && (
          <Typography variant="caption" sx={{ color: designTokens.ink2, mt: 0.25, display: 'block' }}>
            {sub}
          </Typography>
        )}
      </Paper>
    </Grid>
  );
}

// -- Bar tooltip styles
const tooltipStyle: React.CSSProperties = {
  borderRadius: 8,
  border: `1px solid ${designTokens.rule}`,
  backgroundColor: designTokens.card,
  fontSize: '0.8rem',
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
};
