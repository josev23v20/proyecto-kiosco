
let usuarioActual = null;

document.addEventListener("DOMContentLoaded", async () => {
  usuarioActual = protegerPagina();
  if (!usuarioActual) return;

  if (usuarioActual.rol !== "admin") {
    alert("No tenés acceso a esta sección");
    window.location.href = "index.html";
    return;
  }

  mostrarBarraUsuario(usuarioActual);

  await cargarPedidos();
  await cargarProductos();

  document.getElementById("form-nuevo-producto").addEventListener("submit", crearProducto);
});

/* ================= PEDIDOS ================= */

async function cargarPedidos() {
  try {
    const pedidos = await apiFetch("/api/admin/pedidos");
    renderPedidos(pedidos);
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
    const detalle = p.items.map((i) => `${i.nombre} x${i.cantidad}`).join(", ");
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.codigo}</td>
      <td>${p.usuario} <span class="text-muted">(${p.curso})</span></td>
      <td>${detalle}</td>
      <td>$${p.total}</td>
      <td>
        <select class="form-select form-select-sm" onchange="cambiarEstadoPedido(${p.id}, this.value)">
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
    renderProductos([...normales, ...negros]);
  } catch (e) {
    alert(e.message);
  }
}

function renderProductos(productos) {
  const tbody = document.getElementById("tabla-productos");
  tbody.innerHTML = "";

  productos.forEach((p) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.nombre} ${p.mercado_negro ? '<span class="badge bg-dark">Mercado Negro</span>' : ""}</td>
      <td>${p.categoria}</td>
      <td>$${p.precio}</td>
      <td>${p.stock}</td>
      <td>
        <button class="btn btn-sm btn-secondary" onclick="reponerStock(${p.id}, '${p.nombre.replace(/'/g, "\\'")}', ${p.stock})">
          Reponer
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

async function reponerStock(productoId, nombre, stockActual) {
  const cantidad = prompt("Nueva cantidad de stock para " + nombre + ":", stockActual);
  if (cantidad === null) return;

  const valor = parseInt(cantidad, 10);
  if (isNaN(valor) || valor < 0) {
    alert("Cantidad inválida");
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

async function crearProducto(event) {
  event.preventDefault();

  const nombre = document.getElementById("np-nombre").value.trim();
  const categoria = document.getElementById("np-categoria").value;
  const precio = parseInt(document.getElementById("np-precio").value, 10);
  const stock = parseInt(document.getElementById("np-stock").value, 10);
  const mercadoNegro = document.getElementById("np-mercado").checked;

  if (!nombre || !categoria || isNaN(precio) || isNaN(stock)) {
    alert("Completá todos los campos del producto");
    return;
  }

  try {
    await apiFetch("/api/admin/productos", {
      method: "POST",
      body: JSON.stringify({ nombre, categoria, precio, stock, mercado_negro: mercadoNegro }),
    });
    document.getElementById("form-nuevo-producto").reset();
    await cargarProductos();
  } catch (e) {
    alert(e.message);
  }
}