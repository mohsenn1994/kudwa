import { useState } from 'react';
import AppShell, { type AppTab } from './components/AppShell';
import { useReportPage } from './pages/ReportPage';
import { useDashboardPage } from './pages/DashboardPage';

export default function App() {
  const [tab, setTab] = useState<AppTab>('report');

  const report = useReportPage();
  const dashboard = useDashboardPage();

  const current = tab === 'report' ? report : dashboard;
  const title = tab === 'report' ? 'Profit & Loss Report' : 'Profit & Loss Dashboard';

  return (
    <AppShell
      active={tab}
      onChangeTab={setTab}
      title={title}
      actions={current.actions}
    >
      {current.body}
    </AppShell>
  );
}
