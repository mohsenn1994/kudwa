import { type ReactNode } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import { designTokens } from '../theme/theme';

const SIDEBAR_WIDTH = 232;
export type AppTab = 'report' | 'dashboard';


interface Props {
  active: AppTab;
  onChangeTab: (tab: AppTab) => void;
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}

export default function AppShell({
  active,
  onChangeTab,
  title,
  actions,
  children,
}: Props) {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* ---- Sidebar ---- */}
      <Drawer
        variant="permanent"
        sx={{
          width: SIDEBAR_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: SIDEBAR_WIDTH,
            border: 'none',
            borderRight: `1px solid ${designTokens.rule}`,
            backgroundColor: designTokens.canvas,
            px: 1.5,
            py: 2.5,
          },
        }}
      >
        {/* Logo */}
        <Box sx={{ px: 1.5, mb: 3, display: 'flex', alignItems: 'baseline', gap: 1 }}>
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: '1.5rem',
              letterSpacing: '-0.03em',
              color: designTokens.ink,
            }}
          >
            kudwa
          </Typography>
        </Box>
        {/* Nav */}
        <List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <NavItem
            icon={<DashboardOutlinedIcon fontSize="small" />}
            label="Report"
            selected={active === 'report'}
            onClick={() => onChangeTab('report')}
          />
          <NavItem
            icon={<AssessmentOutlinedIcon fontSize="small" />}
            label="Dashboard"
            selected={active === 'dashboard'}
            onClick={() => onChangeTab('dashboard')}
          />
        </List>
      </Drawer>

      {/* ---- Main column ---- */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
        }}
      >
        {/* Page header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: { xs: 'flex-start', md: 'center' },
            justifyContent: 'space-between',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 2,
            px: 3,
            py: 2.5,
          }}
        >
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
              <Typography variant="h4" component="h1" sx={{ fontSize: '1.6rem' }}>
                {title}
              </Typography>
            </Box>
          </Box>
          {actions && (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>{actions}</Box>
          )}
        </Box>

        {/* Body */}
        <Box sx={{ flexGrow: 1, px: 3, pb: 4 }}>{children}</Box>
      </Box>
    </Box>
  );
}

// -- Sub-components
interface NavItemProps {
  icon: ReactNode;
  label: string;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

function NavItem({ icon, label, selected, disabled, onClick }: NavItemProps) {
  return (
    <ListItemButton
      onClick={onClick}
      disabled={disabled}
      sx={{
        borderRadius: 1.5,
        py: 1,
        px: 1.5,
        minHeight: 0,
        backgroundColor: selected ? designTokens.chartreuse : 'transparent',
        color: selected ? designTokens.chartreuseInk : designTokens.ink,
        '&:hover': {
          backgroundColor: selected ? designTokens.chartreuseHover : 'rgba(0,0,0,0.04)',
        },
        '&.Mui-disabled': {
          opacity: 0.45,
        },
      }}
    >
      <ListItemIcon
        sx={{
          minWidth: 28,
          color: 'inherit',
        }}
      >
        {icon}
      </ListItemIcon>
      <ListItemText
        primary={label}
        primaryTypographyProps={{
          fontSize: '0.85rem',
          fontWeight: selected ? 600 : 500,
        }}
      />
    </ListItemButton>
  );
}

