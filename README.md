# Ludy Hair Studio - Sistema de Citas

Sistema completo de gestión de citas para Ludy Hair Studio con recordatorios SMS vía Twilio.

## Stack Tecnológico

- **Backend**: FastAPI (Python) + PostgreSQL + SQLAlchemy + Alembic
- **Frontend**: Next.js 15 + Tailwind CSS + React Query
- **SMS**: Twilio
- **Deploy**: Railway (backend) + Vercel (frontend)

---

## Desarrollo Local

### Prerequisitos

- Python 3.11+
- Node.js 18+
- PostgreSQL corriendo localmente

### 1. Clonar e instalar dependencias del backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configurar variables de entorno del backend

```bash
cp .env.example .env
```

Edita `backend/.env`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ludy_hair
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
```

### 3. Crear base de datos

```bash
createdb ludy_hair
```

### 4. Ejecutar el backend

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

Las tablas se crean automáticamente y los servicios por defecto se insertan al iniciar.

Documentación API disponible en: http://localhost:8000/docs

### 5. Instalar dependencias del frontend

```bash
cd frontend
npm install
```

### 6. Configurar variables de entorno del frontend

```bash
cp .env.example .env.local
```

Edita `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 7. Ejecutar el frontend

```bash
cd frontend
npm run dev
```

La aplicación estará en: http://localhost:3000

---

## Migraciones con Alembic

```bash
cd backend

# Crear una migración
alembic revision --autogenerate -m "descripcion"

# Aplicar migraciones
alembic upgrade head

# Revertir última migración
alembic downgrade -1
```

---

## Deploy en Railway (Backend)

1. Crear cuenta en [Railway](https://railway.app)
2. Nuevo proyecto → "Deploy from GitHub repo"
3. Seleccionar este repositorio, apuntar al directorio `backend`
4. Agregar una base de datos PostgreSQL al proyecto
5. Configurar variables de entorno en Railway:
   - `DATABASE_URL` (Railway la provee automáticamente desde el plugin Postgres)
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_PHONE_NUMBER`
6. El deploy se realiza automáticamente mediante `railway.json`

---

## Deploy en Vercel (Frontend)

1. Crear cuenta en [Vercel](https://vercel.com)
2. "Add New Project" → importar desde GitHub
3. Configurar el directorio raíz como `frontend`
4. Agregar variable de entorno:
   - `NEXT_PUBLIC_API_URL=https://tu-backend.railway.app`
5. Deploy

---

## Configurar Twilio

1. Crear cuenta en [Twilio](https://www.twilio.com)
2. Obtener un número de teléfono con capacidades SMS
3. Copiar Account SID y Auth Token desde el dashboard
4. Configurar las variables de entorno correspondientes

Formato del mensaje de recordatorio:
```
Hola {nombre}! Te recordamos tu cita en Ludy Hair Studio mañana {fecha} a las {hora} para {servicio}. ¡Te esperamos! 💇‍♀️
```

---

## Servicios por Defecto

Al iniciar el backend por primera vez, se crean automáticamente:

| Servicio    | Duración | Precio |
|-------------|----------|--------|
| Corte       | 45 min   | $25.00 |
| Color       | 120 min  | $80.00 |
| Peinado     | 60 min   | $40.00 |
| Maquillaje  | 60 min   | $50.00 |

---

## API Endpoints

### Servicios
- `GET /api/services` — Listar servicios
- `POST /api/services` — Crear servicio
- `GET /api/services/{id}` — Obtener servicio
- `PUT /api/services/{id}` — Actualizar servicio
- `DELETE /api/services/{id}` — Eliminar servicio

### Citas
- `GET /api/appointments` — Listar citas (filtros: date, status, upcoming, past)
- `POST /api/appointments` — Crear cita
- `GET /api/appointments/{id}` — Obtener cita
- `PUT /api/appointments/{id}` — Actualizar cita
- `DELETE /api/appointments/{id}` — Eliminar cita
- `GET /api/appointments/by-date` — Citas agrupadas por fecha

### SMS
- `POST /api/sms/send-reminder/{id}` — Enviar recordatorio individual
- `POST /api/sms/send-bulk-reminders` — Enviar recordatorios para citas de mañana

### Salud
- `GET /health` — Estado del servidor
