import { useEffect, useState, useCallback } from 'react';
import {
  Box,
  CircularProgress,
  Alert,
  Stack,
  Select,
  MenuItem,
  FormControl,
} from '@mui/material';
import IntegrationControls from '../components/IntegrationControls';
import ProfitLossTable from '../components/ProfitLossTable';
import EmptyState from '../components/EmptyState';
import { api, ApiClientError } from '../api/client';
import type { ReportSummary } from '../types/backend';
import type { ProfitAndLossReport } from '../types/display';
import type { PageSlots } from '../types/page';

export function useReportPage(): PageSlots {
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [report, setReport] = useState<ProfitAndLossReport | null>(null);
  const [state, setState] = useState<'loading' | 'empty' | 'error' | 'ready'>('loading');
  const [error, setError] = useState<string | null>(null);

  const refreshList = useCallback(
    () =>
      api.listReports(50, 0).then(res => {
        const complete = res.reports.filter(r => r.status === 'complete');
        setReports(complete);
        return complete;
      }),
    [],
  );

  // Load report list on mount and auto-select the latest
  useEffect(() => {
    refreshList()
      .then(complete => {
        if (complete.length > 0) {
          setSelectedId(String(complete[0].id));
        } else {
          setState('empty');
        }
      })
      .catch(() => setState('empty'));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = useCallback(async (id: string) => {
    setState('loading');
    setError(null);
    try {
      const r = await api.getReportDisplay(id);
      setReport(r);
      setState('ready');
    } catch (e) {
      if (e instanceof ApiClientError && e.code === 'NOT_FOUND') {
        setReport(null);
        setState('empty');
        return;
      }
      setError(e instanceof Error ? e.message : 'Unknown error');
      setState('error');
    }
  }, []);

  useEffect(() => {
    if (selectedId) void load(selectedId);
  }, [load, selectedId]);

  const onIntegrationCompleted = useCallback(() => {
    refreshList()
      .then(complete => {
        if (complete.length > 0) setSelectedId(String(complete[0].id));
      })
      .catch(() => {});
  }, [refreshList]);

  const actions = <IntegrationControls onCompleted={onIntegrationCompleted} />;

  const body = (
    <Stack spacing={2}>
      {reports.length > 0 && (
        <Box>
          <FormControl size="small">
            <Select
              value={selectedId ?? ''}
              onChange={e => setSelectedId(e.target.value)}
              displayEmpty
              sx={{ fontSize: '0.85rem', minWidth: 280 }}
            >
              {reports.map((r, i) => (
                <MenuItem key={r.id} value={String(r.id)} sx={{ fontSize: '0.85rem' }}>
                  {r.period_label}{i === 0 ? ' — latest' : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}

      {state === 'loading' && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={28} />
        </Box>
      )}
      {state === 'error' && (
        <Alert severity="error">{error ?? 'Failed to load report.'}</Alert>
      )}
      {state === 'empty' && <EmptyState />}
      {state === 'ready' && report && <ProfitLossTable report={report} />}
    </Stack>
  );

  return { actions, body };
}
