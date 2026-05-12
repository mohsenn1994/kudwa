import { Paper, Typography, Box } from '@mui/material';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import { designTokens } from '../theme/theme';

interface Props {
  title?: string;
  message?: string;
}

// Empty state shown when no report has been generated yet
export default function EmptyState({
  title = 'No report yet',
  message = 'Click "Run integration" above to ingest the bundled data sources and populate this view.',
}: Props) {
  return (
    <Paper
      sx={{
        p: 6,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 1.5,
        backgroundColor: designTokens.cardAlt,
      }}
    >
      <InsightsOutlinedIcon sx={{ fontSize: 44, color: designTokens.ink3 }} />
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600 }} gutterBottom>
          {title}
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: designTokens.ink2, maxWidth: 460, mx: 'auto' }}
        >
          {message}
        </Typography>
      </Box>
    </Paper>
  );
}
