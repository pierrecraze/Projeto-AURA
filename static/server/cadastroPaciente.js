/* ========================================================
   cadastroPaciente.js
   Cadastro/edição de paciente (3 etapas) + persistência local.
   ======================================================== */

const STORAGE_KEY = "aura_pacientes_v1";

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

function loadPacientes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function savePacientes(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
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

function serializeForm(existingId = null) {
  return {
    id: existingId || uid(),
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
    updatedAt: new Date().toISOString(),
  };
}

function fillForm(p) {
  $("nomePaciente").value = p.nome || "";
  $("dataNascimento").value = p.dataNascimento || "";
  $("sexoBiologico").value = p.sexoBiologico || "";
  $("nomeMae").value = p.nomeMae || "";
  $("nomePai").value = p.nomePai || "";
  $("responsavel").value = p.responsavel || "";
  $("grauParentesco").value = p.grauParentesco || "";
  $("cpfResponsavel").value = p.cpfResponsavel || "";
  $("cidade").value = p.cidade || "";
  $("estado").value = p.estado || "";
  $("pais").value = p.pais || "";
}

(function init() {
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
    const pacientes = loadPacientes();
    const found = pacientes.find((p) => p.id === id);
    if (found) {
      editingId = found.id;
      fillForm(found);
      $("pageTitle").textContent = "Editar Paciente";
      $("pageSubtitle").textContent = "Atualize os dados cadastrais do paciente";
    }
  }

  $("btnSave").addEventListener("click", () => {
    // valida todas as etapas antes de salvar
    for (const s of [1, 2, 3]) {
      if (!validateStep(s)) {
        setStep(s);
        return;
      }
    }

    const pacientes = loadPacientes();
    const payload = serializeForm(editingId);

    if (editingId) {
      const idx = pacientes.findIndex((p) => p.id === editingId);
      if (idx >= 0) pacientes[idx] = { ...pacientes[idx], ...payload };
    } else {
      pacientes.unshift({ ...payload, createdAt: new Date().toISOString() });
    }

    savePacientes(pacientes);
    window.location.href = ret;
  });

  setStep(1);
  attachStepperNavigation();
})();
