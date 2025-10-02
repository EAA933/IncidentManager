# Incidents – IndexedDB (Option B)

Esta versión guarda los datos **localmente en cada dispositivo** usando **IndexedDB** con **Dexie**. No requiere Prisma, Postgres ni Neon.

## Rutas y archivos clave
- `app/incidents/page.tsx`: componente 100% cliente (React) con:
  - Alta de incidentes
  - Filtros por estado y severidad
  - Cambio de estado (cíclico)
  - Eliminación
  - Exportar/Importar JSON
- `src/lib/idb.ts`: definición de la base local (IndexedDB)
- `src/lib/incidentsRepo.ts`: funciones CRUD y utilidades

## Cómo ejecutar
```bash
npm install
npm run dev
```
> Si tu proyecto original usaba Prisma/Neon, ya no es necesario. Puedes limpiar dependencias más adelante.

## Notas
- Los datos se almacenan por **navegador y dispositivo**. Si borras “datos del sitio” en el navegador, se pierden.
- Para mover datos entre equipos: usa **Exportar JSON** y luego **Importar JSON** en el otro dispositivo.
- Si quieres sincronización futura entre dispositivos, añade un backend simple solo para “sync” y deja IndexedDB como caché offline.

_Compilado: 2025-09-27T02:39:08.638725Z_


## Importar/Exportar Excel
- **Exportar**: botón **Exportar Excel** en `/incidents` (genera `.xlsx` con encabezados en español).
- **Importar**: botón **Importar Excel** en `/incidents`. Soporta `.xlsx/.xls`. Encabezados esperados (pueden variar):
  - `Nombre`, `Descripción`, `Discovery Date` (YYYY-MM-DD), `Monto de Pérdida`, `Financiero` (Sí/No), `Causa Raíz`, `Corresponsal`, `Acompaña CI`, `Área`, `Estado`, `Severidad`.
- También se mantienen **Exportar/Importar JSON**.

## Despliegue en Vercel (sin Neon)
1. Crea un repo en GitHub/GitLab con este proyecto.
2. Entra a **Vercel** → **Add New Project** → importa tu repo.
3. Framework: **Next.js**. (Auto-detectado)
4. Build command: por defecto (`next build`). Output: `.vercel`/`.next` (por defecto).
5. Variables de entorno: **no necesarias** para `/incidents` (IndexedDB es en el navegador).
6. Deploy. Abre `https://tu-app.vercel.app/incidents`.
   - **Ojo**: Los datos se guardan por **navegador/dispositivo** del usuario que visita la página. Vercel no persiste datos; el storage es del **cliente** (IndexedDB).

_Actualizado: 2025-09-27T03:00:55.949626Z_
