
"""
Carga los productos iniciales (17 de la tienda + 3 del Mercado Negro).
Se puede correr varias veces: si un producto ya existe, no lo duplica.
Las imágenes se suben después desde el panel de admin.

Uso (parado en la carpeta backend):
    python seed.py
"""

from app import app
from models import Producto, db

PRODUCTOS_TIENDA = [
    ("Pitusas frutilla", "galleta", 1500, 5),
    ("Pitusas chocolate", "galleta", 1500, 5),
    ("Pitusas vainilla", "galleta", 1500, 5),
    ("Baggio", "bebida", 1000, 10),
    ("Alfajor", "golosina", 500, 20),
    ("Pico dulce", "golosina", 500, 5),
    ("Chupetin", "golosina", 500, 20),
    ("Pipas", "snack", 1000, 5),
    ("Palitos salados", "snack", 1500, 5),
    ("Caramelo", "golosina", 100, 5),
    ("Beldent", "golosina", 1000, 10),
    ("Mini alfajores", "golosina", 2000, 5),
    ("Turrones", "golosina", 500, 10),
    ("Suavecitas", "galleta", 1500, 5),
    ("Donsatur salado", "galleta", 1500, 5),
    ("Don satur dulce", "galleta", 1500, 5),
    ("Saladix", "snack", 1000, 5),
]

PRODUCTOS_MERCADO_NEGRO = [
    ("Tortilla", "snack", 2000, 4),
    ("Saquitos de cafe", "bebida", 500, 5),
    ("Pebetes", "snack", 2000, 5),
]


def cargar():
    with app.app_context():
        db.create_all()
        creados = 0

        for lista, es_negro in ((PRODUCTOS_TIENDA, False), (PRODUCTOS_MERCADO_NEGRO, True)):
            for nombre, categoria, precio, stock in lista:
                existe = Producto.query.filter_by(nombre=nombre, mercado_negro=es_negro).first()
                if existe:
                    continue
                db.session.add(
                    Producto(
                        nombre=nombre,
                        categoria=categoria,
                        precio=precio,
                        stock=stock,
                        mercado_negro=es_negro,
                    )
                )
                creados += 1

        db.session.commit()
        print(f"Listo. Productos nuevos creados: {creados}")


if __name__ == "__main__":
    cargar()