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
      // remember that user dismissed splash so it won't show again
      try {
        localStorage.setItem('seenSplash', '1');
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

  // If user already dismissed splash earlier, hide it immediately
  try {
    if (localStorage.getItem('seenSplash') === '1') {
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
        const popupContent = `<div><strong>${p.title.pt}</strong><br>${
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
          const contentNow = `<div><strong>${titleNow}</strong><br>${descNow}<br><a href="#" class="history-link" data-id="${
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
                  const updated = `<div><strong>${titleNow}</strong><br>${descNow}<br><a href=\"#\" class=\"history-link\" data-id=\"${
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
})();
