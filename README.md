# 🧃 Tiendita buen precio (proyecto-kiosco)

Kiosco escolar online: los alumnos y el personal de la escuela se registran, arman un carrito con golosinas, galletas, bebidas y snacks, y hacen un pedido que el kiosquero ve y gestiona desde un panel de administración. Incluye una sección oculta, el **Mercado Negro**, con productos exclusivos por pre-pedido.

> Estado actual: **MVP funcional**. Las cuentas, el catálogo, el stock, los pedidos y el panel admin son reales y se guardan en base de datos. El **cobro todavía no existe**: el pago se hace en persona al retirar. Ver [qué falta](#-qué-falta-para-que-esté-100-terminado).

## Índice

- [Funcionalidades](#-funcionalidades)
- [Tecnologías](#-tecnologías)
- [Estructura del proyecto](#-estructura-del-proyecto)
- [Cómo correrlo](#-cómo-correrlo-paso-a-paso)
- [Variables de entorno](#-variables-de-entorno)
- [Usuarios y roles](#-usuarios-y-roles)
- [Resumen de la API](#-resumen-de-la-api)
- [Problemas comunes](#-problemas-comunes)
- [Deploy](#-deploy-render)
- [Qué falta para que esté 100% terminado](#-qué-falta-para-que-esté-100-terminado)
- [Más documentación](#-más-documentación)

## ✅ Funcionalidades

**Alumnos y personal**
- Registro (nombre, contraseña y curso) e inicio de sesión (nombre y contraseña).
- Catálogo con 4 categorías (galletas, bebidas, golosinas, snacks), filtros y buscador.
- Carrito con cantidades y botón para quitar productos.
- Pedido mínimo de **$2000**. Al comprar se guarda el pedido y se muestra un código `PED-12345`.
- Mercado Negro: link discreto al pie de la tienda (`v1.4.2`), mismos mecanismos que la tienda.

**Administrador**
- Panel con la lista de pedidos y cambio de estado (pendiente, entregado, cancelado).
- Control de stock de cada producto.
- Alta de productos nuevos con imagen (PNG, JPG o WEBP, máx. 2 MB) y cambio de imagen en productos existentes.

**Seguridad y robustez**
- Contraseñas guardadas con hash (nunca en texto plano).
- Sesión con token firmado (dura 7 días). El rol admin no se puede falsificar desde el navegador.
- Precios y stock se validan siempre en el servidor, nunca con lo que mande el navegador.
- Las filas de stock se bloquean durante la compra: dos personas no pueden llevarse la última unidad a la vez.
- Se escapa el texto antes de mostrarlo en pantalla (evita inyección de HTML/JS).

## 🛠 Tecnologías

| Parte | Tecnología |
|---|---|
| Frontend | HTML, CSS, JavaScript puro, Bootstrap 5 (por CDN) |
| Backend | Python + Flask |
| Base de datos | PostgreSQL |
| ORM | SQLAlchemy (Flask-SQLAlchemy) |
| Hosting previsto | Render |

## 📁 Estructura del proyecto

```
proyecto-kiosco/
├── README.md
├── proyecto.txt            Explicación general para estudiantes
├── documentacion.txt       Detalles técnicos
├── .gitignore
├── backend/
│   ├── app.py              Servidor Flask: rutas, login, pedidos, admin
│   ├── models.py           Tablas de la base (modelos SQLAlchemy)
│   ├── seed.py             Carga los 20 productos iniciales
│   ├── requirements.txt    Dependencias de Python
│   ├── .env.example        Plantilla de variables de entorno
│   └── .env                Tu configuración real (NO se sube a git)
└── frontend/
    ├── login.html          Inicio de sesión y registro
    ├── index.html          Tienda
    ├── mercado.html        Mercado Negro
    ├── admin.html          Panel de administración
    ├── config.js           URL del backend
    ├── api.js              Función para hablar con el backend
    ├── auth.js             Sesión, login y registro
    ├── tienda.js           Productos, carrito y compra
    ├── admin.js            Lógica del panel admin
    ├── styles.css          Estilos de la tienda y el panel
    └── login.css           Estilos del login
```

Las carpetas `carpetas de imagenes` y `carpeta de imagenes del mercado nigga` ya no se usan: las imágenes ahora se guardan en la base de datos y se suben desde el panel admin. Los archivos viejos `index.txt`, `login.txt` y `javascrip.js` también se pueden borrar.

## 🚀 Cómo correrlo (paso a paso)

Las instrucciones están pensadas para **Windows + PowerShell**. Al final de cada paso hay una nota si en Mac/Linux cambia algo.

### 0. Requisitos

- [Python 3.10 o más nuevo](https://www.python.org/downloads/) (al instalar, tildá *Add Python to PATH*).
- [PostgreSQL](https://www.postgresql.org/download/) con pgAdmin. Anotá la contraseña del usuario `postgres` que elegiste al instalar.
- [Git](https://git-scm.com/downloads).

Comprobá que andan:

```powershell
python --version
git --version
```

### 1. Descargar el proyecto

```powershell
git clone https://github.com/TU_USUARIO/proyecto-kiosco.git
cd proyecto-kiosco
```

### 2. Crear la base de datos

En pgAdmin: clic derecho en **Databases → Create → Database…** y poné el nombre `proyecto-kiosco`.

Si preferís SQL, el nombre lleva comillas por el guion:

```sql
CREATE DATABASE "proyecto-kiosco";
```

No hace falta crear tablas: el backend las crea solo.

### 3. Instalar las dependencias de Python

Recomendado: usar un entorno virtual para no mezclar librerías con otros proyectos.

```powershell
python -m venv venv
venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
```

- Si PowerShell bloquea la activación, corré una vez `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` y repetí.
- Si no querés entorno virtual, saltá las dos primeras líneas y corré solo el `pip install`.
- En Mac/Linux: `python3 -m venv venv`, `source venv/bin/activate`, y las rutas con `/` (`backend/requirements.txt`).

### 4. Configurar las variables de entorno

Copiá la plantilla y editala:

```powershell
copy backend\.env.example backend\.env
notepad backend\.env
```

Completá al menos estos valores:

```env
DATABASE_URL=postgresql://postgres:TU_PASSWORD@localhost:5432/proyecto-kiosco
SECRET_KEY=un-texto-largo-y-random
ADMIN_PASSWORD=la-contraseña-del-admin
PORT=54321
FRONTEND_ORIGIN=*
```

- Reemplazá `TU_PASSWORD` por tu contraseña de Postgres. Si tiene caracteres especiales hay que codificarlos: `@` → `%40`, `#` → `%23`, `/` → `%2F`.
- Para generar una `SECRET_KEY` segura: `python -c "import secrets; print(secrets.token_hex(32))"`.
- `ADMIN_PASSWORD` es la contraseña del usuario `admin`, que se crea solo.
- **`PORT`**: usá un puerto alto como `54321`. En algunas PCs con Windows, los puertos típicos (5000, 5001, 8080) están reservados y Flask falla con *"Intento de acceso a un socket no permitido"*.

### 5. Cargar los productos iniciales

```powershell
python backend\seed.py
```

Tiene que decir `Listo. Productos nuevos creados: 20`. Se puede correr varias veces sin duplicar nada.

### 6. Apuntar el frontend al backend

Abrí `frontend\config.js` y poné **el mismo puerto** que usaste en `.env`:

```js
const API_BASE_URL = "http://127.0.0.1:54321";
```

### 7. Prender el backend (terminal 1)

```powershell
python backend\app.py
```

Tiene que aparecer `Running on http://127.0.0.1:54321`. Dejá esa terminal abierta. Si abrís esa dirección en el navegador, debería decir *"El servidor del kiosco está funcionando."*

El servidor no se recarga solo: si cambiás código del backend, cortalo con `Ctrl+C` y volvé a correrlo.

### 8. Prender el frontend (terminal 2)

Abrí **otra** terminal en la carpeta del proyecto:

```powershell
cd frontend
python -m http.server 54400 --bind 127.0.0.1
```

Después abrí en el navegador:

```
http://127.0.0.1:54400/login.html
```

No abras los `.html` con doble clic (`file://`): el navegador bloquea las llamadas al backend. Usá siempre `127.0.0.1`, no `[::]`.

### 9. Probar que todo anda

1. Entrá como administrador: nombre `admin` y la contraseña de `ADMIN_PASSWORD`. No hace falta elegir curso.
2. Arriba, en la tienda, aparece el botón **Panel admin**. Ahí podés subir las imágenes con **Cambiar imagen**.
3. Cerrá sesión, registrá un usuario de prueba y hacé una compra de $2000 o más.
4. Volvé al panel admin: el pedido aparece en la tabla y podés cambiarle el estado.

## ⚙ Variables de entorno

Se definen en `backend/.env` (local) o en el panel del servicio (Render).

| Variable | Obligatoria | Descripción |
|---|---|---|
| `DATABASE_URL` | Sí | URL de conexión a PostgreSQL. Acepta `postgresql://` y `postgres://`. |
| `SECRET_KEY` | Sí en producción | Firma los tokens de sesión. Si la cambiás, se cierran todas las sesiones. |
| `ADMIN_PASSWORD` | Sí | Contraseña del usuario `admin`. Para cambiarla, editá el valor y reiniciá el backend. |
| `FRONTEND_ORIGIN` | No (`*`) | Dominio del frontend permitido por CORS. En producción poné la URL real, sin barra final. |
| `PORT` | No (`5000`) | Puerto del backend en local. |
| `HOST` | No (`127.0.0.1`) | Con `0.0.0.0` otros dispositivos de la red pueden entrar a tu backend. |

## 👤 Usuarios y roles

- **usuario**: se registra desde la web (nombre, contraseña y curso). Puede comprar.
- **admin**: el backend lo crea solo al arrancar con nombre `admin` y la contraseña de `ADMIN_PASSWORD`. El nombre `admin` está reservado: nadie puede registrarse con él.

## 📡 Resumen de la API

| Método | Ruta | Quién | Qué hace |
|---|---|---|---|
| POST | `/api/registro` | Público | Crea una cuenta y devuelve el token |
| POST | `/api/login` | Público | Inicia sesión y devuelve el token |
| GET | `/api/me` | Logueado | Datos del usuario actual |
| GET | `/api/productos?mercado_negro=0\|1` | Público | Lista productos de la tienda o del Mercado Negro |
| GET | `/api/productos/<id>/imagen` | Público | Imagen de un producto |
| POST | `/api/pedido` | Logueado | Crea un pedido y descuenta stock |
| GET | `/api/mis-pedidos` | Logueado | Pedidos del usuario actual |
| GET | `/api/admin/pedidos` | Admin | Todos los pedidos |
| POST | `/api/admin/pedidos/<id>/estado` | Admin | Cambia el estado de un pedido |
| POST | `/api/admin/productos` | Admin | Crea un producto (con imagen opcional) |
| POST | `/api/admin/productos/<id>/stock` | Admin | Cambia el stock |
| POST | `/api/admin/productos/<id>/imagen` | Admin | Cambia la imagen |

Las rutas protegidas necesitan el header `Authorization: Bearer <token>`. Detalle completo en `documentacion.txt`.

## 🩺 Problemas comunes

| Síntoma | Causa y solución |
|---|---|
| `Falta DATABASE_URL` | No existe `backend/.env` o está vacío. Repetí el paso 4. |
| `password authentication failed` | La contraseña de `DATABASE_URL` no es la de tu Postgres, o tiene caracteres especiales sin codificar. |
| `database "proyecto-kiosco" does not exist` | No creaste la base (paso 2) o el nombre no coincide. |
| `ModuleNotFoundError: No module named ...` | Falta instalar dependencias o no activaste el entorno virtual (paso 3). |
| `Intento de acceso a un socket no permitido por sus permisos de acceso` | Windows tiene reservado ese puerto. Usá un puerto alto (ej. `54321`) en `.env` y en `config.js`. |
| La web dice *"No se pudo conectar con el servidor"* | El backend no está corriendo, o el puerto de `config.js` no coincide con el de `.env`. |
| `ERR_ADDRESS_INVALID` en el navegador | Abriste `[::]`. Usá `http://127.0.0.1:54400/login.html`. |
| No aparece el botón **Panel admin** | Falta `ADMIN_PASSWORD` en `.env` (la consola avisa al arrancar) o no entraste con el usuario `admin`. |
| Los productos aparecen *"Sin imagen"* | Es lo normal al empezar: subí las imágenes desde el panel admin. |
| Cambié el `.env` o el código y no pasa nada | Hay que reiniciar el backend (`Ctrl+C` y volver a correrlo). |

Si ninguna de estas te sirve, abrí el navegador, apretá `F12` y mirá la pestaña **Console**: el error en rojo casi siempre dice qué pasa.

## ☁ Deploy (Render)

Todavía **no está desplegado**. El plan:

- **Base de datos**: PostgreSQL en Render. La *Internal Database URL* va como variable `DATABASE_URL`.
- **Backend**: Web Service de Render con *Build command* `pip install -r backend/requirements.txt` y *Start command* `gunicorn --chdir backend app:app`. Variables: `DATABASE_URL`, `SECRET_KEY`, `ADMIN_PASSWORD`, `FRONTEND_ORIGIN`.
- **Frontend**: son archivos estáticos, sirve Render Static Site, GitHub Pages o Vercel. Hay que cambiar `API_BASE_URL` en `config.js` por la URL pública del backend.
- Cuando el frontend tenga su URL final, poné esa URL en `FRONTEND_ORIGIN` (en vez de `*`).

Revisá las condiciones del plan gratuito de Render antes de elegirlo (suspensión por inactividad y vencimiento de la base gratuita).

## 🧩 Qué falta para que esté 100% terminado

### Pendientes importantes (ya acordados)

- [ ] **Horario o turno de retiro** en el pedido (la columna `observaciones` ya está reservada).
- [ ] **Pagos reales** con Mercado Pago y registro de qué pedidos están pagos.
- [ ] **Deploy** en Render (ver sección anterior).
- [ ] **Notificaciones**: avisar al admin de un pedido nuevo y al alumno cuando cambia el estado.

### Funcionalidades que faltan

- [ ] **Devolver el stock** cuando un pedido se cancela (hoy el stock no vuelve).
- [ ] **Historial de pedidos del alumno**: el endpoint `/api/mis-pedidos` existe, falta la pantalla.
- [ ] **Editar productos**: cambiar nombre, precio o categoría, y desactivar o borrar productos (la columna `activo` existe pero no hay botón).
- [ ] **Guardar el carrito** al recargar la página (hoy se pierde).
- [ ] **Cerrar sesión solo** cuando el token vence (hoy da error hasta que se vuelve a entrar).
- [ ] **Cambiar y recuperar contraseña**, y que el admin pueda ver o gestionar usuarios.
- [ ] Reemplazar los `alert()` por avisos visuales (notificaciones dentro de la página).
- [ ] Panel admin con filtros, búsqueda y actualización automática de pedidos.

### Calidad y seguridad

- [ ] **Migraciones de base** (Flask-Migrate/Alembic): hoy `create_all()` solo crea tablas nuevas, no modifica las existentes.
- [ ] **Límite de intentos de login** (por ejemplo con Flask-Limiter) contra adivinación de contraseñas.
- [ ] Tests automáticos del backend.
- [ ] Revisar el diseño en celular (el carrito fijo ocupa mucho espacio).

## 📚 Más documentación

- [`proyecto.txt`](proyecto.txt): explicación general del proyecto, pensada para estudiantes.
- [`documentacion.txt`](documentacion.txt): detalles técnicos (base de datos, API, flujo de compra, decisiones de diseño).