

let total = 0; /*nose */

let minimo = 2000;

let productoActual = "";

let precioActual = 0;

let usuarios = JSON.parse(localStorage.getItem("usuarios")) || {
    "admin": { password: "1234", curso: "", rol: "admin" }
};

function guardarUsuarios(){
    localStorage.setItem(
        "usuarios",
        JSON.stringify(usuarios)
    );
}

guardarUsuarios();

/* STOCK */

let stock = JSON.parse(localStorage.getItem("stock")) || {

    "Galletitas":5,
    "Gaseosa":5,
    "Chocolate":5

};


function cerrarSesion() {
    /*
    window.addEventListener("pageshow", function(event) {
       if (!localStorage.getItem("usuarioLogueado")) {
           window.location.replace("login.html");
       }
    });
    */

    localStorage.removeItem("usuarioLogueado");

    alert("Sesión cerrada correctamente");
    
    window.location.replace("login.html");

  //  window.location.href = "login.html";

}



/* ACTUALIZAR STOCK */

function actualizarStock(){

    for(let p in stock){

        document.querySelectorAll(".stock-" + p)
        .forEach(el => {

            el.textContent =
            stock[p] > 0
            ? "Stock: " + stock[p]
            : "SIN STOCK";

        });

    }

}

/* GUARDAR STOCK */

function guardarStock(){

    localStorage.setItem(
    "stock",
    JSON.stringify(stock)
    );

}

/* AGREGAR */

function agregar(nombre,precio){

    if(stock[nombre] <= 0){

        alert("Sin stock");

        return;

    }

    let lista =
    document.getElementById("lista-carrito");

    let item =
    document.createElement("li");

    item.textContent =
    nombre + " - $" + precio;

    lista.appendChild(item);

    total += precio;

    document.getElementById("total")
    .textContent = total;

    stock[nombre]--;

    guardarStock();

    actualizarStock();

}

/* VER PRODUCTO */

function verProducto(nombre,precio){

    productoActual = nombre;

    precioActual = precio;

    document.getElementById("tituloProducto")
    .textContent = nombre;

    document.getElementById("precioProducto")
    .textContent = "Precio: $" + precio;

    let stockEl = document.getElementById("stockProducto");
    if(stockEl){
        stockEl.textContent =
            stock[nombre] > 0
            ? "Stock: " + stock[nombre]
            : "SIN STOCK";
    }

    new bootstrap.Modal(
    document.getElementById("modalProducto")
    ).show();

}

/* AGREGAR MODAL */

function agregarDesdeModal(){

    agregar(productoActual,precioActual);

}

/* FINALIZAR */

function finalizarCompra(){

    if(total < minimo){

        alert("Pedido mínimo $" + minimo);

        return;

    }

    let numero =
    "PED-" + Math.floor(Math.random()*100000);

    alert("Pedido realizado: " + numero);

    document.getElementById("lista-carrito")
    .innerHTML = "";

    total = 0;

    document.getElementById("total")
    .textContent = total;

}

/* FILTROS */

function filtrarCategoria(cat){

    document.querySelectorAll(".producto")
    .forEach(p => {

        p.style.display =
        (cat === "todos" ||
        p.dataset.categoria === cat)
        ? "block"
        : "none";

    });

}

function filtrarProductos(){

    let texto =
    document.getElementById("buscador")
    .value
    .toLowerCase();

    document.querySelectorAll(".producto")
    .forEach(p => {

        p.style.display =
        p.innerText.toLowerCase()
        .includes(texto)
        ? "block"
        : "none";

    });

}

/* ================= LOGIN ================= */

function login(){

    let nombre =
    document.getElementById("nombre").value.trim();

    let password =
    document.getElementById("password").value;

    let curso =
    document.getElementById("curso").value;

    // VALIDACION
    if(
        nombre === "" ||
        password === "" ||
        curso === ""
    ){

        alert("Completá todos los campos");

        return;

    }

    let usuario = usuarios[nombre];
    if(!usuario){
        alert("Usuario no registrado. Usa Registrarse para crear tu cuenta.");
        return;
    }

    if(usuario.password !== password){
        alert("Contraseña incorrecta");
        return;
    }

    usuario.curso = curso;
    guardarUsuarios();

    let rol = usuario.rol || "usuario";

    localStorage.setItem(
    "nombre",
    nombre
    );

    localStorage.setItem(
    "curso",
    curso
    );

    localStorage.setItem(
    "rol",
    rol
    );

    mostrarUsuario();

}

/*
function estaRegistrado(nombre, password, passwordConfirm, curso){
    for(usuarios["nombre"]){

    }
}
*/

function registrarse(){
    let nombre =
    document.getElementById("nombre").value.trim();

    let password =
    document.getElementById("password").value;

    let passwordConfirm =
    document.getElementById("passwordConfirm").value;

    let curso =
    document.getElementById("curso").value;

    if(
        nombre === "" ||
        password === "" ||
        passwordConfirm === "" ||
        curso === ""
    ){

        alert("Completá todos los campos para registrarte");
        return;

    }

    if(password !== passwordConfirm){
        alert("Las contraseñas no coinciden. Por favor, verificá ambas.");
        return;
    }

    

    if(usuarios[nombre]){
        alert("Ese usuario ya existe. Iniciá sesión o elige otro nombre.");
        return;
    }

    usuarios[nombre] = {
        password: password,
        curso: curso,
        rol: "usuario"
    };

    guardarUsuarios();

    localStorage.setItem(
    "nombre",
    nombre
    );

    localStorage.setItem(
    "curso",
    curso
    );

    localStorage.setItem(
    "rol",
    "usuario"
    );

    mostrarUsuario();
}

/* ================= MOSTRAR USUARIO ================= */

function mostrarUsuario(){

    let nombre =
    localStorage.getItem("nombre");

    let curso =
    localStorage.getItem("curso");

    let rol =
    localStorage.getItem("rol");

    if(nombre){

        let loginBoxEl = document.getElementById("login_Box");
        if(loginBoxEl){
            loginBoxEl.innerHTML = `

            <div class="alert alert-success shadow">

            <h4>
            Bienvenido ${nombre}
            </h4>

            <p>
            Curso: ${curso}
            </p>

            <p>
            Rol: ${rol}
            </p>

            <button
            class="btn btn-danger"
            onclick="logout()">

            Cerrar sesión

            </button>

            </div>

            `;

            loginBoxEl.style.display = "none";
        }

        let contenido = document.getElementById("contenido");
        if(contenido){
            contenido.style.display = "block";
        }

        let userStatus = document.getElementById("userStatus");
        if(userStatus){
            userStatus.innerHTML = `
              <div class="alert alert-dark shadow-sm d-flex flex-column flex-md-row justify-content-between align-items-center mb-4">
                <div>
                  <strong>Cuenta activa:</strong> ${nombre} <span class="text-muted">(${curso})</span>
                </div>
                <button class="btn btn-outline-light btn-sm mt-3 mt-md-0" onclick="logout()">Cerrar sesión</button>
              </div>
            `;
        }

        // SI ES ADMIN
        if(rol === "admin"){

            mostrarBotonesReponerAdmin();

        }

    }

}

/* ================= LOGOUT ================= */

function logout(){

    localStorage.removeItem("nombre");

    localStorage.removeItem("curso");

    localStorage.removeItem("rol");


    location.reload();

}

/* ================= MODO ADMIN ================= */

function mostrarBotonesReponerAdmin(){
    document.querySelectorAll(".producto").forEach(card => {
        if (card.querySelector(".btn-reponer")) return;

        let nombre = card.querySelector("h5").innerText.trim();
        let footer = card.querySelector(".card-body");

        let boton = document.createElement("button");
        boton.type = "button";
        boton.className = "btn btn-secondary btn-sm w-100 mt-2 btn-reponer";
        boton.textContent = "Reponer";
        boton.onclick = () => reponerProducto(nombre);

        footer.appendChild(boton);
    });
}

function reponerProducto(nombre){
    let cantidad = prompt("Ingrese nueva cantidad de stock para " + nombre + ":", stock[nombre]);
    if(cantidad === null){
        return;
    }

    cantidad = parseInt(cantidad, 10);
    if(isNaN(cantidad) || cantidad < 0){
        alert("Ingresa una cantidad válida de stock.");
        return;
    }

    stock[nombre] = cantidad;
    guardarStock();
    actualizarStock();

    let mensaje = "Stock de " + nombre + " actualizado a " + cantidad + " unidades.";
    alert(mensaje);
}

/* ================= MODO ADMIN ================= */

function activarModoAdmin(){

    document.body.style.border =
    "5px solid red";

    alert("Modo admin activado");

}

/* MERCADO NEGRO */

function mercadoNegro(){
    window.location.href = "mercado.html";
}

/* INICIO */

actualizarStock();

mostrarUsuario();
