import DashboardShell from '@/components/dashboard/public-dashboard-shell';

export default function ResultsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}