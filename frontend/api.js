
/* Envuelve fetch: agrega el token de sesión y traduce errores del backend
   en un mensaje legible (data.error). Acepta JSON o FormData (subida de archivos). */
async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("token");

  const headers = { ...(options.headers || {}) };

  // Con FormData el navegador pone solo el Content-Type correcto (multipart + boundary)
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = "Bearer " + token;
  }

  let res;
  try {
    res = await fetch(API_BASE_URL + path, { ...options, headers });
  } catch (e) {
    throw new Error("No se pudo conectar con el servidor. ¿Está prendido el backend?");
  }

  let data = {};
  try {
    data = await res.json();
  } catch (e) {
    /* respuesta sin cuerpo JSON, se ignora */
  }

  if (!res.ok) {
    throw new Error(data.error || "Ocurrió un error inesperado");
  }

  return data;
}

/* Escapa texto antes de meterlo en innerHTML (evita que un nombre de usuario
   con <etiquetas> se ejecute como código en el navegador del admin). */
function escaparHtml(texto) {
  return String(texto ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));
}