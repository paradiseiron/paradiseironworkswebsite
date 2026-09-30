import type { SupabaseClient } from "@supabase/supabase-js";
import { isCustomerType } from "@/lib/customer-types";

export type CustomerProfileInput = {
  name: string;
  contactName?: string | null;
  customerType?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
};

export function customerNameKey(name: string) {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

export async function upsertCustomerProfile(
  supabase: SupabaseClient,
  input: CustomerProfileInput
) {
  const name = input.name.trim().replace(/\s+/g, " ");
  const nameKey = customerNameKey(name);
  if (!nameKey) throw new Error("Customer name is required.");
  if (input.customerType && !isCustomerType(input.customerType)) throw new Error("Invalid customer type.");

  const { data: existing, error: lookupError } = await supabase
    .from("customers")
    .select("id")
    .eq("name_key", nameKey)
    .maybeSingle();
  if (lookupError) throw lookupError;

  const reusableFields = {
    contact_name: optional(input.contactName),
    customer_type: optional(input.customerType),
    phone: optional(input.phone),
    email: optional(input.email),
    address: optional(input.address),
    city: optional(input.city),
    state: optional(input.state),
    zip_code: optional(input.zipCode),
  };

  if (existing) {
    const updates = Object.fromEntries(
      Object.entries(reusableFields).filter(([, value]) => value !== null)
    );
    const { error } = await supabase
      .from("customers")
      .update({ name, ...updates, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
    if (error) throw error;
    return String(existing.id);
  }

  const { data: customer, error } = await supabase
    .from("customers")
    .insert({ name, name_key: nameKey, ...reusableFields })
    .select("id")
    .single();
  if (error?.code === "23505") {
    const { data: concurrentCustomer, error: concurrentError } = await supabase
      .from("customers")
      .select("id")
      .eq("name_key", nameKey)
      .single();
    if (concurrentError || !concurrentCustomer) throw concurrentError || error;
    return String(concurrentCustomer.id);
  }
  if (error || !customer) throw error || new Error("Unable to create customer profile.");
  return String(customer.id);
}

function optional(value?: string | null) {
  return value?.trim() || null;
}

export async function listCustomerNames(supabase: SupabaseClient) {
  const names: string[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase.from("customers").select("name").order("name").range(offset, offset + 999);
    if (error) throw error;
    names.push(...(data || []).map((customer) => customer.name));
    if (!data || data.length < 1000) break;
  }
  return names;
}
