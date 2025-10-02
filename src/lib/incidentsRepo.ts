import { db, type Incident } from './idb';

export async function listIncidents(): Promise<Incident[]> {
  return db.incidents.orderBy('createdAt').reverse().toArray();
}

export async function createIncident(data: Omit<Incident, 'id'|'createdAt'|'updatedAt'>) {
  const now = Date.now();
  const id = await db.incidents.add({ ...data, createdAt: now, updatedAt: now });
  return db.incidents.get(id);
}

export async function updateIncident(id: number, patch: Partial<Incident>) {
  await db.incidents.update(id, { ...patch, updatedAt: Date.now() });
  return db.incidents.get(id);
}

export async function deleteIncident(id: number) {
  return db.incidents.delete(id);
}

export async function exportAll(): Promise<string> {
  const all = await db.incidents.toArray();
  return JSON.stringify(all, null, 2);
}

export async function importFromJson(jsonText: string) {
  const parsed = JSON.parse(jsonText) as Incident[];
  // normalize timestamps and remove id to avoid conflicts (Dexie autoincrement)
  const cleaned = parsed.map(p => ({
    title: p.title,
    status: p.status,
    severity: p.severity,
    description: p.description,
    createdAt: p.createdAt ?? Date.now(),
    updatedAt: p.updatedAt ?? Date.now()
  }));
  await db.incidents.bulkAdd(cleaned as any);
}
