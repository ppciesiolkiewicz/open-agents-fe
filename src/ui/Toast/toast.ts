export type ToastEntry = {
  id: string;
  message: string;
  duration: number;
};

type Listener = (toasts: ToastEntry[]) => void;

let entries: ToastEntry[] = [];
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((l) => l(entries));
}

export function toast(message: string, duration = 2000) {
  const id = Math.random().toString(36).slice(2);
  entries = [...entries, { id, message, duration }];
  notify();
}

export function dismissToast(id: string) {
  entries = entries.filter((e) => e.id !== id);
  notify();
}

export function subscribeToasts(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getToasts() {
  return entries;
}
