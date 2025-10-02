import Dexie, { Table } from 'dexie';

export interface Incident {
  id?: number;
  // Campos previos
  title: string;
  status: 'open' | 'in_progress' | 'closed';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description?: string;
  createdAt: number;
  updatedAt: number;
  // Campos solicitados
  nombre?: string;
  discoveryDate?: number;      // timestamp (Date.now())
  lossAmount?: number;         // monto de pérdida
  esFinanciero?: boolean;      // true = financiero, false = no financiero
  causaRaiz?: string;
  corresponsal?: string;
  acompanaCI?: string;         // "Quién de Control Interno me acompaña"
  area?: string;
}

class IncidentDB extends Dexie {
  incidents!: Table<Incident, number>;
  constructor() {
    super('incident-manager');
    this.version(1).stores({
      incidents: '++id, status, severity, createdAt, discoveryDate, area, esFinanciero'
    });
  }
}

export const db = new IncidentDB();
