/* ========================================================
   cadastroPaciente.js
   Cadastro/edição de paciente (3 etapas) + persistência local.
   ======================================================== */

const API_URL = "/api/pacientes/";

function $(id) {
  return document.getElementById(id);
}

function getQueryParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    id: params.get("id"),
    ret: params.get("return") || "todosPacientes.html",
  };
}

function uid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function mostrarToast(msg) {
  const t = $("toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2800);
}

function setStep(step) {
  const steps = [1, 2, 3];
  steps.forEach((s) => {
    const panel = $("step-" + s);
    const item = $("stepper-" + s);
    if (panel) panel.hidden = s !== step;
    if (item) item.classList.toggle("is-active", s === step);
    if (item) item.setAttribute("aria-current", s === step ? "step" : "false");
  });

  $("btnPrev").hidden = step === 1;
  $("btnNext").hidden = step === 3;
  $("btnSave").hidden = step !== 3;

  $("currentStep").value = String(step);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function attachStepperNavigation() {
  const items = [1, 2, 3].map((n) => ({ n, el: $("stepper-" + n) }));

  function attemptJump(targetStep) {
    const from = currentStep();

    if (targetStep <= from) {
      setStep(targetStep);
      return;
    }

    // Indo pra frente: valida as etapas intermediárias
    for (let s = from; s < targetStep; s++) {
      if (!validateStep(s)) {
        setStep(s);
        return;
      }
    }

    setStep(targetStep);
  }

  items.forEach(({ n, el }) => {
    if (!el) return;

    el.addEventListener("click", () => attemptJump(n));
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        attemptJump(n);
      }
    });
  });
}

function currentStep() {
  return parseInt($("currentStep").value, 10) || 1;
}

function requiredInPanel(panelEl) {
  return [...panelEl.querySelectorAll("[data-required='true']")];
}

function validateStep(step) {
  const panel = $("step-" + step);
  if (!panel) return true;

  const requiredFields = requiredInPanel(panel);
  for (const el of requiredFields) {
    const value = (el.value || "").trim();
    if (!value) {
      el.focus();
      mostrarToast("Preencha os campos obrigatórios desta etapa.");
      return false;
    }
  }

  if (step === 2) {
    const cpf = $("cpfResponsavel").value.trim();
    if (cpf && cpf.replace(/\D/g, "").length !== 11) {
      $("cpfResponsavel").focus();
      mostrarToast("CPF do responsável inválido.");
      return false;
    }
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

const SEXO_PARA_API = { Feminino: "F", Masculino: "M" };
const SEXO_DA_API = { F: "Feminino", M: "Masculino" };

function serializeForm() {
  const payload = {
    nome: $("nomePaciente").value.trim(),
    data_nascimento: $("dataNascimento").value.trim(),
    sexo_biologico: SEXO_PARA_API[$("sexoBiologico").value.trim()] || "",
    nome_mae: $("nomeMae").value.trim() || null,
    nome_pai: $("nomePai").value.trim() || null,
    cidade: $("cidade").value.trim() || null,
    estado: $("estado").value.trim() || null,
    pais: $("pais").value.trim() || null,
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
  $("nomeMae").value = p.nome_mae || "";
  $("nomePai").value = p.nome_pai || "";
  $("cidade").value = p.cidade || "";
  $("estado").value = p.estado || "";
  $("pais").value = p.pais || "";

  const resp = (p.responsaveis && p.responsaveis[0]) || null;
  if (resp) {
    $("responsavel").value = resp.nome || "";
    $("grauParentesco").value = resp.parentesco || "";
    $("cpfResponsavel").value = resp.cpf || "";
  }
}

(async function init() {
  const { id, ret } = getQueryParams();

  $("btnCancel").addEventListener("click", () => {
    window.location.href = ret;
  });

  $("btnPrev").addEventListener("click", () => {
    const step = currentStep();
    setStep(Math.max(1, step - 1));
  });

  $("btnNext").addEventListener("click", () => {
    const step = currentStep();
    if (!validateStep(step)) return;
    setStep(Math.min(3, step + 1));
  });

  $("cpfResponsavel").addEventListener("input", (e) => mascaraCpf(e.target));

  // Se edição
  let editingId = null;
  if (id) {
    try {
      const token = localStorage.getItem('aura_token');
      const res = await fetch(`${API_URL}${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const found = await res.json();
        editingId = found.id;
        fillForm(found);
        $("pageTitle").textContent = "Editar Paciente";
        $("pageSubtitle").textContent = "Atualize os dados cadastrais do paciente";
      }
    } catch (err) {
      console.error("Erro ao buscar paciente:", err);
    }
  }

  $("btnSave").addEventListener("click", async () => {
    // valida todas as etapas antes de salvar
    for (const s of [1, 2, 3]) {
      if (!validateStep(s)) {
        setStep(s);
        return;
      }
    }

    const payload = serializeForm();

    try {
      const token = localStorage.getItem('aura_token');
      const url = editingId ? `${API_URL}${editingId}` : API_URL;
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        mostrarToast("Paciente salvo com sucesso!");
        setTimeout(() => window.location.href = ret, 1200);
      } else {
        const erro = await res.json().catch(() => null);
        const detalhe = erro?.detail
          ? (Array.isArray(erro.detail) ? erro.detail.map(d => d.msg).join(", ") : erro.detail)
          : "Erro ao salvar paciente no servidor.";
        mostrarToast(detalhe);
      }
    } catch (err) {
      mostrarToast("Erro de conexão com o servidor.");
    }
  });

  setStep(1);
  attachStepperNavigation();
})();
