import type { Metadata } from "next";
import Header from "@/components/Header";


export const metadata: Metadata = {
  title: "Our Work | Paradise Ironworks",
  description:
    "Explore completed Paradise Ironworks projects across residential, commercial, and structural metal fabrication in the DMV.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />

      <main>
        {children}
      </main>

  
    </>
  );
}
