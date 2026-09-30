import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

async function unsubscribe(token: string) {
  "use server";
  const supabase = createAdminClient();
  const { data } = await supabase.from("email_campaign_recipients").select("email").eq("unsubscribe_token", token).maybeSingle();
  if (!data) notFound();
  const { error } = await supabase.from("email_suppressions").upsert({ email: data.email.trim().toLowerCase() }, { onConflict: "email" });
  if (error) throw new Error("Unable to save your unsubscribe request. Please try again.");
  redirect("/unsubscribe/complete");
}

export default async function UnsubscribePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { data } = await createAdminClient().from("email_campaign_recipients").select("email").eq("unsubscribe_token", token).maybeSingle();
  if (!data) notFound();
  return <main className="mx-auto max-w-lg px-6 py-20"><h1 className="text-3xl font-semibold">Unsubscribe from marketing email</h1><p className="mt-4">Stop sending campaign emails to {data.email}.</p><form action={unsubscribe.bind(null, token)} className="mt-8"><button className="rounded-xl bg-[#fb5411] px-5 py-3 font-semibold text-white">Unsubscribe</button></form></main>;
}
