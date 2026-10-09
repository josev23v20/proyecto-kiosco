
const MAX_IMAGEN_BYTES = 2 * 1024 * 1024;
const TIPOS_IMAGEN = ["image/png", "image/jpeg", "image/webp"];

let usuarioActual = null;
let productosAdmin = [];
let productoParaImagen = null;

document.addEventListener("DOMContentLoaded", async () => {
  usuarioActual = protegerPagina();
  if (!usuarioActual) return;

  if (usuarioActual.rol !== "admin") {
    alert("No tenés acceso a esta sección");
    window.location.href = "index.html";
    return;
  }

  mostrarBarraUsuario(usuarioActual);

  document.getElementById("form-nuevo-producto").addEventListener("submit", crearProducto);
  document.getElementById("np-imagen").addEventListener("change", previsualizarImagen);
  document.getElementById("input-cambiar-imagen").addEventListener("change", subirImagenExistente);

  // Un solo listener para todos los botones de la tabla (evita meter nombres dentro de onclick)
  document.getElementById("tabla-productos").addEventListener("click", (e) => {
    const boton = e.target.closest("button[data-accion]");
    if (!boton) return;
    const producto = productosAdmin.find((p) => p.id === Number(boton.dataset.id));
    if (!producto) return;
    if (boton.dataset.accion === "stock") reponerStock(producto);
    if (boton.dataset.accion === "imagen") elegirImagen(producto);
  });

  document.getElementById("tabla-pedidos").addEventListener("change", (e) => {
    const select = e.target.closest("select[data-pedido]");
    if (select) cambiarEstadoPedido(Number(select.dataset.pedido), select.value);
  });

  await cargarPedidos();
  await cargarProductos();
});

/* ================= PEDIDOS ================= */

async function cargarPedidos() {
  try {
    renderPedidos(await apiFetch("/api/admin/pedidos"));
  } catch (e) {
    alert(e.message);
  }
}

function renderPedidos(pedidos) {
  const tbody = document.getElementById("tabla-pedidos");
  tbody.innerHTML = "";

  if (pedidos.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">Todavía no hay pedidos</td></tr>`;
    return;
  }

  pedidos.forEach((p) => {
    const detalle = p.items.map((i) => `${escaparHtml(i.nombre)} x${i.cantidad}`).join(", ");
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escaparHtml(p.codigo)}</td>
      <td>${escaparHtml(p.usuario)} <span class="text-muted">(${escaparHtml(p.curso)})</span></td>
      <td>${detalle}</td>
      <td>$${p.total}</td>
      <td>
        <select class="form-select form-select-sm" data-pedido="${p.id}">
          <option value="pendiente" ${p.estado === "pendiente" ? "selected" : ""}>Pendiente</option>
          <option value="entregado" ${p.estado === "entregado" ? "selected" : ""}>Entregado</option>
          <option value="cancelado" ${p.estado === "cancelado" ? "selected" : ""}>Cancelado</option>
        </select>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

async function cambiarEstadoPedido(pedidoId, estado) {
  try {
    await apiFetch(`/api/admin/pedidos/${pedidoId}/estado`, {
      method: "POST",
      body: JSON.stringify({ estado }),
    });
  } catch (e) {
    alert(e.message);
    await cargarPedidos(); // revierte el select si falló
  }
}

/* ================= PRODUCTOS ================= */

async function cargarProductos() {
  try {
    const normales = await apiFetch("/api/productos?mercado_negro=0");
    const negros = await apiFetch("/api/productos?mercado_negro=1");
    productosAdmin = [...normales, ...negros];
    renderProductos();
  } catch (e) {
    alert(e.message);
  }
}

function renderProductos() {
  const tbody = document.getElementById("tabla-productos");
  tbody.innerHTML = "";

  productosAdmin.forEach((p) => {
    const imagen = p.imagen_url
      ? `<img class="miniatura" src="${API_BASE_URL}${p.imagen_url}" alt="">`
      : `<div class="miniatura-vacia">Sin imagen</div>`;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${imagen}</td>
      <td>${escaparHtml(p.nombre)} ${p.mercado_negro ? '<span class="badge bg-dark">Mercado Negro</span>' : ""}</td>
      <td>${escaparHtml(p.categoria)}</td>
      <td>$${p.precio}</td>
      <td>${p.stock}</td>
      <td class="text-nowrap">
        <button class="btn btn-sm btn-secondary" data-accion="stock" data-id="${p.id}">Reponer</button>
        <button class="btn btn-sm btn-outline-secondary" data-accion="imagen" data-id="${p.id}">Cambiar imagen</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

async function reponerStock(producto) {
  const cantidad = prompt("Nueva cantidad de stock para " + producto.nombre + ":", producto.stock);
  if (cantidad === null) return;

  const valor = parseInt(cantidad, 10);
  if (isNaN(valor) || valor < 0) {
    alert("Cantidad inválida");
    return;
  }

  try {
    await apiFetch(`/api/admin/productos/${producto.id}/stock`, {
      method: "POST",
      body: JSON.stringify({ stock: valor }),
    });
    await cargarProductos();
  } catch (e) {
    alert(e.message);
  }
}

/* ================= IMÁGENES ================= */

function validarImagen(archivo) {
  if (!TIPOS_IMAGEN.includes(archivo.type)) {
    return "Formato no válido. Usá PNG, JPG o WEBP.";
  }
  if (archivo.size > MAX_IMAGEN_BYTES) {
    return "La imagen supera el máximo de 2 MB.";
  }
  return null;
}

function previsualizarImagen(event) {
  const preview = document.getElementById("np-preview");
  const archivo = event.target.files[0];

  if (!archivo) {
    preview.style.display = "none";
    return;
  }

  const problema = validarImagen(archivo);
  if (problema) {
    alert(problema);
    event.target.value = "";
    preview.style.display = "none";
    return;
  }

  preview.src = URL.createObjectURL(archivo);
  preview.style.display = "block";
}

function elegirImagen(producto) {
  productoParaImagen = producto;
  const input = document.getElementById("input-cambiar-imagen");
  input.value = "";
  input.click();
}

async function subirImagenExistente(event) {
  const archivo = event.target.files[0];
  if (!archivo || !productoParaImagen) return;

  const problema = validarImagen(archivo);
  if (problema) {
    alert(problema);
    return;
  }

  const formData = new FormData();
  formData.append("imagen", archivo);

  try {
    await apiFetch(`/api/admin/productos/${productoParaImagen.id}/imagen`, {
      method: "POST",
      body: formData,
    });
    await cargarProductos();
  } catch (e) {
    alert(e.message);
  } finally {
    productoParaImagen = null;
  }
}

/* ================= ALTA DE PRODUCTO ================= */

async function crearProducto(event) {
  event.preventDefault();

  const nombre = document.getElementById("np-nombre").value.trim();
  const categoria = document.getElementById("np-categoria").value;
  const precio = document.getElementById("np-precio").value;
  const stock = document.getElementById("np-stock").value;
  const mercadoNegro = document.getElementById("np-mercado").checked;
  const archivo = document.getElementById("np-imagen").files[0];

  if (!nombre || !categoria || precio === "" || stock === "") {
    alert("Completá todos los campos del producto");
    return;
  }

  const formData = new FormData();
  formData.append("nombre", nombre);
  formData.append("categoria", categoria);
  formData.append("precio", precio);
  formData.append("stock", stock);
  formData.append("mercado_negro", mercadoNegro ? "1" : "0");
  if (archivo) formData.append("imagen", archivo);

  const boton = document.getElementById("np-guardar");
  boton.disabled = true;

  try {
    await apiFetch("/api/admin/productos", { method: "POST", body: formData });

    document.getElementById("form-nuevo-producto").reset();
    document.getElementById("np-preview").style.display = "none";
    bootstrap.Modal.getInstance(document.getElementById("modalNuevoProducto")).hide();

    await cargarProductos();
  } catch (e) {
    alert(e.message);
  } finally {
    boton.disabled = false;
  }
}