import { prisma } from "@/lib/prisma"; import StatusBadge from "@/components/StatusBadge"; import FileUpload from "@/components/FileUpload"; import UpdateForm from "@/components/UpdateForm";
type Status='OPEN'|'IN_PROGRESS'|'ON_HOLD'|'RESOLVED'|'CLOSED';
type Update={id:string; note:string; status:Status|null; createdAt:Date|string; author:string;};
type Attachment={id:string; fileName:string; fileUrl:string; uploadedAt:Date|string; uploadedBy:string;};
type Incident={id:string; title:string; description:string; date:Date|string; reporterName:string; correspondent:string; area:string; status:Status; controlOwner:string; nextSteps?:string|null; updates:Update[]; attachments:Attachment[];};
async function getIncident(id:string){ const inc=await prisma.incident.findUnique({ where:{id}, include:{ attachments:{orderBy:{uploadedAt:'desc'}}, updates:{orderBy:{createdAt:'desc'}} } }); return inc as unknown as Incident|null; }
export default async function IncidentDetail({params}:{params:{id:string}}){
  const inc=await getIncident(params.id); if(!inc) return <div className='card'>No encontrado</div>;
  return (<div className='space-y-4'>
    <div className='card'><div className='flex justify-between items-start'><div>
      <h1 className='text-2xl font-semibold'>{inc.title}</h1><p className='text-slate-700'>{inc.description}</p>
      <div className='mt-3 grid md:grid-cols-2 text-sm gap-2'>
        <div><b>Fecha:</b> {new Date(inc.date).toLocaleDateString()}</div>
        <div><b>Reportó:</b> {inc.reporterName}</div>
        <div><b>Corresponsal:</b> {inc.correspondent}</div>
        <div><b>Área:</b> {inc.area}</div>
        <div><b>Control:</b> {inc.controlOwner}</div>
      </div></div><StatusBadge status={inc.status as Status}/></div></div>
    <div className='grid md:grid-cols-2 gap-4'>
      <div className='card'><h2 className='font-semibold mb-2'>Siguientes pasos</h2><p className='whitespace-pre-wrap'>{inc.nextSteps||'—'}</p></div>
      <div className='card'><h2 className='font-semibold mb-2'>Actualizar estatus / nota</h2><UpdateForm id={inc.id}/></div>
    </div>
    <div className='card'><h2 className='font-semibold mb-2'>Historial</h2>
      <ul className='space-y-2'>{inc.updates.map((u:Update)=>(
        <li key={u.id} className='border rounded-lg p-3'><div className='flex justify-between items-center'>
          <div className='text-sm text-slate-600'>{new Date(u.createdAt).toLocaleString()}</div>{u.status&&<span className='text-xs'>{u.status}</span>}
        </div><p className='mt-1 whitespace-pre-wrap'>{u.note}</p><p className='text-xs text-slate-500 mt-1'>Autor: {u.author}</p></li>
      ))}{inc.updates.length===0 && <li className='text-sm text-slate-500'>Sin actualizaciones.</li>}</ul>
    </div>
    <div className='card'><h2 className='font-semibold mb-2'>Documentos</h2>
      <ul className='list-disc ml-6'>{inc.attachments.map((a:Attachment)=>(
        <li key={a.id}><a className='underline' href={a.fileUrl} target='_blank' rel='noreferrer'>{a.fileName}</a>
          <span className='text-xs text-slate-500'> — subido {new Date(a.uploadedAt).toLocaleString()} por {a.uploadedBy}</span></li>
      ))}{inc.attachments.length===0 && <li className='text-sm text-slate-500'>Sin documentos.</li>}</ul>
      <div className='mt-3'><FileUpload incidentId={inc.id}/></div>
    </div>
  </div>);
}