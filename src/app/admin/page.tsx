import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminPage() {
  const supabase = await createClient();

  const {
  data: { session },
} = await supabase.auth.getSession();

if (!session) {
  redirect("/login");
}
  return (
    <div>
      <h1 className="text-3xl font-semibold">Paradise Internal CRM</h1>
      <p className="mt-4 text-neutral-300">
        Dashboard Here.
      </p>
    </div>
  );
}