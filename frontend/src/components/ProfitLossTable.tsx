import { useState, useMemo, useCallback, type CSSProperties } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Box,
  Paper,
  Typography,
} from '@mui/material';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import type { ProfitAndLossReport, PnlNode } from '../types/display';
import { formatMoney } from '../api/format';
import { designTokens } from '../theme/theme';

/**
 * ProfitLossTable
 *
 * Hierarchical P&L with one column per period. Each Section / Account row
 * is expandable when it has children — clicking the chevron toggles the
 * descendant subtree.
 *
 * Visual treatment matches the new Kudwa theme: white card, light hairline
 * borders, Inter throughout (numbers use `tabular-nums` for column
 * alignment without switching typefaces), total rows get a heavier top
 * border in ink-black rather than a colored underline.
 *
 * Implementation notes (unchanged from previous version):
 *  - We flatten the visible tree to a 1D row array each render.
 *  - Expansion state keyed by a stable path string ("0/1/3").
 *  - First column is sticky-left, period headers are sticky-top.
 */

interface Props {
  report: ProfitAndLossReport;
}

interface FlatRow {
  node: PnlNode;
  path: string;
  depth: number;
  hasChildren: boolean;
  expanded: boolean;
}

export default function ProfitLossTable({ report }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    // Default: top-level sections expanded one level so the user immediately
    // sees the structure without having to click anything.
    return new Set(report.sections.map((_, i) => `${i}`));
  });

  const toggle = useCallback((path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  const rows = useMemo<FlatRow[]>(() => {
    const out: FlatRow[] = [];
    const walk = (node: PnlNode, path: string, depth: number) => {
      const hasChildren = node.children.length > 0;
      const isExpanded = expanded.has(path);
      out.push({ node, path, depth, hasChildren, expanded: isExpanded });
      if (hasChildren && isExpanded) {
        node.children.forEach((child, i) => walk(child, `${path}/${i}`, depth + 1));
      }
    };
    report.sections.forEach((s, i) => walk(s, `${i}`, 0));
    return out;
  }, [report.sections, expanded]);

  const expandAll = useCallback(() => {
    const all = new Set<string>();
    const walk = (node: PnlNode, path: string) => {
      if (node.children.length > 0) all.add(path);
      node.children.forEach((c, i) => walk(c, `${path}/${i}`));
    };
    report.sections.forEach((s, i) => walk(s, `${i}`));
    setExpanded(all);
  }, [report.sections]);

  const collapseAll = useCallback(() => {
    setExpanded(new Set());
  }, []);

  return (
    <Paper sx={{ overflow: 'hidden' }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          px: 2.5,
          py: 1.75,
          borderBottom: `1px solid ${designTokens.rule}`,
          backgroundColor: designTokens.card,
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
            Profit &amp; Loss
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: designTokens.ink2, display: 'block', mt: 0.25 }}
          >
            {report.startDate} → {report.endDate} · {report.periods.length} periods ·{' '}
            <Box component="span" sx={{ textTransform: 'capitalize' }}>
              {report.source}
            </Box>{' '}
            · {report.currency}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <ActionLink onClick={expandAll}>Expand all</ActionLink>
          <ActionLink onClick={collapseAll}>Collapse all</ActionLink>
        </Box>
      </Box>

      <TableContainer>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={stickyFirstHeader}>Account</TableCell>
              {report.periods.map((p) => (
                <TableCell key={p.id} align="right" sx={periodHeader}>
                  {p.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <PnlRow
                key={row.path}
                row={row}
                periodCount={report.periods.length}
                currency={report.currency}
                onToggle={toggle}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

function PnlRow({
  row,
  periodCount,
  currency,
  onToggle,
}: {
  row: FlatRow;
  periodCount: number;
  currency: string;
  onToggle: (path: string) => void;
}) {
  const { node, path, depth, hasChildren, expanded } = row;
  const isTotal = node.type === 'Total';
  const isSection = node.type === 'Section';
  const emphasize = isTotal || isSection;

  return (
    <TableRow
      sx={{
        backgroundColor: isTotal ? designTokens.cardAlt : 'transparent',
        '&:hover': { backgroundColor: isTotal ? designTokens.cardAlt : '#fafaf7' },
      }}
    >
      <TableCell sx={{ ...stickyFirstCell, paddingLeft: `${12 + depth * 18}px` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {hasChildren ? (
            <IconButton
              size="small"
              onClick={() => onToggle(path)}
              aria-label={expanded ? 'Collapse' : 'Expand'}
              sx={{ width: 22, height: 22, color: designTokens.ink2 }}
            >
              {expanded ? (
                <KeyboardArrowDownIcon sx={{ fontSize: 16 }} />
              ) : (
                <KeyboardArrowRightIcon sx={{ fontSize: 16 }} />
              )}
            </IconButton>
          ) : (
            <Box sx={{ width: 22, height: 22 }} />
          )}
          <Typography
            component="span"
            sx={{
              fontWeight: emphasize ? 600 : 400,
              fontSize: emphasize ? '0.88rem' : '0.85rem',
              color: designTokens.ink,
              whiteSpace: 'nowrap',
            }}
          >
            {node.name}
          </Typography>
        </Box>
      </TableCell>

      {Array.from({ length: periodCount }).map((_, i) => {
        const v = node.values[i] ?? 0;
        return (
          <TableCell
            key={i}
            align="right"
            sx={{
              ...numericCell,
              fontWeight: emphasize ? 600 : 400,
              color: v < 0 ? designTokens.negative : emphasize ? designTokens.ink : designTokens.ink2,
              borderTop: isTotal ? `1px solid ${designTokens.ruleStrong}` : undefined,
            }}
          >
            {v === 0 ? (
              <span style={{ color: designTokens.ink3 }}>—</span>
            ) : (
              formatMoney(v, currency)
            )}
          </TableCell>
        );
      })}
    </TableRow>
  );
}

// ---------- Inline style objects ------------------------------------------

const stickyFirstHeader: CSSProperties = {
  position: 'sticky',
  left: 0,
  zIndex: 3,
  background: designTokens.cardAlt,
  minWidth: 320,
  borderRight: `1px solid ${designTokens.rule}`,
};

const stickyFirstCell: CSSProperties = {
  position: 'sticky',
  left: 0,
  zIndex: 1,
  background: designTokens.card,
  borderRight: `1px solid ${designTokens.rule}`,
  minWidth: 320,
};

const periodHeader: CSSProperties = {
  whiteSpace: 'nowrap',
  fontSize: '0.7rem',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: designTokens.ink2,
};

const numericCell: CSSProperties = {
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'nowrap',
  fontSize: '0.85rem',
};

function ActionLink({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Box
      component="button"
      onClick={onClick}
      sx={{
        appearance: 'none',
        background: 'none',
        border: 0,
        cursor: 'pointer',
        color: designTokens.ink2,
        fontFamily: 'inherit',
        fontSize: '0.78rem',
        fontWeight: 600,
        padding: 0,
        '&:hover': { color: designTokens.ink, textDecoration: 'underline' },
      }}
    >
      {children}
    </Box>
  );
}
