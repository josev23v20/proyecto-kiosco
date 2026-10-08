
/* Esta página debe definir "const MERCADO_NEGRO = true/false;"
   ANTES de incluir este script. */

const PEDIDO_MINIMO = 2000;

let usuarioActual = null;
let productosCache = [];
let carrito = []; // [{producto_id, nombre, precio, cantidad}]
let productoActualId = null;

document.addEventListener("DOMContentLoaded", async () => {
  usuarioActual = protegerPagina();
  if (!usuarioActual) return; // protegerPagina ya redirigió

  mostrarBarraUsuario(usuarioActual);

  const contenido = document.getElementById("contenido");
  if (contenido) contenido.style.display = "block";

  await cargarProductos();
});

/* ================= PRODUCTOS ================= */

async function cargarProductos() {
  try {
    const query = MERCADO_NEGRO ? "?mercado_negro=1" : "?mercado_negro=0";
    productosCache = await apiFetch("/api/productos" + query);
    renderProductos(productosCache);
  } catch (e) {
    alert("No se pudieron cargar los productos: " + e.message);
  }
}

function renderProductos(productos) {
  const contenedor = document.getElementById("contenedor-productos");
  if (!contenedor) return;
  contenedor.innerHTML = "";

  productos.forEach((p) => {
    const col = document.createElement("div");
    col.className = "col-md-4 producto";
    col.dataset.categoria = p.categoria;

    const imagenHtml = p.imagen
      ? `<img src="${p.imagen}" class="card-img-top" alt="${p.nombre}">`
      : `<div class="sin-imagen">Sin imagen</div>`;

    col.innerHTML = `
      <div class="card producto-card">
        ${imagenHtml}
        <div class="card-body text-center">
          <h5>${p.nombre}</h5>
          <p class="precio">$${p.precio}</p>
          <p class="stock-label">${p.stock > 0 ? "Stock: " + p.stock : "SIN STOCK"}</p>
          <button class="btn btn-outline-dark" onclick="verProducto(${p.id})">Ver</button>
          <button class="btn btn-danger w-100" ${p.stock <= 0 ? "disabled" : ""} onclick="agregar(${p.id})">Agregar</button>
        </div>
      </div>
    `;
    contenedor.appendChild(col);
  });

  if (usuarioActual && usuarioActual.rol === "admin") {
    agregarBotonesReponer();
  }
}

/* ================= MODAL "VER" ================= */

function verProducto(productoId) {
  const p = productosCache.find((x) => x.id === productoId);
  if (!p) return;

  productoActualId = productoId;

  document.getElementById("tituloProducto").textContent = p.nombre;
  document.getElementById("precioProducto").textContent = "Precio: $" + p.precio;

  const stockEl = document.getElementById("stockProducto");
  if (stockEl) {
    stockEl.textContent = p.stock > 0 ? "Stock: " + p.stock : "SIN STOCK";
  }

  new bootstrap.Modal(document.getElementById("modalProducto")).show();
}

function agregarDesdeModal() {
  if (productoActualId) agregar(productoActualId);
}

/* ================= CARRITO ================= */

function agregar(productoId) {
  const producto = productosCache.find((p) => p.id === productoId);
  if (!producto) return;

  if (producto.stock <= 0) {
    alert("Sin stock");
    return;
  }

  const item = carrito.find((i) => i.producto_id === productoId);
  const cantidadEnCarrito = item ? item.cantidad : 0;

  if (cantidadEnCarrito + 1 > producto.stock) {
    alert("No hay más stock disponible de " + producto.nombre);
    return;
  }

  if (item) {
    item.cantidad++;
  } else {
    carrito.push({
      producto_id: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      cantidad: 1,
    });
  }

  renderCarrito();
}

function quitarDelCarrito(productoId) {
  carrito = carrito.filter((i) => i.producto_id !== productoId);
  renderCarrito();
}

function renderCarrito() {
  const lista = document.getElementById("lista-carrito");
  if (!lista) return;
  lista.innerHTML = "";

  let total = 0;
  carrito.forEach((item) => {
    total += item.precio * item.cantidad;
    const li = document.createElement("li");
    li.className = "d-flex justify-content-between align-items-center";
    li.innerHTML = `
      <span>${item.nombre} x${item.cantidad} - $${item.precio * item.cantidad}</span>
      <button class="btn btn-sm btn-outline-danger ms-2" onclick="quitarDelCarrito(${item.producto_id})">x</button>
    `;
    lista.appendChild(li);
  });

  document.getElementById("total").textContent = total;
}

async function finalizarCompra() {
  const total = carrito.reduce((acc, i) => acc + i.precio * i.cantidad, 0);

  if (carrito.length === 0) {
    alert("El carrito está vacío");
    return;
  }

  if (total < PEDIDO_MINIMO) {
    alert("Pedido mínimo $" + PEDIDO_MINIMO);
    return;
  }

  try {
    const items = carrito.map((i) => ({
      producto_id: i.producto_id,
      cantidad: i.cantidad,
    }));

    const pedido = await apiFetch("/api/pedido", {
      method: "POST",
      body: JSON.stringify({ items }),
    });

    alert("Pedido realizado: " + pedido.codigo);

    carrito = [];
    renderCarrito();
    await cargarProductos(); // refresca el stock mostrado
  } catch (e) {
    alert("No se pudo completar el pedido: " + e.message);
  }
}

/* ================= FILTROS ================= */

function filtrarCategoria(cat) {
  document.querySelectorAll(".producto").forEach((p) => {
    p.style.display = cat === "todos" || p.dataset.categoria === cat ? "block" : "none";
  });
}

function filtrarProductos() {
  const texto = document.getElementById("buscador").value.toLowerCase();
  document.querySelectorAll(".producto").forEach((p) => {
    p.style.display = p.innerText.toLowerCase().includes(texto) ? "block" : "none";
  });
}

/* ================= ADMIN: reponer stock desde la tienda ================= */

function agregarBotonesReponer() {
  document.querySelectorAll(".producto").forEach((card) => {
    if (card.querySelector(".btn-reponer")) return;

    const nombre = card.querySelector("h5").innerText.trim();
    const producto = productosCache.find((p) => p.nombre === nombre);
    if (!producto) return;

    const footer = card.querySelector(".card-body");
    const boton = document.createElement("button");
    boton.className = "btn btn-secondary btn-sm w-100 mt-2 btn-reponer";
    boton.textContent = "Reponer";
    boton.onclick = () => reponerProducto(producto.id, producto.nombre, producto.stock);
    footer.appendChild(boton);
  });
}

async function reponerProducto(productoId, nombre, stockActual) {
  const cantidad = prompt("Ingrese nueva cantidad de stock para " + nombre + ":", stockActual);
  if (cantidad === null) return;

  const valor = parseInt(cantidad, 10);
  if (isNaN(valor) || valor < 0) {
    alert("Ingresá una cantidad válida de stock.");
    return;
  }

  try {
    await apiFetch(`/api/admin/productos/${productoId}/stock`, {
      method: "POST",
      body: JSON.stringify({ stock: valor }),
    });
    await cargarProductos();
  } catch (e) {
    alert(e.message);
  }
}