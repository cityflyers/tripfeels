'use client';
import { useRoleGuard } from '@/hooks/use-role-guard';
import { Skeleton } from '@/components/ui/skeleton';
import FareMarkupManager from '@/components/dashboard/FareMarkupManager';
import { calculateTotalWithMarkup } from '@/lib/calculateTotalWithMarkup';

export default function MarkupPage() {
  const { hasAccess, loading } = useRoleGuard({
    allowedRoles: ['SUPER_ADMIN', 'ACCOUNT_ADMIN'],
  });

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center">
        <h1 className="text-2xl font-bold">Unauthorized Access</h1>
        <p className="text-muted-foreground">
          You do not have permission to access this page.
        </p>
      </div>
    );
  }

  // Example markup calculation for demonstration
  const examplePayable = 2828; // BDT from your screenshot
  const exampleVat = 10; // AIT VAT from your screenshot
  const exampleMarkup = 5; // 5% markup example

  const { totalAmount, markupAmount } = calculateTotalWithMarkup({
    payable: examplePayable,
    vat: exampleVat,
    markupPercent: exampleMarkup,
  });

  return (
    <div className="space-y-8">
      {/* Markup Calculation Example */}
      <div className="bg-background rounded-lg shadow p-6 border border-border">
        <h2 className="text-xl font-semibold mb-4">Markup Calculation Example</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <h3 className="font-medium text-sm text-muted-foreground">Input Values</h3>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Payable Amount:</span>
                <span className="font-medium">BDT {examplePayable.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>VAT:</span>
                <span className="font-medium">BDT {exampleVat.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Markup Percentage:</span>
                <span className="font-medium">{exampleMarkup}%</span>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium text-sm text-muted-foreground">Calculated Results</h3>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Markup Amount:</span>
                <span className="font-medium">BDT {markupAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Amount:</span>
                <span className="font-medium text-lg">BDT {totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Formula:</span>
                <span>Payable + Markup + VAT</span>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 p-3 bg-muted rounded-md">
          <p className="text-sm text-muted-foreground">
            <strong>How it works:</strong> The markup is calculated as a percentage of the payable amount. 
            The total price shown to customers will be: <strong>Payable Amount + (Markup % of Payable) + VAT</strong>
          </p>
        </div>
      </div>

      {/* Fare Markup Manager */}
      <FareMarkupManager />
    </div>
  );
} 