
from flask import Flask, jsonify
from flask_cors import CORS
import pymysql

app = Flask(__name__)
# CORS permite que tu HTML/JS (que correrá en otro puerto) se comunique con este servidor Python
CORS(app) 

# Función para conectarse a tu MariaDB
def conectar_db():
    return pymysql.connect(
        host='localhost',
        user='root',
        password='', # <-- Cambia esto por la contraseña de tu MariaDB
        database='kiosco',
        cursorclass=pymysql.cursors.DictCursor # Devuelve los datos como diccionarios, ideal para JSON
    )

# Ruta base de prueba
@app.route('/', methods=['GET'])
def inicio():
    return "¡El servidor del kiosco está funcionando!"

# Ruta para pedir los productos (Tu JS llamará a esta ruta)
@app.route('/api/productos', methods=['GET'])
def obtener_productos():
    try:
        conexion = conectar_db()
        cursor = conexion.cursor()
        
        # Ejecutamos la consulta SQL
        cursor.execute("SELECT * FROM productos")
        productos = cursor.fetchall() # Trae todos los resultados
        
        conexion.close()
        
        # Convertimos los datos de MariaDB a formato JSON para enviarlos al Frontend
        return jsonify(productos)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Arranca el servidor
if __name__ == '__main__':
    print("Iniciando el backend en http://localhost:5000")
    app.run(debug=True, port=5000)
