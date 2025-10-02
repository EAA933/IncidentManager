import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main(){
  const count = await prisma.incident.count();
  if (count === 0){
    await prisma.incident.createMany({ data: [
      { title:'Interrupción de VPN', description:'Usuarios no pueden conectar', date:new Date(), reporterName:'Soporte N1', correspondent:'TI Redes', area:'Infraestructura', status:'OPEN', controlOwner:'Seguridad', nextSteps:'Revisar logs' },
      { title:'Falla pagos', description:'Rechazos intermitentes', date:new Date(), reporterName:'CX', correspondent:'Producto', area:'Digital', status:'IN_PROGRESS', controlOwner:'DevOps', nextSteps:'Rollback' }
    ]});
    console.log('Seed creado');
  } else {
    console.log('Seed omitido, ya hay data');
  }
}
main().catch(e=>{console.error(e);process.exit(1)}).finally(async()=>{await prisma.$disconnect()});