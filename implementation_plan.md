# Sistema de Gestión para Academia de Barbería Apolo

Este documento detalla el plan de implementación para el nuevo sistema web de Academia Apolo, utilizando la infraestructura de Supabase en el proyecto existente (`gestor.io`) y Next.js para el Frontend.

> [!IMPORTANT]
> Se requiere confirmación del usuario antes de proceder con el desarrollo y la configuración inicial del proyecto. Por favor, revisa las consultas al final del documento.

## Arquitectura y Stack Tecnológico
* **Frontend**: Next.js (App Router), React, Tailwind CSS, Shadcn UI para componentes rápidos y estilizados.
* **Backend y Base de Datos**: Proyecto Supabase "gestor.io" (`tucxkgscnrahclaeudgs`). Uso extensivo de PostgreSQL y Row Level Security (RLS).
* **Autenticación**: Supabase Auth (para el administrador único/administradores del sistema).

---

## Esquema de Base de Datos Propuesto

Se aplicarán migraciones en Supabase para crear las siguientes tablas:

### 1. `cursos` (Configuración de Cursos)
El corazón del sistema.
* `id` (UUID, PK)
* `nombre` (Text)
* `fecha_inicio` (Date)
* `fecha_fin` (Date)
* `dias_cursado` (Text/Array)
* `horarios` (Text)
* `whatsapp_link` (Text) -> **Restricción CHECK comprobando formato URL (HTTP/HTTPS)**
* `creado_en` (Timestamp)

### 2. `alumnos` (Gestión de Alumnos)
* `id` (UUID, PK)
* `nombre_completo` (Text)
* `telefono` (Text) -> Utilizado para generar el `wa.me/` link.
* `creado_en` (Timestamp)

### 3. `curso_inscripciones` e `inscripcion_asistencias` (Ventas y Asistencia)
Gestiona la relación de un estudiante anotado en un curso específico y sus asistencias por fecha.
* `curso_inscripciones`: `id`, `curso_id`, `alumno_id`, `estado_pago` (enumeración: 'AL_DIA', 'PENDIENTE', 'DEUDOR'), `monto_total`, `creado_en`.
* `asistencias`: `id`, `inscripcion_id`, `fecha_clase`, `presente`.

### 4. `pagos` (Tesorería)
Registro atómico de cobros.
* `id` (UUID, PK)
* `inscripcion_id` (FK a `curso_inscripciones`)
* `monto` (Numeric)
* `fecha_pago` (Date)
* `tipo` (Text: 'SEÑA', 'CUOTA', 'TOTAL')

### 5. `comunicaciones` y `alertas` (Avisos Centralizados)
* `curso_comunicaciones_checklist`: Almacena el estado de los mensajes clave pactados por cada curso ("Bienvenida", "Material", "Promo M.", etc).
* `alertas`: Panel central de Tareas.
  * `id`, `descripcion`, `fecha_vencimiento`, `color_etiqueta`, `completada`
  * Las reglas configurables (como *F.I. - 3 días*) serán pre-calculadas como registros en esta tabla mediante un Database Trigger cuando se inserta un nuevo `curso`.

---

## Propuesta de Módulos (Frontend)

Se construirán las siguientes vistas principales:

1. **Dashboard (El Semáforo Diario)**:
   * Panel de notificaciones y alertas priorizadas por fecha de vencimiento.
   * Resumen visual rápido: Asistencias del día a tomar, cobros urgentes.

2. **Módulo de Cursos**:
   * Formulario de Alta con comprobación forzada de `whatsapp_link`.
   * Vista Detalle: Lista de checklist para "Mensajes Clave" e indicadores de progreso.

3. **Módulo de Alumnos / Inscripciones**:
   * Alta de alumno y "Venta de Curso".
   * Sistema sin bot: Botón dinámico que abre una nueva pestaña en `wa.me/{numero}?text={UrlEncodedMsg}` incrustando el link del grupo.
   * Grilla editable tipo Excel para marcar asistencia.

4. **Módulo Tesorería**:
   * Listado unificado con etiquetas 🟢, 🟡, 🔴.
   * Botones de acción rápida: "Cargar Seña", "Completar Pago".

---

## User Review Required

### Open Questions para Ignacio
1. **Frontend Bootstrapping**: ¿Estás de acuerdo con iniciar un proyecto Next.js limpio con Shadcn UI + Tailwind CSS en esta carpeta (`apolo-academia`) para el frontend?
2. **Alertas de Sistema y Triggers**: Para las "Reglas Configurables" (ej: *F.I. - 3 días avisar material* o *F.I. + 5 días enviar promo*), lo más robusto es armar un Trigger de base de datos que *auto-genere* estas tareas personalizadas tan pronto el Curso es creado en la base de datos. Así aparecerán en la "Campanita". ¿Te suena una buena estrategia de base?
3. **Flujo de Asistencia**: ¿Al curso se le configura un calendario fijo con todas sus fechas ("lunes 1, miércoles 3"), o es preferible que el usuario simplemente cree la "Clase del Día" de forma dinámica y todos los alumnos inscritos ese día son pasados en limpio por la lista? 

## Verification Plan
1. Se inicializa del lado backend una tabla de Migrations en Supabase, conectándose remota o generando la primera migración de esquema.
2. Se prueba la restricción estricta de base de datos en `cursos` insertando una URL falsa. (Verificación por base).
3. Se monta y prueba el módulo `wa.me/` validando en el navegador que genere bien la URL concatenada.
4. Se ejecuta el flujo en una demostración funcional.
