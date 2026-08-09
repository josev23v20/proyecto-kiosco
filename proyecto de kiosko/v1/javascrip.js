let total = 0;

function agregar(nombre, precio) {
  const lista = document.getElementById("lista-carrito");
  const totalElemento = document.getElementById("total");

  const item = document.createElement("li");
  item.textContent = nombre + " - $" + precio;

  lista.appendChild(item);

  total += precio;
  totalElemento.textContent = total;
}
function toggleMenu() {
  const menu = document.getElementById("menu-opciones");
  menu.style.display = menu.style.display === "block" ? "none" : "block";
}