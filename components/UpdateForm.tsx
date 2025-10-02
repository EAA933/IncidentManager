'use client'; import React,{useState} from 'react';
export default function UpdateForm({id}:{id:string}){ const[loading,setLoading]=useState(false); const[error,setError]=useState<string|null>(null);
 async function submit(e:React.FormEvent<HTMLFormElement>){ e.preventDefault(); setLoading(true); setError(null); const form=e.currentTarget; const data=Object.fromEntries(new FormData(form).entries());
  try{ const res=await fetch(`/api/incidents/${id}/updates`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}); if(!res.ok) throw new Error(await res.text()); (form as any).reset(); window.location.reload(); }
  catch(e:any){ setError(e.message||'Error'); } finally{ setLoading(false); } }
 return (<form onSubmit={submit} className="space-y-2">
  <textarea className="textarea" name="note" rows={3} placeholder="Nota / siguiente paso..." required/>
  <div className="grid md:grid-cols-3 gap-2">
    <input className="input" name="author" placeholder="Autor (quien actualiza)" required/>
    <select name="status" className="select">
      <option value="">(sin cambio)</option><option value="OPEN">OPEN</option><option value="IN_PROGRESS">IN_PROGRESS</option><option value="ON_HOLD">ON_HOLD</option><option value="RESOLVED">RESOLVED</option><option value="CLOSED">CLOSED</option>
    </select>
    <button className="btn" disabled={loading}>{loading?'Guardando...':'Añadir actualización'}</button>
  </div>
  {error && <p className="text-red-600">{error}</p>}
 </form>); }