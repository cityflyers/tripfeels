/**
 * Calculates the total amount with markup based on the payable amount.
 * @param payable - The payable amount (number)
 * @param vat - The total VAT (number)
 * @param markupPercent - The markup percentage (e.g., 5 for 5%)
 * @returns { totalAmount: number, discount: number, markupAmount: number }
 */
export function calculateTotalWithMarkup({
  payable,
  vat,
  markupPercent,
}: {
  payable: number;
  vat: number;
  markupPercent: number;
}) {
  const markupAmount = Math.round(payable * (markupPercent / 100));
  const totalAmount = Math.round(payable + markupAmount + vat);
  return {
    totalAmount,
    markupAmount,
  };
} 