# AdminDentalSoft — Panel de administración de licencias

Front-office del SaaS **DentalSoft**: lo usa el equipo dueño del producto (no las
clínicas) para definir **planes** y su precio, el catálogo de **módulos**
(funcionalidades vendibles de forma modular y mensual) y, más adelante, las
**licencias** (clínicas suscriptas).

Es una app independiente del ERP (`FrontDentalSoft`) pero replica fielmente su
sistema de diseño (mismos tokens de color, tipografía, componentes y patrones de
página-lista + modal CRUD). Se diferencia por la marca **DentalSoft · Admin** y un
menú propio.

## Stack

- React 19 · Vite · react-router-dom 7 (HashRouter) · sass · sonner
- Sesión en `localStorage["adminMaestro"]` (clave distinta del ERP para no pisarse)
- Apunta al backend `BackDentalSoft` (`VITE_API_URL`, por defecto `http://localhost:9090/dental`)

## Correr en local

```bash
nvm use 22          # importante: el node default suele ser viejo
yarn install
yarn dev            # http://localhost:5174  (el ERP usa :5173)
```

## Acceso

Login contra `POST /usuario/validar` (mismo endpoint del ERP), pero **solo** se
permite el acceso a usuarios con `usunivel = 'SA'` (superadmin del SaaS). Cualquier
otro nivel (administrador de clínica, doctor, paciente) es rechazado en el front,
y los endpoints `/admin/**` exigen rol `SA` en el backend.

Superadmin de prueba (creado por la migración `sprint26`):

```
usuario:    superadmin@dentalsoft.com
contraseña: 123     (cambiar tras el primer login)
```

## Contrato de backend esperado (a implementar en BackDentalSoft, paquete /admin)

Todos los endpoints van bajo el context-path `/dental` y exigen rol `SA`.

### Módulos — `modulo` (Dental_Licencia)

| Verbo | Ruta | Cuerpo / Notas |
|---|---|---|
| GET | `/admin/modulo?search=&estado=&page=&size=` | `{ data, total, page, size }` |
| POST | `/admin/modulo` | `{ modcodigo, modnom, moddesc, modprecio, modorden, modesencial, modest }` |
| PUT | `/admin/modulo/{id}` | idem |
| DELETE | `/admin/modulo/{id}` | soft-delete (`modest = false`) |
| POST | `/admin/modulo/inicializar-defaults` | siembra el catálogo base (idempotente) |

### Planes — `plan` (Dental_Licencia) + `plan_modulo`

| Verbo | Ruta | Cuerpo / Notas |
|---|---|---|
| GET | `/admin/plan?search=&estado=&page=&size=` | `{ data, total }`; cada plan con `modulos` (ids o `{modid,modnom}`) |
| GET | `/admin/plan/{id}` | detalle con `modulos` |
| POST | `/admin/plan` | `{ plncodigo, plnnom, plndesc, plnprecio, plnperiodo, plnmaxterminales, plndestacado, plnest, modulos: [modid] }` |
| PUT | `/admin/plan/{id}` | idem (reemplaza el set de módulos) |
| DELETE | `/admin/plan/{id}` | soft-delete (`plnest = false`) |

### Modelo de datos (resumen, prefijo de 3 letras estilo StarSoft)

- `modulo(modid, modcodigo, modnom, moddesc, modprecio, modorden, modesencial, modest, modfeccreado, modfecmod)`
- `plan(plnid, plncodigo, plnnom, plndesc, plnprecio, plnperiodo, plnmaxterminales, plndestacado, plnest, plnfeccreado, plnfecmod)`
- `plan_modulo(pmoid, pmoplnid, pmomodid, pmofeccreado)` — módulos incluidos en cada tier
- `licencia_modulo(lmoid, lmolicid, lmomodid, lmoprecio, lmofecini, lmofecfin, lmoest)` — add-ons por licencia
- `licencia.planid` pasa a referenciar `plan.plnid`

> Estas tablas viven en la BD **maestra** `Dental_Licencia` (catálogo global del SaaS),
> por eso **no llevan `licid`** — a diferencia de las tablas de negocio de `Dental_SOFT`.

## Estado

Iteración 1 **completa y funcional end-to-end**: scaffold + login SA + CRUD de
Módulos y Planes (front) **y** el backend `/admin` en BackDentalSoft (migración
`sprint26_admin_planes_modulos.sql`, entidades `Modulo`/`PlanSuscripcion`, repos,
servicios, controllers y gate de rol `SA` en `WebSecurityConfig`).

Próximos pasos sugeridos: módulo de **Licencias** (listar clínicas, asignarles un
plan, suspender/reactivar, contratar add-ons vía `licencia_modulo`) y que el ERP
consuma los módulos del plan para gatear funcionalidades.
