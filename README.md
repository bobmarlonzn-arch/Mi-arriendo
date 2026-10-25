# Mi Arriendo

Panel simple para ver quién pagó el arriendo, gestionar apartamentos e inquilinos y automatizar cobros por WhatsApp.
Stack 100 % gratis: **Next.js 14 (Vercel) + Supabase (PostgreSQL + Storage) + Tailwind**. No se guarda nada en el disco local.

## Cómo funciona
- **Panel (Pagos):** semáforo verde/rojo del mes actual. Botón *Confirmar pago*: guarda el pago, marca el comprobante y envía el WhatsApp *"Hemos recibido su pago correctamente. Quedó al día con {mes}. ¡Gracias!"*.
- **Cron (Vercel, 8:00 a.m. Colombia):** busca inquilinos en ROJO a 5 días de su fecha de pago y les envía la plantilla. Si un envío falla, reintenta los días siguientes hasta el vencimiento. Nunca envía dos veces el mismo mes.
- **Webhook `/api/webhook/whatsapp`:** recibe fotos/PDF, los sube al bucket `comprobantes` de Supabase y muestra la alerta *"{nombre} envió comprobante"* en el panel.

---

## 1. Supabase (base de datos + archivos)
1. Crea cuenta en https://supabase.com → **New project** (plan Free). Guarda la contraseña de la base.
2. Menú **SQL Editor → New query** → pega todo `supabase.sql` → **Run**. Esto crea las tablas y el bucket público `comprobantes`.
3. **Project Settings → API**: copia `Project URL` (→ `SUPABASE_URL`) y la clave **service_role** (→ `SUPABASE_SERVICE_ROLE_KEY`). Esta clave es secreta: va solo en Vercel, nunca en el navegador ni en GitHub.

## 2. GitHub + Vercel
1. Sube la carpeta a un repositorio de GitHub (`.env` ya está en `.gitignore`).
2. En https://vercel.com → **Add New → Project** → importa el repositorio.
3. Antes de desplegar, en **Environment Variables** agrega todas las de `.env.example`.
   - `ADMIN_PASSWORD`: la clave con la que entrarás al panel.
   - `AUTH_SECRET` y `CRON_SECRET`: textos largos aleatorios (ej. 40 letras y números).
4. **Deploy**. Tu app queda en `https://tu-proyecto.vercel.app`.
5. Si cambias variables después, haz **Redeploy**.

## 3. WhatsApp Cloud API (Meta)
### 3.1 Crear la app
1. Entra a https://developers.facebook.com → **My Apps → Create App** → tipo **Business** → ponle nombre (ej. "Mi Arriendo") y asócialo a tu portafolio comercial (créalo en business.facebook.com si no tienes).
2. En el panel de la app agrega el producto **WhatsApp** → *Set up*.

### 3.2 Phone ID y número
1. En **WhatsApp → API Setup** verás un número de prueba y el **Phone number ID** → cópialo en `PHONE_ID`.
2. Para pruebas: en "To" agrega y verifica tu celular como destinatario (máx. 5).
3. Para producción: **Add phone number** y registra el número real del negocio (no puede estar activo en la app normal de WhatsApp; si lo está, debes eliminarlo de allí primero). Verifica con el código SMS/llamada.

### 3.3 Token permanente (importante)
El token que aparece en *API Setup* **caduca en 24 horas**. Crea uno permanente:
1. https://business.facebook.com → **Configuración del negocio → Usuarios → Usuarios del sistema → Agregar** (rol Administrador).
2. **Asignar activos** → Apps → tu app → permiso *Control total*. Asigna también tu cuenta de WhatsApp Business.
3. **Generar token** → elige tu app → vencimiento **Nunca** → marca `whatsapp_business_messaging` y `whatsapp_business_management` → copia el token en `WHATSAPP_TOKEN` (Vercel) y haz Redeploy.

### 3.4 Plantilla (obligatoria para el recordatorio)
Los mensajes que inicia el negocio fuera de las 24 h requieren plantilla aprobada.
1. https://business.facebook.com → **Administrador de WhatsApp → Plantillas de mensajes → Crear plantilla**.
2. Categoría: **Utilidad**. Nombre: `recordatorio_arriendo` (minúsculas y guiones bajos). Idioma: **Español** (código `es`).
3. Cuerpo (Meta usa números en vez de nombres):
```
Hola {{1}}, te recordamos que tu arriendo del {{2}} vence el {{3}}. Valor {{4}}. Responde a este chat con el comprobante.
```
4. Ejemplos de variables: `María Pérez`, `Apto 301`, `30 de noviembre`, `$1.200.000`.
5. Enviar. La aprobación suele tardar de minutos a unas horas. Si Meta la reclasifica como "Marketing", pide revisión o reescribe más neutral.
6. Si usas otro nombre o idioma, cambia `WHATSAPP_TEMPLATE_NAME` / `WHATSAPP_TEMPLATE_LANG` en Vercel. El orden de variables es: nombre, apto, fecha, valor.

### 3.5 Webhook
1. En la app de Meta: **WhatsApp → Configuration → Webhook → Edit**.
2. **Callback URL:** `https://tu-proyecto.vercel.app/api/webhook/whatsapp`
3. **Verify token:** exactamente el mismo valor de `WHATSAPP_VERIFY_TOKEN`. → *Verify and save*.
4. En *Webhook fields* → **messages** → *Subscribe*.
5. (Recomendado) **App settings → Basic → App secret**: cópialo en `APP_SECRET` para que el webhook rechace llamadas falsas.

## 4. Cron en Vercel
`vercel.json` ya lo incluye:
```json
{ "crons": [{ "path": "/api/cron/recordatorios", "schedule": "0 13 * * *" }] }
```
- Vercel usa **UTC**: 13:00 UTC = **8:00 a.m. Colombia** (UTC-5).
- Con `CRON_SECRET` definido, Vercel envía solo el encabezado `Authorization: Bearer ...`.
- Ver ejecuciones: Vercel → Project → **Settings → Cron Jobs** (botón *Run* para ejecutarlo a mano) y **Logs**.
- **Límite del plan gratis (Hobby):** el cron corre una vez al día, pero Vercel puede ejecutarlo en cualquier minuto de esa hora (entre 8:00 y 8:59 a.m.). Si necesitas la hora exacta, usa un servicio externo gratis (cron-job.org) que llame `https://tu-proyecto.vercel.app/api/cron/recordatorios?key=TU_CRON_SECRET`.

## 5. Lista de pruebas (hazlas en este orden)
1. Entra al panel con `ADMIN_PASSWORD`. Crea un apartamento y un inquilino con **tu** celular (ya verificado como destinatario de prueba).
2. Pon como día de pago una fecha que esté a 5 días de hoy.
3. Abre `https://tu-proyecto.vercel.app/api/cron/recordatorios?key=TU_CRON_SECRET` → la respuesta lista los envíos y debes recibir la plantilla en WhatsApp.
4. Responde a ese chat con una foto → en unos segundos aparece la alerta amarilla en *Pagos* con la imagen.
5. Pulsa **Confirmar pago** → el semáforo pasa a verde y recibes *"Hemos recibido su pago correctamente…"*.
6. Revisa en Supabase → Storage → `comprobantes` que quedó el archivo.

## 6. Cosas que debes saber
- **Costos de WhatsApp:** Meta no cobra por los mensajes de servicio (la confirmación, enviada dentro de las 24 h siguientes a que el inquilino escribe). La **plantilla de recordatorio sí se cobra** por mensaje (tarifa de "Utilidad", centavos de dólar; consulta la tarifa vigente en Meta para Colombia). El resto de la plataforma es gratis.
- **Ventana de 24 h:** la confirmación solo llega si el inquilino escribió en las últimas 24 h. Si falla, el panel igual guarda el pago y te avisa que el WhatsApp no se envió.
- **Mes de pago:** el semáforo evalúa el mes calendario actual. Si confirmas un pago de alguien que ya pagó este mes, se registra para el mes siguiente.
- **Plan Hobby de Vercel** es para uso personal/no comercial según sus términos; si lo usas como negocio, revisa si necesitas el plan Pro.
- **Supabase Free** pausa el proyecto tras 7 días sin actividad (se reactiva desde su panel) y da 1 GB de archivos; las fotos se reducen automáticamente antes de subirse.
- Los celulares se guardan con indicativo 57 si escribes 10 dígitos. Para otros países escribe el número completo con indicativo.

## Desarrollo local (opcional)
```bash
cp .env.example .env.local   # completa los valores
npm install
npm run dev
```
