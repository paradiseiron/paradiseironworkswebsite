"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function EditProjectForm({ project }: { project: any }) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);

    const body = Object.fromEntries(formData.entries());

    const response = await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const data = await response.json();
      setErrorMessage(data.error || "Project update failed.");
      return;
    }

    router.push(`/admin/projects/${project.id}`);
    router.refresh();
  }

  return (
    <form
      id="edit-project-form"
      onSubmit={handleSubmit}
      className="mt-8 space-y-8"
    >
      {errorMessage && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {errorMessage}
        </div>
      )}

      <section>
        <h2 className="mb-5 text-xl font-semibold">Contact Info</h2>

        <div className="grid gap-5 md:grid-cols-2">
          <Field
            label="Customer / Company"
            name="customer_name"
            defaultValue={project.customer_name}
          />

          <Field
            label="Contact Name"
            name="contact_name"
            defaultValue={project.contact_name}
          />

          <Field label="Phone" name="phone" defaultValue={project.phone} />

          <Field
            label="Email"
            name="email"
            type="email"
            defaultValue={project.email}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-5 text-xl font-semibold">Project Location</h2>

        <div className="grid gap-5 md:grid-cols-2">
          <Field
            label="Address"
            name="project_address"
            defaultValue={project.project_address}
          />

          <Field label="City" name="city" defaultValue={project.city} />

          <Field label="State" name="state" defaultValue={project.state} />

          <Field
            label="Zip Code"
            name="zip_code"
            defaultValue={project.zip_code}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-5 text-xl font-semibold">Project Details</h2>

        <div className="grid gap-5 md:grid-cols-2">
          <Select
            label="Project Category"
            name="project_category"
            defaultValue={project.project_category}
            options={[
              ["residential", "Residential"],
              ["commercial", "Commercial"],
            ]}
          />

          <Field
            label="Project Type"
            name="project_type"
            defaultValue={project.project_type}
          />

          <Field
            label="Lead Source"
            name="lead_source"
            defaultValue={project.lead_source}
          />

          <Select
            label="Priority"
            name="priority"
            defaultValue={project.priority || "normal"}
            options={[
              ["low", "Low"],
              ["normal", "Normal"],
              ["high", "High"],
              ["urgent", "Urgent"],
            ]}
          />

          <Field
            label="Assigned To"
            name="assigned_to"
            defaultValue={project.assigned_to}
          />
        </div>
      </section>

      <section>
        <label className="mb-2 block text-sm text-neutral-400">Notes</label>

        <textarea
          name="notes"
          defaultValue={project.notes || ""}
          rows={5}
          className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none focus:border-[#fb5411]"
        />
      </section>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue = "",
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | number | null;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm text-neutral-400">{label}</label>

      <input
        name={name}
        type={type}
        defaultValue={defaultValue || ""}
        className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none focus:border-[#fb5411]"
      />
    </div>
  );
}

function Select({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  options: [string, string][];
}) {
  return (
    <div>
      <label className="mb-2 block text-sm text-neutral-400">{label}</label>

      <div className="relative">
        <select
          name={name}
          defaultValue={defaultValue || ""}
          className="w-full appearance-none rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 pr-12 text-white outline-none focus:border-[#fb5411]"
        >
          {options.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-neutral-500">
          ⌄
        </div>
      </div>
    </div>
  );
}