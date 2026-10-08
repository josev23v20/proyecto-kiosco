
/* Envuelve fetch: agrega el token de sesión y traduce errores del backend
   en un mensaje legible (data.error). */
async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

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