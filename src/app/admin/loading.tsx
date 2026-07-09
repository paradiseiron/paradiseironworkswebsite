import Image from "next/image";

export default function AdminLoading() {
  return (
    <div className="grid min-h-[calc(100vh-8rem)] place-items-center bg-neutral-950 px-6 text-white">
      <div className="flex flex-col items-center">
        <div className="grid h-24 w-24 place-items-center rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/40">
          <Image
            src="/images/paradise_ironworks_logo.png"
            alt="Paradise Ironworks"
            width={112}
            height={112}
            priority
            className="h-16 w-16 object-contain"
          />
        </div>

        <div className="mt-6 h-1 w-32 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-1/2 animate-[admin-loading_1.2s_ease-in-out_infinite] rounded-full bg-[#fb5411]" />
        </div>
      </div>
    </div>
  );
}
