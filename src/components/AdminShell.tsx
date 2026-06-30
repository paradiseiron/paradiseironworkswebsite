"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Hammer, LayoutDashboard } from "lucide-react";
import DeleteProjectButton from "@/components/DeleteProjectButton";
import AdminProfileMenu from "@/components/AdminProfileMenu";

export default function AdminShell({
  children,
  userEmail,
}: {
  children: React.ReactNode;
  userEmail?: string;
}) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentTab = searchParams.get("tab");

  const isDashboardPage = pathname === "/admin";
  const isProjectsPage = pathname === "/admin/projects";
  const isNewProjectPage = pathname === "/admin/projects/new";
  const isEditProjectPage =
  pathname.startsWith("/admin/projects/") &&
  pathname.endsWith("/edit");

  const isProposalPreview =
    pathname.startsWith("/admin/projects/") &&
    pathname.endsWith("/proposal");

  const isProjectDetail =
    pathname.startsWith("/admin/projects/") &&
    !pathname.endsWith("/proposal") &&
    pathname !== "/admin/projects" &&
    pathname !== "/admin/projects/new";

  const isProjectProposalTab =
    isProjectDetail && currentTab === "proposal";

  const projectPath = isProposalPreview
    ? `${pathname.replace("/proposal", "")}?tab=proposal`
    : pathname;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const savedTheme = window.localStorage.getItem("admin-theme");
      if (savedTheme === "light" || savedTheme === "dark") {
        setTheme(savedTheme);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.adminTheme = theme;
    return () => {
      delete document.documentElement.dataset.adminTheme;
    };
  }, [theme]);

  function toggleTheme() {
    setTheme((currentTheme) => {
      const nextTheme = currentTheme === "dark" ? "light" : "dark";
      window.localStorage.setItem("admin-theme", nextTheme);
      return nextTheme;
    });
  }

  return (
    <div
      className="admin-shell min-h-screen bg-neutral-950 text-white transition-colors"
      data-theme={theme}
    >
      <aside className="admin-sidebar fixed left-0 top-0 z-50 h-screen w-20 border-r border-white/10 bg-black/50 backdrop-blur-xl print:hidden">
        <div className="flex h-20 items-center justify-center border-b border-white/10">
          <Link href="/admin" className="group">
            <Image
              src="/images/paradise_ironworks_logo.png"
              alt="Projects"
              width={34}
              height={34}
              className="opacity-80 transition group-hover:opacity-100"
            />
          </Link>
        </div>

        <nav className="flex flex-col items-center gap-4 p-4">
          <NavIcon
            href="/admin"
            active={pathname === "/admin"}
            label="Dashboard"
          >
            <LayoutDashboard className="h-6 w-6" aria-hidden="true" />
          </NavIcon>
          <NavIcon
            href="/admin/projects"
            active={pathname.startsWith("/admin/projects")}
            label="Projects"
          >
            <Hammer className="h-6 w-6" aria-hidden="true" />
          </NavIcon>
        </nav>
        <AdminProfileMenu
          email={userEmail}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      </aside>

      <div className="ml-20 print:ml-0">
        <header className="admin-header sticky top-0 z-40 border-b border-white/10 bg-neutral-950/80 backdrop-blur-xl print:hidden">
          <div className="flex items-center justify-between px-8 py-4">
            <div>
              {isNewProjectPage && (
                <Link
                  href="/admin/projects"
                  className="rounded-xl border border-white/10 px-4 py-2 text-sm text-neutral-300 transition hover:bg-white/5 hover:text-white"
                >
                  ← Back to Projects
                </Link>
              )}

              {isProjectDetail && (
                <Link
                  href="/admin/projects"
                  className="rounded-xl border border-white/10 px-4 py-2 text-sm text-neutral-300 transition hover:bg-white/5 hover:text-white"
                >
                  ← Back to Projects
                </Link>
              )}

              {isProposalPreview && (
                <Link
                  href={projectPath}
                  className="rounded-xl border border-white/10 px-4 py-2 text-sm text-neutral-300 transition hover:bg-white/5 hover:text-white"
                >
                  ← Back to Project
                </Link>
              )}
            </div>

            <div className="flex items-center gap-3">
              {(isDashboardPage || isProjectsPage) && (
                <Link
                  href="/admin/projects/new"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#fb5411] px-5 text-sm font-semibold text-white transition hover:bg-[#e64d0f]"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4v16m8-8H4"
                    />
                  </svg>

                  <span>New Project</span>
                </Link>
              )}
              

              {isNewProjectPage && (
                <button
                  type="submit"
                  form="new-project-form"
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-[#fb5411] px-5 text-sm font-semibold text-white transition hover:bg-[#e64d0f]"
                >
                  Save Project
                </button>
              )}
{isProjectDetail && !isProjectProposalTab && !isEditProjectPage &&  (
  <>
    <Link
      href={`${pathname}/edit`}
      className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 px-5 text-sm font-semibold text-neutral-300 transition hover:bg-white/5 hover:text-white"
    >
      Edit Project
    </Link>
    <DeleteProjectButton projectId={pathname.split("/").pop() || ""} />
  </>
)}
{isEditProjectPage && (
  <button
    type="submit"
    form="edit-project-form"
    className="inline-flex h-10 items-center justify-center rounded-xl bg-[#fb5411] px-5 text-sm font-semibold text-white transition hover:bg-[#e64d0f]"
  >
    Save Changes
  </button>
)}

              {isProjectProposalTab && (
                <button
                  type="submit"
                  form="proposal-form"
                  name="intent"
                  value="preview"
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-[#fb5411] px-5 text-sm font-semibold text-white transition hover:bg-[#e64d0f]"
                >
                  Preview
                </button>
              )}

              {isProposalPreview && (
  <>
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-xl border border-white/10 px-4 py-2 text-sm text-neutral-300 transition hover:bg-white/5 hover:text-white"
    >
      Print
    </button>

    <Link
  href={`${pathname}/pdf`}
  className="rounded-xl bg-[#fb5411] px-5 py-2 text-sm font-semibold text-white hover:bg-[#e64d0f]"
>
  Download PDF
</Link>
  </>
)}
            </div>
          </div>
        </header>

        <main className="overflow-x-hidden px-8 pb-8 pt-4 print:p-0 print:overflow-visible">
          {children}
        </main>
      </div>
    </div>
  );
}

function NavIcon({
  href,
  active,
  label,
  children,
}: {
  href: string;
  active?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      title={label}
      className={`group flex h-12 w-12 items-center justify-center rounded-2xl border transition ${
        active
          ? "border-[#fb5411]/40 bg-[#fb5411]/15"
          : "border-white/10 bg-white/[0.03] hover:bg-white/10"
      }`}
    >
      {children}
    </Link>
  );
}
