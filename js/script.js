/**
 * CECATI 97 - Sistema de Registro a Cursos
 * Maneja el formulario de inscripción en registro.html
 */

document.addEventListener("DOMContentLoaded", function() {
    // ==================== CONFIGURACIÓN ====================
    const CONFIG = {
        claveStorage: "registros",
        claseError: "mensaje-error",
        claseErrorCampo: "error-campo",
        claseOverlay: "overlay-exito"
    };

    // Elementos del formulario
    const formulario = document.getElementById('form-registro');

    if (!formulario) return; // Si no estamos en registro.html, no hacer nada

    // Agregar opciones de cursos al select (pueden venir de un array)
    const selectCurso = document.getElementById('curso');
    const cursos = [
        "Electricidad",
        "Carpintería",
        "Corte y Confección"
    ];
    cursos.forEach(curso => {
        const option = document.createElement('option');
        option.value = curso;
        option.textContent = curso;
        selectCurso.appendChild(option);
    });

    // Configurar validación
    configurarValidacionFormulario(formulario);

    /**
     * Configura la validación y envío del formulario
     */
    function configurarValidacionFormulario(formulario) {
        const campos = formulario.querySelectorAll('input, select');
        campos.forEach(campo => {
            campo.addEventListener('blur', function() {
                validarCampo(this);
            });
            campo.addEventListener('input', function() {
                quitarErrorCampo(this);
            });
        });

        formulario.addEventListener('submit', manejarEnvio);
    }

    /**
     * Maneja el envío del formulario
     */
    function manejarEnvio(e) {
        e.preventDefault();
        const formulario = e.target;

        limpiarTodosErrores(formulario);

        if (!validarFormulario(formulario)) {
            mostrarErrorFormulario(formulario, 'Por favor corrija los errores en el formulario.');
            return;
        }

        const datos = recogerDatosFormulario(formulario);

        if (guardarEnLocalStorage(datos)) {
            mostrarOverlayExito(formulario, datos.curso);
            console.log('Registro guardado:', datos);
        } else {
            mostrarErrorFormulario(formulario, 'Error al guardar el registro. Intente nuevamente.');
        }
    }

    /**
     * Valida todo el formulario
     */
    function validarFormulario(formulario) {
        let valido = true;
        const camposRequeridos = formulario.querySelectorAll('[required]');
        camposRequeridos.forEach(campo => {
            if (!validarCampo(campo)) valido = false;
        });

        // Validación especial para fecha de nacimiento
        const campoFecha = formulario.querySelector('input[name="fecha_nacimiento"]');
        if (campoFecha && campoFecha.value) {
            if (!validarFechaNacimiento(campoFecha.value)) {
                mostrarErrorCampo(campoFecha, 'Debe ser mayor de 15 años');
                valido = false;
            } else if (!validarFechaCompleta(campoFecha)) {
                mostrarErrorCampo(campoFecha, 'Ingrese una fecha válida en formato DD/MM/AAAA');
                valido = false;
            }
        }

        return valido;
    }

    /**
     * Valida un campo individual
     */
    function validarCampo(campo) {
        quitarErrorCampo(campo);

        if (campo.required && !campo.value.trim()) {
            mostrarErrorCampo(campo, 'Este campo es requerido');
            return false;
        }

        if (campo.dataset.patron && campo.value.trim()) {
            const patron = new RegExp(campo.dataset.patron);
            if (!patron.test(campo.value.trim())) {
                mostrarErrorCampo(campo, campo.dataset.mensajeValidacion || 'Formato inválido');
                return false;
            }
        }

        if (campo.tagName === 'SELECT' && campo.required && !campo.value) {
            mostrarErrorCampo(campo, 'Seleccione una opción');
            return false;
        }

        return true;
    }

    /**
     * Valida formato de fecha DD/MM/AAAA
     */
    function validarFechaCompleta(input) {
        const valor = input.value;
        const patron = /^(\d{2})\/(\d{2})\/(\d{4})$/;
        const match = valor.match(patron);
        if (!match) return false;

        const dia = parseInt(match[1], 10);
        const mes = parseInt(match[2], 10) - 1;
        const anio = parseInt(match[3], 10);
        const fecha = new Date(anio, mes, dia);
        return fecha.getDate() === dia && fecha.getMonth() === mes && fecha.getFullYear() === anio;
    }

    /**
     * Valida edad (mayor de 15 años)
     */
    function validarFechaNacimiento(fechaStr) {
        const partes = fechaStr.split('/');
        if (partes.length !== 3) return false;
        const dia = parseInt(partes[0], 10);
        const mes = parseInt(partes[1], 10) - 1;
        const anio = parseInt(partes[2], 10);
        const fechaNac = new Date(anio, mes, dia);
        const hoy = new Date();
        const edad = hoy.getFullYear() - fechaNac.getFullYear();
        const diffMes = hoy.getMonth() - fechaNac.getMonth();
        if (diffMes < 0 || (diffMes === 0 && hoy.getDate() < fechaNac.getDate())) {
            return edad - 1 >= 15;
        }
        return edad >= 15;
    }

    /**
     * Recoge los datos del formulario
     */
    function recogerDatosFormulario(formulario) {
        const formData = new FormData(formulario);
        const datos = {};
        for (let [clave, valor] of formData.entries()) {
            datos[clave] = valor.trim();
        }
        datos.fechaRegistro = new Date().toISOString();
        datos.id = generarId();
        return datos;
    }

    function generarId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    function guardarEnLocalStorage(datos) {
        try {
            let registros = JSON.parse(localStorage.getItem(CONFIG.claveStorage)) || [];
            registros.push(datos);
            localStorage.setItem(CONFIG.claveStorage, JSON.stringify(registros));
            return true;
        } catch (error) {
            console.error('Error guardando en localStorage:', error);
            return false;
        }
    }

    // ==================== FUNCIONES DE UI ====================
    function mostrarErrorCampo(campo, mensaje) {
        quitarErrorCampo(campo);
        campo.classList.add(CONFIG.claseErrorCampo);
        const errorDiv = document.createElement('div');
        errorDiv.className = CONFIG.claseError;
        errorDiv.textContent = mensaje;
        campo.parentNode.appendChild(errorDiv);
    }

    function quitarErrorCampo(campo) {
        campo.classList.remove(CONFIG.claseErrorCampo);
        const errorExistente = campo.parentNode.querySelector(`.${CONFIG.claseError}`);
        if (errorExistente) errorExistente.remove();
    }

    function mostrarErrorFormulario(formulario, mensaje) {
        quitarErrorFormulario(formulario);
        const errorDiv = document.createElement('div');
        errorDiv.className = CONFIG.claseError + ' error-formulario';
        errorDiv.textContent = mensaje;
        formulario.insertBefore(errorDiv, formulario.firstChild);
        errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function quitarErrorFormulario(formulario) {
        const errorExistente = formulario.querySelector('.error-formulario');
        if (errorExistente) errorExistente.remove();
    }

    function limpiarTodosErrores(formulario) {
        quitarErrorFormulario(formulario);
        formulario.querySelectorAll(`.${CONFIG.claseError}`).forEach(e => e.remove());
        formulario.querySelectorAll(`.${CONFIG.claseErrorCampo}`).forEach(c => c.classList.remove(CONFIG.claseErrorCampo));
    }

    function mostrarOverlayExito(formulario, nombreCurso) {
        const overlay = document.createElement('div');
        overlay.className = CONFIG.claseOverlay;

        const contenido = document.createElement('div');
        contenido.className = 'contenido-overlay';

        const icono = document.createElement('div');
        icono.className = 'icono-exito';
        icono.textContent = '✓';

        const titulo = document.createElement('h3');
        titulo.textContent = '¡Registro Exitoso!';

        const mensaje = document.createElement('p');
        mensaje.textContent = `Te has inscrito correctamente al curso de ${nombreCurso}`;

        const detalle = document.createElement('p');
        detalle.className = 'detalle-overlay';
        detalle.textContent = 'Pronto recibirás más información en tu correo electrónico.';

        const boton = document.createElement('button');
        boton.className = 'boton-overlay';
        boton.textContent = 'Cerrar';
        boton.addEventListener('click', () => {
            overlay.remove();
            formulario.reset();
        });

        contenido.appendChild(icono);
        contenido.appendChild(titulo);
        contenido.appendChild(mensaje);
        contenido.appendChild(detalle);
        contenido.appendChild(boton);
        overlay.appendChild(contenido);

        formulario.style.position = 'relative';
        formulario.appendChild(overlay);

        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.remove();
                formulario.reset();
            }
        }, 5000);
    }
});