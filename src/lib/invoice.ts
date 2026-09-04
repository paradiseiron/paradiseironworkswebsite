import { formatCurrency } from "@/lib/proposal-pricing";

export type InvoiceSummary = {
  invoiceNumber: string;
  contractAmount: number;
  paidToDate: number;
  amountDue: number;
  remainingBalance: number;
  isInitialPaymentInvoice: boolean;
};

export function getInvoiceSummary(project: Record<string, unknown>) {
  const contractAmount = optionalNumber(project.proposal_amount) || 0;
  const depositAmount = optionalNumber(project.proposal_deposit_amount) || 0;
  const paidToDate = Math.max(
    optionalNumber(project.initial_payment_received_amount) || 0,
    0
  );
  const remainingBalance = Math.max(contractAmount - paidToDate, 0);
  const isInitialPaymentInvoice =
    project.status === "active" &&
    project.proposal_initial_payment_required === true &&
    !project.initial_payment_received_at &&
    depositAmount > 0;
  const amountDue = isInitialPaymentInvoice
    ? Math.min(depositAmount, remainingBalance)
    : remainingBalance;

  return {
    invoiceNumber: getInvoiceNumber(project),
    contractAmount,
    paidToDate,
    amountDue,
    remainingBalance,
    isInitialPaymentInvoice,
  };
}

export function getInvoiceNumber(project: Record<string, unknown>) {
  const proposalNumber = String(project.proposal_number || "").trim();
  if (proposalNumber) return `INV-${proposalNumber}`;

  const id = String(project.id || "").trim();
  return id ? `INV-${id.slice(0, 8).toUpperCase()}` : "INV-DRAFT";
}

export function getProjectLocation(project: Record<string, unknown>) {
  return [
    project.project_address,
    project.city,
    project.state,
    project.zip_code,
  ]
    .filter(Boolean)
    .join(", ");
}

export function getInvoiceLineItems(summary: InvoiceSummary) {
  if (summary.isInitialPaymentInvoice) {
    return [{ description: "Initial payment due", amount: summary.amountDue }];
  }
  return [
    {
      description: "Contract amount",
      amount: summary.contractAmount,
    },
    {
      description: "Payments and deposits received",
      amount: -summary.paidToDate,
    },
  ].filter((item) => item.amount !== 0);
}

export { formatCurrency };

function optionalNumber(value: unknown) {
  if (value === "" || value === null || value === undefined) return null;

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
