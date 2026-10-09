import { LinkIcon } from "./icons";

/** A product link as she would send it. The caller sets the colors and the text. */
export function LinkPill({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <p
      className={`flex min-h-12 max-w-full items-center gap-2.5 rounded-full px-5 text-[0.9375rem] ${className}`}
    >
      <LinkIcon className="size-4 shrink-0" />
      {children}
    </p>
  );
}
