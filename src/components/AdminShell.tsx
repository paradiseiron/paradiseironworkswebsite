"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Download,
  Hammer,
  LayoutDashboard,
  ClipboardList,
  Pencil,
} from "lucide-react";
import DeleteProjectButton from "@/components/DeleteProjectButton";
import AdminProfileMenu from "@/components/AdminProfileMenu";
import ReliableMobileLink from "@/components/ReliableMobileLink";
import type { UserRole } from "@/lib/roles";

export default function AdminShell({
  children,
  userEmail,
  userRole,
}: {
  children: React.ReactNode;
  userEmail?: string;
  userRole: UserRole;
}) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentTab = searchParams.get("tab");

  const isDashboardPage = pathname === "/admin";
  const isProjectsPage = pathname === "/admin/projects";
  const isDailyShopReportPage = pathname.startsWith(
    "/admin/daily-shop-report"
  );
  const isDailyShopReportIndex = pathname === "/admin/daily-shop-report";
  const isDailyShopReportSubpage =
    isDailyShopReportPage && !isDailyShopReportIndex;
  const isNewProjectPage = pathname === "/admin/projects/new";
  const isEditProjectPage =
  pathname.startsWith("/admin/projects/") &&
  pathname.endsWith("/edit");

  const isProposalPreview =
    pathname.startsWith("/admin/projects/") &&
    pathname.endsWith("/proposal");

  const isInvoicePreview =
    pathname.startsWith("/admin/projects/") &&
    pathname.endsWith("/invoice");

  const isProjectDetail =
    pathname.startsWith("/admin/projects/") &&
    !pathname.endsWith("/proposal") &&
    !pathname.endsWith("/invoice") &&
    pathname !== "/admin/projects" &&
    pathname !== "/admin/projects/new";

  const isProjectProposalTab =
    isProjectDetail && currentTab === "proposal";
  const canWrite =
    userRole === "admin" ||
    userRole === "estimator" ||
    userRole === "operations_foreman";

  const projectPath = isProposalPreview
    ? `${pathname.replace("/proposal", "")}?tab=proposal`
    : isInvoicePreview
      ? `${pathname.replace("/invoice", "")}?tab=invoice`
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
      <aside className="admin-sidebar fixed left-0 top-0 z-50 hidden h-screen w-20 border-r border-white/10 bg-black/50 backdrop-blur-xl md:block print:hidden">
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
            href="/admin/daily-shop-report"
            active={isDailyShopReportPage}
            label="Daily Shop Report"
          >
            <ClipboardList className="h-6 w-6" aria-hidden="true" />
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

      <div className="md:ml-20 print:ml-0">
        <header className="admin-header sticky top-0 z-40 border-b border-white/10 bg-neutral-950 print:hidden md:bg-neutral-950/80 md:backdrop-blur-xl">
          <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 md:px-8 md:py-4">
            <div className="shrink-0">
              {isNewProjectPage && (
                <ReliableMobileLink
                  href="/admin/projects"
                  aria-label="Back to Projects"
                  title="Back to Projects"
                  className="inline-flex h-10 touch-manipulation items-center justify-center gap-2 rounded-xl border border-white/10 px-3 text-sm text-neutral-300 transition hover:bg-white/5 hover:text-white sm:px-4"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Back to Projects</span>
                </ReliableMobileLink>
              )}

              {isDailyShopReportSubpage && (
                <ReliableMobileLink
                  href="/admin/daily-shop-report"
                  aria-label="Back to Daily Shop Reports"
                  title="Back to Daily Shop Reports"
                  className="inline-flex h-10 touch-manipulation items-center justify-center gap-2 rounded-xl border border-white/10 px-3 text-sm text-neutral-300 transition hover:bg-white/5 hover:text-white sm:px-4"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">
                    Back to Daily Shop Reports
                  </span>
                </ReliableMobileLink>
              )}

              {isProjectDetail && (
                <ReliableMobileLink
                  href="/admin/projects"
                  aria-label="Back to Projects"
                  title="Back to Projects"
                  className="inline-flex h-10 touch-manipulation items-center justify-center gap-2 rounded-xl border border-white/10 px-3 text-sm text-neutral-300 transition hover:bg-white/5 hover:text-white sm:px-4"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Back to Projects</span>
                </ReliableMobileLink>
              )}

              {(isProposalPreview || isInvoicePreview) && (
                <ReliableMobileLink
                  href={projectPath}
                  aria-label="Back to Project"
                  title="Back to Project"
                  className="inline-flex h-10 touch-manipulation items-center justify-center gap-2 rounded-xl border border-white/10 px-3 text-sm text-neutral-300 transition hover:bg-white/5 hover:text-white sm:px-4"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Back to Project</span>
                </ReliableMobileLink>
              )}
            </div>

            <div className="flex min-w-0 flex-1 items-center justify-end gap-2 overflow-x-auto sm:gap-3">
              {canWrite && (isDashboardPage || isProjectsPage) && (
                <Link
                  href="/admin/projects/new"
                  className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#fb5411] px-4 text-sm font-semibold text-white transition hover:bg-[#e64d0f] sm:px-5"
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
              {userRole === "operations_foreman" &&
                isDailyShopReportIndex && (
                  <Link
                    href="/admin/daily-shop-report/new"
                    className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#fb5411] px-4 text-sm font-semibold text-white transition hover:bg-[#e64d0f] sm:px-5"
                  >
                    <ClipboardList className="h-4 w-4" aria-hidden="true" />
                    <span>Daily Shop Report</span>
                  </Link>
                )}
              

              {isNewProjectPage && (
                <button
                  type="submit"
                  form="new-project-form"
                  className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-[#fb5411] px-4 text-sm font-semibold text-white transition hover:bg-[#e64d0f] sm:px-5"
                >
                  Save Project
                </button>
              )}
{userRole === "admin" && isProjectDetail && !isProjectProposalTab && !isEditProjectPage &&  (
  <>
    <Link
      href={`${pathname}/edit`}
      aria-label="Edit Project"
      title="Edit Project"
      className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-white/10 px-3 text-sm font-semibold text-neutral-300 transition hover:bg-white/5 hover:text-white sm:px-5"
    >
      <Pencil className="h-4 w-4" aria-hidden="true" />
      <span className="hidden sm:inline">Edit Project</span>
    </Link>
    <DeleteProjectButton projectId={pathname.split("/").pop() || ""} />
  </>
)}
{userRole === "admin" && isEditProjectPage && (
  <button
    type="submit"
    form="edit-project-form"
    className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-[#fb5411] px-4 text-sm font-semibold text-white transition hover:bg-[#e64d0f] sm:px-5"
  >
    Save Changes
  </button>
)}

              {canWrite && isProjectProposalTab && (
                <button
                  type="submit"
                  form="proposal-form"
                  name="intent"
                  value="preview"
                  className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-[#fb5411] px-4 text-sm font-semibold text-white transition hover:bg-[#e64d0f] sm:px-5"
                >
                  Preview
                </button>
              )}

              {(isProposalPreview || isInvoicePreview) && (
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
  aria-label="Download PDF"
  title="Download PDF"
  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#fb5411] px-3 text-sm font-semibold text-white hover:bg-[#e64d0f] sm:px-5"
>
  <Download className="h-4 w-4" aria-hidden="true" />
  <span className="hidden sm:inline">Download PDF</span>
</Link>
  </>
)}
            </div>
          </div>
        </header>

        <main className="overflow-x-hidden px-4 pb-[calc(10rem+env(safe-area-inset-bottom))] pt-4 sm:px-6 md:px-8 md:pb-8 print:p-0 print:overflow-visible">
          {children}
        </main>
      </div>

      <nav
        aria-label="Admin navigation"
        className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-around border-t border-white/10 bg-neutral-950/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl md:hidden print:hidden"
      >
        <MobileNavLink
          href="/admin"
          active={pathname === "/admin"}
          label="Dashboard"
        >
          <LayoutDashboard className="h-5 w-5" aria-hidden="true" />
        </MobileNavLink>
        <MobileNavLink
          href="/admin/daily-shop-report"
          active={isDailyShopReportPage}
          label="Shop Report"
        >
          <ClipboardList className="h-5 w-5" aria-hidden="true" />
        </MobileNavLink>
        <MobileNavLink
          href="/admin/projects"
          active={pathname.startsWith("/admin/projects")}
          label="Projects"
        >
          <Hammer className="h-5 w-5" aria-hidden="true" />
        </MobileNavLink>
        <AdminProfileMenu
          email={userEmail}
          theme={theme}
          onToggleTheme={toggleTheme}
          mobile
        />
      </nav>
    </div>
  );
}

function MobileNavLink({
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
      className={`flex min-w-20 flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-xs transition ${
        active ? "text-[#fb5411]" : "text-neutral-400 hover:text-white"
      }`}
    >
      {children}
      <span>{label}</span>
    </Link>
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
