// Aplicación mínima: carga puntos desde points.json y muestra en Leaflet con popup bilingüe
(function () {
  // Elementos de UI
  const splash = document.getElementById("splash");
  const splashStart = document.getElementById("splashStart");
  const welcome = document.getElementById("welcome");
  const welcomeForm = document.getElementById("welcomeForm");
  const userNameInput = document.getElementById("userName");
  const userRoleSelect = document.getElementById("userRole");
  const skipWelcome = document.getElementById("skipWelcome");
  const modal = document.getElementById("modal");
  const modalContent = document.getElementById("modalContent");
  const modalClose = document.getElementById("modalClose");
  const welcomeLangSelect = document.getElementById("welcomeLangSelect");
  const btnQuiz = document.getElementById("btnQuiz");
  const btnHistoria = document.getElementById("btnHistoria");
  const btnVocabulario = document.getElementById("btnVocabulario");
  const btnActividades = document.getElementById("btnActividades");
  const btnPerfil = document.getElementById("btnPerfil");
  const btnLogout = document.getElementById("btnLogout");
  const poiSearch = document.getElementById("poiSearch");
  const btnSearch = document.getElementById("btnSearch");

  // Mantiene los puntos y marcadores globalmente para búsqueda / enfoque
  let pointsById = {};
  let markersById = {};
  // Índice de búsqueda simple: id -> cadena buscable (minúsculas, sin diacríticos)
  let searchIndex = {};

  function showModal(html) {
    modalContent.innerHTML = html;
    modal.setAttribute("aria-hidden", "false");
  }
  function closeModal() {
    modal.setAttribute("aria-hidden", "true");
    modalContent.innerHTML = "";
  }
  modalClose.addEventListener("click", closeModal);

  // Translations for UI strings (pt = Portuguese, es = Spanish)
  const T = {
    pt: {
      header: "TURISMO EDUCA — Projeto Piloto",
      welcomeTitle: "Bem-vinda/o ao TURISMO EDUCA",
      welcomeText:
        "Antes de começar, diga quem você é para personalizar a experiência.",
      labelName: "Nome",
      namePlaceholder: "Seu nome",
      labelProf: "Profissão / Curso",
      profPlaceholder: "Ex: Professor, Aluno 3ºA",
      roleLabel: "Papel",
      roleAlumno: "Aluno",
      roleProfesor: "Professor",
      roleTurista: "Turista",//Añadido
      enter: "Entrar",
      skip: "Entrar sem perfil",
      infoDefault: "Marque um marcador para ver informação bilíngue.",
      searchPlaceholder: "Buscar ponto (ex. Cristo)",
      btnQuiz: "Quiz",
      btnHistoria: "História",
      btnVocabulario: "Vocabulário",
      btnActividades: "Atividades",
      btnPerfil: "Ver Perfil",// Corregido
      btnLogout: "Sair",//Añadido
      modalClose: "Fechar",
      historyTitle: "História",
      quizText:
        "Quiz de exemplo: perguntas interativas para alunos. (Conteúdo demo).",
      historiaText:
        "Texto histórico e fotos da região. Aqui vai um resumo introdutório.",
      actividadesText:
        "Listado de atividades/retos para o passeio educativo (demo).",
        // Traducción para el diálogo de Salida em portugués
        logoutTitle: "Confirmar saída", 
        logoutText: "Você deseja sair do seu perfil e voltar à tela de boas-vindas?",
        logoutConfirm: "Sim, sair",
        logoutCancel: "Cancelar",
    },
    es: {
      header: "TURISMO EDUCA — Proyecto Piloto",
      welcomeTitle: "Bienvenida/o a TURISMO EDUCA",
      welcomeText:
        "Antes de empezar, dinos quién eres  para personalizar la experiencia.",
      labelName: "Nombre",
      namePlaceholder: "Tu nombre",
      labelProf: "Profesión / Curso",
      profPlaceholder: "Ej: Profesor, Alumno 3ºA",
      roleLabel: "Rol",
      roleAlumno: "Alumno",
      roleProfesor: "Profesor",
      roleTurista: "Turista",//Añadido
      enter: "Entrar",
      skip: "Entrar sin perfil",
      infoDefault: "Marca un marcador para ver información bilingüe.",
      searchPlaceholder: "Buscar punto (ej. Cristo)",
      btnQuiz: "Quiz",
      btnHistoria: "Historia",
      btnVocabulario: "Vocabulario",
      btnActividades: "Actividades",
      btnPerfil: "Ver Perfil",// Corregido
      btnLogout: "Salir",//Añadido  
      modalClose: "Cerrar",
      historyTitle: "Historia",
      quizText:
        "Quiz de ejemplo: preguntas interactivas para estudiantes. (Contenido demo).",
      historiaText:
        "Texto histórico y fotos de la región. Aquí un resumen introductorio.",
      actividadesText:
        "Listado de actividades/retos para el paseo educativo (demo).",
        // Traducción para el diálogo de Salida em español
        logoutTitle: "Confirmar salida", 
        logoutText: "¿Deseas salir de tu perfil y volver a la pantalla de bienvenida?",
        logoutConfirm: "Sí, salir",
        logoutCancel: "Cancelar",
    },
  };

  function applyTranslations(lang) {
    const t = T[lang] || T.pt;
    // cabecera (solo establece la cabecera genérica cuando no hay usuario)
    const header = document.querySelector("header h1");
    if (!getUser()) header.textContent = t.header;

    // Panel de Bienvenida
    const welcomeTitleEl = document.getElementById("welcomeTitle");
    if (welcomeTitleEl) welcomeTitleEl.textContent = t.welcomeTitle;
    const welcomeTextEl = document.getElementById("welcomeText");
    if (welcomeTextEl) welcomeTextEl.textContent = t.welcomeText;

    // labelName: preservar el elemento input al cambiar la etiqueta
    const labelNameEl = document.getElementById("labelName");
    if (labelNameEl) {
      const input = labelNameEl.querySelector("input");
      labelNameEl.innerHTML = t.labelName + "<br />";
      if (input) {
        input.placeholder = t.namePlaceholder || input.placeholder;
        labelNameEl.appendChild(input);
      }
    }

    // Etiqueta de rol: preservar el elemento select
    const labelRoleEl = document.getElementById("labelRole");
    if (labelRoleEl) {
      const select = labelRoleEl.querySelector("select");
      labelRoleEl.innerHTML = t.roleLabel + "\n";
      if (select) labelRoleEl.appendChild(select);
    }

    if (document.getElementById("roleAlumno"))
      document.getElementById("roleAlumno").textContent = t.roleAlumno;
    if (document.getElementById("roleProfesor"))
      document.getElementById("roleProfesor").textContent = t.roleProfesor;
    if (document.getElementById("roleTurista"))
      document.getElementById("roleTurista").textContent =
        t.roleTurista || "Turista";

    // Botón Omitir e información por defecto
    const skipBtn = document.getElementById("skipWelcome");
    if (skipBtn) skipBtn.textContent = t.skip;
    const infoEl = document.getElementById("info");
    if (infoEl) infoEl.textContent = t.infoDefault;
    
    // Placeholder del buscador
    if (poiSearch) poiSearch.placeholder = t.searchPlaceholder;

    // botones de la barra de herramientas (toolbar)
    if (btnQuiz) btnQuiz.textContent = t.btnQuiz;
    if (btnHistoria) btnHistoria.textContent = t.btnHistoria;
    if (btnVocabulario) btnVocabulario.textContent = t.btnVocabulario;
    if (btnActividades) btnActividades.textContent = t.btnActividades;
    if (btnPerfil) btnPerfil.textContent = t.btnPerfil;
    if (btnLogout) btnLogout.textContent = t.btnLogout; // Asegurada la traducción de "Salir"!
    // modal close
    if (modalClose) modalClose.textContent = t.modalClose;
  }

  function getRoleDisplay(role, lang) {
    const t = T[lang] || T.pt;
    if (role === "alumno") return t.roleAlumno;
    if (role === "profesor") return t.roleProfesor;
    if (role === "turista") return t.roleTurista;
    // Fallback para cualquier otro rol
    return role;
  }

  /* El event listener de traducciones fue movido más abajo, después de que
     'langSelect' esté definido. Esto evita intentar referenciar el elemento DOM
     antes de que esté disponible (lo cual causaba un ReferenceError en tiempo
     de ejecución que detenía el script). */

  function getUser() {
    try {
      return JSON.parse(localStorage.getItem("turismoUser")) || null;
    } catch (e) {
      return null;
    }
  }
  function setUser(u) {
    localStorage.setItem("turismoUser", JSON.stringify(u));
    renderUser();
  }
  function renderUser() {
    const u = getUser();
    const header = document.querySelector("header h1");
    // Determinar el idioma para elegir el prefijo de cabecera localizado
    const lang =
      (langSelect && langSelect.value) ||
      (welcomeLangSelect && welcomeLangSelect.value) ||
      "es";
    const baseHeader = ((T[lang] || T.es).header || "TURISMO EDUCA").split(
      " — "
    )[0];
    if (u) {
      const roleDisplay = getRoleDisplay(u.role, lang);
      header.textContent = `${baseHeader} — ${u.name} (${roleDisplay})`;
      welcome.setAttribute("aria-hidden", "true");
    } else {
      header.textContent = (T[lang] || T.es).header;
      welcome.setAttribute("aria-hidden", "false");
    }
  }

  // Si no hay usuario, mostrar el overlay de bienvenida
  if (!getUser()) welcome.setAttribute("aria-hidden", "false");
  else welcome.setAttribute("aria-hidden", "true");

  // Manejadores de splash: ocultar splash cuando el usuario hace clic en Comenzar o cuando buscan
  function hideSplash() {
    try {
      if (splash) splash.setAttribute("aria-hidden", "true");
      // Recordar que el usuario descartó el splash solo para esta sesión
      try {
        sessionStorage.setItem('seenSplash', '1');
      } catch (e) {}
    } catch (e) {}
  }
  if (splashStart) {
    splashStart.addEventListener("click", (e) => {
      e.preventDefault();
      hideSplash();
      // Enfocar el input de búsqueda para que puedan buscar inmediatamente
      try {
        poiSearch && poiSearch.focus();
      } catch (err) {}
    });
  }

  // Si el usuario ya descartó el splash en esta sesión, ocultarlo inmediatamente
  try {
    if (sessionStorage.getItem('seenSplash') === '1') {
      if (splash) splash.setAttribute('aria-hidden', 'true');
    }
  } catch (e) {}

  // Toolbar buttons
  btnQuiz.addEventListener("click", () => {
    const lang = (langSelect && langSelect.value) || "es";
    showModal(
      `<h3>${(T[lang] || T.es).btnQuiz}</h3><p>${
        (T[lang] || T.es).quizText
      }</p>`
    );
    info.textContent = (T[lang] || T.es).quizText;
  });
  btnHistoria.addEventListener("click", () => {
    const lang = (langSelect && langSelect.value) || "es";
    showModal(
      `<h3>${(T[lang] || T.es).historyTitle}</h3><p>${
        (T[lang] || T.es).historiaText
      }</p>`
    );
    info.textContent = (T[lang] || T.es).historiaText;
  });
  btnActividades.addEventListener("click", () => {
    const lang = (langSelect && langSelect.value) || "es";
    showModal(
      `<h3>${(T[lang] || T.es).btnActividades}</h3><p>${
        (T[lang] || T.es).actividadesText
      }</p>`
    );
    info.textContent = (T[lang] || T.es).actividadesText;
  });
  btnPerfil.addEventListener("click", () => {
    const u = getUser();
    if (!u)
      return showModal(
        "<p>No hay usuario. Usa el formulario de bienvenida para crear un perfil.</p>"
      );
    const lang = (langSelect && langSelect.value) || "es";
    const roleDisplay = getRoleDisplay(u.role, lang);
    const html = `<h3>Perfil</h3><p>Nombre: ${u.name}</p><p>Rol: ${roleDisplay}</p><div style="margin-top:12px"><button id="editProfile" class="btn">Editar perfil</button></div>`;
    showModal(html);
    // Adjuntar manejador después de mostrar el modal
    setTimeout(() => {
      const edit = document.getElementById("editProfile");
      if (edit) {
        edit.addEventListener("click", () => {
          closeModal();
          // Prellenar formulario de bienvenida y mostrar
          const user = getUser() || {};
          userNameInput.value = user.name || "";
          userRoleSelect.value =
            user.role === "profesor" ? "profesor" : "alumno";
          welcome.setAttribute("aria-hidden", "false");
        });
      }
    }, 50);
  });

  // Botón logout: mostrar modal de confirmación, luego limpiar usuario y mostrar bienvenida
  if (btnLogout)
    btnLogout.addEventListener("click", () => {
      const lang = (langSelect && langSelect.value) || "es";
      const t = T[lang] || T.es;
      const html = `<h3>${t.logoutTitle}</h3>
      <p>${t.logoutText}</p>
      <div style="margin-top:12px">
        <button id="confirmLogout" class="btn primary">${t.logoutConfirm}</button>
        <button id="cancelLogout" class="btn">${t.logoutCancel}</button>
      </div>`;
      showModal(html);
      // Adjuntar manejadores después de renderizar el modal
      setTimeout(() => {
        const confirmBtn = document.getElementById("confirmLogout");
        const cancelBtn = document.getElementById("cancelLogout");
        if (confirmBtn) {
          confirmBtn.addEventListener("click", () => {
            localStorage.removeItem("turismoUser");
            closeModal();
            renderUser();
            // Asegurar que la capa de bienvenida sea visible
            if (welcome) welcome.setAttribute("aria-hidden", "false");
          });
        }
        if (cancelBtn) {
          cancelBtn.addEventListener("click", () => {
            closeModal();
          });
        }
      }, 50);
    });

  welcomeForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = userNameInput.value.trim();
    if (!name) return alert("Por favor ingresa tu nombre");
    const role = userRoleSelect.value;
    setUser({ name, role });
    closeModal();
  });
  skipWelcome.addEventListener("click", () => {
    // Usar rol 'turista' para visitante anónimo
    setUser({ name: "Visitante", role: "turista" });
    closeModal();
  });

  const map = L.map("map").setView([-27.02, -48.642], 13); // Balneário Camboriú approx
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
  }).addTo(map);

  const info = document.getElementById("info");
  const langSelect = document.getElementById("langSelect");

  // Aplicar traducciones ahora que langSelect existe
  applyTranslations(langSelect.value || "es");
  // Asegurar que el encabezado muestre texto personalizado si el usuario existe
  renderUser();
  // Actualizar traducciones e info cuando cambie el idioma
  langSelect.addEventListener("change", () => {
    const lang = langSelect.value || "es";
    applyTranslations(lang);
    info.textContent = (T[lang] || T.es).infoDefault;
    // Re-renderizar encabezado de usuario para que nombre/rol se preserven con prefijo localizado
    renderUser();
  });

  // Si existe selector de idioma de bienvenida, sincronizar con selector principal y permitir
  // seleccionar idioma antes de entrar
  if (welcomeLangSelect) {
    // Empezar con el mismo valor que el selector del encabezado
    welcomeLangSelect.value = langSelect.value || "es";
    welcomeLangSelect.addEventListener("change", () => {
      const lang = welcomeLangSelect.value || "es";
      // Actualizar selector principal y disparar su manejador de cambio
      langSelect.value = lang;
      langSelect.dispatchEvent(new Event("change"));
    });
  }

  function loadPoints() {
    // Intentar cargar primero un archivo GeoJSON estándar; fallback a legacy points.json
    function fetchGeoJSON() {
      return fetch("points.geojson").then((r) => {
        if (!r.ok) throw new Error("no-geojson");
        return r.json();
      });
    }

    function fetchLegacy() {
      return fetch("points.json").then((r) => r.json());
    }

    function toPointsArrayFromGeo(geo) {
      if (
        !geo ||
        geo.type !== "FeatureCollection" ||
        !Array.isArray(geo.features)
      )
        return [];
      return geo.features.map((f) => {
        const props = f.properties || {};
        const coords = (f.geometry && f.geometry.coordinates) || [0, 0];
        return {
          id:
            props.id ||
            f.id ||
            String(props.title?.pt || props.title?.es || Math.random()),
          lat: coords[1],
          lng: coords[0],
          title: props.title || {},
          desc: props.desc || {},
          history: props.history || {},
          image: props.image || null,
        };
      });
    }

    function processPoints(points) {
      // Indexar puntos por id para acceso rápido
      pointsById = {};
      markersById = {};
      points.forEach((p) => {
        pointsById[p.id] = p;
      });

      // Construir índice de búsqueda: incluir id y todas las variaciones de título
      searchIndex = {};
      points.forEach((p) => {
        const pieces = [p.id];
        if (p.title) {
          Object.keys(p.title).forEach((k) => pieces.push(p.title[k]));
        }
        const joined = pieces.join(" ").toLowerCase();
        // Normalizar para eliminar diacríticos y tener búsqueda más robusta
        const normalized = joined
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
        searchIndex[p.id] = normalized;
      });

      // Cargar sobreescrituras desde localStorage (id -> {lat,lng})
      const overrides = JSON.parse(
        localStorage.getItem("pointOverrides") || "{}"
      );
      points.forEach((p) => {
        const useLat = overrides[p.id] ? overrides[p.id].lat : p.lat;
        const useLng = overrides[p.id] ? overrides[p.id].lng : p.lng;
        const marker = L.marker([useLat, useLng], {
          riseOnHover: true,
          draggable: true,
        }).addTo(map);
        try {
          if (marker.dragging) marker.dragging.disable();
        } catch (err) {}
        markersById[p.id] = marker;
        const imageHtml = p.image ? `<img src="${p.image}" alt="${p.title.pt}" style="width:100%;height:auto;margin-bottom:8px;"/>` : '';
        const popupContent = `<div>${imageHtml}<strong>${p.title.pt}</strong><br>${
          p.desc.pt
        }<br><a href="#" class="history-link" data-id="${
          p.id
        }">Ver historia</a><div style="margin-top:8px;font-size:0.9em">Coords: ${useLat.toFixed(
          5
        )}, ${useLng.toFixed(5)} <button class="fix-coords btn" data-id="${
          p.id
        }">Corregir posición</button></div></div>`;
        marker.bindPopup(popupContent);

        marker.on("click", () => {
          const lang = langSelect.value;
          const title = p.title[lang] || p.title.pt;
          const desc = p.desc[lang] || p.desc.pt;
          info.textContent = title + " — " + desc;
        });

        marker.on("popupopen", (e) => {
          const langNow = langSelect.value || "pt";
          const titleNow = p.title[langNow] || p.title.pt;
          const descNow = p.desc[langNow] || p.desc.pt;
          const curLat = overrides[p.id] ? overrides[p.id].lat : p.lat;
          const curLng = overrides[p.id] ? overrides[p.id].lng : p.lng;
          const imageHtmlNow = p.image ? `<img src="${p.image}" alt="${titleNow}" style="width:100%;height:auto;margin-bottom:8px;"/>` : '';
          const contentNow = `<div>${imageHtmlNow}<strong>${titleNow}</strong><br>${descNow}<br><a href="#" class="history-link" data-id="${
            p.id
          }">Ver historia</a><div style="margin-top:8px;font-size:0.9em">Coords: ${curLat.toFixed(
            5
          )}, ${curLng.toFixed(5)} <button class="fix-coords btn" data-id="${
            p.id
          }">Corregir posición</button></div></div>`;
          try {
            e.popup.setContent(contentNow);
          } catch (err) {}

          const selector = `.history-link[data-id="${p.id}"]`;
          try {
            const popupEl = e.popup.getElement
              ? e.popup.getElement()
              : document;
            const link = popupEl.querySelector(selector);
            if (link) {
              link.addEventListener("click", (ev) => {
                ev.preventDefault();
                showHistory(p.id, pointsById);
              });
            }
            const fixBtn = popupEl.querySelector(
              `.fix-coords[data-id="${p.id}"]`
            );
            if (fixBtn) {
              fixBtn.addEventListener("click", (ev) => {
                ev.preventDefault();
                if (marker.dragging) marker.dragging.enable();
                else marker.options.draggable = true;
                info.textContent =
                  "Arrastra el marcador al lugar correcto y suéltalo. Luego se guardará localmente.";
                marker.once("dragend", (de) => {
                  const nl = de.target.getLatLng();
                  overrides[p.id] = { lat: nl.lat, lng: nl.lng };
                  localStorage.setItem(
                    "pointOverrides",
                    JSON.stringify(overrides)
                  );
                  try {
                    marker.setLatLng([nl.lat, nl.lng]);
                  } catch (err) {}
                  try {
                    if (marker.dragging) marker.dragging.disable();
                  } catch (err) {}
                  const imageHtmlUpdated = p.image ? `<img src="${p.image}" alt="${titleNow}" style="width:100%;height:auto;margin-bottom:8px;"/>` : '';
                  const updated = `<div>${imageHtmlUpdated}<strong>${titleNow}</strong><br>${descNow}<br><a href=\"#\" class=\"history-link\" data-id=\"${
                    p.id
                  }\">Ver historia</a><div style=\"margin-top:8px;font-size:0.9em\">Coords: ${nl.lat.toFixed(
                    5
                  )}, ${nl.lng.toFixed(
                    5
                  )} <button class=\"fix-coords btn\" data-id=\"${
                    p.id
                  }\">Corregir posición</button></div></div>`;
                  try {
                    e.popup.setContent(updated);
                  } catch (err) {}
                  info.textContent = "Posición guardada localmente.";
                });
              });
            }
          } catch (err) {
            // ignore if popup element cannot be queried
          }
        });
      });
    }

    // Intentar GeoJSON y luego fallback
    fetchGeoJSON()
      .then((geo) => processPoints(toPointsArrayFromGeo(geo)))
      .catch(() => {
        // Fallback a formato legacy
        fetchLegacy()
          .then((points) => processPoints(points))
          .catch((e) => {
            info.textContent = "Error cargando puntos: " + e.message;
          });
      });
  }

  // Función de búsqueda: encontrar por id o substring de título (idioma actual)
  function searchAndFocus(query) {
    // Ocultar splash si está visible para que el mapa sea visible detrás
    hideSplash();
    if (!query) return showModal("<p>Ingrese un término de búsqueda.</p>");
    const raw = query.trim();
    if (!raw) return showModal("<p>Ingrese un término de búsqueda.</p>");
    const q = raw
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    let found = null;
    // Preferir coincidencia exacta de id primero
    const idCandidate = Object.keys(pointsById).find(
      (id) => id.toLowerCase() === q
    );
    if (idCandidate) found = pointsById[idCandidate];
    // De lo contrario, buscar en el índice coincidencia de substring
    if (!found) {
      for (const id in searchIndex) {
        if (searchIndex[id].includes(q)) {
          found = pointsById[id];
          break;
        }
      }
    }
    if (!found)
      return showModal("<p>No se encontró ningún punto que coincida.</p>");
    // Enfocar mapa
    const marker = markersById[found.id];
    if (marker) {
      // Usar las coordenadas actuales del marcador (que pueden incluir sobreescrituras) para centrar
      try {
        const ll = marker.getLatLng();
        map.setView([ll.lat, ll.lng], 15, { animate: true });
      } catch (err) {
        // Fallback a coordenadas originales
        map.setView([found.lat, found.lng], 15, { animate: true });
      }
      marker.openPopup();
      // Pequeño rebote visual para llamar la atención: retrasar un poco para que el DOM se actualice
      setTimeout(() => {
        try {
          const icon = marker.getElement ? marker.getElement() : marker._icon;
          if (icon) {
            icon.classList.add("marker-bounce");
            setTimeout(() => icon.classList.remove("marker-bounce"), 750);
          }
        } catch (err) {}
      }, 150);
    }
    // También mostrar historia o info
    const lang = (langSelect && langSelect.value) || "es";
    const title = found.title[lang] || found.title.pt;
    const desc = found.desc[lang] || found.desc.pt;
    info.textContent = title + " — " + desc;
  }

  // Wire search UI
  if (btnSearch && poiSearch) {
    btnSearch.addEventListener("click", () => searchAndFocus(poiSearch.value));
    poiSearch.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        searchAndFocus(poiSearch.value);
      }
    });
  }

  function showHistory(id, pointsById) {
    const p = pointsById && pointsById[id] ? pointsById[id] : null;
    if (!p) return showModal("<p>Historial no disponible para este punto.</p>");
    const lang = langSelect.value || "pt";
    const title = p.title[lang] || p.title.pt;
    const historyText =
      (p.history && (p.history[lang] || p.history.pt)) ||
      "<p>Historia no disponible.</p>";
    const html = `<h3>${title}</h3><div>${historyText}</div>`;
    showModal(html);
  }

  // Cambio de idioma manejado arriba (applyTranslations)

  loadPoints();

  // Renderizar encabezado si el usuario ya existe
  renderUser();
  // --- Nuevas Funciones para Contenido (Quiz, Historia, Actividades) ---

function showQuiz() {
  // Obtenemos el idioma actual para las traducciones
  const lang = (langSelect && langSelect.value) || "pt";
  const quizTitle = lang === 'es' ? 'Quiz de Turismo y Cultura' : 'Quiz de Turismo e Cultura';
  
  // Contenido del Quiz: 2 preguntas (fácil de ampliar)
  const quizContent = `
    <h2>${quizTitle}</h2>
    <p>${lang === 'es' ? '¡Pon a prueba tus conocimientos sobre la región!' : 'Teste seus conhecimentos sobre a região!'}</p>

    <form id="quizForm">
      
      <h3>1. ${lang === 'es' ? '¿Qué atrae al Parque Unipraias el título de ser el único teleférico del mundo de su tipo?' : 'O que faz o Parque Unipraias ser o único teleférico do mundo do seu tipo?'}</h3>
      <label><input type="radio" name="q1" value="a"> ${lang === 'es' ? 'Interconecta 3 playas' : 'Interliga 3 praias'}</label><br>
      <label><input type="radio" name="q1" value="b"> ${lang === 'es' ? 'Es el único que sube un morro' : 'É o único que sobe um morro'}</label><br>
      <label><input type="radio" name="q1" value="c"> ${lang === 'es' ? 'Interconecta dos playas (Barra Sul y Laranjeiras)' : 'Interliga duas praias (Barra Sul e Laranjeiras)'}</label><br>
      
      <br>
      
      <h3>2. ${lang === 'es' ? 'El programa "Parque Escola" se enfoca en la conservación de...' : 'O programa "Parque Escola" se foca na conservação da...'}</h3>
      <label><input type="radio" name="q2" value="a"> ${lang === 'es' ? 'La Fauna marina' : 'A Fauna marinha'}</label><br>
      <label><input type="radio" name="q2" value="b"> ${lang === 'es' ? 'La Mata Atlântica' : 'A Mata Atlântica'}</label><br>
      <label><input type="radio" name="q2" value="c"> ${lang === 'es' ? 'Las dunas de arena' : 'As dunas de areia'}</label><br>

      <br>
      
      <button type="submit" class="btn primary">${lang === 'es' ? 'Verificar Respuestas' : 'Verificar Respostas'}</button>
    </form>

    <div id="quizResult" style="margin-top: 15px; font-weight: bold;"></div>
  `;

  showModal(quizContent);

  // Lógica de validación de respuestas
  const quizForm = document.getElementById("quizForm");
  if (quizForm) {
    quizForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const resultDiv = document.getElementById("quizResult");
      const q1 = document.querySelector('input[name="q1"]:checked');
      const q2 = document.querySelector('input[name="q2"]:checked');
      
      let feedback = [];
      
      // Respuestas Correctas: Q1: c, Q2: b
      
      if (q1 && q1.value === 'c') {
        feedback.push(lang === 'es' ? 'Pregunta 1: Correcta (Conecta dos playas).' : 'Pergunta 1: Correta (Conecta duas praias).');
      } else {
        feedback.push(lang === 'es' ? 'Pregunta 1: Incorrecta.' : 'Pergunta 1: Incorreta.');
      }

      if (q2 && q2.value === 'b') {
        feedback.push(lang === 'es' ? 'Pregunta 2: Correcta (La Mata Atlântica).' : 'Pergunta 2: Correta (A Mata Atlântica).');
      } else {
        feedback.push(lang === 'es' ? 'Pregunta 2: Incorrecta.' : 'Pergunta 2: Incorreta.');
      }

      // Muestra solo el feedback (sin score)
      resultDiv.innerHTML = `<p>${lang === 'es' ? 'Resultados de tu intento:' : 'Resultados da sua tentativa:'}</p><ul><li>${feedback.join('</li><li>')}</li></ul>`;
    });
  }
}

function showActivities() {
  const lang = (langSelect && langSelect.value) || "pt";
  const title = lang === 'es' ? 'Actividades en Balneário Camboriú' : 'Atividades em Balneário Camboriú';
  
  const activitiesContent = `
    <h2>${title}</h2>
    <div class="activities-tree">
      
      <!-- 1. Parque Unipraias -->
      <div class="tree-item">
        <div class="tree-header" onclick="this.parentElement.classList.toggle('open')">
          <i class="fa fa-chevron-right"></i>
          <strong>1. Parque Unipraias</strong>
        </div>
        <div class="tree-content">
          <p>${lang === 'es' 
            ? 'El paseo principal se realiza en el Bondinho Aéreo, que interconecta tres estaciones, siendo el único teleférico en el mundo que une dos playas: la Estación Barra Sul y la Estación Laranjeiras.'
            : 'O passeio principal é feito pelo Bondinho Aéreo, que interliga três estações, sendo o único teleférico no mundo a ligar duas praias: a Estação Barra Sul e a Estação Laranjeiras.'}</p>
          <p>${lang === 'es'
            ? 'La estación intermedia, Estación Mata Atlântica (en el Morro da Aguada), es el corazón educativo. Aquí se puede realizar un sendero ecológico guiado (parte del programa "Parque Escola"), donde monitores explican la fauna y flora de la Mata Atlântica, uno de los biomas más amenazados de Brasil.'
            : 'A estação intermediária, Estação Mata Atlântica (no Morro da Aguada), é o coração educativo. Aqui é possível fazer uma trilha ecológica guiada (parte do programa "Parque Escola"), onde monitores explicam a fauna e flora da Mata Atlântica, um dos biomas mais ameaçados do Brasil.'}</p>
          
          <h4>${lang === 'es' ? 'Atracciones en el Parque:' : 'Atrações no Parque:'}</h4>
          <ul>
            <li><strong>Youhooo!</strong> ${lang === 'es' 
              ? 'Es un trineo de montaña ubicado en la Estación Mata Atlântica. Realiza un recorrido de 710 metros en medio de la Mata Atlântica (ida y vuelta). El trineo puede alcanzar hasta 60 km/h, y todos los carritos poseen frenos, lo que permite al aventurero elegir a qué velocidad descender. Puede realizarse en pareja o individualmente. Equipo de fabricación alemana. En total, son 30 trenós.'
              : 'É um trenó de montanha localizado na Estação Mata Atlântica. Faz um percurso de 710 metros em meio a Mata Atlântica (vai e volta no mesmo local). O trenó pode atingir até 60km/h, todos os carrinhos possuem freios fazendo com que o aventureiro escolha em que velocidade descer. Pode ser realizado em dupla ou individualmente. Equipamento de fabricação alemã. Ao todo são 30 trenós.'}</li>
            
            <li><strong>ZipRider</strong> ${lang === 'es'
              ? 'Es una mega tirolesa ubicada en la Estación Mata Atlântica. Desciende desde la Estación Mata Atlântica hasta la Estación Laranjeiras. Son 240 metros de altura y 750 metros de distancia que se recorren en 45 segundos a 1 minuto, alcanzando una velocidad de hasta 60 km/h. El equipo permite el descenso de hasta 4 personas a la vez, con sistema de freno automático. Al descender en ZipRider, tienes derecho a un viaje de regreso en el Bondinho.'
              : 'É uma mega tirolesa localizada na Estação Mata Atlântica. Desce da Estação Mata Atlântica até a Estação Laranjeiras. São 240m de altura e 750m de distância percorridos de 45s a 1 minuto, atingindo velocidade de até 60km/h. O equipamento permite a descida de até 4 pessoas por vez, com sistema de freio automático. Descendo de ZipRider você tem direito a retorno de bondinho.'}</li>
            
            <li><strong>Fantástica Floresta</strong> ${lang === 'es'
              ? 'Viaja en el mágico tren suspendido a cerca de 3 metros y sorpréndete con la Casa del Chocolate y el Mirador Laranjeiras. Con tres vagones y capacidad para 14 personas, recorre un trayecto de aprox. 400 metros a una velocidad que puede alcanzar hasta 10 km/h.'
              : 'Viaje pelo mágico trem suspenso a cerca de 3m e se surpreenda com a Casa do Chocolate e o Mirante Laranjeiras. Com três vagões e capacidade para 14 pessoas, percorre um trajeto de aprox. 400m a uma velocidade que pode chegar até 10km/h.'}</li>
            
            <li><strong>Super Gyro Tower</strong> ${lang === 'es'
              ? 'Ubicada en el punto más alto del Morro da Aguada, ofrece una experiencia inolvidable con vistas panorámicas de la deslumbrante belleza natural de Balneário Camboriú. Elevándose a 59 metros de altura y alcanzando casi 300 metros sobre el nivel del mar, la torre ofrece una imagen inigualable del litoral catarinense. Capacidad para 50 personas simultáneamente.'
              : 'Localizada no ponto mais alto do Morro da Aguada, oferece uma experiência inesquecível com vistas panorâmicas da deslumbrante beleza natural de Balneário Camboriú. Elevando-se a 59 metros de altura e atingindo quase 300 metros acima do nível do mar, a torre oferece uma imagem inigualável do litoral catarinense. Capacidade para 50 pessoas simultaneamente.'}</li>
          </ul>
        </div>
      </div>

      <!-- 2. Barco Pirata -->
      <div class="tree-item">
        <div class="tree-header" onclick="this.parentElement.classList.toggle('open')">
          <i class="fa fa-chevron-right"></i>
          <strong>2. Barco Pirata</strong>
        </div>
        <div class="tree-content">
          <p><em>${lang === 'es' ? '(en desarrollo)' : '(em desenvolvimento)'}</em></p>
        </div>
      </div>

      <!-- 3. Catamarã do Barco Pirata -->
      <div class="tree-item">
        <div class="tree-header" onclick="this.parentElement.classList.toggle('open')">
          <i class="fa fa-chevron-right"></i>
          <strong>3. ${lang === 'es' ? 'Catamarán a Portobelo' : 'Catamarã do Barco Pirata'}</strong>
        </div>
        <div class="tree-content">
          <p><em>${lang === 'es' ? '(en desarrollo)' : '(em desenvolvimento)'}</em></p>
        </div>
      </div>

      <!-- 4. Píer da Barra Sul -->
      <div class="tree-item">
        <div class="tree-header" onclick="this.parentElement.classList.toggle('open')">
          <i class="fa fa-chevron-right"></i>
          <strong>4. ${lang === 'es' ? 'Muelle de Barra Sul' : 'Píer da Barra Sul'}</strong>
        </div>
        <div class="tree-content">
          <p><em>${lang === 'es' ? '(en desarrollo)' : '(em desenvolvimento)'}</em></p>
        </div>
      </div>

      <!-- 5. Passarela da Barra -->
      <div class="tree-item">
        <div class="tree-header" onclick="this.parentElement.classList.toggle('open')">
          <i class="fa fa-chevron-right"></i>
          <strong>5. ${lang === 'es' ? 'Pasarela da Barra' : 'Passarela da Barra'}</strong>
        </div>
        <div class="tree-content">
          <p><em>${lang === 'es' ? '(en desarrollo)' : '(em desenvolvimento)'}</em></p>
        </div>
      </div>

      <!-- 6. Classic Car Show -->
      <div class="tree-item">
        <div class="tree-header" onclick="this.parentElement.classList.toggle('open')">
          <i class="fa fa-chevron-right"></i>
          <strong>6. Classic Car Show</strong>
        </div>
        <div class="tree-content">
          <p><em>${lang === 'es' ? '(en desarrollo)' : '(em desenvolvimento)'}</em></p>
        </div>
      </div>

      <!-- 7. Oceanic Aquarium -->
      <div class="tree-item">
        <div class="tree-header" onclick="this.parentElement.classList.toggle('open')">
          <i class="fa fa-chevron-right"></i>
          <strong>7. Oceanic Aquarium</strong>
        </div>
        <div class="tree-content">
          <p><em>${lang === 'es' ? '(en desarrollo)' : '(em desenvolvimento)'}</em></p>
        </div>
      </div>

      <!-- 8. Cinema 3D -->
      <div class="tree-item">
        <div class="tree-header" onclick="this.parentElement.classList.toggle('open')">
          <i class="fa fa-chevron-right"></i>
          <strong>8. ${lang === 'es' ? 'Cine 3D' : 'Cinema 3D'}</strong>
        </div>
        <div class="tree-content">
          <p><em>${lang === 'es' ? '(en desarrollo)' : '(em desenvolvimento)'}</em></p>
        </div>
      </div>

      <!-- 9. Aventura Pirata -->
      <div class="tree-item">
        <div class="tree-header" onclick="this.parentElement.classList.toggle('open')">
          <i class="fa fa-chevron-right"></i>
          <strong>9. ${lang === 'es' ? 'Aventura Pirata' : 'Aventura Pirata'}</strong>
        </div>
        <div class="tree-content">
          <p><em>${lang === 'es' ? '(en desarrollo)' : '(em desenvolvimento)'}</em></p>
        </div>
      </div>

      <!-- 10. Summit BC -->
      <div class="tree-item">
        <div class="tree-header" onclick="this.parentElement.classList.toggle('open')">
          <i class="fa fa-chevron-right"></i>
          <strong>10. Summit BC</strong>
        </div>
        <div class="tree-content">
          <p><em>${lang === 'es' ? '(en desarrollo)' : '(em desenvolvimento)'}</em></p>
        </div>
      </div>

      <!-- 11. City Tour -->
      <div class="tree-item">
        <div class="tree-header" onclick="this.parentElement.classList.toggle('open')">
          <i class="fa fa-chevron-right"></i>
          <strong>11. City Tour Balneário Camboriú</strong>
        </div>
        <div class="tree-content">
          <ul>
            <li>${lang === 'es' ? 'Camelódromo' : 'Camelódromo'}</li>
            <li>${lang === 'es' ? 'Iglesia Santa Inés' : 'Igreja Santa Inês'}</li>
            <li>${lang === 'es' ? 'Peatonal Central - Playa Central' : 'Calçadão Central - Praia Central'}</li>
            <li>${lang === 'es' ? 'Plaza Tamandaré' : 'Praça Tamandaré'}</li>
            <li>${lang === 'es' ? 'Paseo Alvin Baur' : 'Passeio Alvin Baur'}</li>
            <li>Show Atlântico</li>
            <li>${lang === 'es' ? 'Artesanos' : 'Artesãos'}</li>
          </ul>
          <p><em>${lang === 'es' ? '(en desarrollo)' : '(em desenvolvimento)'}</em></p>
        </div>
      </div>

      <!-- 12. FG Big Wheel -->
      <div class="tree-item">
        <div class="tree-header" onclick="this.parentElement.classList.toggle('open')">
          <i class="fa fa-chevron-right"></i>
          <strong>12. FG Big Wheel</strong>
        </div>
        <div class="tree-content">
          <p><em>${lang === 'es' ? '(en desarrollo)' : '(em desenvolvimento)'}</em></p>
        </div>
      </div>

      <!-- 13. Píer Norte -->
      <div class="tree-item">
        <div class="tree-header" onclick="this.parentElement.classList.toggle('open')">
          <i class="fa fa-chevron-right"></i>
          <strong>13. ${lang === 'es' ? 'Muelle Norte' : 'Píer Norte'}</strong>
        </div>
        <div class="tree-content">
          <p><em>${lang === 'es' ? '(en desarrollo)' : '(em desenvolvimento)'}</em></p>
        </div>
      </div>

      <!-- 14. Praia do Buraco -->
      <div class="tree-item">
        <div class="tree-header" onclick="this.parentElement.classList.toggle('open')">
          <i class="fa fa-chevron-right"></i>
          <strong>14. Praia do Buraco</strong>
        </div>
        <div class="tree-content">
          <p><em>${lang === 'es' ? '(en desarrollo)' : '(em desenvolvimento)'}</em></p>
        </div>
      </div>

      <!-- 15. Morro Careca -->
      <div class="tree-item">
        <div class="tree-header" onclick="this.parentElement.classList.toggle('open')">
          <i class="fa fa-chevron-right"></i>
          <strong>15. Morro Careca</strong>
        </div>
        <div class="tree-content">
          <p><em>${lang === 'es' ? '(en desarrollo)' : '(em desenvolvimento)'}</em></p>
        </div>
      </div>

      <!-- 16. Complexo Turístico Cristo Luz -->
      <div class="tree-item">
        <div class="tree-header" onclick="this.parentElement.classList.toggle('open')">
          <i class="fa fa-chevron-right"></i>
          <strong>16. ${lang === 'es' ? 'Complejo Turístico Cristo Luz' : 'Complexo Turístico Cristo Luz'}</strong>
        </div>
        <div class="tree-content">
          <p><em>${lang === 'es' ? '(en desarrollo)' : '(em desenvolvimento)'}</em></p>
        </div>
      </div>

      <!-- 17. Aventura Jurássica -->
      <div class="tree-item">
        <div class="tree-header" onclick="this.parentElement.classList.toggle('open')">
          <i class="fa fa-chevron-right"></i>
          <strong>17. ${lang === 'es' ? 'Aventura Jurásica' : 'Aventura Jurássica'}</strong>
        </div>
        <div class="tree-content">
          <p><em>${lang === 'es' ? '(en desarrollo)' : '(em desenvolvimento)'}</em></p>
        </div>
      </div>

      <!-- 18. Space Adventure Balneário Camboriú - Parque NASA -->
      <div class="tree-item">
        <div class="tree-header" onclick="this.parentElement.classList.toggle('open')">
          <i class="fa fa-chevron-right"></i>
          <strong>18. Space Adventure Balneário Camboriú - Parque NASA</strong>
        </div>
        <div class="tree-content">
          <p><em>${lang === 'es' ? '(en desarrollo)' : '(em desenvolvimento)'}</em></p>
        </div>
      </div>

    </div>
  `;

  showModal(activitiesContent);
}

function showCityHistory() {
  const lang = (langSelect && langSelect.value) || "pt";
  const title = lang === 'es' ? 'Historia de Balneário Camboriú' : 'História de Balneário Camboriú';
  
  const historyContent = `
    <h2>${title}</h2>
    <div class="history-tree">
      
      <!-- 1. Los Primeros Habitantes -->
      <div class="tree-item history-period">
        <div class="tree-header" onclick="this.parentElement.classList.toggle('open')">
          <i class="fa fa-chevron-right"></i>
          <strong>🏹 1. ${lang === 'es' ? 'Los Primeros Habitantes: Sambaquis y Carijós' : 'Os Primeiros Habitantes: Sambaquis e Carijós'}</strong>
        </div>
        <div class="tree-content">
          <p>${lang === 'es' 
            ? 'La historia de la región de Camboriú es milenaria, mucho anterior a la llegada de los europeos. El territorio que hoy ocupa Balneário Camboriú fue el hogar de dos importantes grupos precoloniales:'
            : 'A história da região de Camboriú é milenar, muito anterior à chegada dos europeus. O território que hoje ocupa Balneário Camboriú foi o lar de dois importantes grupos pré-coloniais:'
          }</p>
          
          <h4>🐚 ${lang === 'es' ? 'A. Los Constructores de los Sambaquis' : 'A. Os Construtores dos Sambaquis'}</h4>
          <p><strong>${lang === 'es' ? 'Período:' : 'Período:'}</strong> ${lang === 'es' ? 'Desde hace aproximadamente 4.000 a 5.000 años.' : 'Desde aproximadamente 4.000 a 5.000 anos atrás.'}</p>
          <p><strong>${lang === 'es' ? 'Descripción:' : 'Descrição:'}</strong> ${lang === 'es' 
            ? 'Eran pueblos seminómadas que vivían de la pesca y la recolección de moluscos.'
            : 'Eram povos seminômadas que viviam da pesca e da coleta de moluscos.'
          }</p>
          <p><strong>${lang === 'es' ? 'Evidencia Arqueológica:' : 'Evidência Arqueológica:'}</strong> ${lang === 'es' 
            ? 'Su legado más importante son los <em>Sambaquis</em> (del tupí-guaraní: <em>tamba</em> = concha; <em>ki</em> = acumulación), grandes montículos artificiales de conchas, huesos de animales, herramientas y restos humanos. Estos montículos funcionaban como basureros, viviendas y, principalmente, cementerios. Demuestran la primera presencia humana organizada en la costa.'
            : 'Seu legado mais importante são os <em>Sambaquis</em> (do tupi-guarani: <em>tamba</em> = concha; <em>ki</em> = acumulação), grandes montes artificiais de conchas, ossos de animais, ferramentas e restos humanos. Esses montes funcionavam como depósitos de lixo, moradias e, principalmente, cemitérios. Demonstram a primeira presença humana organizada no litoral.'
          }</p>
          
          <h4>🌿 ${lang === 'es' ? 'B. El Pueblo Guaraní-Carijó' : 'B. O Povo Guarani-Carijó'}</h4>
          <p><strong>${lang === 'es' ? 'Período:' : 'Período:'}</strong> ${lang === 'es' 
            ? 'Dominaron la costa antes de la colonización (desde aproximadamente el año 1000 d.C.).'
            : 'Dominaram o litoral antes da colonização (desde aproximadamente o ano 1000 d.C.).'
          }</p>
          <p><strong>${lang === 'es' ? 'Modo de Vida:' : 'Modo de Vida:'}</strong> ${lang === 'es' 
            ? 'Eran agricultores, alfareros y pescadores, con una estructura social más compleja que los pueblos del sambaqui.'
            : 'Eram agricultores, ceramistas e pescadores, com uma estrutura social mais complexa que os povos do sambaqui.'
          }</p>
          <p><strong>${lang === 'es' ? 'Impacto Inicial:' : 'Impacto Inicial:'}</strong> ${lang === 'es' 
            ? 'El contacto con los colonos europeos fue inicialmente a través de la actividad de la esclavización indígena (tráfico de indios para mano de obra en el sur y sureste de Brasil), lo que diezmó rápidamente a la población Carijó de la costa en el siglo XVI.'
            : 'O contato com os colonos europeus foi inicialmente através da atividade de escravização indígena (tráfico de índios para mão de obra no sul e sudeste do Brasil), o que dizimou rapidamente a população Carijó do litoral no século XVI.'
          }</p>
        </div>
      </div>

      <!-- 2. Raíces Portuguesas -->
      <div class="tree-item history-period">
        <div class="tree-header" onclick="this.parentElement.classList.toggle('open')">
          <i class="fa fa-chevron-right"></i>
          <strong>🇵🇹 2. ${lang === 'es' ? 'Raíces Portuguesas: La Colonización de Camboriú' : 'Raízes Portuguesas: A Colonização de Camboriú'}</strong>
        </div>
        <div class="tree-content">
          <p>${lang === 'es' 
            ? 'La ocupación europea de la región se consolidó tardíamente, a partir del siglo XVIII.'
            : 'A ocupação europeia da região consolidou-se tardiamente, a partir do século XVIII.'
          }</p>
          
          <p><strong>${lang === 'es' ? 'Pioneros:' : 'Pioneiros:'}</strong> ${lang === 'es' 
            ? 'La mayoría de los colonos provenían de las Islas Azores (Portugal), buscando tierras fértiles para la agricultura.'
            : 'A maioria dos colonos provinha das Ilhas Açores (Portugal), buscando terras férteis para a agricultura.'
          }</p>
          
          <p><strong>${lang === 'es' ? 'La Freguesia Madre:' : 'A Freguesia Mãe:'}</strong> ${lang === 'es' 
            ? 'El núcleo poblacional se estableció originalmente en el interior, a orillas del río Camboriú. Esto dio lugar a la fundación de la <em>Freguesia do Santíssimo Sacramento de Camboriú</em> alrededor de 1845 (hoy la ciudad vecina de Camboriú).'
            : 'O núcleo populacional se estabeleceu originalmente no interior, às margens do rio Camboriú. Isso deu origem à fundação da <em>Freguesia do Santíssimo Sacramento de Camboriú</em> por volta de 1845 (hoje a cidade vizinha de Camboriú).'
          }</p>
          
          <p><strong>${lang === 'es' ? 'División Geográfica:' : 'Divisão Geográfica:'}</strong> ${lang === 'es' 
            ? 'La vida económica giraba en torno a la agricultura (caña de azúcar y mandioca) y la ganadería en el interior (Sertão), mientras que la zona costera (Barra) se mantuvo poco desarrollada.'
            : 'A vida econômica girava em torno da agricultura (cana-de-açúcar e mandioca) e da pecuária no interior (Sertão), enquanto a zona costeira (Barra) permaneceu pouco desenvolvida.'
          }</p>
        </div>
      </div>

      <!-- 3. Nacimiento del Balneario -->
      <div class="tree-item history-period">
        <div class="tree-header" onclick="this.parentElement.classList.toggle('open')">
          <i class="fa fa-chevron-right"></i>
          <strong>🏖️ 3. ${lang === 'es' ? 'Nacimiento del Balneario y Emancipación (1919-1964)' : 'Nascimento do Balneário e Emancipação (1919-1964)'}</strong>
        </div>
        <div class="tree-content">
          <p>${lang === 'es' 
            ? 'El siglo XX marcó el cambio fundamental en la historia de la costa. Familias adineradas de la región del Valle de Itajaí (principalmente de Blumenau e Itajaí) comenzaron a buscar la tranquilidad de la playa de Camboriú para pasar el verano, naciendo así el concepto de balneario.'
            : 'O século XX marcou a mudança fundamental na história do litoral. Famílias abastadas da região do Vale do Itajaí (principalmente de Blumenau e Itajaí) começaram a buscar a tranquilidade da praia de Camboriú para passar o verão, nascendo assim o conceito de balneário.'
          }</p>
          
          <h4>🏠 ${lang === 'es' ? 'A. La Creación del Distrito (1919)' : 'A. A Criação do Distrito (1919)'}</h4>
          <p><strong>${lang === 'es' ? 'Primeras Estructuras:' : 'Primeiras Estruturas:'}</strong> ${lang === 'es' 
            ? 'A principios de siglo, la Barra era conocida simplemente como "Praia de Camboriú". Con el aumento de visitantes, se construyeron los primeros chalets de veraneo y modestas posadas.'
            : 'No início do século, a Barra era conhecida simplesmente como "Praia de Camboriú". Com o aumento de visitantes, foram construídos os primeiros chalés de veraneio e modestas pousadas.'
          }</p>
          
          <p><strong>${lang === 'es' ? 'Hito Administrativo:' : 'Marco Administrativo:'}</strong> ${lang === 'es' 
            ? 'En 1919, la Asamblea Legislativa de Santa Catarina reconoció el crecimiento de la costa y creó el <strong>Distrito de Balneário de Camboriú</strong>. Este acto marcó el reconocimiento oficial de la zona como una entidad separada de la Camboriú rural.'
            : 'Em 1919, a Assembleia Legislativa de Santa Catarina reconheceu o crescimento do litoral e criou o <strong>Distrito de Balneário de Camboriú</strong>. Este ato marcou o reconhecimento oficial da zona como uma entidade separada da Camboriú rural.'
          }</p>
          
          <h4>🌊 ${lang === 'es' ? 'B. El Impulso Turístico (1930s-1950s)' : 'B. O Impulso Turístico (1930s-1950s)'}</h4>
          <p>${lang === 'es' 
            ? 'La mejora de los accesos viales y el desarrollo de la infraestructura de alojamiento aceleraron la transformación. La identidad de la costa se consolidó como un destino exclusivamente turístico, mientras que la ciudad madre (Camboriú) mantuvo su enfoque agrícola. Esta diferencia en el desarrollo, las necesidades administrativas y la recaudación de impuestos generó un fuerte movimiento cívico.'
            : 'A melhoria dos acessos rodoviários e o desenvolvimento da infraestrutura de hospedagem aceleraram a transformação. A identidade do litoral consolidou-se como um destino exclusivamente turístico, enquanto a cidade-mãe (Camboriú) manteve seu foco agrícola. Esta diferença no desenvolvimento, as necessidades administrativas e a arrecadação de impostos gerou um forte movimento cívico.'
          }</p>
          
          <h4>🎉 ${lang === 'es' ? 'C. La Emancipación (1964)' : 'C. A Emancipação (1964)'}</h4>
          <p><strong>${lang === 'es' ? 'Objetivo:' : 'Objetivo:'}</strong> ${lang === 'es' 
            ? 'Los líderes y residentes del Balneário buscaban el autogobierno para poder invertir directamente en infraestructura turística (calles, saneamiento, energía), lo que la administración de Camboriú priorizaba para el interior.'
            : 'Os líderes e residentes do Balneário buscavam o autogoverno para poder investir diretamente em infraestrutura turística (ruas, saneamento, energia), o que a administração de Camboriú priorizava para o interior.'
          }</p>
          
          <p><strong>${lang === 'es' ? 'Fecha Clave:' : 'Data-Chave:'}</strong> ${lang === 'es' 
            ? 'El <strong>15 de mayo de 1964</strong> fue el día de la Emancipación Político-Administrativa. El Distrito de Balneário de Camboriú fue elevado a la categoría de Municipio (ciudad), separándose definitivamente de la ciudad madre.'
            : 'O <strong>15 de maio de 1964</strong> foi o dia da Emancipação Político-Administrativa. O Distrito de Balneário de Camboriú foi elevado à categoria de Município (cidade), separando-se definitivamente da cidade-mãe.'
          }</p>
          
          <p><strong>${lang === 'es' ? 'Primer Nombre Oficial:' : 'Primeiro Nome Oficial:'}</strong> ${lang === 'es' 
            ? 'Inicialmente, el municipio se llamó simplemente <em>Balneário Camboriú</em>.'
            : 'Inicialmente, o município chamou-se simplesmente <em>Balneário Camboriú</em>.'
          }</p>
        </div>
      </div>

      <!-- 4. Era de la Verticalización -->
      <div class="tree-item history-period">
        <div class="tree-header" onclick="this.parentElement.classList.toggle('open')">
          <i class="fa fa-chevron-right"></i>
          <strong>📈 4. ${lang === 'es' ? 'La Era de la Verticalización y el Turismo Masivo (1960s-Actualidad)' : 'A Era da Verticalização e o Turismo de Massa (1960s-Atualidade)'}</strong>
        </div>
        <div class="tree-content">
          <p>${lang === 'es' 
            ? 'Una vez independiente, la ciudad se volcó por completo al desarrollo turístico, adoptando un modelo urbanístico que la define hasta hoy.'
            : 'Uma vez independente, a cidade voltou-se completamente ao desenvolvimento turístico, adotando um modelo urbanístico que a define até hoje.'
          }</p>
          
          <h4>🏙️ ${lang === 'es' ? 'A. La Verticalización Acelerada' : 'A. A Verticalização Acelerada'}</h4>
          <p>${lang === 'es' 
            ? 'A partir de finales de los años 60 y, especialmente, en las décadas de 1970 y 1980, Balneário Camboriú experimentó un "boom" inmobiliario. El alto precio del suelo costero y la demanda por alojamiento resultaron en la construcción de edificios cada vez más altos. Esta tendencia transformó su horizonte, dándole el apodo de la <strong>"Dubai Brasileña"</strong> debido a su alta concentración de rascacielos.'
            : 'A partir do final dos anos 60 e, especialmente, nas décadas de 1970 e 1980, Balneário Camboriú experimentou um "boom" imobiliário. O alto preço do solo costeiro e a demanda por hospedagem resultaram na construção de edifícios cada vez mais altos. Esta tendência transformou seu horizonte, dando-lhe o apelido de <strong>"Dubai Brasileira"</strong> devido à sua alta concentração de arranha-céus.'
          }</p>
          
          <h4>🎯 ${lang === 'es' ? 'B. Hitos del Desarrollo Turístico' : 'B. Marcos do Desenvolvimento Turístico'}</h4>
          <ul>
            <li><strong>${lang === 'es' ? 'Cristo Luz (1997):' : 'Cristo Luz (1997):'}</strong> ${lang === 'es' 
              ? 'Inaugurado como un símbolo religioso y un importante mirador nocturno, consolidando la oferta de atracciones más allá de la playa.'
              : 'Inaugurado como um símbolo religioso e um importante mirante noturno, consolidando a oferta de atrações além da praia.'
            }</li>
            <li><strong>${lang === 'es' ? 'Complejo Turístico de Interpraias:' : 'Complexo Turístico de Interpraias:'}</strong> ${lang === 'es' 
              ? 'El desarrollo de la carretera que conecta la Praia Central con las playas más agrestes del sur (Laranjeiras, Taquaras, etc.), fundamental para diversificar la oferta turística.'
              : 'O desenvolvimento da estrada que conecta a Praia Central com as praias mais agrestes do sul (Laranjeiras, Taquaras, etc.), fundamental para diversificar a oferta turística.'
            }</li>
          </ul>
          
          <h4>🌊 ${lang === 'es' ? 'C. La Megaobra del Siglo XXI' : 'C. A Megaobra do Século XXI'}</h4>
          <p><strong>${lang === 'es' ? 'Alargamiento de la Praia Central (2021):' : 'Alargamento da Praia Central (2021):'}</strong> ${lang === 'es' 
            ? 'Para enfrentar la erosión costera y el sombreado de la playa causado por la altura de los edificios, la ciudad ejecutó un proyecto de ingeniería de gran escala. Se amplió la franja de arena de la Praia Central, transformando su paisaje y capacidad de uso, siendo uno de los hitos urbanísticos más comentados de Brasil en la actualidad.'
            : 'Para enfrentar a erosão costeira e o sombreamento da praia causado pela altura dos edifícios, a cidade executou um projeto de engenharia de grande escala. Ampliou-se a faixa de areia da Praia Central, transformando sua paisagem e capacidade de uso, sendo um dos marcos urbanísticos mais comentados do Brasil na atualidade.'
          }</p>
        </div>
      </div>

      <!-- 5. Monumentos -->
      <div class="tree-item history-period">
        <div class="tree-header" onclick="this.parentElement.classList.toggle('open')">
          <i class="fa fa-chevron-right"></i>
          <strong>🏛️ 5. ${lang === 'es' ? 'Monumentos y Puntos de Memoria Histórica' : 'Monumentos e Pontos de Memória Histórica'}</strong>
        </div>
        <div class="tree-content">
          <p>${lang === 'es' 
            ? 'Aunque Balneário Camboriú es una ciudad relativamente joven y moderna, conserva puntos que recuerdan su pasado o que se han convertido en símbolos de su desarrollo.'
            : 'Embora Balneário Camboriú seja uma cidade relativamente jovem e moderna, conserva pontos que relembram seu passado ou que se tornaram símbolos de seu desenvolvimento.'
          }</p>
          
          <ul>
            <li><strong>Passarela da Barra:</strong> ${lang === 'es' 
              ? 'Esta moderna pasarela peatonal sobre el Río Camboriú une la Barra Sul con la Praia Central. Históricamente, la "Barra" fue la zona de desembocadura del río y su conectividad fue clave para el desarrollo comercial y turístico. La pasarela es un símbolo de la ingeniería y la unión urbana.'
              : 'Esta moderna passarela pedestre sobre o Rio Camboriú une a Barra Sul com a Praia Central. Historicamente, a "Barra" foi a zona de desembocadura do rio e sua conectividade foi chave para o desenvolvimento comercial e turístico. A passarela é um símbolo da engenharia e da união urbana.'
            }</li>
            
            <li><strong>${lang === 'es' ? 'Antiguas Residencias de Veraneo:' : 'Antigas Residências de Veraneio:'}</strong> ${lang === 'es' 
              ? 'A pesar de la verticalización, aún se pueden encontrar algunas casas antiguas y chalets de madera, especialmente cerca del centro, que datan de las primeras décadas del siglo XX, cuando la ciudad era todavía una villa de playa. Un ejemplo notable de este estilo es la <em>Casa Linhares</em> (aunque ha sido reconstruida y modificada).'
              : 'Apesar da verticalização, ainda se podem encontrar algumas casas antigas e chalés de madeira, especialmente perto do centro, que datam das primeiras décadas do século XX, quando a cidade era ainda uma vila de praia. Um exemplo notável deste estilo é a <em>Casa Linhares</em> (embora tenha sido reconstruída e modificada).'
            }</li>
            
            <li><strong>${lang === 'es' ? 'Píer da Barra Sul:' : 'Píer da Barra Sul:'}</strong> ${lang === 'es' 
              ? 'La existencia de un muelle ha sido históricamente importante para la pesca y el transporte fluvial/marítimo. Hoy, el Píer es una terminal turística esencial para los paseos en Barco Pirata y Catamarán, continuando la tradición marítima de la ciudad.'
              : 'A existência de um píer tem sido historicamente importante para a pesca e o transporte fluvial/marítimo. Hoje, o Píer é um terminal turístico essencial para os passeios de Barco Pirata e Catamarã, continuando a tradição marítima da cidade.'
            }</li>
            
            <li><strong>${lang === 'es' ? 'Complexo Turístico Cristo Luz:' : 'Complexo Turístico Cristo Luz:'}</strong> ${lang === 'es' 
              ? 'Inaugurado en 1997, aunque no es un monumento de la época fundacional, es un hito moderno que se ha convertido en el principal ícono nocturno y turístico, representando el espíritu de gran desarrollo de la ciudad.'
              : 'Inaugurado em 1997, embora não seja um monumento da época fundacional, é um marco moderno que se tornou o principal ícone noturno e turístico, representando o espírito de grande desenvolvimento da cidade.'
            }</li>
          </ul>
        </div>
      </div>

      <!-- 6. Referencia Bibliográfica -->
      <div class="tree-item history-period reference">
        <div class="tree-header" onclick="this.parentElement.classList.toggle('open')">
          <i class="fa fa-chevron-right"></i>
          <strong>📚 6. ${lang === 'es' ? 'Referencia Bibliográfica' : 'Referência Bibliográfica'}</strong>
        </div>
        <div class="tree-content">
          <div style="margin-top: 20px; padding: 15px; background-color: #f9f9f9; border-left: 4px solid #DAA520; border-radius: 4px;">
            <p style="margin: 0; font-size: 14px; color: #333; line-height: 1.6;">
              CORRÊA, Isaque de Borba. <em>História de duas cidades: Camboriú e Balneário Camboriú</em>. Camboriú, SC: I. de Borba Corrêa (${lang === 'es' ? 'Edición del Autor' : 'Edição do Autor'}), 1985.
            </p>
          </div>
        </div>
      </div>

    </div>
  `;

  showModal(historyContent);
}

function showVocabulario() {
  const lang = (langSelect && langSelect.value) || "pt";
  const title = lang === 'es' ? 'Vocabulario Bilingüe' : 'Vocabulário Bilíngue';
  
  // Datos de vocabulario organizados por categorías
  const vocabularyData = {
    turismo: {
      title: { es: '🏖️ Turismo y Playas', pt: '🏖️ Turismo e Praias' },
      words: [
        { es: 'Playa', pt: 'Praia' },
        { es: 'Arena', pt: 'Areia' },
        { es: 'Ola', pt: 'Onda' },
        { es: 'Sombrilla', pt: 'Guarda-sol' },
        { es: 'Salvavidas', pt: 'Salva-vidas' },
        { es: 'Silla', pt: 'Cadeira' }
      ]
    },
    ciudad: {
      title: { es: '🏙️ Ciudad y Transporte', pt: '🏙️ Cidade e Transporte' },
      words: [
        { es: 'Calle', pt: 'Rua' },
        { es: 'Avenida', pt: 'Avenida' },
        { es: 'Autobús', pt: 'Ônibus' },
        { es: 'Taxi', pt: 'Táxi' },
        { es: 'Coche/Auto', pt: 'Carro' },
        { es: 'Pasarela', pt: 'Passarela' },
        { es: 'Terminal de autobuses', pt: 'Rodoviária' },
        { es: 'Aeropuerto', pt: 'Aeroporto' },
        { es: 'Gasolinera', pt: 'Posto de gasolina' }
      ]
    },
    gastronomia: {
      title: { es: '🍽️ Gastronomía y Mesa', pt: '🍽️ Gastronomia e Mesa' },
      words: [
        { es: 'Restaurante', pt: 'Restaurante' },
        { es: 'Comida', pt: 'Comida' },
        { es: 'Pescado', pt: 'Peixe' },
        { es: 'Camarón', pt: 'Camarão' },
        { es: 'Postre', pt: 'Sobremesa' },
        { es: 'Cuchara', pt: 'Colher' },
        { es: 'Tenedor', pt: 'Garfo' },
        { es: 'Cuchillo', pt: 'Faca' },
        { es: 'Taza', pt: 'Xícara' },
        { es: 'Té', pt: 'Chá' },
        { es: 'Café', pt: 'Café' },
        { es: 'Leche', pt: 'Leite' },
        { es: 'Azúcar', pt: 'Açúcar' }
      ]
    },
    atracciones: {
      title: { es: '🎡 Atracciones', pt: '🎡 Atrações' },
      words: [
        { es: 'Rueda gigante', pt: 'Roda gigante' },
        { es: 'Teleférico', pt: 'Bondinho' },
        { es: 'Museo', pt: 'Museu' },
        { es: 'Mirador', pt: 'Mirante' },
        { es: 'Parque', pt: 'Parque' }
      ]
    },
    servicios: {
      title: { es: '🏥 Servicios Públicos', pt: '🏥 Serviços Públicos' },
      words: [
        { es: 'Centro de salud', pt: 'Posto de saúde' },
        { es: 'Hospital', pt: 'Hospital' },
        { es: 'Farmacia', pt: 'Farmácia' },
        { es: 'Policía', pt: 'Polícia' }
      ]
    },
    juegosRopa: {
      title: { es: '🎮 Juegos y Ropa', pt: '🎮 Jogos e Roupas' },
      words: [
        { es: 'Jugar', pt: 'Jogar' },
        { es: 'Juegos', pt: 'Jogos' },
        { es: 'Hamaca', pt: 'Balanço' },
        { es: 'Tobogán', pt: 'Escorregador' },
        { es: 'Pelota', pt: 'Bola' },
        { es: 'Muñeca', pt: 'Boneca' },
        { es: 'Peluche', pt: 'Pelúcia' },
        { es: 'Pantalón', pt: 'Calça' },
        { es: 'Pollera/Falda', pt: 'Saia' },
        { es: 'Campera', pt: 'Jaqueta' },
        { es: 'Remera', pt: 'Camiseta' },
        { es: 'Musculosa', pt: 'Regata' }
      ]
    },
    descripcion: {
      title: { es: '📏 Descripción y Ubicación', pt: '📏 Descrição e Localização' },
      words: [
        { es: 'Lejos', pt: 'Longe' },
        { es: 'Cerca', pt: 'Perto' },
        { es: 'Largo', pt: 'Comprido' },
        { es: 'Ancho', pt: 'Largo' },
        { es: 'Estirado', pt: 'Esticado' },
        { es: 'Rubia', pt: 'Loira' },
        { es: 'Morocha', pt: 'Morena' },
        { es: 'Pelirroja', pt: 'Ruiva' }
      ]
    },
    tiempo: {
      title: { es: '📅 Días de la Semana', pt: '📅 Dias da Semana' },
      words: [
        { es: 'Lunes', pt: 'Segunda-feira' },
        { es: 'Martes', pt: 'Terça-feira' },
        { es: 'Miércoles', pt: 'Quarta-feira' },
        { es: 'Jueves', pt: 'Quinta-feira' },
        { es: 'Viernes', pt: 'Sexta-feira' },
        { es: 'Sábado', pt: 'Sábado' },
        { es: 'Domingo', pt: 'Domingo' }
      ]
    },
    meses: {
      title: { es: '🗓️ Meses del Año', pt: '🗓️ Meses do Ano' },
      words: [
        { es: 'Enero', pt: 'Janeiro' },
        { es: 'Febrero', pt: 'Fevereiro' },
        { es: 'Marzo', pt: 'Março' },
        { es: 'Abril', pt: 'Abril' },
        { es: 'Mayo', pt: 'Maio' },
        { es: 'Junio', pt: 'Junho' },
        { es: 'Julio', pt: 'Julho' },
        { es: 'Agosto', pt: 'Agosto' },
        { es: 'Septiembre', pt: 'Setembro' },
        { es: 'Octubre', pt: 'Outubro' },
        { es: 'Noviembre', pt: 'Novembro' },
        { es: 'Diciembre', pt: 'Dezembro' }
      ]
    },
    estaciones: {
      title: { es: '🌦️ Estaciones del Año', pt: '🌦️ Estações do Ano' },
      words: [
        { es: 'Primavera', pt: 'Primavera' },
        { es: 'Verano', pt: 'Verão' },
        { es: 'Otoño', pt: 'Outono' },
        { es: 'Invierno', pt: 'Inverno' }
      ]
    },
    colores: {
      title: { es: '🎨 Colores', pt: '🎨 Cores' },
      words: [
        { es: 'Rojo', pt: 'Vermelho' },
        { es: 'Azul', pt: 'Azul' },
        { es: 'Verde', pt: 'Verde' },
        { es: 'Amarillo', pt: 'Amarelo' },
        { es: 'Naranja', pt: 'Laranja' },
        { es: 'Violeta', pt: 'Violeta' },
        { es: 'Rosa', pt: 'Rosa' },
        { es: 'Negro', pt: 'Preto' },
        { es: 'Blanco', pt: 'Branco' },
        { es: 'Gris', pt: 'Cinza' },
        { es: 'Marrón', pt: 'Marrom' }
      ]
    },
    familia: {
      title: { es: '👨‍👩‍👧‍👦 Familia', pt: '👨‍👩‍👧‍👦 Família' },
      words: [
        { es: 'Mamá', pt: 'Mãe' },
        { es: 'Papá', pt: 'Pai' },
        { es: 'Hijo', pt: 'Filho' },
        { es: 'Hija', pt: 'Filha' },
        { es: 'Hermano', pt: 'Irmão' },
        { es: 'Hermana', pt: 'Irmã' },
        { es: 'Abuelo', pt: 'Avô' },
        { es: 'Abuela', pt: 'Avó' },
        { es: 'Tío', pt: 'Tio' },
        { es: 'Tía', pt: 'Tia' },
        { es: 'Primo', pt: 'Primo' },
        { es: 'Prima', pt: 'Prima' }
      ]
    },
    animales: {
      title: { es: '🐾 Animales', pt: '🐾 Animais' },
      words: [
        { es: 'Perro', pt: 'Cachorro' },
        { es: 'Gato', pt: 'Gato' },
        { es: 'Pájaro', pt: 'Pássaro' },
        { es: 'Pez', pt: 'Peixe' },
        { es: 'Caballo', pt: 'Cavalo' },
        { es: 'Vaca', pt: 'Vaca' },
        { es: 'Cerdo', pt: 'Porco' },
        { es: 'Gallina', pt: 'Galinha' },
        { es: 'Conejo', pt: 'Coelho' },
        { es: 'Tortuga', pt: 'Tartaruga' },
        { es: 'Mariposa', pt: 'Borboleta' }
      ]
    },
    numeros: {
      title: { es: '🔢 Números', pt: '🔢 Números' },
      words: [
        { es: 'Uno', pt: 'Um' },
        { es: 'Dos', pt: 'Dois' },
        { es: 'Tres', pt: 'Três' },
        { es: 'Cuatro', pt: 'Quatro' },
        { es: 'Cinco', pt: 'Cinco' },
        { es: 'Seis', pt: 'Seis' },
        { es: 'Siete', pt: 'Sete' },
        { es: 'Ocho', pt: 'Oito' },
        { es: 'Nueve', pt: 'Nove' },
        { es: 'Diez', pt: 'Dez' },
        { es: 'Veinte', pt: 'Vinte' },
        { es: 'Cien', pt: 'Cem' },
        { es: 'Mil', pt: 'Mil' }
      ]
    }
  };

  let vocabContent = `
    <h2>${title}</h2>
    <p style="text-align: center; color: #666; margin: 20px 0;">
      ${lang === 'es' 
        ? 'Haz clic en las tarjetas para ver la traducción' 
        : 'Clique nos cartões para ver a tradução'}
    </p>
    
    <div style="text-align: center; margin: 20px 0;">
      <button onclick="startVocabTest()" class="test-button">
        ${lang === 'es' ? '📝 Hacer Test de Vocabulario' : '📝 Fazer Teste de Vocabulário'}
      </button>
    </div>
    
    <div class="vocab-container">
  `;

  // Generar HTML para cada categoría
  Object.keys(vocabularyData).forEach(category => {
    const cat = vocabularyData[category];
    vocabContent += `
      <div class="vocab-category">
        <h3>${cat.title[lang]}</h3>
        <div class="flashcards-grid">
    `;
    
    // Generar cada flashcard de manera simple
    cat.words.forEach((word, index) => {
      const frontLang = lang === 'es' ? word.es : word.pt;
      const backLang = lang === 'es' ? word.pt : word.es;
      
      vocabContent += `
        <div class="flashcard" onclick="this.classList.toggle('flipped')">
          <div class="flashcard-inner">
            <div class="flashcard-front">
              <span>${frontLang}</span>
            </div>
            <div class="flashcard-back">
              <span>${backLang}</span>
            </div>
          </div>
        </div>
      `;
    });
    
    vocabContent += `
        </div>
      </div>
    `;
  });

  vocabContent += `</div>`;
  
  showModal(vocabContent);
}

// Función para iniciar el test de vocabulario
window.startVocabTest = function() {
  const lang = (langSelect && langSelect.value) || "pt";
  
  // Recopilar todas las palabras del vocabulario
  const vocabularyData = getVocabularyData();
  const allWords = [];
  
  Object.keys(vocabularyData).forEach(category => {
    vocabularyData[category].words.forEach(word => {
      allWords.push(word);
    });
  });
  
  // Seleccionar 10 palabras aleatorias para el test
  const shuffled = allWords.sort(() => 0.5 - Math.random());
  const testWords = shuffled.slice(0, Math.min(10, allWords.length));
  
  // Inicializar variables del test
  window.currentQuestion = 0;
  window.correctAnswers = 0;
  window.testQuestions = testWords.map(word => {
    // Generar 3 opciones incorrectas aleatorias
    const wrongOptions = allWords
      .filter(w => w.pt !== word.pt)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3)
      .map(w => lang === 'es' ? w.pt : w.es);
    
    // Agregar la respuesta correcta
    const correctAnswer = lang === 'es' ? word.pt : word.es;
    const options = [...wrongOptions, correctAnswer].sort(() => 0.5 - Math.random());
    
    return {
      question: lang === 'es' ? word.es : word.pt,
      correct: correctAnswer,
      options: options
    };
  });
  
  showTestQuestion();
};

// Función para mostrar cada pregunta del test
function showTestQuestion() {
  const lang = (langSelect && langSelect.value) || "pt";
  const question = window.testQuestions[window.currentQuestion];
  const questionNum = window.currentQuestion + 1;
  const total = window.testQuestions.length;
  
  const testContent = `
    <h2>${lang === 'es' ? 'Test de Vocabulario' : 'Teste de Vocabulário'}</h2>
    
    <div class="test-progress">
      ${lang === 'es' ? 'Pregunta' : 'Pergunta'} ${questionNum} ${lang === 'es' ? 'de' : 'de'} ${total}
    </div>
    
    <div class="test-question">
      <h3>${lang === 'es' ? '¿Cómo se dice en portugués?' : 'Como se diz em espanhol?'}</h3>
      <div class="test-word">${question.question}</div>
    </div>
    
    <div class="test-options">
      ${question.options.map((option, index) => `
        <button class="test-option" onclick="checkAnswer('${option.replace(/'/g, "\\'")}', '${question.correct.replace(/'/g, "\\'")}')">
          ${option}
        </button>
      `).join('')}
    </div>
  `;
  
  showModal(testContent);
}

// Función para verificar la respuesta
window.checkAnswer = function(selected, correct) {
  const lang = (langSelect && langSelect.value) || "pt";
  const isCorrect = selected === correct;
  
  if (isCorrect) {
    window.correctAnswers++;
  }
  
  // Mostrar feedback visual
  const buttons = document.querySelectorAll('.test-option');
  buttons.forEach(btn => {
    btn.disabled = true;
    if (btn.textContent.trim() === correct) {
      btn.classList.add('correct');
    } else if (btn.textContent.trim() === selected && !isCorrect) {
      btn.classList.add('incorrect');
    }
  });
  
  // Avanzar a la siguiente pregunta después de 1.5 segundos
  setTimeout(() => {
    window.currentQuestion++;
    if (window.currentQuestion < window.testQuestions.length) {
      showTestQuestion();
    } else {
      showTestResults();
    }
  }, 1500);
};

// Función para mostrar resultados del test
function showTestResults() {
  const lang = (langSelect && langSelect.value) || "pt";
  const score = window.correctAnswers;
  const total = window.testQuestions.length;
  const percentage = Math.round((score / total) * 100);
  
  // Determinar medalla y nivel según el desempeño real
  let medal = '🥉';
  let level = lang === 'es' ? 'Principiante' : 'Principiante';
  let message = lang === 'es' ? '¡Sigue practicando!' : 'Continue praticando!';
  
  if (percentage >= 80) {
    medal = '🥇';
    level = lang === 'es' ? 'Experto' : 'Especialista';
    message = lang === 'es' ? '¡Excelente trabajo!' : 'Excelente trabalho!';
  } else if (percentage >= 60) {
    medal = '🥈';
    level = lang === 'es' ? 'Intermedio' : 'Intermediário';
    message = lang === 'es' ? '¡Muy bien!' : 'Muito bem!';
  }
  
  // Guardar el mejor resultado en localStorage
  const bestScore = localStorage.getItem('vocabBestScore') || 0;
  if (percentage > bestScore) {
    localStorage.setItem('vocabBestScore', percentage);
  }
  
  const resultsContent = `
    <h2>${lang === 'es' ? 'Resultados del Test' : 'Resultados do Teste'}</h2>
    
    <div class="test-results">
      <div class="result-medal">${medal}</div>
      <div class="result-level">${level}</div>
      <div class="result-score">${score}/${total} ${lang === 'es' ? 'correctas' : 'corretas'}</div>
      <div class="result-percentage">${percentage}%</div>
      <div class="result-message">${message}</div>
      
      ${percentage > bestScore ? `
        <div class="new-record">
          🎉 ${lang === 'es' ? '¡Nuevo récord personal!' : 'Novo recorde pessoal!'} 🎉
        </div>
      ` : ''}
      
      <div class="result-actions">
        <button onclick="startVocabTest()" class="test-button">
          ${lang === 'es' ? '🔄 Repetir Test' : '🔄 Repetir Teste'}
        </button>
        <button onclick="showVocabulario()" class="test-button">
          ${lang === 'es' ? '📚 Volver al Vocabulario' : '📚 Voltar ao Vocabulário'}
        </button>
      </div>
    </div>
  `;
  
  showModal(resultsContent);
}

// Función auxiliar para obtener los datos de vocabulario
function getVocabularyData() {
  return {
    turismo: {
      words: [
        { es: 'Playa', pt: 'Praia' },
        { es: 'Arena', pt: 'Areia' },
        { es: 'Ola', pt: 'Onda' },
        { es: 'Sombrilla', pt: 'Guarda-sol' },
        { es: 'Salvavidas', pt: 'Salva-vidas' },
        { es: 'Silla', pt: 'Cadeira' }
      ]
    },
    ciudad: {
      words: [
        { es: 'Calle', pt: 'Rua' },
        { es: 'Avenida', pt: 'Avenida' },
        { es: 'Autobús', pt: 'Ônibus' },
        { es: 'Taxi', pt: 'Táxi' },
        { es: 'Coche/Auto', pt: 'Carro' },
        { es: 'Pasarela', pt: 'Passarela' },
        { es: 'Terminal de autobuses', pt: 'Rodoviária' },
        { es: 'Aeropuerto', pt: 'Aeroporto' },
        { es: 'Gasolinera', pt: 'Posto de gasolina' }
      ]
    },
    gastronomia: {
      words: [
        { es: 'Restaurante', pt: 'Restaurante' },
        { es: 'Comida', pt: 'Comida' },
        { es: 'Pescado', pt: 'Peixe' },
        { es: 'Camarón', pt: 'Camarão' },
        { es: 'Postre', pt: 'Sobremesa' },
        { es: 'Cuchara', pt: 'Colher' },
        { es: 'Tenedor', pt: 'Garfo' },
        { es: 'Cuchillo', pt: 'Faca' },
        { es: 'Taza', pt: 'Xícara' },
        { es: 'Té', pt: 'Chá' },
        { es: 'Café', pt: 'Café' },
        { es: 'Leche', pt: 'Leite' },
        { es: 'Azúcar', pt: 'Açúcar' }
      ]
    },
    atracciones: {
      words: [
        { es: 'Rueda gigante', pt: 'Roda gigante' },
        { es: 'Teleférico', pt: 'Bondinho' },
        { es: 'Museo', pt: 'Museu' },
        { es: 'Mirador', pt: 'Mirante' },
        { es: 'Parque', pt: 'Parque' }
      ]
    },
    servicios: {
      words: [
        { es: 'Centro de salud', pt: 'Posto de saúde' },
        { es: 'Hospital', pt: 'Hospital' },
        { es: 'Farmacia', pt: 'Farmácia' },
        { es: 'Policía', pt: 'Polícia' }
      ]
    },
    juegosRopa: {
      words: [
        { es: 'Jugar', pt: 'Jogar' },
        { es: 'Juegos', pt: 'Jogos' },
        { es: 'Hamaca', pt: 'Balanço' },
        { es: 'Tobogán', pt: 'Escorregador' },
        { es: 'Pelota', pt: 'Bola' },
        { es: 'Muñeca', pt: 'Boneca' },
        { es: 'Peluche', pt: 'Pelúcia' },
        { es: 'Pantalón', pt: 'Calça' },
        { es: 'Pollera/Falda', pt: 'Saia' },
        { es: 'Campera', pt: 'Jaqueta' },
        { es: 'Remera', pt: 'Camiseta' },
        { es: 'Musculosa', pt: 'Regata' }
      ]
    },
    descripcion: {
      words: [
        { es: 'Lejos', pt: 'Longe' },
        { es: 'Cerca', pt: 'Perto' },
        { es: 'Largo', pt: 'Comprido' },
        { es: 'Ancho', pt: 'Largo' },
        { es: 'Estirado', pt: 'Esticado' },
        { es: 'Rubia', pt: 'Loira' },
        { es: 'Morocha', pt: 'Morena' },
        { es: 'Pelirroja', pt: 'Ruiva' }
      ]
    },
    tiempo: {
      words: [
        { es: 'Lunes', pt: 'Segunda-feira' },
        { es: 'Martes', pt: 'Terça-feira' },
        { es: 'Miércoles', pt: 'Quarta-feira' },
        { es: 'Jueves', pt: 'Quinta-feira' },
        { es: 'Viernes', pt: 'Sexta-feira' },
        { es: 'Sábado', pt: 'Sábado' },
        { es: 'Domingo', pt: 'Domingo' }
      ]
    },
    meses: {
      words: [
        { es: 'Enero', pt: 'Janeiro' },
        { es: 'Febrero', pt: 'Fevereiro' },
        { es: 'Marzo', pt: 'Março' },
        { es: 'Abril', pt: 'Abril' },
        { es: 'Mayo', pt: 'Maio' },
        { es: 'Junio', pt: 'Junho' },
        { es: 'Julio', pt: 'Julho' },
        { es: 'Agosto', pt: 'Agosto' },
        { es: 'Septiembre', pt: 'Setembro' },
        { es: 'Octubre', pt: 'Outubro' },
        { es: 'Noviembre', pt: 'Novembro' },
        { es: 'Diciembre', pt: 'Dezembro' }
      ]
    },
    estaciones: {
      words: [
        { es: 'Primavera', pt: 'Primavera' },
        { es: 'Verano', pt: 'Verão' },
        { es: 'Otoño', pt: 'Outono' },
        { es: 'Invierno', pt: 'Inverno' }
      ]
    },
    colores: {
      words: [
        { es: 'Rojo', pt: 'Vermelho' },
        { es: 'Azul', pt: 'Azul' },
        { es: 'Verde', pt: 'Verde' },
        { es: 'Amarillo', pt: 'Amarelo' },
        { es: 'Naranja', pt: 'Laranja' },
        { es: 'Violeta', pt: 'Violeta' },
        { es: 'Rosa', pt: 'Rosa' },
        { es: 'Negro', pt: 'Preto' },
        { es: 'Blanco', pt: 'Branco' },
        { es: 'Gris', pt: 'Cinza' },
        { es: 'Marrón', pt: 'Marrom' }
      ]
    },
    familia: {
      words: [
        { es: 'Mamá', pt: 'Mãe' },
        { es: 'Papá', pt: 'Pai' },
        { es: 'Hijo', pt: 'Filho' },
        { es: 'Hija', pt: 'Filha' },
        { es: 'Hermano', pt: 'Irmão' },
        { es: 'Hermana', pt: 'Irmã' },
        { es: 'Abuelo', pt: 'Avô' },
        { es: 'Abuela', pt: 'Avó' },
        { es: 'Tío', pt: 'Tio' },
        { es: 'Tía', pt: 'Tia' },
        { es: 'Primo', pt: 'Primo' },
        { es: 'Prima', pt: 'Prima' }
      ]
    },
    animales: {
      words: [
        { es: 'Perro', pt: 'Cachorro' },
        { es: 'Gato', pt: 'Gato' },
        { es: 'Pájaro', pt: 'Pássaro' },
        { es: 'Pez', pt: 'Peixe' },
        { es: 'Caballo', pt: 'Cavalo' },
        { es: 'Vaca', pt: 'Vaca' },
        { es: 'Cerdo', pt: 'Porco' },
        { es: 'Gallina', pt: 'Galinha' },
        { es: 'Conejo', pt: 'Coelho' },
        { es: 'Tortuga', pt: 'Tartaruga' },
        { es: 'Mariposa', pt: 'Borboleta' }
      ]
    },
    numeros: {
      words: [
        { es: 'Uno', pt: 'Um' },
        { es: 'Dos', pt: 'Dois' },
        { es: 'Tres', pt: 'Três' },
        { es: 'Cuatro', pt: 'Quatro' },
        { es: 'Cinco', pt: 'Cinco' },
        { es: 'Seis', pt: 'Seis' },
        { es: 'Siete', pt: 'Sete' },
        { es: 'Ocho', pt: 'Oito' },
        { es: 'Nueve', pt: 'Nove' },
        { es: 'Diez', pt: 'Dez' },
        { es: 'Veinte', pt: 'Vinte' },
        { es: 'Cien', pt: 'Cem' },
        { es: 'Mil', pt: 'Mil' }
      ]
    }
  };
}

// --- Conexión de Botones (Event Listeners) ---

// La variable langSelect ya está definida al inicio de app.js (const langSelect = document.getElementById("langSelect");)
// Las variables btnQuiz, btnHistoria, y btnActividades también están definidas al inicio.

if (btnQuiz) {
  btnQuiz.addEventListener("click", showQuiz);
}
if (btnHistoria) {
  btnHistoria.addEventListener("click", showCityHistory);
}
if (btnVocabulario) {
  btnVocabulario.addEventListener("click", showVocabulario);
}
if (btnActividades) {
  btnActividades.addEventListener("click", showActivities);
}
})();
