"use client";

import { useId, useMemo, useState } from "react";

export default function CustomerNameField({
  names,
  defaultValue = "",
  label,
  required = false,
}: {
  names: string[];
  defaultValue?: string | null;
  label: string;
  required?: boolean;
}) {
  const listId = useId();
  const [value, setValue] = useState(defaultValue || "");
  const [focused, setFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const query = value.trim().toLocaleLowerCase();
  const matches = useMemo(() => {
    if (!query) return [];
    return names
      .filter((name) => name.toLocaleLowerCase().includes(query))
      .sort((a, b) => {
        const aStarts = a.toLocaleLowerCase().startsWith(query);
        const bStarts = b.toLocaleLowerCase().startsWith(query);
        return Number(bStarts) - Number(aStarts) || a.localeCompare(b);
      })
      .slice(0, 8);
  }, [names, query]);
  const open = focused && matches.length > 0;

  function choose(name: string) {
    setValue(name);
    setFocused(false);
    setActiveIndex(-1);
  }

  return <div className="relative">
    <label htmlFor={listId} className="mb-2 block text-sm text-neutral-300">{label}</label>
    <input
      id={listId}
      name="customer_name"
      type="text"
      autoComplete="off"
      required={required}
      value={value}
      role="combobox"
      aria-autocomplete="list"
      aria-expanded={open}
      aria-controls={`${listId}-options`}
      aria-activedescendant={open && activeIndex >= 0 ? `${listId}-option-${activeIndex}` : undefined}
      onFocus={() => setFocused(true)}
      onBlur={() => { setFocused(false); setActiveIndex(-1); }}
      onChange={(event) => { setValue(event.target.value); setFocused(true); setActiveIndex(-1); }}
      onKeyDown={(event) => {
        if (event.key === "Escape") { setFocused(false); setActiveIndex(-1); return; }
        if (!open) return;
        if (event.key === "ArrowDown") { event.preventDefault(); setActiveIndex((index) => Math.min(index + 1, matches.length - 1)); }
        if (event.key === "ArrowUp") { event.preventDefault(); setActiveIndex((index) => Math.max(index - 1, 0)); }
        if (event.key === "Enter" && activeIndex >= 0) { event.preventDefault(); choose(matches[activeIndex]); }
      }}
      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#fb5411]"
    />
    {open && <ul id={`${listId}-options`} role="listbox" className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-xl border border-white/15 bg-neutral-900 p-1 text-sm text-white shadow-xl">
      {matches.map((name, index) => <li key={name} id={`${listId}-option-${index}`} role="option" aria-selected={index === activeIndex}>
        <button type="button" onPointerDown={(event) => event.preventDefault()} onClick={() => choose(name)} className={`w-full rounded-lg px-3 py-2 text-left ${index === activeIndex ? "bg-[#fb5411] text-white" : "hover:bg-white/10"}`}>{name}</button>
      </li>)}
    </ul>}
  </div>;
}
