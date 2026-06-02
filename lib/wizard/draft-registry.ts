type SaveFn = () => Promise<void>;

const handlers = new Set<SaveFn>();

export function registerWizardDraftSave(fn: SaveFn): () => void {
  handlers.add(fn);
  return () => handlers.delete(fn);
}

export async function flushWizardDrafts(): Promise<void> {
  await Promise.all([...handlers].map((fn) => fn()));
}
