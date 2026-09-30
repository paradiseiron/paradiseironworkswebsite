import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export function campaignConfig() {
  return {
    apiKey: process.env.RESEND_API_KEY?.trim(),
    from: process.env.CAMPAIGN_FROM_EMAIL?.trim() || "Paradise Ironworks <info@paradiseironworks.com>",
    postalAddress: process.env.CAMPAIGN_POSTAL_ADDRESS?.trim(),
    siteUrl: (process.env.NEXT_PUBLIC_SITE_URL || "https://www.paradiseironworks.com").replace(/\/$/, ""),
  };
}

export async function eligibleCustomers(audienceType: string | null) {
  const supabase = createAdminClient();
  const customers: { id: string; name: string; email: string; customer_type: string | null }[] = [];
  for (let offset = 0; ; offset += 1000) {
    let query = supabase.from("customers").select("id, name, email, customer_type").not("email", "is", null).order("name").range(offset, offset + 999);
    if (audienceType) query = query.eq("customer_type", audienceType);
    const { data, error } = await query;
    if (error) throw error;
    customers.push(...(data || []).filter((customer) => customer.email?.trim()));
    if (!data || data.length < 1000) break;
  }
  const suppressions: string[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase.from("email_suppressions").select("email").order("email").range(offset, offset + 999);
    if (error) throw error;
    suppressions.push(...(data || []).map((row) => row.email));
    if (!data || data.length < 1000) break;
  }
  const suppressed = new Set(suppressions);
  const seen = new Set<string>();
  return customers.filter((customer) => {
    const email = customer.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || suppressed.has(email) || seen.has(email)) return false;
    seen.add(email);
    return true;
  });
}

export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] || character);
}
