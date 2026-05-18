let total = 0;
let minimo = 2000;

let productoActual = "";
let precioActual = 0;

let stock = {
  "Galletitas": 5,
  "Gaseosa": 5,
  "Chocolate": 5
};

function actualizarStock() {
  for (let p in stock) {
    let elemento = document.getElementById("stock-" + p);

    if (stock[p] > 0) {
      elemento.textContent = "Stock: " + stock[p];
      elemento.classList.remove("sin-stock");
    } else {
      elemento.textContent = "SIN STOCK";
      elemento.classList.add("sin-stock");
    }
  }
}

function agregar(nombre, precio) {
  if (stock[nombre] <= 0) {
    alert("Sin stock");
    return;
  }

  const lista = document.getElementById("lista-carrito");
  const item = document.createElement("li");
  item.textContent = nombre + " - $" + precio;

  lista.appendChild(item);

  total += precio;
  document.getElementById("total").textContent = total;

  stock[nombre]--;
  actualizarStock();
}

function verProducto(nombre, precio) {
  productoActual = nombre;
  precioActual = precio;

  document.getElementById("tituloProducto").textContent = nombre;
  document.getElementById("precioProducto").textContent = "Precio: $" + precio;

  let modal = new bootstrap.Modal(document.getElementById('modalProducto'));
  modal.show();
}

function agregarDesdeModal() {
  agregar(productoActual, precioActual);
}

function finalizarCompra() {
  if (total < minimo) {
    alert("Pedido mínimo $" + minimo);
    return;
  }

  let numero = "PED-" + Math.floor(Math.random() * 100000);
  alert("Pedido: " + numero);

  document.getElementById("lista-carrito").innerHTML = "";
  total = 0;
  document.getElementById("total").textContent = total;
}

// 🔥 MERCADO NEGRO CON MODO OSCURO
function mercadoNegro() {
  let clave = prompt("Clave:");

  if (clave === "negro123") {

    document.body.classList.remove("tema-claro");
    document.body.classList.add("tema-oscuro");

    alert("Entraste al mercado negro");

    agregar("Producto ilegal", 500);

  } else {
    alert("Acceso denegado");
  }
}

actualizarStock();