import { formatCurrency } from "@/lib/proposal-pricing";

export type InvoiceSummary = {
  invoiceNumber: string;
  contractAmount: number;
  paidToDate: number;
  amountDue: number;
};

export function getInvoiceSummary(project: Record<string, unknown>) {
  const contractAmount = optionalNumber(project.proposal_amount) || 0;
  const recordedBalance = optionalNumber(project.balance_due);
  const depositAmount = optionalNumber(project.proposal_deposit_amount) || 0;
  const amountDue =
    recordedBalance !== null
      ? Math.max(recordedBalance, 0)
      : Math.max(contractAmount - depositAmount, 0);
  const paidToDate = Math.max(contractAmount - amountDue, 0);

  return {
    invoiceNumber: getInvoiceNumber(project),
    contractAmount,
    paidToDate,
    amountDue,
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
