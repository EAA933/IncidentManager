'use client'; import React,{useState} from 'react';
export default function IncidentForm(){ const[loading,setLoading]=useState(false); const[error,setError]=useState<string|null>(null);
async function onSubmit(e:React.FormEvent<HTMLFormElement>){ e.preventDefault(); setLoading(true); setError(null); const form=e.currentTarget; const data=Object.fromEntries(new FormData(form).entries());
 try{ const res=await fetch('/api/incidents',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}); if(!res.ok) throw new Error(await res.text()); const {id}=await res.json(); window.location.href=`/incidents/${id}`;}catch(err:any){setError(err.message||'Error')}finally{setLoading(false)}}
 return (<form onSubmit={onSubmit} className="space-y-4 card">
  <div className="grid md:grid-cols-2 gap-3">
    <input className="input" name="title" placeholder="Título" required/>
    <input className="input" name="reporterName" placeholder="Quién reportó" required/>
    <input className="input" name="correspondent" placeholder="Corresponsal" required/>
    <input className="input" name="area" placeholder="Área" required/>
    <input className="input" name="controlOwner" placeholder="Quien de Control ayuda" required/>
    <input className="input" name="date" type="date" required/>
    <select name="status" className="select" defaultValue="OPEN">
      <option value="OPEN">OPEN</option><option value="IN_PROGRESS">IN_PROGRESS</option><option value="ON_HOLD">ON_HOLD</option><option value="RESOLVED">RESOLVED</option><option value="CLOSED">CLOSED</option>
    </select>
  </div>
  <textarea className="textarea" name="description" rows={4} placeholder="Descripción detallada" required/>
  <textarea className="textarea" name="nextSteps" rows={3} placeholder="Siguientes pasos"/>
  {error && <p className="text-red-600">{error}</p>}
  <button className="btn" disabled={loading}>{loading?'Guardando...':'Crear incidencia'}</button>
 </form>); }