import { useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Alert,
  Typography,
  Stack,
  Chip,
} from '@mui/material';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { api, ApiClientError } from '../api/client';
import type { PipelineRun } from '../types/backend';
import { designTokens } from '../theme/theme';

interface Props {
  onCompleted?: (run: PipelineRun) => void;
  compact?: boolean;
}

export default function IntegrationControls({ onCompleted, compact }: Props) {
  const [loading, setLoading] = useState(false);
  const [run, setRun] = useState<PipelineRun | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRun = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.runIntegration();
      setRun(result);
      onCompleted?.(result);
    } catch (e) {
      const msg =
        e instanceof ApiClientError ? `${e.code}: ${e.message}` : (e as Error).message;
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
      <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap">
        <Button
          variant="contained"
          color="primary"
          onClick={handleRun}
          disabled={loading}
          startIcon={
            loading ? (
              <CircularProgress size={14} thickness={5} sx={{ color: designTokens.ink }} />
            ) : (
              <AutoAwesomeOutlinedIcon sx={{ fontSize: 16 }} />
            )
          }
        >
          {loading ? 'Running…' : 'Run integration'}
        </Button>

        {!compact && run && (
          <Stack direction="row" spacing={0.75} alignItems="center">
            <CheckCircleOutlineIcon sx={{ fontSize: 16, color: designTokens.positive }} />
            <Typography variant="caption" sx={{ color: designTokens.ink2 }}>
              {run.periodLabel}
            </Typography>
            <Stack direction="row" spacing={0.5} sx={{ ml: 0.5 }}>
              <StatChip label={`${run.accountsLoaded} accounts`} />
              <StatChip label={`${run.transactionsLoaded.toLocaleString()} transactions`} />
              <StatChip label={`${run.duration}`} />
            </Stack>
          </Stack>
        )}
      </Stack>

      {error && (
        <Alert severity="error" sx={{ fontSize: '0.8rem' }}>
          {error}
        </Alert>
      )}
    </Box>
  );
}

function StatChip({ label }: { label: string }) {
  return (
    <Chip
      size="small"
      label={label}
      sx={{
        backgroundColor: 'transparent',
        border: `1px solid ${designTokens.rule}`,
        color: designTokens.ink2,
        fontFamily: 'inherit',
        fontWeight: 500,
        fontVariantNumeric: 'tabular-nums',
      }}
    />
  );
}
