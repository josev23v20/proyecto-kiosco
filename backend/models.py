
from datetime import datetime, timezone

from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import deferred

db = SQLAlchemy()


def ahora():
    """Fecha/hora actual en UTC (sin zona, como la guarda Postgres)."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


class Usuario(db.Model):
    __tablename__ = "usuarios"

    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(60), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    curso = db.Column(db.String(40), nullable=False)
    rol = db.Column(db.String(10), nullable=False, default="usuario")  # "usuario" o "admin"
    creado_en = db.Column(db.DateTime, default=ahora)

    pedidos = db.relationship("Pedido", backref="usuario", lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "nombre": self.nombre,
            "curso": self.curso,
            "rol": self.rol,
        }


class Producto(db.Model):
    __tablename__ = "productos"

    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(80), nullable=False)
    categoria = db.Column(db.String(20), nullable=False)  # galleta, bebida, golosina, snack
    precio = db.Column(db.Integer, nullable=False)
    stock = db.Column(db.Integer, nullable=False, default=0)
    mercado_negro = db.Column(db.Boolean, nullable=False, default=False)
    activo = db.Column(db.Boolean, nullable=False, default=True)

    # Imagen guardada directamente en la base (BYTEA en Postgres).
    # "deferred": los bytes NO se leen al listar productos, solo cuando se pide la imagen.
    imagen_datos = deferred(db.Column(db.LargeBinary, nullable=True))
    imagen_tipo = db.Column(db.String(30), nullable=True)  # image/png, image/jpeg, image/webp
    imagen_version = db.Column(db.Integer, nullable=False, default=0)  # sube con cada cambio (evita caché vieja)

    def to_dict(self):
        imagen_url = None
        if self.imagen_tipo:
            imagen_url = f"/api/productos/{self.id}/imagen?v={self.imagen_version}"

        return {
            "id": self.id,
            "nombre": self.nombre,
            "categoria": self.categoria,
            "precio": self.precio,
            "stock": self.stock,
            "mercado_negro": self.mercado_negro,
            "imagen_url": imagen_url,
        }


class Pedido(db.Model):
    __tablename__ = "pedidos"

    id = db.Column(db.Integer, primary_key=True)
    codigo = db.Column(db.String(20), unique=True, nullable=False)
    usuario_id = db.Column(db.Integer, db.ForeignKey("usuarios.id"), nullable=False)
    total = db.Column(db.Integer, nullable=False)
    estado = db.Column(db.String(15), nullable=False, default="pendiente")  # pendiente, entregado, cancelado
    observaciones = db.Column(db.String(200), nullable=True)  # reservado: horario de retiro (pendiente)
    creado_en = db.Column(db.DateTime, default=ahora)

    items = db.relationship("PedidoItem", backref="pedido", lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "codigo": self.codigo,
            "usuario": self.usuario.nombre if self.usuario else None,
            "curso": self.usuario.curso if self.usuario else None,
            "total": self.total,
            "estado": self.estado,
            "creado_en": self.creado_en.isoformat() if self.creado_en else None,
            "items": [item.to_dict() for item in self.items],
        }


class PedidoItem(db.Model):
    __tablename__ = "pedido_items"

    id = db.Column(db.Integer, primary_key=True)
    pedido_id = db.Column(db.Integer, db.ForeignKey("pedidos.id"), nullable=False)
    producto_id = db.Column(db.Integer, db.ForeignKey("productos.id"), nullable=False)
    cantidad = db.Column(db.Integer, nullable=False)
    precio_unitario = db.Column(db.Integer, nullable=False)

    producto = db.relationship("Producto")

    def to_dict(self):
        return {
            "producto_id": self.producto_id,
            "nombre": self.producto.nombre if self.producto else None,
            "cantidad": self.cantidad,
            "precio_unitario": self.precio_unitario,
        }