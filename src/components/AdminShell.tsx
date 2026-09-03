"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowLeftRight,
  BriefcaseBusiness,
  CalendarDays,
  Hammer,
  LayoutDashboard,
  ClipboardList,
  Pencil,
} from "lucide-react";
import DeleteProjectButton from "@/components/DeleteProjectButton";
import DeleteBidOpportunityButton from "@/components/DeleteBidOpportunityButton";
import AdminProfileMenu from "@/components/AdminProfileMenu";
import ReliableMobileLink from "@/components/ReliableMobileLink";
import type { UserRole } from "@/lib/roles";
import PdfFileAction from "@/components/PdfFileAction";

export default function AdminShell({
  children,
  userEmail,
  userRole,
  projectNotificationCount = 0,
}: {
  children: React.ReactNode;
  userEmail?: string;
  userRole: UserRole;
  projectNotificationCount?: number;
}) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [workspaceSwitching, setWorkspaceSwitching] = useState(false);
  const viewportBaseline = useRef(0);
  const workspaceTimer = useRef<number | null>(null);
  const workspaceLogo = useRef<HTMLSpanElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentTab = searchParams.get("tab");

  const isDashboardPage = pathname === "/admin";
  const isProjectsPage = pathname === "/admin/projects";
  const isBidsPage = pathname.startsWith("/admin/bids");
  const isBidWorkspace = isBidsPage;
  const isNewBidPage = pathname === "/admin/bids/new";
  const isEditBidPage = isBidsPage && pathname.endsWith("/edit");
  const isBidDetailPage =
    isBidsPage && pathname !== "/admin/bids" && !isNewBidPage && !isEditBidPage;
  const bidOpportunityId = pathname.split("/")[3] || "";
  const isCalendarPage = pathname === "/admin/calendar";
  const isDailyShopReportPage = pathname.startsWith(
    "/admin/daily-shop-report"
  );
  const isDailyShopReportIndex = pathname === "/admin/daily-shop-report";
  const isDailyShopReportSubpage =
    isDailyShopReportPage && !isDailyShopReportIndex;
  const isDailyShopReportEditPage =
    isDailyShopReportPage && pathname.endsWith("/edit");
  const dailyShopReportBackPath = isDailyShopReportEditPage
    ? pathname.replace(/\/edit$/, "")
    : "/admin/daily-shop-report";
  const dailyShopReportBackLabel = isDailyShopReportEditPage
    ? "Back to Daily Shop Report"
    : "Back to Daily Shop Reports";
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

  const isReceiptPreview =
    pathname.startsWith("/admin/projects/") &&
    pathname.endsWith("/receipt");

  const isProjectDetail =
    pathname.startsWith("/admin/projects/") &&
    !pathname.endsWith("/proposal") &&
    !pathname.endsWith("/invoice") &&
    !pathname.endsWith("/receipt") &&
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
    : isReceiptPreview
      ? `${pathname.replace("/receipt", "")}?tab=close`
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

  useEffect(
    () => () => {
      if (workspaceTimer.current !== null) {
        window.clearTimeout(workspaceTimer.current);
      }
    },
    []
  );

  function switchWorkspace(href: string, animate = true) {
    if (workspaceSwitching) return;
    if (
      !animate ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      router.push(href);
      return;
    }

    setWorkspaceSwitching(true);
    workspaceLogo.current?.animate(
      [
        { transform: "rotateY(0deg) scale(1)" },
        { transform: "rotateY(180deg) scale(0.86)", offset: 0.5 },
        { transform: "rotateY(360deg) scale(1)" },
      ],
      {
        duration: 900,
        easing: "cubic-bezier(0.4, 0, 0.2, 1)",
        fill: "both",
      }
    );
    workspaceTimer.current = window.setTimeout(() => {
      workspaceTimer.current = null;
      setWorkspaceSwitching(false);
      router.push(href);
    }, 900);
  }

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    viewportBaseline.current = Math.max(window.innerHeight, viewport.height);

    const isEditableElement = (element: Element | null) => {
      if (element instanceof HTMLTextAreaElement) return true;
      if (element instanceof HTMLSelectElement) return true;
      if (!(element instanceof HTMLInputElement)) return false;
      return ![
        "button",
        "checkbox",
        "file",
        "hidden",
        "radio",
        "range",
        "reset",
        "submit",
      ].includes(element.type);
    };

    const updateKeyboardState = () => {
      const hasEditableFocus = isEditableElement(document.activeElement);
      if (!hasEditableFocus) {
        viewportBaseline.current = Math.max(
          viewportBaseline.current,
          window.innerHeight,
          viewport.height
        );
        setKeyboardOpen(false);
        return;
      }

      const coveredHeight = viewportBaseline.current - viewport.height;
      setKeyboardOpen(coveredHeight > 140);
    };

    const handleFocusChange = () => {
      window.setTimeout(updateKeyboardState, 50);
    };
    const handleWindowResize = () => {
      if (!isEditableElement(document.activeElement)) {
        viewportBaseline.current = Math.max(window.innerHeight, viewport.height);
      }
      updateKeyboardState();
    };

    viewport.addEventListener("resize", updateKeyboardState);
    viewport.addEventListener("scroll", updateKeyboardState);
    window.addEventListener("resize", handleWindowResize);
    document.addEventListener("focusin", handleFocusChange);
    document.addEventListener("focusout", handleFocusChange);

    return () => {
      viewport.removeEventListener("resize", updateKeyboardState);
      viewport.removeEventListener("scroll", updateKeyboardState);
      window.removeEventListener("resize", handleWindowResize);
      document.removeEventListener("focusin", handleFocusChange);
      document.removeEventListener("focusout", handleFocusChange);
    };
  }, []);

  function toggleTheme() {
    setTheme((currentTheme) => {
      const nextTheme = currentTheme === "dark" ? "light" : "dark";
      window.localStorage.setItem("admin-theme", nextTheme);
      return nextTheme;
    });
  }

  return (
    <div
      className="admin-shell min-h-dvh bg-neutral-950 text-white transition-colors"
      data-theme={theme}
      data-keyboard-open={keyboardOpen ? "true" : "false"}
    >
      <aside className="admin-sidebar fixed left-0 top-0 z-50 hidden h-screen w-20 border-r border-white/10 bg-black/50 backdrop-blur-xl md:block print:hidden">
        <div className="flex h-20 items-center justify-center border-b border-white/10">
          <Link href={isBidWorkspace ? "/admin/bids" : "/admin"} className="group [perspective:600px]">
            <span
              ref={workspaceLogo}
              className="block [transform-style:preserve-3d]"
            >
              <Image
                src="/images/paradise_ironworks_logo.png"
                alt="Projects"
                width={34}
                height={34}
                className="opacity-80 transition group-hover:opacity-100"
              />
            </span>
          </Link>
        </div>

        <nav className="flex flex-col items-center gap-4 p-4">
          {isBidWorkspace ? (
            <NavIcon href="/admin/bids" active label="Bid Opportunities">
              <BriefcaseBusiness className="h-6 w-6" aria-hidden="true" />
            </NavIcon>
          ) : (
            <>
              <NavIcon href="/admin" active={pathname === "/admin"} label="Dashboard">
                <LayoutDashboard className="h-6 w-6" aria-hidden="true" />
              </NavIcon>
              <NavIcon
                href="/admin/daily-shop-report"
                active={isDailyShopReportPage}
                label="Daily Shop Report"
              >
                <ClipboardList className="h-6 w-6" aria-hidden="true" />
              </NavIcon>
              <NavIcon href="/admin/calendar" active={isCalendarPage} label="Calendar">
                <CalendarDays className="h-6 w-6" aria-hidden="true" />
              </NavIcon>
              <NavIcon
                href="/admin/projects"
                active={pathname.startsWith("/admin/projects")}
                label="Projects"
                badgeCount={projectNotificationCount}
              >
                <Hammer className="h-6 w-6" aria-hidden="true" />
              </NavIcon>
            </>
          )}
        </nav>
        <WorkspaceSwitch
          isBidWorkspace={isBidWorkspace}
          switching={workspaceSwitching}
          onSwitch={switchWorkspace}
        />
        <AdminProfileMenu
          email={userEmail}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      </aside>

      <div className="md:ml-20 print:ml-0">
        <header className="admin-header sticky top-0 z-40 border-b border-white/10 bg-neutral-950 print:hidden md:bg-neutral-950/80 md:backdrop-blur-xl">
          <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 md:px-8 md:py-4">
            <div className="flex shrink-0 items-center gap-2">
              <div className="md:hidden">
                <div className="flex items-center gap-2">
                  {(isDashboardPage || pathname === "/admin/bids") && (
                    <AdminProfileMenu
                      email={userEmail}
                      theme={theme}
                      onToggleTheme={toggleTheme}
                      workspaceHref={isBidWorkspace ? "/admin" : "/admin/bids"}
                      workspaceLabel={
                        isBidWorkspace
                          ? "Switch to Operations"
                          : "Switch to Commercial Bids"
                      }
                      mobile
                      header
                    />
                  )}
                </div>
              </div>
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

              {isNewBidPage && (
                <ReliableMobileLink
                  href="/admin/bids"
                  aria-label="Back to Bid Opportunities"
                  title="Back to Bid Opportunities"
                  className="inline-flex h-10 touch-manipulation items-center justify-center gap-2 rounded-xl border border-white/10 px-3 text-sm text-neutral-300 transition hover:bg-white/5 hover:text-white sm:px-4"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Back to Bids</span>
                </ReliableMobileLink>
              )}

              {isBidDetailPage && (
                <ReliableMobileLink
                  href="/admin/bids"
                  aria-label="Back to Bid Opportunities"
                  title="Back to Bid Opportunities"
                  className="inline-flex h-10 touch-manipulation items-center justify-center gap-2 rounded-xl border border-white/10 px-3 text-sm text-neutral-300 transition hover:bg-white/5 hover:text-white sm:px-4"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Back to Bids</span>
                </ReliableMobileLink>
              )}

              {isEditBidPage && (
                <ReliableMobileLink
                  href={`/admin/bids/${bidOpportunityId}`}
                  aria-label="Back to Bid Opportunity"
                  title="Back to Bid Opportunity"
                  className="inline-flex h-10 touch-manipulation items-center justify-center gap-2 rounded-xl border border-white/10 px-3 text-sm text-neutral-300 transition hover:bg-white/5 hover:text-white sm:px-4"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Back to Bid</span>
                </ReliableMobileLink>
              )}

              {isDailyShopReportSubpage && (
                <ReliableMobileLink
                  href={dailyShopReportBackPath}
                  aria-label={dailyShopReportBackLabel}
                  title={dailyShopReportBackLabel}
                  className="inline-flex h-10 touch-manipulation items-center justify-center gap-2 rounded-xl border border-white/10 px-3 text-sm text-neutral-300 transition hover:bg-white/5 hover:text-white sm:px-4"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">
                    {dailyShopReportBackLabel}
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

              {(isProposalPreview || isInvoicePreview || isReceiptPreview) && (
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
              {isNewBidPage && (
                <button
                  type="submit"
                  form="new-bid-opportunity-form"
                  className="inline-flex h-10 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-[#fb5411] px-4 text-sm font-semibold text-white transition hover:bg-[#e64d0f] sm:px-5"
                >
                  Create Opportunity
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

              {(userRole === "admin" ||
                userRole === "bid_estimator" ||
                userRole === "project_manager") &&
                isBidDetailPage && (
                  <>
                    <Link
                      href={`${pathname}/edit`}
                      aria-label="Edit Bid Opportunity"
                      title="Edit Bid Opportunity"
                      className="inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/10 px-3 text-sm font-semibold text-neutral-300 transition hover:bg-white/5 hover:text-white sm:px-5"
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                      <span className="hidden sm:inline">Edit Opportunity</span>
                    </Link>
                    {userRole === "admin" && (
                      <DeleteBidOpportunityButton id={bidOpportunityId} />
                    )}
                  </>
                )}

              {isEditBidPage && (
                <button
                  type="submit"
                  form="edit-bid-opportunity-form"
                  className="inline-flex h-10 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-[#fb5411] px-4 text-sm font-semibold text-white transition hover:bg-[#e64d0f] sm:px-5"
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

              {(isProposalPreview || isInvoicePreview || isReceiptPreview) && (
  <>
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-xl border border-white/10 px-4 py-2 text-sm text-neutral-300 transition hover:bg-white/5 hover:text-white"
    >
      Print
    </button>

    <PdfFileAction
      href={`${pathname}/pdf`}
      label="Download PDF"
      compactLabel="PDF"
      className="rounded-xl bg-[#fb5411] px-3 text-sm font-semibold text-white hover:bg-[#e64d0f] sm:px-5"
    />
  </>
)}
            </div>
          </div>
        </header>

        <main
          className={`overflow-x-hidden px-4 pt-4 sm:px-6 md:px-8 md:pb-8 print:p-0 print:overflow-visible ${
            keyboardOpen
              ? "pb-6"
              : "pb-[calc(10rem+env(safe-area-inset-bottom))]"
          }`}
        >
          {children}
        </main>
      </div>

      <nav
        aria-label="Admin navigation"
        className={`fixed inset-x-0 bottom-0 z-50 items-center justify-around border-t border-white/10 bg-neutral-950/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl md:hidden print:hidden ${
          keyboardOpen ? "hidden" : "flex"
        }`}
      >
        {isBidWorkspace ? (
          <MobileNavLink href="/admin/bids" active label="Bid Opportunities">
            <BriefcaseBusiness className="h-5 w-5" aria-hidden="true" />
          </MobileNavLink>
        ) : (
          <>
            <MobileNavLink href="/admin" active={pathname === "/admin"} label="Dashboard">
              <LayoutDashboard className="h-5 w-5" aria-hidden="true" />
            </MobileNavLink>
            <MobileNavLink
              href="/admin/daily-shop-report"
              active={isDailyShopReportPage}
              label="Shop Report"
            >
              <ClipboardList className="h-5 w-5" aria-hidden="true" />
            </MobileNavLink>
            <MobileNavLink href="/admin/calendar" active={isCalendarPage} label="Calendar">
              <CalendarDays className="h-5 w-5" aria-hidden="true" />
            </MobileNavLink>
            <MobileNavLink
              href="/admin/projects"
              active={pathname.startsWith("/admin/projects")}
              label="Projects"
              badgeCount={projectNotificationCount}
            >
              <Hammer className="h-5 w-5" aria-hidden="true" />
            </MobileNavLink>
          </>
        )}
      </nav>
    </div>
  );
}

function WorkspaceSwitch({
  isBidWorkspace,
  switching,
  onSwitch,
  mobile = false,
}: {
  isBidWorkspace: boolean;
  switching: boolean;
  onSwitch: (href: string, animate?: boolean) => void;
  mobile?: boolean;
}) {
  const href = isBidWorkspace ? "/admin" : "/admin/bids";
  const label = isBidWorkspace
    ? "Switch to Operations"
    : "Switch to Commercial Bids";

  return (
    <Link
      href={href}
      onClick={(event) => {
        event.preventDefault();
        onSwitch(href, !mobile);
      }}
      aria-label={label}
      aria-disabled={switching}
      title={label}
      className={
        mobile
          ? "inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-neutral-400 transition hover:bg-white/10 hover:text-white"
          : "absolute bottom-20 left-4 flex h-12 w-12 cursor-pointer items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-neutral-300 transition hover:border-[#fb5411]/40 hover:bg-[#fb5411]/15 hover:text-[#fb5411]"
      }
    >
      <ArrowLeftRight className={mobile ? "h-5 w-5" : "h-6 w-6"} aria-hidden="true" />
    </Link>
  );
}

function MobileNavLink({
  href,
  active,
  label,
  children,
  badgeCount = 0,
}: {
  href: string;
  active?: boolean;
  label: string;
  children: React.ReactNode;
  badgeCount?: number;
}) {
  return (
    <Link
      href={href}
      className={`relative flex min-h-12 min-w-16 flex-col items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-[11px] transition sm:min-w-20 sm:px-3 sm:text-xs ${
        active ? "text-[#fb5411]" : "text-neutral-400 hover:text-white"
      }`}
    >
      {children}
      {badgeCount > 0 && <NotificationBadge count={badgeCount} mobile />}
      <span>{label}</span>
    </Link>
  );
}

function NavIcon({
  href,
  active,
  label,
  children,
  badgeCount = 0,
}: {
  href: string;
  active?: boolean;
  label: string;
  children: React.ReactNode;
  badgeCount?: number;
}) {
  return (
    <Link
      href={href}
      title={label}
      className={`group relative flex h-12 w-12 items-center justify-center rounded-2xl border transition ${
        active
          ? "border-[#fb5411]/40 bg-[#fb5411]/15"
          : "border-white/10 bg-white/[0.03] hover:bg-white/10"
      }`}
    >
      {children}
      {badgeCount > 0 && <NotificationBadge count={badgeCount} />}
    </Link>
  );
}

function NotificationBadge({
  count,
  mobile = false,
}: {
  count: number;
  mobile?: boolean;
}) {
  return (
    <span
      aria-label={`${count} new notification${count === 1 ? "" : "s"}`}
      className={`absolute inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-5 text-white shadow ${
        mobile ? "right-3 top-0" : "-right-1.5 -top-1.5"
      }`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
