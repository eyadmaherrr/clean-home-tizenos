import { createElement, useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { focusManager, type FocusAction, type TvKeyDetail } from "../../platform/remote/FocusManager";

interface Props {
  id: string;
  group?: string;
  className?: string;
  style?: CSSProperties;
  /** Focused when the screen opens with nothing remembered. */
  isDefault?: boolean;
  disabled?: boolean;
  /** Activation (OK / Enter, or a mouse click in the browser). */
  onSelect?: () => void;
  /** Consume a key before focus moves; return true when handled. */
  onKey?: (action: FocusAction) => boolean;
  onFocus?: () => void;
  as?: "div" | "button" | "li";
  children?: ReactNode;
  label?: string;
}

/** A remote-focusable element. Focus styling comes from the `:focus` CSS of each component. */
export function Focusable({ id, group, className, style, isDefault, disabled, onSelect, onKey, onFocus, as = "div", children, label }: Props) {
  const ref = useRef<HTMLElement | null>(null);
  const keyRef = useRef(onKey);
  keyRef.current = onKey;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fn = (e: Event) => {
      const action = (e as CustomEvent<TvKeyDetail>).detail.action;
      if (keyRef.current && keyRef.current(action)) e.preventDefault();
    };
    el.addEventListener("tvkey", fn);
    return () => el.removeEventListener("tvkey", fn);
  }, []);

  return createElement(as, {
    ref,
    className: "focusable" + (className ? " " + className : ""),
    style,
    tabIndex: -1,
    role: "button",
    "aria-label": label,
    "aria-disabled": disabled ? "true" : undefined,
    "data-focusable": "",
    "data-focus-id": id,
    "data-focus-group": group,
    "data-focus-default": isDefault ? "" : undefined,
    onClick: () => { if (!disabled && onSelect) onSelect(); },
    onFocus,
    // Mouse support for development in a desktop browser.
    onMouseEnter: () => { if (ref.current) focusManager.focus(ref.current); },
  }, children);
}
