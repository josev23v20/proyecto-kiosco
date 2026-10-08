

/* ================= SESIÓN ================= */

function guardarSesion(token, usuario) {
  localStorage.setItem("token", token);
  localStorage.setItem("usuario", JSON.stringify(usuario));
}

function obtenerUsuario() {
  const raw = localStorage.getItem("usuario");
  return raw ? JSON.parse(raw) : null;
}

function cerrarSesion() {
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");
  window.location.href = "login.html";
}

/* Redirige según corresponda y devuelve el usuario si la página puede mostrarse.
   - Sin sesión fuera de login.html -> manda a login.html
   - Con sesión en login.html -> manda a index.html
   Se llama al cargar cada página. */
function protegerPagina() {
  const usuario = obtenerUsuario();
  const token = localStorage.getItem("token");
  const enLogin = window.location.pathname.toLowerCase().includes("login");

  if ((!usuario || !token) && !enLogin) {
    window.location.href = "login.html";
    return null;
  }

  if (usuario && token && enLogin) {
    window.location.href = "index.html";
    return null;
  }

  return usuario;
}

function mostrarBarraUsuario(usuario) {
  const el = document.getElementById("userStatus");
  if (!el || !usuario) return;

  el.innerHTML = `
    <div class="alert alert-dark shadow-sm d-flex flex-column flex-md-row justify-content-between align-items-center mb-4">
      <div>
        <strong>Cuenta activa:</strong> ${usuario.nombre}
        <span class="text-muted">(${usuario.curso})</span>
      </div>
      <div>
        ${usuario.rol === "admin" ? '<a href="admin.html" class="btn btn-outline-light btn-sm me-2">Panel admin</a>' : ""}
        <button class="btn btn-outline-light btn-sm mt-2 mt-md-0" onclick="cerrarSesion()">Cerrar sesión</button>
      </div>
    </div>
  `;
}

/* ================= LOGIN / REGISTRO (login.html) ================= */

async function login() {
  const nombre = document.getElementById("nombre").value.trim();
  const password = document.getElementById("password").value;

  if (!nombre || !password) {
    alert("Completá todos los campos");
    return;
  }

  try {
    const data = await apiFetch("/api/login", {
      method: "POST",
      body: JSON.stringify({ nombre, password }),
    });
    guardarSesion(data.token, data.usuario);
    window.location.href = "index.html";
  } catch (e) {
    alert(e.message);
  }
}

async function registrarse() {
  const nombre = document.getElementById("nombre").value.trim();
  const password = document.getElementById("password").value;
  const passwordConfirm = document.getElementById("passwordConfirm").value;
  const curso = document.getElementById("curso").value;

  if (!nombre || !password || !passwordConfirm || !curso) {
    alert("Completá todos los campos para registrarte");
    return;
  }

  if (password !== passwordConfirm) {
    alert("Las contraseñas no coinciden. Por favor, verificá ambas.");
    return;
  }

  try {
    const data = await apiFetch("/api/registro", {
      method: "POST",
      body: JSON.stringify({ nombre, password, curso }),
    });
    guardarSesion(data.token, data.usuario);
    window.location.href = "index.html";
  } catch (e) {
    alert(e.message);
  }
}