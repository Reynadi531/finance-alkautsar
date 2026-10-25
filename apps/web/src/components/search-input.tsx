import { cn } from "@keuangan-alkautsar/ui/lib/utils";
import { Search } from "lucide-react";
import { useEffect, useState, type ComponentProps } from "react";

/**
 * Search box for list toolbars. Typing is debounced before `onSearch` fires so URL-driven
 * lists don't refetch on every keystroke.
 */
export function SearchInput({
  value,
  onSearch,
  delay = 300,
  className,
  ...props
}: Omit<ComponentProps<"input">, "value" | "onChange" | "type"> & {
  value: string;
  onSearch: (value: string) => void;
  delay?: number;
}) {
  const [draft, setDraft] = useState(value);

  useEffect(() => setDraft(value), [value]);

  useEffect(() => {
    if (draft === value) return;
    const timer = setTimeout(() => onSearch(draft), delay);
    return () => clearTimeout(timer);
  }, [draft, value, delay, onSearch]);

  return (
    <div className={cn("relative min-w-0", className)}>
      <Search
        className="pointer-events-none absolute top-1/2 left-3.5 size-3.5 -translate-y-1/2 text-ink-subtle"
        aria-hidden
      />
      <input
        type="search"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        className="h-[38px] w-full rounded-lg border border-line bg-white pr-3 pl-9 text-[13px] text-ink outline-none placeholder:text-ink-subtle focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20"
        {...props}
      />
    </div>
  );
}
