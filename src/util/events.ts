type Handler = (...args: unknown[]) => void;

export class EventBus {
  private map = new Map<string, Set<Handler>>();

  on(event: string, fn: Handler): () => void {
    let set = this.map.get(event);
    if (!set) {
      set = new Set();
      this.map.set(event, set);
    }
    set.add(fn);
    return () => set!.delete(fn);
  }

  emit(event: string, ...args: unknown[]): void {
    this.map.get(event)?.forEach((fn) => fn(...args));
  }
}

export const bus = new EventBus();
