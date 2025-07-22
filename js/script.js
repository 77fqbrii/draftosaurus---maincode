document.addEventListener('DOMContentLoaded', function() {
    const btnVerDescripcion = document.getElementById('btn-ver-descripcion');
    const textoDescripcionModos = document.getElementById('descripcion-modos-texto');

    if (btnVerDescripcion && textoDescripcionModos) {
        btnVerDescripcion.addEventListener('click', function() {
            const esVisible = textoDescripcionModos.classList.toggle('visible');
            btnVerDescripcion.classList.toggle('expanded');
            btnVerDescripcion.setAttribute('aria-expanded', esVisible);
            textoDescripcionModos.setAttribute('aria-hidden', !esVisible);
        });
        const esVisibleInicialmente = textoDescripcionModos.classList.contains('visible');
        btnVerDescripcion.setAttribute('aria-expanded', esVisibleInicialmente);
        textoDescripcionModos.setAttribute('aria-hidden', !esVisibleInicialmente);
    }

    const botonCambiarTema = document.getElementById('theme-toggle-button');
    if (botonCambiarTema) {
        const elementoCuerpo = document.body;
        const aplicarTema = (tema) => {
            elementoCuerpo.classList.toggle('dark-mode', tema === 'dark');
            localStorage.setItem('theme', tema);
        };
        botonCambiarTema.addEventListener('click', () => {
            aplicarTema(elementoCuerpo.classList.contains('dark-mode') ? 'light' : 'dark');
        });
        const temaGuardado = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        aplicarTema(temaGuardado);
    }

    const btnQuienesSomos = document.getElementById('btn-quienes-somos');
    const modalQuienesSomosOverlay = document.getElementById('quienes-somos-modal-overlay');
    if (btnQuienesSomos && modalQuienesSomosOverlay) {
        const btnCerrarModalQuienesSomos = document.getElementById('btn-close-quienes-somos-modal');
        const mostrarModal = () => modalQuienesSomosOverlay.classList.add('visible');
        const ocultarModal = () => modalQuienesSomosOverlay.classList.remove('visible');
        btnQuienesSomos.addEventListener('click', mostrarModal);
        btnCerrarModalQuienesSomos.addEventListener('click', ocultarModal);
        modalQuienesSomosOverlay.addEventListener('click', (e) => e.target === modalQuienesSomosOverlay && ocultarModal());
        document.addEventListener('keydown', (e) => e.key === 'Escape' && ocultarModal());
    }

    const contenedorConfiguracion = document.getElementById('seccion-configuracion-partida');
    if (contenedorConfiguracion) {
        const btnIniciarConfiguracion = document.getElementById('btn-iniciar-configuracion');
        const seccionBienvenida = document.getElementById('seccion-bienvenida');
        const selectorJugadores = document.getElementById('numero-jugadores');
        const contenedorCamposNombres = document.getElementById('campos-nombres');
        const btnCrearPartida = document.getElementById('btn-crear-partida');

        btnIniciarConfiguracion.addEventListener('click', (e) => {
            e.preventDefault();
            seccionBienvenida.classList.add('hidden');
            contenedorConfiguracion.classList.remove('hidden');
        });

        selectorJugadores.addEventListener('change', function() {
            const cantidad = parseInt(this.value, 10);
            contenedorCamposNombres.innerHTML = '';
            if (cantidad > 0) {
                for (let i = 1; i <= cantidad; i++) {
                    const input = document.createElement('input');
                    input.type = 'text';
                    input.placeholder = `Nombre del Jugador ${i}`;
                    input.className = 'nombre-jugador-input form-control';
                    input.required = true;
                    contenedorCamposNombres.appendChild(input);
                }
            }
            validarNombres();
        });

        const validarNombres = () => {
            const inputs = contenedorCamposNombres.querySelectorAll('input');
            const todosLlenos = [...inputs].every(input => input.value.trim() !== '');
            btnCrearPartida.disabled = !todosLlenos;
        };

        contenedorCamposNombres.addEventListener('input', validarNombres);

        btnCrearPartida.addEventListener('click', () => {
            const nombres = [...contenedorCamposNombres.querySelectorAll('input')].map(input => input.value.trim());
            localStorage.setItem('jugadoresDraftosaurus', JSON.stringify(nombres));
            window.location.href = 'tablero.html';
        });
    }

    const tableroPrincipal = document.getElementById('main-tablero');
    if (tableroPrincipal) {
        const TIPOS_DINO = ["t-rex", "spinosaurus", "brachiosaurus", "triceratops", "parasaurolophus", "stegosaurus"];
        let estadoJuego = {
            jugadores: [],
            rondaActual: 1,
            turnoActual: 1,
            indiceJugadorActivoDados: 0,
            restriccionDados: 'ninguna',
            historialMovimientos: [],
            jugadoresQueJugaronEsteTurno: [],
            manos: {},
            manosOriginales: {},
        };
        let dinosaurioSeleccionado = null;
        let indiceJugadorActivoTablero = 0;

        const contenedorPestanas = document.getElementById('tabs-jugadores');
        const contenedorTableros = document.getElementById('tableros-container');
        const plantilla = document.getElementById('plantilla-parque-jugador');
        const btnFinalizarPartida = document.getElementById('btn-finalizar-partida');
        const btnSiguienteTurno = document.getElementById('btn-siguiente-turno');
        const btnLanzarDado = document.getElementById('btn-lanzar-dado');
        const btnDeshacer = document.getElementById('btn-deshacer');
        const contenedorRestricciones = document.getElementById('restricciones-dados-container');
        const modalResultadosOverlay = document.getElementById('resultados-modal-overlay');
        const btnCerrarModalResultados = document.getElementById('btn-close-resultados-modal');
        const btnManoAleatoria = document.getElementById('btn-mano-aleatoria');
        const dinosManoVirtual = document.getElementById('mano-virtual-dinos');
        const btnRegistrarMano = document.getElementById('btn-registrar-mano');
        const rondaManoVirtual = document.getElementById('ronda-mano-virtual');
        const btnVerHistorial = document.getElementById('btn-ver-historial');
        const modalHistorialOverlay = document.getElementById('historial-modal-overlay');
        const cuerpoHistorial = document.getElementById('historial-body');
        const btnCerrarModalHistorial = document.getElementById('btn-cerrar-historial-modal');
        const btnReiniciarPartida = document.getElementById('btn-reiniciar-partida');
        function actualizarEstilosPestanas() {
            const pestanas = document.querySelectorAll('.tab-jugador');
            pestanas.forEach((pestana, index) => {
                pestana.classList.remove('listo', 'pendiente'); 
                if (estadoJuego.jugadoresQueJugaronEsteTurno.includes(index)) {
                    pestana.classList.add('listo');
                } else {
                    pestana.classList.add('pendiente');
                }
            });
        }
        function reiniciarJuego() {
            if (!confirm('¿Estás seguro de que quieres reiniciar la partida? Se perderá todo el progreso actual.')) {
                return;
            }
            estadoJuego.rondaActual = 1;
            estadoJuego.turnoActual = 1;
            estadoJuego.indiceJugadorActivoDados = 0;
            estadoJuego.restriccionDados = 'ninguna';
            estadoJuego.historialMovimientos = [];
            estadoJuego.jugadoresQueJugaronEsteTurno = [];
            estadoJuego.manos = {};
            estadoJuego.manosOriginales = {};
            dinosaurioSeleccionado = null;
            indiceJugadorActivoTablero = 0;
            estadoJuego.jugadores.forEach((jugador, index) => {
                jugador.tablero = {
                    bosqueSemejanza: [],
                    pradoDiferencia: [],
                    praderaAmor: [],
                    trioFrondoso: [],
                    reySelva: [],
                    islaSolitaria: [],
                    rio: []
                };
                jugador.puntuacionTotal = 0;
                jugador.puntuacionDetallada = {};
                actualizarUIPuntuacion(index); 
            });

            document.querySelectorAll('.dino-slot').forEach(slot => {
                slot.className = 'dino-slot';
            });

            dinosManoVirtual.innerHTML = '';
            document.getElementById('mano-virtual-info').classList.add('hidden');
            btnRegistrarMano.disabled = false;
            btnManoAleatoria.disabled = false;
            btnDeshacer.disabled = true;
            btnSiguienteTurno.disabled = true;
            modalResultadosOverlay.classList.remove('visible');

            actualizarUIInfoPartida();
            limpiarVisualizacionSlots();
            cambiarPestanaActiva(0);
            actualizarEstilosPestanas(); 
            mostrarNotificacion('Partida Reiniciada. ¡Mucha suerte!', 'success');
        }

        function mostrarHistorial() {
            const nombresRecintos = {
                bosqueSemejanza: 'Bosque Semejanza',
                pradoDiferencia: 'Prado Diferencia',
                praderaAmor: 'Pradera Amor',
                trioFrondoso: 'Trío Frondoso',
                reySelva: 'Rey de la Selva',
                islaSolitaria: 'Isla Solitaria',
                rio: 'Río'
            };

            cuerpoHistorial.innerHTML = '';

            if (estadoJuego.historialMovimientos.length === 0) {
                cuerpoHistorial.innerHTML = '<p>Aún no se han realizado movimientos.</p>';
            } else {
                const lista = document.createElement('ul');
                [...estadoJuego.historialMovimientos].reverse().forEach(mov => {
                    const li = document.createElement('li');
                    const nombreJugador = estadoJuego.jugadores[mov.indiceJugador].nombre;
                    const nombreRecinto = nombresRecintos[mov.claveRecinto] || mov.claveRecinto;
                    const tipoDino = mov.dino.type.charAt(0).toUpperCase() + mov.dino.type.slice(1);

                    li.innerHTML = `
                        <span class="historial-turno">RONDA ${mov.ronda}, TURNO ${mov.turno}</span>
                        <span class="historial-accion"><b>${nombreJugador}</b> colocó un <b>${tipoDino}</b> en <b>${nombreRecinto}</b>.</span>
                    `;
                    lista.appendChild(li);
                });
                cuerpoHistorial.appendChild(lista);
            }
            modalHistorialOverlay.classList.add('visible');
        }
        
        btnReiniciarPartida.addEventListener('click', reiniciarJuego);

        function mostrarNotificacion(mensaje, tipo = 'error') {
            const container = document.getElementById('notificacion-container');
            if (!container) return;
            const notif = document.createElement('div');
            notif.className = `notificacion ${tipo}`;
            notif.textContent = mensaje;
            container.appendChild(notif);
            setTimeout(() => notif.classList.add('visible'), 10);
            setTimeout(() => {
                notif.classList.remove('visible');
                notif.addEventListener('transitionend', () => notif.remove());
            }, 4000);
        }

        function esMovimientoValido(slot, tipoDino, indiceJugador, restriccion) {
            const elementoRecinto = slot.closest('.recinto');
            if (!elementoRecinto) return false;
            const claveRecinto = elementoRecinto.dataset.recinto;
            const jugador = estadoJuego.jugadores[indiceJugador];
            const dinosEnRecinto = jugador.tablero[claveRecinto];
            
            if (claveRecinto === 'bosqueSemejanza' || claveRecinto === 'pradoDiferencia') {
                const slotsDelRecinto = Array.from(elementoRecinto.querySelectorAll('.dino-slot'));
                const indiceSlot = slotsDelRecinto.findIndex(s => s === slot);

                if (indiceSlot > 0) {
                    const slotAnterior = slotsDelRecinto[indiceSlot - 1];
                    const anteriorOcupado = TIPOS_DINO.some(claseDino => slotAnterior.classList.contains(claseDino));
                    if (!anteriorOcupado) return false;
                }
                if (claveRecinto === 'bosqueSemejanza') {
                    if (dinosEnRecinto.length > 0 && dinosEnRecinto[0].type !== tipoDino) return false;
                } else if (claveRecinto === 'pradoDiferencia') {
                    if (dinosEnRecinto.some(d => d.type === tipoDino)) return false;
                }
            }

            if (indiceJugador !== estadoJuego.indiceJugadorActivoDados) {
                if (restriccion !== 'ninguna' && restriccion !== null) {
                    const zonas = {
                        cafeteria: ['praderaAmor', 'trioFrondoso', 'bosqueSemejanza'],
                        banos: ['reySelva', 'islaSolitaria', 'pradoDiferencia'],
                        boscosa: ['bosqueSemejanza', 'reySelva', 'trioFrondoso'],
                        rocosa: ['pradoDiferencia', 'islaSolitaria', 'praderaAmor']
                    };

                    switch (restriccion) {
                        case 'cafeteria':
                            if (!zonas.cafeteria.includes(claveRecinto)) return false;
                            break;
                        case 'banos':
                            if (!zonas.banos.includes(claveRecinto)) return false;
                            break;
                        case 'boscosa':
                            if (!zonas.boscosa.includes(claveRecinto)) return false;
                            break;
                        case 'rocosa':
                            if (!zonas.rocosa.includes(claveRecinto)) return false;
                            break;
                        case 'vacio':
                            if (dinosEnRecinto.length > 0) return false;
                            break;
                        case 'sin-t-rex':
                            if (dinosEnRecinto.some(d => d.type === 't-rex')) return false;
                            break;
                    }
                }
            }
            return true;
        }

        function limpiarVisualizacionSlots() {
            document.querySelectorAll('.dino-slot').forEach(s => s.classList.remove('slot-valido'));
            if(contenedorTableros) contenedorTableros.classList.remove('tablero-restringido');
        }

        function obtenerSlotsValidos(indiceJugador, tipoDino) {
            const contenedorParque = document.querySelector(`.parque-container[data-jugador-index="${indiceJugador}"]`);
            if (!contenedorParque) return [];

            const todosLosSlots = contenedorParque.querySelectorAll('.dino-slot');
            const slotsValidos = [];

            todosLosSlots.forEach(slot => {
                const esOcupado = TIPOS_DINO.some(claseDino => slot.classList.contains(claseDino));
                if (esOcupado) return;

                const claveRecinto = slot.closest('.recinto')?.dataset.recinto;
                if (!claveRecinto || claveRecinto === 'rio') return;

                if (esMovimientoValido(slot, tipoDino, indiceJugador, estadoJuego.restriccionDados)) {
                    slotsValidos.push(slot);
                }
            });

            if (slotsValidos.length === 0) {
                 contenedorParque.querySelectorAll('.recinto[data-recinto="rio"] .dino-slot').forEach(slot => {
                    const esOcupado = TIPOS_DINO.some(claseDino => slot.classList.contains(claseDino));
                    if (!esOcupado) slotsValidos.push(slot);
                });
            }
            
            return slotsValidos;
        }

        function actualizarVisualizacionSlots() {
            limpiarVisualizacionSlots();
            if (!dinosaurioSeleccionado) return;

            const indiceJugador = indiceJugadorActivoTablero;
            if (estadoJuego.jugadoresQueJugaronEsteTurno.includes(indiceJugador)) return;

            const slotsValidos = obtenerSlotsValidos(indiceJugador, dinosaurioSeleccionado);
            if(contenedorTableros) contenedorTableros.classList.add('tablero-restringido');

            if (slotsValidos.length === 0) {
                mostrarNotificacion("¡Atención! No hay jugadas válidas disponibles en este momento.", "error");
            } else {
                slotsValidos.forEach(slot => slot.classList.add('slot-valido'));
            }
        }

        function intentarColocarDinosaurio(slot) {
            if (!dinosaurioSeleccionado || !slot.classList.contains('slot-valido')) return;
            
            const manoJugador = estadoJuego.manos[indiceJugadorActivoTablero] || [];
            const indiceDinoEnMano = manoJugador.indexOf(dinosaurioSeleccionado);
            
            if (indiceDinoEnMano === -1) {
                mostrarNotificacion("Este dinosaurio no está en tu mano actual.", "error");
                return;
            }

            const indiceJugador = indiceJugadorActivoTablero;
            const claveRecinto = slot.closest('.recinto').dataset.recinto;
            const idSlot = slot.dataset.slotId;
            const nuevoDino = {
                type: dinosaurioSeleccionado,
                slotId: idSlot
            };
            estadoJuego.jugadores[indiceJugador].tablero[claveRecinto].push(nuevoDino);
            estadoJuego.historialMovimientos.push({
                indiceJugador,
                claveRecinto,
                dino: nuevoDino,
                turno: estadoJuego.turnoActual,
                ronda: estadoJuego.rondaActual
            });
            estadoJuego.jugadoresQueJugaronEsteTurno.push(indiceJugador);
            estadoJuego.manos[indiceJugador].splice(indiceDinoEnMano, 1);
            slot.classList.add(dinosaurioSeleccionado);
            slot.textContent = '';
            
            const dinoEnManoVisual = dinosManoVirtual.querySelector(`.dino-selector[data-dino-type="${dinosaurioSeleccionado}"]:not(.colocado)`);
            if (dinoEnManoVisual) dinoEnManoVisual.classList.add('colocado');

            dinosaurioSeleccionado = null;
            limpiarVisualizacionSlots();
            calcularPuntuacionTotal(indiceJugador, false);
            actualizarEstadoBotonSiguienteTurno();
            actualizarEstilosPestanas(); 
        }

        function deshacerUltimoMovimiento() {
            if (estadoJuego.historialMovimientos.length === 0) {
                 mostrarNotificacion("No hay movimientos para deshacer.", 'info');
                return;
            }
            const movimientoParaDeshacer = estadoJuego.historialMovimientos.pop();
            const { indiceJugador, claveRecinto, dino } = movimientoParaDeshacer;
            const tableroJugador = estadoJuego.jugadores[indiceJugador].tablero;
            
            tableroJugador[claveRecinto] = tableroJugador[claveRecinto].filter(d => d.slotId !== dino.slotId);

            if (!estadoJuego.manos[indiceJugador]) estadoJuego.manos[indiceJugador] = [];
            estadoJuego.manos[indiceJugador].push(dino.type);

            const slot = document.querySelector(`.parque-container[data-jugador-index="${indiceJugador}"] .dino-slot[data-slot-id="${dino.slotId}"]`);
            if (slot) slot.className = 'dino-slot';

            const indiceEnTurno = estadoJuego.jugadoresQueJugaronEsteTurno.indexOf(indiceJugador);
            if (movimientoParaDeshacer.turno === estadoJuego.turnoActual && movimientoParaDeshacer.ronda === estadoJuego.rondaActual && indiceEnTurno > -1) {
                estadoJuego.jugadoresQueJugaronEsteTurno.splice(indiceEnTurno, 1);
            }

            limpiarVisualizacionSlots();
            renderizarManoVirtual(indiceJugador);
            calcularPuntuacionTotal(indiceJugador, false);
            actualizarEstadoBotonSiguienteTurno();
            actualizarEstilosPestanas(); 
            mostrarNotificacion("Último movimiento deshecho.", 'success');
        }

        function lanzarDado() {
            const carasDelDado = ['boscosa', 'rocosa', 'vacio', 'sin-t-rex', 'cafeteria', 'banos'];
            const resultado = carasDelDado[Math.floor(Math.random() * carasDelDado.length)];
            estadoJuego.restriccionDados = resultado;

            const nombreNotificacion = {
                boscosa: "Zona Boscosa", rocosa: "Zona Rocosa", vacio: "Recinto Vacío",
                'sin-t-rex': "Recinto sin T-Rex", cafeteria: "Zona Cafetería", banos: "Zona Baños"
            };
            mostrarNotificacion(`¡El dado ha caído en: ${nombreNotificacion[resultado].toUpperCase()}!`, 'success');
            actualizarUIInfoPartida();
            actualizarVisualizacionSlots();
        }

        function avanzarTurno() {
            if (estadoJuego.jugadoresQueJugaronEsteTurno.length !== estadoJuego.jugadores.length) {
                mostrarNotificacion("Aún no han jugado todos los jugadores en este turno.", 'error');
                return;
            }

            const manosRotadas = {};
            const numJugadores = estadoJuego.jugadores.length;
            for (let i = 0; i < numJugadores; i++) {
                const indiceJugadorQueRecibe = (i + 1) % numJugadores;
                manosRotadas[indiceJugadorQueRecibe] = estadoJuego.manos[i];
            }
            estadoJuego.manos = manosRotadas;


            if (estadoJuego.turnoActual === 6) {
                estadoJuego.turnoActual = 1;
                estadoJuego.rondaActual++;
                
                if (estadoJuego.rondaActual > 2) {
                    mostrarNotificacion("La partida ha terminado. ¡Calcula los resultados!", 'success');
                    btnFinalizarPartida.click();
                    return;
                }

                estadoJuego.manos = {};
                mostrarNotificacion(`¡Fin de la Ronda! Inicia Ronda ${estadoJuego.rondaActual}. Registren sus nuevas manos.`, "success");
            } else {
                estadoJuego.turnoActual++;
            }

            estadoJuego.indiceJugadorActivoDados = (estadoJuego.indiceJugadorActivoDados + 1) % estadoJuego.jugadores.length;
            estadoJuego.restriccionDados = 'ninguna';
            estadoJuego.jugadoresQueJugaronEsteTurno = [];

            actualizarUIInfoPartida();
            actualizarEstadoBotonSiguienteTurno();
            limpiarVisualizacionSlots();
            renderizarManoVirtual(indiceJugadorActivoTablero);
            actualizarEstilosPestanas(); 
            mostrarNotificacion(`Inicia el Turno ${estadoJuego.turnoActual} de la Ronda ${estadoJuego.rondaActual}.`, 'info');
        }

        function actualizarEstadoBotonSiguienteTurno() {
            if(!btnSiguienteTurno) return;
            if (estadoJuego.jugadoresQueJugaronEsteTurno.length === estadoJuego.jugadores.length) {
                btnSiguienteTurno.disabled = false;
                btnSiguienteTurno.classList.remove('btn-disabled');
            } else {
                btnSiguienteTurno.disabled = true;
                btnSiguienteTurno.classList.add('btn-disabled');
            }
        }

        const calcularPraderaAmor = (dinos) => {
            const conteos = {};
            dinos.forEach(dino => conteos[dino.type] = (conteos[dino.type] || 0) + 1);
            let pares = 0;
            Object.values(conteos).forEach(conteo => pares += Math.floor(conteo / 2));
            return pares * 5;
        };
        const calcularTrioFrondoso = (dinos) => (dinos.length === 3) ? 7 : 0;
        const calcularBosqueSemejanza = (dinos) => {
            if (dinos.length === 0) return 0;
            const primeraEspecie = dinos[0].type;
            if (!dinos.every(dino => dino.type === primeraEspecie)) return 0;
            const puntosPorCantidad = { 1: 2, 2: 4, 3: 8, 4: 12, 5: 18, 6: 24 };
            return puntosPorCantidad[dinos.length] || 0;
        };
        const calcularPradoDiferencia = (dinos) => {
            const especiesUnicas = new Set(dinos.map(d => d.type));
            if (especiesUnicas.size !== dinos.length) return 0;
            const puntosPorCantidad = { 1: 1, 2: 3, 3: 6, 4: 10, 5: 15, 6: 21 };
            return puntosPorCantidad[dinos.length] || 0;
        };
        const calcularReySelva = (indiceJugador, todosLosJugadores) => {
            const jugadorActual = todosLosJugadores[indiceJugador];
            const dinoEnRecinto = jugadorActual.tablero.reySelva[0];
            if (!dinoEnRecinto) return 0;
            const tipoDino = dinoEnRecinto.type;
            const conteoEsteJugador = Object.values(jugadorActual.tablero).flat().filter(d => d.type === tipoDino).length;
            const esElRey = todosLosJugadores.every((otroJugador, indice) => {
                if (indice === indiceJugador) return true;
                const conteoOtroJugador = Object.values(otroJugador.tablero).flat().filter(d => d.type === tipoDino).length;
                return conteoEsteJugador >= conteoOtroJugador;
            });
            return esElRey ? 7 : 0;
        };
        const calcularIslaSolitaria = (dinoEnIsla, parqueCompleto) => {
            if (dinoEnIsla.length === 0) return 0;
            const conteoTotal = parqueCompleto.filter(d => d.type === dinoEnIsla[0].type).length;
            return conteoTotal === 1 ? 7 : 0;
        };
        const calcularBonusTRex = (tablero) => {
            let bono = 0;
            for (const claveRecinto in tablero) {
                if (claveRecinto !== 'rio' && tablero[claveRecinto].some(d => d.type === 't-rex')) {
                    bono++;
                }
            }
            return bono;
        };

        function calcularPuntuacionTotal(indiceJugador, esFinal) {
            const jugador = estadoJuego.jugadores[indiceJugador];
            if(!jugador) return;
            const tablero = jugador.tablero;
            let total = 0;
            let puntajes = {};
            const parqueCompleto = Object.values(tablero).flat();
            puntajes.praderaAmor = calcularPraderaAmor(tablero.praderaAmor);
            puntajes.trioFrondoso = calcularTrioFrondoso(tablero.trioFrondoso);
            puntajes.bosqueSemejanza = calcularBosqueSemejanza(tablero.bosqueSemejanza);
            puntajes.pradoDiferencia = calcularPradoDiferencia(tablero.pradoDiferencia);
            puntajes.rio = tablero.rio.length;
            puntajes.islaSolitaria = calcularIslaSolitaria(tablero.islaSolitaria, parqueCompleto);
            puntajes.bonusTRex = calcularBonusTRex(tablero);
            puntajes.reySelva = esFinal ? calcularReySelva(indiceJugador, estadoJuego.jugadores) : 0;
            total = Object.values(puntajes).reduce((sum, val) => sum + val, 0);
            jugador.puntuacionDetallada = puntajes;
            jugador.puntuacionTotal = total;
            actualizarUIPuntuacion(indiceJugador);
        }

        function actualizarUIPuntuacion(indiceJugador) {
            const contenedorParque = document.querySelector(`.parque-container[data-jugador-index="${indiceJugador}"]`);
            if (contenedorParque) {
                const elPuntos = contenedorParque.querySelector('.puntos');
                if(elPuntos) elPuntos.textContent = estadoJuego.jugadores[indiceJugador].puntuacionTotal;
            }
        }

        function actualizarUIInfoPartida() {
            const elRonda = document.getElementById('ronda-actual');
            const elTurno = document.getElementById('turno-actual');
            const elJugadorActivo = document.getElementById('jugador-activo-dados');
            const elRondaMano = document.getElementById('ronda-mano-virtual');

            if(elRonda) elRonda.textContent = estadoJuego.rondaActual;
            if(elTurno) elTurno.textContent = estadoJuego.turnoActual;
            if(elJugadorActivo && estadoJuego.jugadores.length > 0) elJugadorActivo.textContent = estadoJuego.jugadores[estadoJuego.indiceJugadorActivoDados].nombre;
            if(elRondaMano) elRondaMano.textContent = estadoJuego.rondaActual;

            document.querySelectorAll('.btn-dado').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.restriccion === estadoJuego.restriccionDados);
            });
        }

        function renderizarTableroCompleto() {
            if(!contenedorPestanas || !contenedorTableros) return;
            contenedorPestanas.innerHTML = '';
            contenedorTableros.innerHTML = '';
            estadoJuego.jugadores.forEach((jugador, index) => {
                const pestana = document.createElement('button');
                pestana.className = 'tab-jugador';
                pestana.textContent = jugador.nombre;
                pestana.dataset.jugadorIndex = index;
                if (index === indiceJugadorActivoTablero) pestana.classList.add('active');
                contenedorPestanas.appendChild(pestana);

                const clon = plantilla.content.cloneNode(true);
                const contenedorParque = clon.querySelector('.parque-container');
                contenedorParque.dataset.jugadorIndex = index;
                clon.querySelector('.nombre-jugador-parque').textContent = jugador.nombre;
                if (index !== indiceJugadorActivoTablero) contenedorParque.classList.add('hidden');
                contenedorTableros.appendChild(clon);
            });
        }

        function renderizarManoVirtual(indiceJugador) {
            if(!dinosManoVirtual) return;
            dinosManoVirtual.innerHTML = '';
            const mano = estadoJuego.manos[indiceJugador] || [];
            const infoMano = document.getElementById('mano-virtual-info');

            if (mano.length > 0) {
                mano.forEach(tipoDino => {
                    const elementoDino = document.createElement('div');
                    elementoDino.className = 'dino-selector';
                    elementoDino.dataset.dinoType = tipoDino;
                    elementoDino.title = tipoDino.charAt(0).toUpperCase() + tipoDino.slice(1);
                    dinosManoVirtual.appendChild(elementoDino);
                });
                if(infoMano) infoMano.classList.remove('hidden');
            } else {
                if(infoMano) infoMano.classList.add('hidden');
            }
        }

        function abrirModalRegistroMano() {
            const indiceJugador = indiceJugadorActivoTablero;
            const superposicion = document.createElement('div');
            superposicion.className = 'modal-overlay visible';
            const contenidoModal = document.createElement('div');
            contenidoModal.className = 'modal-content modal-registro-mano';
            contenidoModal.innerHTML = `
                <button class="modal-close-btn">&times;</button>
                <h2>Registrar Mano de ${estadoJuego.jugadores[indiceJugador].nombre}</h2>
                <div class="modal-scrollable-content"></div>
                <button id="btn-guardar-mano" class="btn btn-glow" style="margin-top: 1rem;">Guardar Mano</button>
            `;
            superposicion.appendChild(contenidoModal);
            document.body.appendChild(superposicion);

            const contenidoDesplazable = contenidoModal.querySelector('.modal-scrollable-content');
            let conteosDino = {};

            TIPOS_DINO.forEach(tipoDino => {
                conteosDino[tipoDino] = 0;
                const item = document.createElement('div');
                item.className = 'dino-registro-item';
                item.innerHTML = `
                    <div class="dino-selector" data-dino-type="${tipoDino}"></div>
                    <span class="dino-nombre">${tipoDino.charAt(0).toUpperCase() + tipoDino.slice(1)}</span>
                    <div class="dino-cantidad-controles">
                        <button class="btn-cantidad" data-tipo="${tipoDino}" data-accion="restar">-</button>
                        <span class="cantidad-display" data-tipo="${tipoDino}">0</span>
                        <button class="btn-cantidad" data-tipo="${tipoDino}" data-accion="sumar">+</button>
                    </div>
                `;
                contenidoDesplazable.appendChild(item);
            });

            const totalDinos = () => Object.values(conteosDino).reduce((a, b) => a + b, 0);
            contenidoDesplazable.addEventListener('click', e => {
                if (e.target.classList.contains('btn-cantidad')) {
                    const tipo = e.target.dataset.tipo;
                    const accion = e.target.dataset.accion;

                    if (accion === 'sumar' && totalDinos() < 6) {
                        conteosDino[tipo]++;
                    } else if (accion === 'restar' && conteosDino[tipo] > 0) {
                        conteosDino[tipo]--;
                    }
                    contenidoModal.querySelector(`.cantidad-display[data-tipo="${tipo}"]`).textContent = conteosDino[tipo];
                }
            });

            const cerrarModal = () => superposicion.remove();
            contenidoModal.querySelector('.modal-close-btn').addEventListener('click', cerrarModal);
            contenidoModal.querySelector('#btn-guardar-mano').addEventListener('click', () => {
                if (totalDinos() !== 6) {
                    mostrarNotificacion("Debes registrar exactamente 6 dinosaurios.", "error");
                    return;
                }

                const nuevaMano = [];
                for (const tipo in conteosDino) {
                    for (let i = 0; i < conteosDino[tipo]; i++) {
                        nuevaMano.push(tipo);
                    }
                }

                estadoJuego.manos[indiceJugador] = nuevaMano;
                if (!estadoJuego.manosOriginales[estadoJuego.rondaActual]) {
                    estadoJuego.manosOriginales[estadoJuego.rondaActual] = {};
                }
                estadoJuego.manosOriginales[estadoJuego.rondaActual][indiceJugador] = [...nuevaMano];

                renderizarManoVirtual(indiceJugador);
                cerrarModal();
            });
        }

        function generarManoAleatoria() {
            const indiceJugador = indiceJugadorActivoTablero;
            const manoAleatoria = [];
            for (let i = 0; i < 6; i++) {
                const indiceAleatorio = Math.floor(Math.random() * TIPOS_DINO.length);
                manoAleatoria.push(TIPOS_DINO[indiceAleatorio]);
            }
            estadoJuego.manos[indiceJugador] = manoAleatoria;

            if (!estadoJuego.manosOriginales[estadoJuego.rondaActual]) {
                 estadoJuego.manosOriginales[estadoJuego.rondaActual] = {};
            }
            estadoJuego.manosOriginales[estadoJuego.rondaActual][indiceJugador] = [...manoAleatoria];

            renderizarManoVirtual(indiceJugador);
            mostrarNotificacion(`Mano aleatoria generada para ${estadoJuego.jugadores[indiceJugador].nombre}.`, 'success');
        }

        function cambiarPestanaActiva(index) {
            indiceJugadorActivoTablero = parseInt(index);
            document.querySelectorAll('.tab-jugador').forEach((pestana, i) => pestana.classList.toggle('active', i === indiceJugadorActivoTablero));
            document.querySelectorAll('.parque-container').forEach((parque, i) => parque.classList.toggle('hidden', i !== indiceJugadorActivoTablero));
            
            dinosaurioSeleccionado = null;
            renderizarManoVirtual(indiceJugadorActivoTablero);
            limpiarVisualizacionSlots();
        }

        function mostrarResultadosFinales() {
            estadoJuego.jugadores.forEach((_, index) => calcularPuntuacionTotal(index, true));
            estadoJuego.jugadores.sort((a, b) => {
                if (b.puntuacionTotal !== a.puntuacionTotal) {
                    return b.puntuacionTotal - a.puntuacionTotal;
                }
                 const conteoDinosA = Object.values(a.tablero).flat().length;
                const conteoDinosB = Object.values(b.tablero).flat().length;
                return conteoDinosB - conteoDinosA;
            });

            const contenedorResultados = document.getElementById('resultados-finales-container');
            if(!contenedorResultados) return;
            contenedorResultados.innerHTML = '';
            
            const puntuacionMaxima = estadoJuego.jugadores[0].puntuacionTotal;
            const ganadores = estadoJuego.jugadores.filter(j => j.puntuacionTotal === puntuacionMaxima);

            estadoJuego.jugadores.forEach(jugador => {
                const p = jugador.puntuacionDetallada;
                const div = document.createElement('div');
                div.className = 'jugador-resultados';
                div.innerHTML = `
                    <h3>${jugador.nombre} ${ganadores.includes(jugador) ? '🏆' : ''}</h3>
                    <ul>
                        <li><span>Bosque Semejanza:</span> <span>${p.bosqueSemejanza || 0} pts</span></li>
                        <li><span>Prado Diferencia:</span> <span>${p.pradoDiferencia || 0} pts</span></li>
                        <li><span>Pradera Amor:</span> <span>${p.praderaAmor || 0} pts</span></li>
                        <li><span>Trío Frondoso:</span> <span>${p.trioFrondoso || 0} pts</span></li>
                        <li><span>Río:</span> <span>${p.rio || 0} pts</span></li>
                        <hr>
                        <li><span>Isla Solitaria:</span> <span>${p.islaSolitaria || 0} pts</span></li>
                        <li><span>Rey de la Selva:</span> <span>${p.reySelva || 0} pts</span></li>
                        <li><span>Bonus T-Rex:</span> <span>${p.bonusTRex || 0} pts</span></li>
                    </ul>
                    <p class="total-puntos"><strong>Total: ${jugador.puntuacionTotal} Puntos</strong></p>
                `;
                contenedorResultados.appendChild(div);
            });

            let textoGanador;
            if (ganadores.length > 1) {
                textoGanador = `🎉 ¡Victoria compartida entre ${ganadores.map(g => g.nombre).join(' y ')}! 🎉`;
            } else {
                textoGanador = `🎉 ¡${ganadores[0].nombre} es el ganador! 🎉`;
            }
            const elGanador = document.getElementById('ganador-container');
            if(elGanador) elGanador.innerHTML = `<p>${textoGanador}</p>`;
            
            modalResultadosOverlay.classList.add('visible');
        }

        function anadirEventListeners() {
            if(dinosManoVirtual) {
                dinosManoVirtual.addEventListener('click', (e) => {
                    if (e.target.classList.contains('dino-selector')) {
                        if (e.target.classList.contains('colocado')) return;
                        
                        document.querySelector('#mano-virtual-dinos .dino-selector.selected')?.classList.remove('selected');
                        
                        if(dinosaurioSeleccionado === e.target.dataset.dinoType){
                            dinosaurioSeleccionado = null;
                            limpiarVisualizacionSlots();
                        } else {
                            e.target.classList.add('selected');
                            dinosaurioSeleccionado = e.target.dataset.dinoType;
                            actualizarVisualizacionSlots();
                        }
                    }
                });
            }
            if(btnVerHistorial) btnVerHistorial.addEventListener('click', mostrarHistorial);
            if(btnCerrarModalHistorial) btnCerrarModalHistorial.addEventListener('click', () => modalHistorialOverlay.classList.remove('visible'));
            if(modalHistorialOverlay) modalHistorialOverlay.addEventListener('click', (e) => {
                if (e.target === modalHistorialOverlay) modalHistorialOverlay.classList.remove('visible');
            });

            if(contenedorTableros) contenedorTableros.addEventListener('click', (e) => {
                if (e.target.classList.contains('dino-slot')) {
                    intentarColocarDinosaurio(e.target);
                }
            });
            if(contenedorPestanas) contenedorPestanas.addEventListener('click', (e) => {
                if (e.target.classList.contains('tab-jugador')) {
                    cambiarPestanaActiva(e.target.dataset.jugadorIndex);
                }
            });

            if(btnRegistrarMano) btnRegistrarMano.addEventListener('click', abrirModalRegistroMano);
            if(btnSiguienteTurno) btnSiguienteTurno.addEventListener('click', avanzarTurno);
            if(btnLanzarDado) btnLanzarDado.addEventListener('click', lanzarDado);
            if(btnManoAleatoria) btnManoAleatoria.addEventListener('click', generarManoAleatoria);
            if(btnDeshacer) btnDeshacer.addEventListener('click', deshacerUltimoMovimiento);
            if(contenedorRestricciones) contenedorRestricciones.addEventListener('click', (e) => {
                if (e.target.classList.contains('btn-dado')) {
                    estadoJuego.restriccionDados = e.target.dataset.restriccion;
                    actualizarUIInfoPartida();
                    actualizarVisualizacionSlots();
                }
            });
            if(btnFinalizarPartida) btnFinalizarPartida.addEventListener('click', mostrarResultadosFinales);
            if(btnCerrarModalResultados) btnCerrarModalResultados.addEventListener('click', () => modalResultadosOverlay.classList.remove('visible'));
        }

        function inicializarJuego() {
            const nombresJugadores = JSON.parse(localStorage.getItem('jugadoresDraftosaurus'));
            if (!nombresJugadores || nombresJugadores.length === 0) {
                alert('No se encontraron jugadores. Por favor, configura una partida primero.');
                window.location.href = 'modo_seguimiento.html';
                return;
            }
            estadoJuego.jugadores = nombresJugadores.map(nombre => ({
                nombre: nombre,
                tablero: {
                    bosqueSemejanza: [], pradoDiferencia: [], praderaAmor: [],
                    trioFrondoso: [], reySelva: [], islaSolitaria: [], rio: []
                },
                puntuacionDetallada: {},
                puntuacionTotal: 0
            }));
            renderizarTableroCompleto();
            actualizarUIInfoPartida();
            anadirEventListeners();
            actualizarEstadoBotonSiguienteTurno();
            renderizarManoVirtual(indiceJugadorActivoTablero);
            actualizarEstilosPestanas();
        }
        inicializarJuego();
    }
    
    const contenedorArbolesInvierno = document.querySelector('.contenedor-arboles-invierno');
    const contenedorNevada = document.querySelector('.contenedor-nevada');
    const esModoInvierno = !document.body.classList.contains('dark-mode');
    function crearCopoNieve() {
        if (!contenedorNevada || !esModoInvierno) return; 

        const copoNieve = document.createElement('div');
        copoNieve.classList.add('copo-nieve');
        const tamano = Math.random() * 5 + 5; 
        const duracion = Math.random() * 8 + 7; 
        const retraso = Math.random() * 10; 
        const inicioX = Math.random() * 100; 
        const finXAleatorio = Math.random() * 40 - 20; 
        copoNieve.style.width = `${tamano}px`;
        copoNieve.style.height = `${tamano}px`;
        copoNieve.style.left = `${inicioX}vw`;
        copoNieve.style.animationDuration = `${duracion}s`;
        copoNieve.style.animationDelay = `${retraso}s`;
        copoNieve.style.setProperty('--mov-x-aleatorio', finXAleatorio); 
        contenedorNevada.appendChild(copoNieve);
        copoNieve.addEventListener('animationiteration', () => {
            if (Math.random() > 0.9) { 
                copoNieve.remove();
            } else {
                copoNieve.style.left = `${Math.random() * 100}vw`;
                copoNieve.style.animationDuration = `${Math.random() * 8 + 7}s`;
                copoNieve.style.animationDelay = `${Math.random() * 10}s`;
                copoNieve.style.setProperty('--mov-x-aleatorio', Math.random() * 40 - 20);
                copoNieve.style.opacity = '0.8'; 
                copoNieve.style.transform = 'translateY(-10vh) translateX(0)'; 
            }
        });
    }

    function generarNevada(cantidad) {
        if (!esModoInvierno || !contenedorNevada) return;
        contenedorNevada.innerHTML = '';
        for (let i = 0; i < cantidad; i++) {
            crearCopoNieve();
        }
    }
    function inicializarArbolesInvierno() {
        const arboles = document.querySelectorAll('.arbol-invierno');

        if ('IntersectionObserver' in window) {
            const observadorArboles = new IntersectionObserver((entradas, observador) => {
                entradas.forEach(entrada => {
                    if (entrada.isIntersecting) {
                        const arbol = entrada.target;
                        arbol.style.transition = 'opacity 1s ease-out';
                        arbol.style.opacity = '0.7'; 
                        observador.unobserve(arbol); 
                    }
                });
            }, {
                rootMargin: '0px 0px -10% 0px' 
            });

            arboles.forEach(arbol => {
                observadorArboles.observe(arbol);
            });
        } else {
            arboles.forEach(arbol => {
                arbol.style.opacity = '0.7';
            });
        }
    }

    if (esModoInvierno) {
        generarNevada(50); 
        inicializarArbolesInvierno();
    }
    const botonAlternarTema = document.getElementById('theme-toggle-button');
    if (botonAlternarTema) {
        botonAlternarTema.addEventListener('click', () => {
            setTimeout(() => {
                const modoInviernoActual = !document.body.classList.contains('dark-mode');
                if (modoInviernoActual) {
                    generarNevada(50);
                    inicializarArbolesInvierno(); 
                    contenedorArbolesInvierno.style.opacity = '1'; 
                    contenedorArbolesInvierno.style.visibility = 'visible';
                } else {
                    contenedorNevada.innerHTML = ''; 
                    contenedorArbolesInvierno.style.opacity = '0'; 
                    contenedorArbolesInvierno.style.visibility = 'hidden';
                }
            }, 100); 
        });
    }
});
