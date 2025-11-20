// Minimal app: carga puntos desde points.json y muestra en Leaflet con popup bilingüe
(function () {
  // UI elements
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
  const btnActividades = document.getElementById("btnActividades");
  const btnPerfil = document.getElementById("btnPerfil");
  const btnLogout = document.getElementById("btnLogout");
  const poiSearch = document.getElementById("poiSearch");
  const btnSearch = document.getElementById("btnSearch");

  // hold points and markers globally for search / focus
  let pointsById = {};
  let markersById = {};
  // simple search index: id -> searchable string (lowercase, sin diacríticos)
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
      enter: "Entrar",
      skip: "Entrar sem perfil",
      infoDefault: "Marque um marcador para ver informação bilíngue.",
      btnQuiz: "Quiz",
      btnHistoria: "História",
      btnActividades: "Atividades",
      btnPerfil: "Perfil",
      modalClose: "Fechar",
      historyTitle: "História",
      quizText:
        "Quiz de exemplo: perguntas interativas para alunos. (Conteúdo demo).",
      historiaText:
        "Texto histórico e fotos da região. Aqui vai um resumo introdutório.",
      actividadesText:
        "Listado de atividades/retos para o passeio educativo (demo).",
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
      enter: "Entrar",
      skip: "Entrar sin perfil",
      infoDefault: "Marca un marcador para ver información bilingüe.",
      btnQuiz: "Quiz",
      btnHistoria: "Historia",
      btnActividades: "Actividades",
      btnPerfil: "Perfil",
      modalClose: "Cerrar",
      historyTitle: "Historia",
      quizText:
        "Quiz de ejemplo: preguntas interactivas para estudiantes. (Contenido demo).",
      historiaText:
        "Texto histórico y fotos de la región. Aquí un resumen introductorio.",
      actividadesText:
        "Listado de actividades/retos para el paseo educativo (demo).",
    },
  };

  function applyTranslations(lang) {
    const t = T[lang] || T.pt;
    // header (only set generic header when no user)
    const header = document.querySelector("header h1");
    if (!getUser()) header.textContent = t.header;

    // Welcome panel
    const welcomeTitleEl = document.getElementById("welcomeTitle");
    if (welcomeTitleEl) welcomeTitleEl.textContent = t.welcomeTitle;
    const welcomeTextEl = document.getElementById("welcomeText");
    if (welcomeTextEl) welcomeTextEl.textContent = t.welcomeText;

    // labelName: preserve input element when changing label
    const labelNameEl = document.getElementById("labelName");
    if (labelNameEl) {
      const input = labelNameEl.querySelector("input");
      labelNameEl.innerHTML = t.labelName + "<br />";
      if (input) {
        input.placeholder = t.namePlaceholder || input.placeholder;
        labelNameEl.appendChild(input);
      }
    }

    // role label: preserve select element
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

    // Skip button and info default
    const skipBtn = document.getElementById("skipWelcome");
    if (skipBtn) skipBtn.textContent = t.skip;
    const infoEl = document.getElementById("info");
    if (infoEl) infoEl.textContent = t.infoDefault;

    // toolbar buttons
    if (btnQuiz) btnQuiz.textContent = t.btnQuiz;
    if (btnHistoria) btnHistoria.textContent = t.btnHistoria;
    if (btnActividades) btnActividades.textContent = t.btnActividades;
    if (btnPerfil) btnPerfil.textContent = t.btnPerfil;
    // modal close
    if (modalClose) modalClose.textContent = t.modalClose;
  }

  function getRoleDisplay(role, lang) {
    const t = T[lang] || T.pt;
    if (role === "alumno") return t.roleAlumno;
    if (role === "profesor") return t.roleProfesor;
    // fallback for 'turista' or other roles
    return role;
  }

  /* translations listener moved below after langSelect is defined to avoid
    referencing DOM element before it's available (was causing a runtime
    ReferenceError that stopped the script). */

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
    // determine language to choose localized header prefix
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

  // If no user, show welcome overlay
  if (!getUser()) welcome.setAttribute("aria-hidden", "false");
  else welcome.setAttribute("aria-hidden", "true");

  // Splash handlers: hide splash when user clicks Comenzar or when they search
  function hideSplash() {
    try {
      if (splash) splash.setAttribute("aria-hidden", "true");
      // remember that user dismissed splash for this session only
      try {
        sessionStorage.setItem('seenSplash', '1');
      } catch (e) {}
    } catch (e) {}
  }
  if (splashStart) {
    splashStart.addEventListener("click", (e) => {
      e.preventDefault();
      hideSplash();
      // focus the search input so they can search immediately
      try {
        poiSearch && poiSearch.focus();
      } catch (err) {}
    });
  }

  // If user already dismissed splash in this session, hide it immediately
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
    const html = `<h3>Perfil</h3><p>Nombre: ${u.name}</p><p>Rol: ${u.role}</p><div style="margin-top:12px"><button id="editProfile" class="btn">Editar perfil</button></div>`;
    showModal(html);
    // attach handler after modal shown
    setTimeout(() => {
      const edit = document.getElementById("editProfile");
      if (edit) {
        edit.addEventListener("click", () => {
          closeModal();
          // prefill welcome form and show
          const user = getUser() || {};
          userNameInput.value = user.name || "";
          userRoleSelect.value =
            user.role === "profesor" ? "profesor" : "alumno";
          welcome.setAttribute("aria-hidden", "false");
        });
      }
    }, 50);
  });

  // logout button: show confirmation modal, then clear user and show welcome
  if (btnLogout)
    btnLogout.addEventListener("click", () => {
      const html = `<h3>Confirmar salida</h3>
      <p>¿Deseas salir de tu perfil y volver a la pantalla de bienvenida?</p>
      <div style="margin-top:12px">
        <button id="confirmLogout" class="btn primary">Sí, salir</button>
        <button id="cancelLogout" class="btn">Cancelar</button>
      </div>`;
      showModal(html);
      // attach handlers after modal is rendered
      setTimeout(() => {
        const confirmBtn = document.getElementById("confirmLogout");
        const cancelBtn = document.getElementById("cancelLogout");
        if (confirmBtn) {
          confirmBtn.addEventListener("click", () => {
            localStorage.removeItem("turismoUser");
            closeModal();
            renderUser();
            // ensure welcome overlay visible
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
    // use 'turista' role for anonymous visitor
    setUser({ name: "Visitante", role: "turista" });
    closeModal();
  });

  const map = L.map("map").setView([-27.02, -48.642], 13); // Balneário Camboriú approx
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
  }).addTo(map);

  const info = document.getElementById("info");
  const langSelect = document.getElementById("langSelect");

  // Apply translations now that langSelect exists
  applyTranslations(langSelect.value || "es");
  // ensure header shows personalized text if user exists
  renderUser();
  // Update translations and info when language changes
  langSelect.addEventListener("change", () => {
    const lang = langSelect.value || "es";
    applyTranslations(lang);
    info.textContent = (T[lang] || T.es).infoDefault;
    // re-render user header so name/role are preserved with localized prefix
    renderUser();
  });

  // If welcome language selector exists, sync with main selector and allow
  // selecting language before entering
  if (welcomeLangSelect) {
    // start with same value as header selector
    welcomeLangSelect.value = langSelect.value || "es";
    welcomeLangSelect.addEventListener("change", () => {
      const lang = welcomeLangSelect.value || "es";
      // update main selector and trigger its change handler
      langSelect.value = lang;
      langSelect.dispatchEvent(new Event("change"));
    });
  }

  function loadPoints() {
    // Try to load a standard GeoJSON file first; fallback to legacy points.json
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
      // index points by id for quick access
      pointsById = {};
      markersById = {};
      points.forEach((p) => {
        pointsById[p.id] = p;
      });

      // build search index: include id and all title variations
      searchIndex = {};
      points.forEach((p) => {
        const pieces = [p.id];
        if (p.title) {
          Object.keys(p.title).forEach((k) => pieces.push(p.title[k]));
        }
        const joined = pieces.join(" ").toLowerCase();
        // normalize to remove diacritics for more robust search
        const normalized = joined
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
        searchIndex[p.id] = normalized;
      });

      // load overrides from localStorage (id -> {lat,lng})
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

    // Attempt GeoJSON then fallback
    fetchGeoJSON()
      .then((geo) => processPoints(toPointsArrayFromGeo(geo)))
      .catch(() => {
        // fallback to legacy format
        fetchLegacy()
          .then((points) => processPoints(points))
          .catch((e) => {
            info.textContent = "Error cargando puntos: " + e.message;
          });
      });
  }

  // Search function: find by id or title substring (current language)
  function searchAndFocus(query) {
    // hide splash if visible so map is visible behind
    hideSplash();
    if (!query) return showModal("<p>Ingrese un término de búsqueda.</p>");
    const raw = query.trim();
    if (!raw) return showModal("<p>Ingrese un término de búsqueda.</p>");
    const q = raw
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    let found = null;
    // prefer exact id match first
    const idCandidate = Object.keys(pointsById).find(
      (id) => id.toLowerCase() === q
    );
    if (idCandidate) found = pointsById[idCandidate];
    // otherwise search the index for substring match
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
    // Focus map
    const marker = markersById[found.id];
    if (marker) {
      // use the marker's current coordinates (which may include overrides) to center
      try {
        const ll = marker.getLatLng();
        map.setView([ll.lat, ll.lng], 15, { animate: true });
      } catch (err) {
        // fallback to original
        map.setView([found.lat, found.lng], 15, { animate: true });
      }
      marker.openPopup();
      // small visual bounce to draw la atención: delay a bit so DOM se actualice
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
    // also show history or info
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

  // language change handled above (applyTranslations)

  loadPoints();

  // render header if user already exists
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
  const title = lang === 'es' ? 'Actividades en Parque Unipraias' : 'Atividades no Parque Unipraias';
  
  // 1. Actividad Principal: El Paseo en Bondinho y el Recorrido por la Mata Atlántica
  const mainActivityTitle = lang === 'es' 
    ? '1. ¿En qué consiste el paseo en Parque Unipraias?' 
    : '1. Em que consiste o passeio no Parque Unipraias?';
  const mainActivityDesc = lang === 'es' 
    ? `
      <p>El paseo principal se realiza en el Bondinho Aéreo, que interconecta tres estaciones, siendo el único teleférico en el mundo que une dos playas: la Estación Barra Sul y la Estación Laranjeiras.</p>
      <p>La estación intermedia,Estación Mata Atlântica (en el Morro da Aguada), es el corazón educativo. Aquí se puede realizar un sendero ecológico guiado (parte del programa "Parque Escola"), donde monitores explican la fauna y flora de la Mata Atlântica, uno de los biomas más amenazados de Brasil.</p>
    `
    : `
      <p>O passeio principal é feito pelo Bondinho Aéreo, que interliga três estações, sendo o único teleférico no mundo a ligar duas praias: a Estação Barra Sul e a Estação Laranjeiras.</p>
      <p>A estação intermediária, Estação Mata Atlântica (no Morro da Aguada), é o coração educativo. Aqui é possível fazer uma trilha ecológica guiada (parte do programa "Parque Escola"), onde monitores explicam a fauna e flora da Mata Atlântica, um dos biomas mais ameaçados do Brasil.</p>
    `;
    
  // Listado de otras actividades
  const otherActivitiesTitle = lang === 'es' ? 'Otras Atracciones Destacadas (Listado):' : 'Outras Atrações de Destaque (Listagem):';
  const otherActivitiesList = lang === 'es' 
    ? `
      <ul>
        <li>El Youhooo! es un trineo de montaña que se encuentra ubicado en la Estación Mata Atlântica, en la cima del morro. El único acceso es a través del Bondinho (teleférico).

Realiza un recorrido de 710 metros en medio de la Mata Atlântica (ida y vuelta en el mismo lugar). El trineo puede alcanzar hasta 60 km/h, y todos los carritos poseen frenos, lo que permite al aventurero elegir a qué velocidad descender.

Puede realizarse en pareja o individualmente.

Es un equipo de fabricación alemana. En total, son 30 trineos los que te llevarán a una aventura increíble.</li>
        <li>La ZipRider es una mega tirolesa ubicada en la Estación Mata Atlântica, en la cima del morro, y cuyo único acceso es mediante el Bondinho (teleférico).

Desciende desde la Estación Mata Atlântica hasta la Estación Laranjeiras. Son 240 metros de altura y 750 metros de distancia que se recorren en un tiempo de 45 segundos a 1 minuto, alcanzando una velocidad de hasta 60 km/h.

El equipo cuenta con una tecnología americana que permite el descenso de hasta 4 personas a la vez, con un sistema de freno automático que hace que el aterrizaje sea más tranquilo.

Al descender en ZipRider, tienes derecho a un viaje de regreso en el Bondinho hasta la Estación Mata Atlântica para continuar el paseo.</li>
        <li>La Fantástica Floresta: Viaja en el mágico tren suspendido a cerca de 3 metros y sorpréndete con la Casa del Chocolate y el Mirador Laranjeiras. Con tres vagones y capacidad para 14 personas, recorre un trayecto de aprox. 400 metros a una velocidad que puede alcanzar hasta 10 km/h.</li>
        <li>Super Gyro Tower: Ubicada en el punto más alto del Morro da Aguada, la Super Gyro Tower ofrece una experiencia inolvidable al proporcionar vistas panorámicas de la deslumbrante belleza natural de Balneário Camboriú.

Elevándose a unos impresionantes 59 metros de altura y alcanzando casi 300 metros sobre el nivel del mar, la torre ofrece una imagen inigualable del litoral catarinense. Con capacidad para albergar hasta 50 personas simultáneamente, la Super Gyro Tower es un espacio de contemplación y conexión con la naturaleza.</li>
      </ul>
    `
    : `
      <ul>
        <li>O Youhooo! é um trenó de montanha que fica localizado na Estação Mata Atlântica, no topo do morro, o único acesso é pelo Bondinho. Faz um percurso de 710 metros em meio a Mata Atlântica (vai e volta no mesmo local). O trenó pode atingir até 60km/h, todo os carrinhos possuem freios fazendo com que a aventureira escolha em que velocidade descer.
Pode ser realizado em dupla ou individualmente.
Equipamento de fabricação alemã. Ao todo são 30 trenós que vão te levar a uma aventura incrível. .</li>
        <li>A ZipRider é uma mega tirolesa localizada na Estação Mata Atlântica, no topo do morro, o único acesso é pelo Bondinho. Desce da Estação Mata Atlântica até a Estação Laranjeiras. São 240m de altura e 750m de distância que são percorridos de 45s a 1 minuto, atingindo uma velocidade de até 60km/h.
O equipamento possui uma tecnologia americana permite a descida de até 4 pessoas por vez, com um sistema de freio automático fazendo com que a aterrissagem seja mais tranquila.

Descendo de ZipRider você tem direito a um retorno de bondinho até a Estação Mata Atlântica para das sequência ao passeio.</li>
        <li>A Fantástica Floresta: Viaje pelo mágico trem suspenso a cerca de 3m e se surpreenda-se com a Casa do Chocolate e o Mirante Laranjeiras. Com três vagões e capacidade para 14 pessoas, percorre um trajeto de aprox. 400m a uma velocidade que pode chegar até 10km/h.</li>
        <li>Super Gyro Tower: Localizada no ponto mais alto do Morro da Aguada, a Super Gyro Tower oferece uma experiência inesquecível ao proporcionar vistas panorâmicas da deslumbrante beleza natural de Balneário Camboriú.
​​​​​​​
Elevando-se a impressionantes 59 metros de altura e atingindo quase 300 metros acima do nível do mar, a torre oferece uma imagem inigualável do litoral catarinense. Com capacidade para acomodar até 50 pessoas simultaneamente, a Super Gyro Tower é um espaço de contemplação e conexão com a natureza..</li>
      </ul>
    `;

  const activitiesContent = `
    <h2>${title}</h2>
    <h3>${mainActivityTitle}</h3>
    ${mainActivityDesc}
    <hr>
    <h3>${otherActivitiesTitle}</h3>
    ${otherActivitiesList}
  `;

  showModal(activitiesContent);
}

function showCityHistory() {
  const lang = (langSelect && langSelect.value) || "pt";
  const title = lang === 'es' ? 'Historia de Balneário Camboriú' : 'História de Balneário Camboriú';
  const historyContent = lang === 'es' 
    ? `
      <h2>${title}</h2>
      <p>La región de Balneário Camboriú fue originalmente habitada por indígenas Guaranís. Sin embargo, la ciudad como municipio se emancipó y fue oficialmente fundada en 1964.</p>
      
      <h3>El Crecimiento Turístico</h3>
      <p>A partir de los años 60 y 70, la ciudad pasó de ser una pequeña villa de pescadores a un gran centro turístico. El rápido desarrollo urbano se caracterizó por la construcción de los famosos rascacielos a lo largo de la orla.</p>
      
      <h3>Hitos Recientes</h3>
      <p>Un hito reciente y fundamental para la ciudad fue el proyecto de alargamiento de la Praia Central (ampliación de la franja de arena), que impulsó aún más el turismo y la economía local.</p>
    `
    : `
      <h2>${title}</h2>
      <p>A região de Balneário Camboriú foi originalmente habitada por indígenas Guaranis. No entanto, a cidade como município se emancipou e foi oficialmente fundada em 1964.</p>
      
      <h3>O Crescimento Turístico</h3>
      <p>A partir dos anos 60 e 70, a cidade passou de uma pequena vila de pescadores a um grande centro turístico. O rápido desenvolvimento urbano foi marcado pela construção dos famosos arranha-céus ao longo da orla.</p>
      
      <h3>Marcos Recentes</h3>
      <p>Um marco recente e fundamental para a cidade foi o projeto de alargamento da Praia Central (ampliação da faixa de areia), que impulsionou ainda mais o turismo e a economia local.</p>
    `;

  showModal(historyContent);
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
if (btnActividades) {
  btnActividades.addEventListener("click", showActivities);
}
})();
