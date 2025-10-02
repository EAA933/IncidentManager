// app/incidents/page.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { listIncidents, createIncident, updateIncident, deleteIncident, exportAll, importFromJson } from '@/src/lib/incidentsRepo';
import type { Incident } from '@/src/lib/idb';
import * as XLSX from 'xlsx';

type Status = Incident['status'];
type Severity = Incident['severity'];

const STATUS: Status[] = ['open', 'in_progress', 'closed'];
const SEVERITY: Severity[] = ['low', 'medium', 'high', 'critical'];

export default function IncidentsPage() {
  const [items, setItems] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  // Campos previos
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<Status>('open');
  const [severity, setSeverity] = useState<Severity>('medium');
  const [description, setDescription] = useState('');

  // Nuevos campos
  const [nombre, setNombre] = useState('');
  const [discoveryDate, setDiscoveryDate] = useState<string>(''); // ISO yyyy-mm-dd
  const [lossAmount, setLossAmount] = useState<string>('');
  const [esFinanciero, setEsFinanciero] = useState<boolean>(true);
  const [causaRaiz, setCausaRaiz] = useState('');
  const [corresponsal, setCorresponsal] = useState('');
  const [acompanaCI, setAcompanaCI] = useState('');
  const [area, setArea] = useState('');

  const [filterStatus, setFilterStatus] = useState<Status | 'all'>('all');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingDesc, setEditingDesc] = useState<string>('');
  const [filterSeverity, setFilterSeverity] = useState<Severity | 'all'>('all');
  const fileRef = useRef<HTMLInputElement|null>(null);
  const fileExcelRef = useRef<HTMLInputElement|null>(null);

  useEffect(() => {
    (async () => {
      await reload();
    })();
  }, []);

  const filtered = useMemo(() => {
    return items.filter(it => {
      if (filterStatus !== 'all' && it.status !== filterStatus) return false;
      if (filterSeverity !== 'all' && it.severity !== filterSeverity) return false;
      return true;
    });
  }, [items, filterStatus, filterSeverity]);


  function startEdit(id?: number, desc?: string) {
    if (!id) return;
    setEditingId(id);
    setEditingDesc(desc ?? '');
  }

  async function saveEdit() {
    if (!editingId) return;
    await updateIncident(editingId, { description: editingDesc });
    setEditingId(null);
    setEditingDesc('');
    await reload();
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingDesc('');
  }


  async function reload() {
    setLoading(true);
    setItems(await listIncidents());
    setLoading(false);
  }

  function toTimestamp(dateStr: string | undefined) {
    if (!dateStr) return undefined;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return undefined;
    return d.getTime();
    }

  function formatDate(ts?: number) {
    if (!ts) return '';
    const d = new Date(ts);
    const y = d.getFullYear();
    const m = String(d.getMonth()+1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  }

  async function addIncident(evt?: React.FormEvent) {
    evt?.preventDefault();
    const now = Date.now();
    await createIncident({
      title: title || nombre || 'Incidente',
      status,
      severity,
      description,
      nombre,
      discoveryDate: toTimestamp(discoveryDate) ?? now,
      lossAmount: lossAmount ? Number(lossAmount) : undefined,
      esFinanciero,
      causaRaiz,
      corresponsal,
      acompanaCI,
      area
    });
    // reset
    setTitle(''); setStatus('open'); setSeverity('medium'); setDescription('');
    setNombre(''); setDiscoveryDate(''); setLossAmount(''); setEsFinanciero(true);
    setCausaRaiz(''); setCorresponsal(''); setAcompanaCI(''); setArea('');
    await reload();
  }

  async function cycleStatus(id?: number, current?: Status) {
    if (!id || !current) return;
    const nextIdx = (STATUS.indexOf(current) + 1) % STATUS.length;
    await updateIncident(id, { status: STATUS[nextIdx] });
    await reload();
  }

  async function remove(id?: number) {
    if (!id) return;
    await deleteIncident(id);
    await reload();
  }

  // ===== JSON export/import (se conserva) =====
  async function doExportJSON() {
    const text = await exportAll();
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `incidentes-${new Date().toISOString().slice(0,19)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function doImportJSON(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    await importFromJson(text);
    await reload();
    if (fileRef.current) fileRef.current.value = '';
  }

  // ===== Excel export/import =====
  function toExcelHeader(item: Incident) {
    return {
      'Nombre': item.nombre ?? '',
      'Descripción': item.description ?? '',
      'Discovery Date': formatDate(item.discoveryDate),
      'Monto de Pérdida': item.lossAmount ?? '',
      'Financiero': item.esFinanciero ? 'Sí' : 'No',
      'Causa Raíz': item.causaRaiz ?? '',
      'Corresponsal': item.corresponsal ?? '',
      'Acompaña CI': item.acompanaCI ?? '',
      'Área': item.area ?? '',
      'Estado': item.status,
      'Severidad': item.severity,
      'Título (interno)': item.title ?? ''
    };
  }

  function fromExcelRow(row: any): Partial<Incident> {
    // Aceptamos variaciones comunes de encabezados
    const boolFin = (row['Financiero'] ?? row['financiero'] ?? '').toString().toLowerCase();
    const finVal = boolFin === 'si' || boolFin === 'sí' || boolFin === 'true' || boolFin === '1' || boolFin === 'x';

    const fecha = row['Discovery Date'] || row['Fecha Descubrimiento'] || row['Discovery'];
    let ts: number | undefined;
    if (fecha instanceof Date) ts = fecha.getTime();
    else if (typeof fecha === 'string' && fecha.trim()) ts = new Date(fecha).getTime();

    const estado = (row['Estado'] ?? 'open').toString() as Status;
    const severidad = (row['Severidad'] ?? 'medium').toString() as Severity;

    const monto = row['Monto de Pérdida'] ?? row['Monto'] ?? '';
    const montoNum = typeof monto === 'number' ? monto : (monto ? Number(String(monto).replace(/[^0-9.-]/g,'')) : undefined);

    return {
      title: (row['Título (interno)'] ?? row['Titulo'] ?? row['Título'] ?? row['Nombre'] ?? 'Incidente').toString(),
      description: (row['Descripción'] ?? '').toString(),
      nombre: (row['Nombre'] ?? '').toString(),
      discoveryDate: ts && !isNaN(ts) ? ts : undefined,
      lossAmount: (montoNum != null ? Number(montoNum) : undefined),
      esFinanciero: finVal,
      causaRaiz: (row['Causa Raíz'] ?? row['Causa raiz'] ?? row['CausaRaiz'] ?? '').toString(),
      corresponsal: (row['Corresponsal'] ?? '').toString(),
      acompanaCI: (row['Acompaña CI'] ?? row['Quien CI'] ?? '').toString(),
      area: (row['Área'] ?? row['Area'] ?? '').toString(),
      status: STATUS.includes(estado) ? estado : 'open',
      severity: SEVERITY.includes(severidad) ? severidad : 'medium',
    } as Partial<Incident>;
  }

  async function doExportExcel() {
    const rows = items.map(toExcelHeader);
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Incidentes');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `incidentes-${new Date().toISOString().slice(0,19)}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function doImportExcel(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const data = await file.arrayBuffer();
    const wb = XLSX.read(data);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { raw: true });
    // Transform and import via JSON importer (reusing repo bulkAdd)
    const incidents = rows.map(fromExcelRow);
    // Build JSON for importFromJson (expects Incident[]-like)
    const normalized = incidents.map(p => ({
      title: p.title ?? 'Incidente',
      status: (p.status ?? 'open') as Status,
      severity: (p.severity ?? 'medium') as Severity,
      description: p.description ?? '',
      nombre: p.nombre ?? '',
      discoveryDate: p.discoveryDate ?? Date.now(),
      lossAmount: p.lossAmount ?? undefined,
      esFinanciero: p.esFinanciero ?? true,
      causaRaiz: p.causaRaiz ?? '',
      corresponsal: p.corresponsal ?? '',
      acompanaCI: p.acompanaCI ?? '',
      area: p.area ?? '',
      createdAt: Date.now(),
      updatedAt: Date.now()
    }));
    await importFromJson(JSON.stringify(normalized));
    await reload();
    if (fileExcelRef.current) fileExcelRef.current.value = '';
  }

  if (loading) return <div className="p-6">Cargando…</div>;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Incidentes (Local en este dispositivo)</h1>
        <div className="flex items-center gap-2">
          <button onClick={doExportExcel} className="px-3 py-2 rounded bg-green-700 text-white">Exportar Excel</button>
          <label className="px-3 py-2 rounded border cursor-pointer">
            Importar Excel
            <input ref={fileExcelRef} onChange={doImportExcel} type="file" accept=".xlsx,.xls" className="hidden" />
          </label>
          <button onClick={doExportJSON} className="px-3 py-2 rounded bg-gray-800 text-white">Exportar JSON</button>
          <label className="px-3 py-2 rounded border cursor-pointer">
            Importar JSON
            <input ref={fileRef} onChange={doImportJSON} type="file" accept="application/json" className="hidden" />
          </label>
        </div>
      </header>

      <form onSubmit={addIncident} className="grid grid-cols-1 md:grid-cols-4 gap-3 border rounded p-4">
        {/* Diseño previo con nuevos campos */}
        <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre" className="border rounded p-2 md:col-span-2" />
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Título interno (opcional)" className="border rounded p-2 md:col-span-2" />
        <input value={discoveryDate} onChange={e => setDiscoveryDate(e.target.value)} type="date" placeholder="Discovery Date" className="border rounded p-2" />
        <input value={lossAmount} onChange={e => setLossAmount(e.target.value)} placeholder="Monto de pérdida" className="border rounded p-2" />
        <select value={String(esFinanciero)} onChange={e => setEsFinanciero(e.target.value === 'true')} className="border rounded p-2">
          <option value="true">Financiero</option>
          <option value="false">No financiero</option>
        </select>
        <input value={area} onChange={e => setArea(e.target.value)} placeholder="Área" className="border rounded p-2" />

        <input value={corresponsal} onChange={e => setCorresponsal(e.target.value)} placeholder="Corresponsal" className="border rounded p-2" />
        <input value={acompanaCI} onChange={e => setAcompanaCI(e.target.value)} placeholder="Quién de Control Interno me acompaña" className="border rounded p-2 md:col-span-2" />
        <input value={causaRaiz} onChange={e => setCausaRaiz(e.target.value)} placeholder="Causa raíz" className="border rounded p-2" />

        <select value={status} onChange={e => setStatus(e.target.value as Status)} className="border rounded p-2">
          {STATUS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={severity} onChange={e => setSeverity(e.target.value as Severity)} className="border rounded p-2">
          {SEVERITY.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Descripción" className="border rounded p-2 md:col-span-4" />
        <div className="md:col-span-4 flex justify-end">
          <button type="submit" className="px-3 py-2 rounded bg-blue-600 text-white">Agregar</button>
        </div>
      </form>

      <section className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Estado</span>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} className="border rounded p-1">
            <option value="all">Todos</option>
            {STATUS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Severidad</span>
          <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value as any)} className="border rounded p-1">
            <option value="all">Todas</option>
            {SEVERITY.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </section>

      <ul className="space-y-2">
        {filtered.map(it => (
          <li key={it.id} className="border rounded p-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-medium break-words">{it.nombre || it.title}</div>
              <div className="text-sm text-gray-500 space-x-2">
                <span>{new Date(it.createdAt).toLocaleString()}</span>
                <span>• <strong>{it.status}</strong></span>
                <span>• {it.severity}</span>
              </div>
              <div className="text-sm text-gray-600 space-x-3 mt-1">
                {it.discoveryDate && <span>Descubierto: {formatDate(it.discoveryDate)}</span>}
                {'lossAmount' in it && it.lossAmount !== undefined && <span>Pérdida: {new Intl.NumberFormat().format(it.lossAmount as number)}</span>}
                {'esFinanciero' in it && <span>{it.esFinanciero ? 'Financiero' : 'No financiero'}</span>}
              </div>
              <div className="text-sm text-gray-600 space-x-3 mt-1">
                {it.area && <span>Área: {it.area}</span>}
                {it.corresponsal && <span>Corresponsal: {it.corresponsal}</span>}
                {it.acompanaCI && <span>CI: {it.acompanaCI}</span>}
                {it.causaRaiz && <span>Causa: {it.causaRaiz}</span>}
              </div>
              {editingId === it.id ? (
                <div className="mt-2 space-y-2">
                  <textarea
                    value={editingDesc}
                    onChange={e => setEditingDesc(e.target.value)}
                    className="border rounded p-2 w-full text-sm"
                    rows={3}
                    placeholder="Editar descripción"
                  />
                  <div className="flex gap-2">
                    <button onClick={saveEdit} className="px-2 py-1 rounded bg-blue-600 text-white">Guardar</button>
                    <button onClick={cancelEdit} className="px-2 py-1 border rounded">Cancelar</button>
                  </div>
                </div>
              ) : (
                it.description ? <p className="text-sm mt-2 whitespace-pre-wrap break-words">{it.description}</p> : null
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => cycleStatus(it.id, it.status)} className="px-2 py-1 border rounded">Cambiar estado</button>
              {editingId === it.id ? null : (<button onClick={() => startEdit(it.id, it.description)} className="px-2 py-1 border rounded">Editar desc.</button>)}
              <button onClick={() => remove(it.id)} className="px-2 py-1 border rounded">Eliminar</button>
            </div>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="text-sm text-gray-500">Sin incidentes para los filtros actuales.</li>
        )}
      </ul>
    </div>
  );
}
