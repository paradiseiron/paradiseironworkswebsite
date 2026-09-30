import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export const metadata = { title: "Application Received", robots: { index: false, follow: false } };
export default function ConfirmationPage() { return <main className="bg-zinc-50 px-6 py-24"><div className="mx-auto max-w-xl rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm sm:p-12"><CheckCircle2 className="mx-auto size-14 text-emerald-600" /><h1 className="mt-6 text-3xl font-semibold text-zinc-900">Application received</h1><p className="mt-4 leading-7 text-zinc-600">Thank you for your interest in Paradise Ironworks. A confirmation email has been sent to the address you provided. Our team will review your application and contact you if your experience matches the position.</p><Link href="/careers" className="mt-8 inline-flex rounded-xl bg-[#fb5411] px-5 py-3 font-semibold text-white hover:bg-[#e64d0f]">Return to careers</Link></div></main>; }
