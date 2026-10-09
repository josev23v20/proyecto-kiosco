
import os
import random
from functools import wraps

from dotenv import load_dotenv

load_dotenv()  # lee backend/.env (en Render las variables vienen del panel)

from flask import Flask, Response, g, jsonify, request
from flask_cors import CORS
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
from werkzeug.security import check_password_hash, generate_password_hash

from models import Pedido, PedidoItem, Producto, Usuario, db

app = Flask(__name__)

# ================= CONFIG =================

database_url = os.environ.get("DATABASE_URL")
if not database_url:
    raise RuntimeError(
        "Falta DATABASE_URL. Copiá .env.example a .env y completalo "
        "(ver ejemplo dentro de .env.example)."
    )
# Render entrega "postgres://", SQLAlchemy necesita "postgresql://"
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

app.config["SQLALCHEMY_DATABASE_URI"] = database_url
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev-secret-cambiar-en-produccion")
app.config["MAX_CONTENT_LENGTH"] = 3 * 1024 * 1024  # tope de cualquier request: 3 MB

PEDIDO_MINIMO = 2000
CATEGORIAS = ("galleta", "bebida", "golosina", "snack")
ESTADOS_PEDIDO = ("pendiente", "entregado", "cancelado")
MAX_IMAGEN_BYTES = 2 * 1024 * 1024  # 2 MB por imagen
TOKEN_MAX_AGE = 60 * 60 * 24 * 7  # sesión de 7 días

# Dominio del frontend (para CORS). En desarrollo "*", en producción poné la URL real.
FRONTEND_ORIGIN = os.environ.get("FRONTEND_ORIGIN", "*")
CORS(app, resources={r"/api/*": {"origins": FRONTEND_ORIGIN}})

db.init_app(app)
serializer = URLSafeTimedSerializer(app.config["SECRET_KEY"])

# Crea las tablas si no existen (también corre bajo gunicorn en Render)
with app.app_context():
    db.create_all()


# ================= ERRORES =================

@app.errorhandler(413)
def demasiado_grande(_):
    return jsonify({"error": "El archivo es demasiado grande (máximo 2 MB por imagen)"}), 413


# ================= HELPERS =================

def error(mensaje, codigo=400):
    return jsonify({"error": mensaje}), codigo


def generar_token(usuario_id):
    return serializer.dumps({"usuario_id": usuario_id})


def usuario_desde_token(token):
    try:
        datos = serializer.loads(token, max_age=TOKEN_MAX_AGE)
    except (BadSignature, SignatureExpired):
        return None
    return db.session.get(Usuario, datos.get("usuario_id"))


def requiere_login(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        token = request.headers.get("Authorization", "").replace("Bearer ", "").strip()
        if not token:
            return error("Falta iniciar sesión", 401)
        usuario = usuario_desde_token(token)
        if not usuario:
            return error("Sesión inválida o vencida", 401)
        g.usuario = usuario
        return f(*args, **kwargs)

    return wrapper


def requiere_admin(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if g.usuario.rol != "admin":
            return error("No tenés permiso de administrador", 403)
        return f(*args, **kwargs)

    return wrapper


def generar_codigo_pedido():
    while True:
        codigo = "PED-" + str(random.randint(10000, 99999))
        if not Pedido.query.filter_by(codigo=codigo).first():
            return codigo


def detectar_tipo_imagen(datos):
    """Mira los primeros bytes del archivo (no confía en el nombre ni en lo que diga el navegador)."""
    if datos.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if datos.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if datos[:4] == b"RIFF" and datos[8:12] == b"WEBP":
        return "image/webp"
    return None


def leer_imagen_del_request():
    """Devuelve (datos, tipo, mensaje_error). Si no se mandó archivo: (None, None, None)."""
    archivo = request.files.get("imagen")
    if archivo is None or archivo.filename == "":
        return None, None, None

    datos = archivo.read()
    if len(datos) == 0:
        return None, None, "El archivo de imagen está vacío"
    if len(datos) > MAX_IMAGEN_BYTES:
        return None, None, "La imagen supera el máximo de 2 MB"

    tipo = detectar_tipo_imagen(datos)
    if not tipo:
        return None, None, "Formato de imagen no válido (usá PNG, JPG o WEBP)"

    return datos, tipo, None


# ================= RUTAS BASE =================

@app.route("/", methods=["GET"])
def inicio():
    return "El servidor del kiosco está funcionando."


# ================= AUTENTICACIÓN =================

@app.route("/api/registro", methods=["POST"])
def registro():
    data = request.get_json(silent=True) or {}
    nombre = (data.get("nombre") or "").strip()
    password = data.get("password") or ""
    curso = (data.get("curso") or "").strip()

    if not nombre or not password or not curso:
        return error("Completá todos los campos")
    if len(nombre) > 60:
        return error("El nombre es demasiado largo (máximo 60 caracteres)")
    if len(curso) > 40:
        return error("Curso inválido")
    if len(password) < 4:
        return error("La contraseña debe tener al menos 4 caracteres")

    if Usuario.query.filter_by(nombre=nombre).first():
        return error("Ese usuario ya existe", 409)

    usuario = Usuario(
        nombre=nombre,
        password_hash=generate_password_hash(password),
        curso=curso,
        rol="usuario",  # el rol admin se asigna a mano en la base
    )
    db.session.add(usuario)
    db.session.commit()

    return jsonify({"token": generar_token(usuario.id), "usuario": usuario.to_dict()}), 201


@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    nombre = (data.get("nombre") or "").strip()
    password = data.get("password") or ""

    if not nombre or not password:
        return error("Completá todos los campos")

    usuario = Usuario.query.filter_by(nombre=nombre).first()
    if not usuario or not check_password_hash(usuario.password_hash, password):
        return error("Usuario o contraseña incorrectos", 401)

    return jsonify({"token": generar_token(usuario.id), "usuario": usuario.to_dict()})


@app.route("/api/me", methods=["GET"])
@requiere_login
def me():
    return jsonify(g.usuario.to_dict())


# ================= PRODUCTOS (públicos) =================

@app.route("/api/productos", methods=["GET"])
def obtener_productos():
    mercado_negro = request.args.get("mercado_negro", "0") == "1"
    productos = (
        Producto.query.filter_by(activo=True, mercado_negro=mercado_negro)
        .order_by(Producto.id)
        .all()
    )
    return jsonify([p.to_dict() for p in productos])


@app.route("/api/productos/<int:producto_id>/imagen", methods=["GET"])
def imagen_producto(producto_id):
    producto = db.session.get(Producto, producto_id)
    if not producto or not producto.imagen_tipo or not producto.imagen_datos:
        return "", 404

    respuesta = Response(producto.imagen_datos, mimetype=producto.imagen_tipo)
    # La URL lleva ?v=<version>, así que se puede cachear fuerte sin riesgo de ver una imagen vieja
    respuesta.headers["Cache-Control"] = "public, max-age=31536000, immutable"
    return respuesta


# ================= PEDIDOS =================

@app.route("/api/pedido", methods=["POST"])
@requiere_login
def crear_pedido():
    data = request.get_json(silent=True) or {}
    items = data.get("items")

    if not isinstance(items, list) or not items:
        return error("El carrito está vacío")

    # Junta cantidades por producto (por si el mismo id llega repetido)
    cantidades = {}
    for item in items:
        try:
            producto_id = int(item.get("producto_id"))
            cantidad = int(item.get("cantidad"))
        except (TypeError, ValueError, AttributeError):
            return error("Datos del carrito inválidos")
        if cantidad <= 0:
            return error("Cantidad inválida")
        cantidades[producto_id] = cantidades.get(producto_id, 0) + cantidad

    # Bloquea las filas de esos productos hasta el commit: dos personas comprando
    # el último stock a la vez no pueden pisarse (la segunda espera y ve el stock real).
    productos = (
        Producto.query.filter(Producto.id.in_(list(cantidades.keys())))
        .order_by(Producto.id)
        .with_for_update()
        .all()
    )

    def fallar(mensaje, codigo=400):
        db.session.rollback()
        return error(mensaje, codigo)

    if len(productos) != len(cantidades) or any(not p.activo for p in productos):
        return fallar("Hay productos que ya no están disponibles")

    # Precio y stock se validan contra la base, nunca contra lo que mande el navegador
    total = 0
    for producto in productos:
        cantidad = cantidades[producto.id]
        if producto.stock < cantidad:
            return fallar(f"Sin stock suficiente de {producto.nombre}", 409)
        total += producto.precio * cantidad

    if total < PEDIDO_MINIMO:
        return fallar(f"El pedido mínimo es ${PEDIDO_MINIMO}")

    pedido = Pedido(
        codigo=generar_codigo_pedido(),
        usuario_id=g.usuario.id,
        total=total,
        estado="pendiente",
    )
    db.session.add(pedido)
    db.session.flush()  # para tener pedido.id

    for producto in productos:
        cantidad = cantidades[producto.id]
        producto.stock -= cantidad
        db.session.add(
            PedidoItem(
                pedido_id=pedido.id,
                producto_id=producto.id,
                cantidad=cantidad,
                precio_unitario=producto.precio,
            )
        )

    db.session.commit()
    return jsonify(pedido.to_dict()), 201


@app.route("/api/mis-pedidos", methods=["GET"])
@requiere_login
def mis_pedidos():
    pedidos = (
        Pedido.query.filter_by(usuario_id=g.usuario.id)
        .order_by(Pedido.creado_en.desc())
        .all()
    )
    return jsonify([p.to_dict() for p in pedidos])


# ================= ADMIN =================

@app.route("/api/admin/pedidos", methods=["GET"])
@requiere_login
@requiere_admin
def admin_pedidos():
    pedidos = Pedido.query.order_by(Pedido.creado_en.desc()).all()
    return jsonify([p.to_dict() for p in pedidos])


@app.route("/api/admin/pedidos/<int:pedido_id>/estado", methods=["POST"])
@requiere_login
@requiere_admin
def admin_cambiar_estado_pedido(pedido_id):
    data = request.get_json(silent=True) or {}
    nuevo_estado = data.get("estado")

    if nuevo_estado not in ESTADOS_PEDIDO:
        return error("Estado inválido")

    pedido = db.session.get(Pedido, pedido_id)
    if not pedido:
        return error("Pedido no encontrado", 404)

    pedido.estado = nuevo_estado
    db.session.commit()
    return jsonify(pedido.to_dict())


@app.route("/api/admin/productos", methods=["POST"])
@requiere_login
@requiere_admin
def admin_crear_producto():
    """Recibe multipart/form-data: nombre, categoria, precio, stock, mercado_negro, imagen (opcional)."""
    nombre = (request.form.get("nombre") or "").strip()
    categoria = request.form.get("categoria")
    mercado_negro = request.form.get("mercado_negro") in ("1", "true", "on")

    try:
        precio = int(request.form.get("precio"))
        stock = int(request.form.get("stock", "0"))
    except (TypeError, ValueError):
        return error("Precio y stock deben ser números")

    if not nombre or len(nombre) > 80:
        return error("Nombre inválido (1 a 80 caracteres)")
    if categoria not in CATEGORIAS:
        return error("Categoría inválida")
    if precio < 0 or stock < 0:
        return error("Precio y stock no pueden ser negativos")

    datos, tipo, msg = leer_imagen_del_request()
    if msg:
        return error(msg)

    producto = Producto(
        nombre=nombre,
        categoria=categoria,
        precio=precio,
        stock=stock,
        mercado_negro=mercado_negro,
    )
    if datos:
        producto.imagen_datos = datos
        producto.imagen_tipo = tipo
        producto.imagen_version = 1

    db.session.add(producto)
    db.session.commit()
    return jsonify(producto.to_dict()), 201


@app.route("/api/admin/productos/<int:producto_id>/stock", methods=["POST"])
@requiere_login
@requiere_admin
def admin_reponer_stock(producto_id):
    data = request.get_json(silent=True) or {}
    try:
        cantidad = int(data.get("stock"))
    except (TypeError, ValueError):
        return error("Cantidad de stock inválida")

    if cantidad < 0:
        return error("El stock no puede ser negativo")

    producto = db.session.get(Producto, producto_id)
    if not producto:
        return error("Producto no encontrado", 404)

    producto.stock = cantidad
    db.session.commit()
    return jsonify(producto.to_dict())


@app.route("/api/admin/productos/<int:producto_id>/imagen", methods=["POST"])
@requiere_login
@requiere_admin
def admin_cambiar_imagen(producto_id):
    """Recibe multipart/form-data con el campo 'imagen'."""
    producto = db.session.get(Producto, producto_id)
    if not producto:
        return error("Producto no encontrado", 404)

    datos, tipo, msg = leer_imagen_del_request()
    if msg:
        return error(msg)
    if not datos:
        return error("No se envió ninguna imagen")

    producto.imagen_datos = datos
    producto.imagen_tipo = tipo
    producto.imagen_version = (producto.imagen_version or 0) + 1
    db.session.commit()
    return jsonify(producto.to_dict())


# ================= ARRANQUE LOCAL =================

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, host="0.0.0.0", port=port)