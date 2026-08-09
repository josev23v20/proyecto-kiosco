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
    let el = document.getElementById("stock-" + p);
    el.textContent = stock[p] > 0 ? "Stock: " + stock[p] : "SIN STOCK";
  }
}

function agregar(nombre, precio) {
  if (stock[nombre] <= 0) {
    alert("Sin stock");
    return;
  }

  let lista = document.getElementById("lista-carrito");
  let item = document.createElement("li");
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

  new bootstrap.Modal(document.getElementById('modalProducto')).show();
}

function agregarDesdeModal() {
  agregar(productoActual, precioActual);
}

function finalizarCompra() {
  if (total < minimo) {
    alert("Pedido mínimo $" + minimo);
    return;
  }

  alert("Pedido: PED-" + Math.floor(Math.random() * 100000));

  document.getElementById("lista-carrito").innerHTML = "";
  total = 0;
  document.getElementById("total").textContent = total;
}

// FILTROS
function filtrarCategoria(cat) {
  document.querySelectorAll(".producto").forEach(p => {
    p.style.display = (cat === "todos" || p.dataset.categoria === cat) ? "block" : "none";
  });
}

function filtrarProductos() {
  let texto = document.getElementById("buscador").value.toLowerCase();

  document.querySelectorAll(".producto").forEach(p => {
    p.style.display = p.innerText.toLowerCase().includes(texto) ? "block" : "none";
  });
}

// MERCADO NEGRO MODO DIOS
function mercadoNegro() {

  document.getElementById("sonidoSecreto").play();

  document.body.classList.remove("tema-claro");
  document.body.classList.add("tema-oscuro", "fade");

  document.querySelector("header h1").textContent = "☠ MERCADO NEGRO";

  document.getElementById("contenedor-productos").innerHTML = `
    <div class="col-md-4">
      <div class="card producto-card">
        <img src="https://via.placeholder.com/300x200/000/ff0000?text=ILEGAL">
        <div class="card-body text-center">
          <h5>Producto ilegal</h5>
          <p class="precio">$500</p>
          <button class="btn btn-danger" onclick="agregar('Ilegal',500)">Comprar</button>
        </div>
      </div>
    </div>

    <div class="col-md-4">
      <div class="card producto-card">
        <img src="https://via.placeholder.com/300x200/000/00ff00?text=SECRETO">
        <div class="card-body text-center">
          <h5>Combo secreto</h5>
          <p class="precio">$2000</p>
          <button class="btn btn-danger" onclick="agregar('Combo',2000)">Comprar</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById("zona-boton").innerHTML = `
    <button class="btn btn-success" onclick="location.reload()">🔙 Volver</button>
  `;
}

actualizarStock();