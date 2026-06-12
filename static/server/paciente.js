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

// O banco usa 'M'/'F'; o <select> usa 'Masculino'/'Feminino'
const SEXO_PARA_API = { Feminino: "F", Masculino: "M" };
const SEXO_DA_API = { F: "Feminino", M: "Masculino" };

function lerSintomas() {
  const sintomas = {};
  document.querySelectorAll('#clinicalWrap input[type="checkbox"]').forEach((cb) => {
    sintomas[cb.name] = cb.checked;
  });
  return sintomas;
}

// Monta o payload no formato que a API espera (PacienteCreate, snake_case)
function serializeFormAPI(current) {
  const payload = {
    nome: $("nomePaciente").value.trim(),
    cpf: (current && current.cpf) || null,
    data_nascimento: $("dataNascimento").value.trim(),
    sexo_biologico: SEXO_PARA_API[$("sexoBiologico").value.trim()] || "",
    nome_mae: $("nomeMae").value.trim() || null,
    nome_pai: $("nomePai").value.trim() || null,
    cidade: $("cidade").value.trim() || null,
    estado: $("estado").value.trim() || null,
    pais: $("pais").value.trim() || null,
    sintomas: lerSintomas(),
  };

  const responsavel = $("responsavel").value.trim();
  if (responsavel) {
    payload.responsaveis = [
      {
        nome: responsavel,
        parentesco: $("grauParentesco").value.trim() || "Não informado",
        cpf: $("cpfResponsavel").value.trim() || null,
      },
    ];
  }

  return payload;
}

function fillForm(p) {
  $("nomePaciente").value = p.nome || "";
  $("dataNascimento").value = p.dataNascimento || p.data_nascimento || "";
  const sexo = p.sexoBiologico || p.sexo_biologico || "";
  $("sexoBiologico").value = SEXO_DA_API[sexo] || sexo || "";
  $("nomeMae").value = p.nomeMae || p.nome_mae || "";
  $("nomePai").value = p.nomePai || p.nome_pai || "";

  // Responsável principal vem da API como lista (responsaveis[0])
  const resp = (p.responsaveis && p.responsaveis[0]) || null;
  $("responsavel").value = (resp && resp.nome) || p.responsavel || "";
  $("grauParentesco").value = (resp && resp.parentesco) || p.grauParentesco || "";
  $("cpfResponsavel").value = (resp && resp.cpf) || p.cpfResponsavel || "";

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

  const btnSave = $("btnSave");
  btnSave.addEventListener("click", async () => {
    if (!requiredCheck()) return;

    btnSave.disabled = true;
    try {
      const token = localStorage.getItem("aura_token");
      const res = await fetch(`${API_URL}${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(serializeFormAPI(current)),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const atualizado = await res.json();
      // Preserva as fotos (mantidas no estado local) e reflete a resposta da API
      current = { ...current, ...atualizado, fotos: current.fotos };
      fillForm(current);
      mostrarToast("Paciente atualizado.");
    } catch (e) {
      console.error("Erro ao salvar paciente:", e);
      mostrarToast("Não foi possível salvar as alterações.");
    } finally {
      btnSave.disabled = false;
    }
  });

  const btnSaveForm = $("btnSaveForm");
  if (btnSaveForm) {
    btnSaveForm.addEventListener("click", async () => {
      // Coleta o estado atual do checklist clínico
      const sintomas = {};
      document
        .querySelectorAll('#clinicalWrap input[type="checkbox"]')
        .forEach((cb) => {
          sintomas[cb.name] = cb.checked;
        });

      btnSaveForm.disabled = true;
      try {
        const token = localStorage.getItem("aura_token");
        const res = await fetch(`${API_URL}${id}/sintomas`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ sintomas }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        current.sintomas = sintomas;
        mostrarToast("Formulário clínico salvo.");
      } catch (e) {
        console.error("Erro ao salvar formulário clínico:", e);
        mostrarToast("Não foi possível salvar o formulário clínico.");
      } finally {
        btnSaveForm.disabled = false;
      }
    });
  }
})();
