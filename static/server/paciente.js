/* ========================================================
   paciente.js
   Página do paciente: visualizar/editar dados + fotos.
   Persistência: localStorage (aura_pacientes_v1)
   ======================================================== */

const API_URL = "/api/pacientes/";

function $(id) {
  return document.getElementById(id);
}

function uid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getQueryParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    id: params.get("id"),
    ret: params.get("return") || "todosPacientes.html",
  };
}

function mostrarToast(msg) {
  const t = $("toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2800);
}

function isoToBR(iso) {
  if (!iso) return "";
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return iso;
  return `${m[3]}/${m[2]}/${m[1]}`;
}

function requiredCheck() {
  const required = [
    "nomePaciente",
    "dataNascimento",
    "sexoBiologico",
    "nomeMae",
    "responsavel",
    "grauParentesco",
    "cpfResponsavel",
    "cidade",
    "estado",
    "pais",
  ];

  for (const id of required) {
    const el = $(id);
    const value = (el?.value || "").trim();
    if (!value) {
      el?.focus();
      mostrarToast("Preencha os campos obrigatórios.");
      return false;
    }
  }

  const cpf = $("cpfResponsavel").value.trim();
  if (cpf && cpf.replace(/\D/g, "").length !== 11) {
    $("cpfResponsavel").focus();
    mostrarToast("CPF do responsável inválido.");
    return false;
  }

  return true;
}

function mascaraCpf(input) {
  let v = input.value.replace(/\D/g, "");
  if (v.length > 11) v = v.slice(0, 11);
  v = v.replace(/(\d{3})(\d)/, "$1.$2");
  v = v.replace(/(\d{3})(\d)/, "$1.$2");
  v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  input.value = v;
}

function readForm(current) {
  const sintomas = {};
  document.querySelectorAll('#clinicalWrap input[type="checkbox"]').forEach(cb => {
    sintomas[cb.name] = cb.checked;
  });

  return {
    ...current,
    nome: $("nomePaciente").value.trim(),
    dataNascimento: $("dataNascimento").value.trim(),
    sexoBiologico: $("sexoBiologico").value.trim(),
    nomeMae: $("nomeMae").value.trim(),
    nomePai: $("nomePai").value.trim(),
    responsavel: $("responsavel").value.trim(),
    grauParentesco: $("grauParentesco").value.trim(),
    cpfResponsavel: $("cpfResponsavel").value.trim(),
    cidade: $("cidade").value.trim(),
    estado: $("estado").value.trim(),
    pais: $("pais").value.trim(),
    sintomas: sintomas,
    updatedAt: new Date().toISOString(),
  };
}

function fillForm(p) {
  $("nomePaciente").value = p.nome || "";
  $("dataNascimento").value = p.dataNascimento || p.data_nascimento || "";
  $("sexoBiologico").value = p.sexoBiologico || p.sexo_biologico || "";
  $("nomeMae").value = p.nomeMae || "";
  $("nomePai").value = p.nomePai || "";
  $("responsavel").value = p.responsavel || "";
  $("grauParentesco").value = p.grauParentesco || "";
  $("cpfResponsavel").value = p.cpfResponsavel || "";
  $("cidade").value = p.cidade || "";
  $("estado").value = p.estado || "";
  $("pais").value = p.pais || "";

  $("titleName").textContent = p.nome ? p.nome : "Paciente";
  const nascimento = p.dataNascimento || p.data_nascimento;
  $("subtitleLine").textContent = nascimento
    ? `Nascimento: ${isoToBR(nascimento)} • ${p.cidade || ""}${p.estado ? " / " + p.estado : ""}`.trim()
    : "";
    
  const partes = (p.nome || "").trim().split(/\s+/).filter(Boolean);
  let iniciaisStr = "--";
  if (partes.length >= 2) {
    iniciaisStr = (partes[0][0] + partes[1][0]).toUpperCase();
  } else if (partes.length === 1) {
    iniciaisStr = partes[0][0].toUpperCase();
  }
  const avatarEl = $("patientAvatar");
  if (avatarEl) avatarEl.textContent = iniciaisStr;

  if (p.sintomas) {
    Object.keys(p.sintomas).forEach(name => {
      const cb = document.querySelector(`#clinicalWrap input[name="${name}"]`);
      if (cb) cb.checked = p.sintomas[name];
    });
    // A tela de resultado (score, barra, chips) é renderizada por
    // exibirResultado() ao confirmar — não precisa atualizar aqui.
  }
}

function renderPhotos(photos) {
  const grid = $("photoGrid");
  const empty = $("emptyPhotos");
  if (!grid || !empty) return;

  if (!photos || photos.length === 0) {
    grid.innerHTML = "";
    empty.hidden = false;
    return;
  }

  empty.hidden = true;
  grid.innerHTML = photos
    .map(
      (ph) => `
      <div class="photo-item">
        <img src="${ph.dataUrl}" alt="Foto do paciente" loading="lazy" class="zoomable-photo" />
        <div class="photo-meta">${ph.name ? ph.name : "Foto"}</div>
      </div>`,
    )
    .join("");
}

(async function init() {
  const { id, ret } = getQueryParams();

  let current = null;
  
  if (id) {
    try {
      const token = localStorage.getItem('aura_token');
      const res = await fetch(`${API_URL}${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        current = await res.json();
      }
    } catch(err) { console.error("Erro ao buscar paciente:", err); }
  }

  $("btnBack").addEventListener("click", () => {
    window.location.href = ret;
  });

  $("btnOpenEdit").addEventListener("click", () => {
    const r = encodeURIComponent(ret);
    window.location.href = `cadastroPaciente.html?id=${encodeURIComponent(id)}&return=${r}`;
  });

  $("cpfResponsavel").addEventListener("input", (e) => mascaraCpf(e.target));

  if (!id || !current) {
    $("titleName").textContent = "Paciente não encontrado";
    $("subtitleLine").textContent = "";
    $("formWrap").hidden = true;
    $("photosWrap").hidden = true;
    $("btnSave").disabled = true;
    $("btnOpenEdit").disabled = true;
    return;
  }

  if (!Array.isArray(current.fotos)) current.fotos = [];

  fillForm(current);
  renderPhotos(current.fotos);

  $("photoGrid").addEventListener("click", (e) => {
    if (e.target.classList.contains("zoomable-photo")) {
      const modal = $("photoModal");
      const img = $("photoModalImg");
      if (modal && img) {
        img.src = e.target.src;
        modal.hidden = false;
      }
    }
  });

  const photoModal = $("photoModal");
  if (photoModal) {
    photoModal.addEventListener("click", (e) => {
      if (e.target.id === "photoModal" || e.target.closest("#photoModalClose")) {
        photoModal.hidden = true;
        $("photoModalImg").src = "";
      }
    });
  }

  window.deletePhoto = async function(photoId) {
    if (!confirm("Tem certeza que deseja excluir esta foto?")) return;
    
    current.fotos = current.fotos.filter(p => p.id !== photoId);
    renderPhotos(current.fotos);
    
    try {
      const token = localStorage.getItem('aura_token');
      const res = await fetch(`${API_URL}${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(current)
      });
      if (res.ok) {
        mostrarToast("Foto excluída com sucesso.");
      }
    } catch (err) {
      mostrarToast("Erro ao excluir foto.");
      console.error(err);
    }
  };

  const photoInput = $("photoInput");

  $("btnAddPhoto").addEventListener("click", () => {
    photoInput.value = "";
    photoInput.click();
  });

  photoInput.addEventListener("change", () => {
    const file = photoInput.files && photoInput.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      mostrarToast("Selecione uma imagem.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Define dimensões máximas para caber facilmente no localStorage
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        // Usa o canvas para redimensionar e comprimir a imagem
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        // Converte para JPEG com 65% de qualidade para ficar bem leve
        const dataUrl = canvas.toDataURL("image/jpeg", 0.65);

        current.fotos = [
          ...current.fotos,
          {
            id: uid(),
            name: file.name,
            dataUrl: dataUrl,
            createdAt: new Date().toISOString(),
          },
        ];
        renderPhotos(current.fotos);

        // Persiste imediatamente
        try {
          const token = localStorage.getItem('aura_token');
          fetch(`${API_URL}${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(current)
          }).then(res => {
            if (res.ok) mostrarToast("Foto adicionada.");
            else mostrarToast("Erro ao salvar foto no servidor.");
          });
        } catch (err) {
          mostrarToast("Erro de conexão ao salvar foto.");
          console.error(err);
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

  $("btnSave").addEventListener("click", () => {
    if (!requiredCheck()) return;

    const updated = readForm(current);
    updated.fotos = current.fotos;

    const all = loadPacientes();
    const idx = all.findIndex((p) => p.id === id);
    if (idx < 0) return;

    all[idx] = { ...all[idx], ...updated };

    try {
      savePacientes(all);
      mostrarToast("Paciente atualizado.");
      current = { ...all[idx] };
      fillForm(current);
    } catch (e) {
      // Pode estourar quota se as fotos forem grandes
      mostrarToast(
        "Não foi possível salvar (talvez fotos muito grandes no navegador).",
      );
      console.error(e);
    }
  });

  const btnSaveForm = $("btnSaveForm");
  if (btnSaveForm) {
    btnSaveForm.addEventListener("click", () => {
      $("btnSave").click(); // Dispara o processo de salvar original
    });
  }
})();
