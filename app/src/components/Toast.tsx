import { createStore, useStore } from "../state/store";

const toastStore = createStore<{ text: string; id: number }>({ text: "", id: 0 });
let timer = 0;

/** Short confirmation at the bottom of the screen ("Bookmarked", "Reciter: …"). */
export function toast(text: string): void {
  toastStore.set({ text, id: toastStore.get().id + 1 });
  window.clearTimeout(timer);
  timer = window.setTimeout(() => toastStore.set({ text: "" }), 2200);
}

export function Toast() {
  const text = useStore(toastStore, (s) => s.text);
  return <div className={"toast" + (text ? " show" : "")}>{text}</div>;
}
