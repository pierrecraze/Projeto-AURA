/**
 * PLATAFORMA DE ASSISTÊNCIA CLÍNICA
 * Lógica de pontuação FMR1 (Síndrome do X Frágil)
 * Mesclada com Integração de API (Pacientes e Triagens) + PDF
 */

const PESOS = {
  deficiencia_intelectual: 0.18,
  macroorquidismo: 0.14,
  dificuldades_aprendizagem: 0.1,
  movimentos_repetitivos: 0.08,
  hiperatividade: 0.07,
  evita_contato_fisico: 0.06,
  face_alongada: 0.1,
  hipermobilidade: 0.07,
  deficit_atencao: 0.07,
  atraso_fala: 0.06,
  evita_contato_visual: 0.04,
  agressividade: 0.03,
};

// Aceita tanto ?paciente_id= (formulario.html) quanto ?id= (paciente.html)
const _params = new URLSearchParams(window.location.search);
const PACIENTE_ID = _params.get("paciente_id") || _params.get("id");

let ultimoScore = 0;
let ultimaTriagemId = null; // id da avaliação registrada ao calcular o score

// ─────────────────────────────────────────────
// Utilitários
// ─────────────────────────────────────────────

function getRespostaCampo(nome) {
  // Suporta tanto o padrão antigo quanto o atual (checkboxes/radios)
  const selecionado = document.querySelector(`input[name="${nome}"]:checked`);
  return selecionado ? selecionado.value : null;
}

function calcularScore() {
  let total = 0;
  for (const [nome, peso] of Object.entries(PESOS)) {
    if (getRespostaCampo(nome) === "sim") {
      total += peso;
    }
  }
  // Garante que não passe de 1.00 por arredondamento
  return Math.min(parseFloat(total.toFixed(2)), 1.0);
}

function sintomasMarcados() {
  return Object.keys(PESOS)
    .filter((nome) => getRespostaCampo(nome) === "sim")
    .sort((a, b) => PESOS[b] - PESOS[a]);
}

// ─────────────────────────────────────────────
// Navegação entre telas
// ─────────────────────────────────────────────

function mostrarTela(id) {
  document
    .querySelectorAll(".tela")
    .forEach((t) => t.classList.remove("ativa"));
  document.getElementById(id).classList.add("ativa");
}

// ─────────────────────────────────────────────
// Ação: Cancelar
// ─────────────────────────────────────────────

function cancelarFormulario() {
  if (confirm("Tem certeza que deseja cancelar? As marcações não salvas serão perdidas.")) {
    window.location.href = 'dashboardMedico.html';
  }
}

// ─────────────────────────────────────────────
// Ação: Confirmar dados e Salvar na API
// ─────────────────────────────────────────────

async function confirmarDados() {
  const erroEl = document.getElementById("erro-formulario");

  // ── Dupla confirmação antes de calcular e registrar ──
  const marcados = sintomasMarcados();
  const n = marcados.length;
  const confirmou = confirm(
    `Calcular o score do paciente?\n\n` +
      `${n} de 12 sintomas assinalados como "apresenta".\n` +
      `A avaliação será registrada no sistema.`
  );
  if (!confirmou) return;

  if (erroEl) erroEl.style.display = "none";

  const score = calcularScore();
  ultimoScore = score;

  // Mostra a tela de resultado imediatamente; o registro acontece em paralelo
  exibirResultado(score);

  // Registra a avaliação no histórico de triagens (aparece em Avaliações).
  // A conduta inicial segue a indicação do score e pode ser ajustada
  // pelos botões de encaminhamento/monitoramento.
  try {
    const triagemId = await registrarTriagem(score >= 0.56);
    ultimaTriagemId = triagemId;
    if (triagemId && typeof mostrarToast === "function") {
      mostrarToast("Avaliação registrada no sistema.");
    }
  } catch (error) {
    console.error("Erro ao registrar no histórico de triagens:", error);
  }
}

// Observação: o botão "Salvar" (btnSaveForm) tem handler próprio no paciente.js
// — ele apenas grava o checklist no perfil do paciente, sem calcular score.
// O cálculo do score acontece somente pelo botão "CONFIRMAR DADOS".

// ─────────────────────────────────────────────
// Renderiza tela de resultado
// ─────────────────────────────────────────────

function exibirResultado(score) {
  const scoreBox = document.getElementById("score-box");
  const scoreBadge = document.getElementById("score-badge");
  const indicacaoTexto = document.getElementById("indicacao-texto");
  const asteriscoInfo = document.getElementById("asterisco-info");
  const botoesRes = document.getElementById("botoes-resultado");

  let classe, categoria;
  if (score >= 0.56) {
    classe = "alto";
    categoria = "Alta probabilidade";
  } else if (score >= 0.40) {
    classe = "medio";
    categoria = "Média probabilidade";
  } else {
    classe = "baixo";
    categoria = "Baixa probabilidade";
  }

  // ── Score apresentado como percentual + badge de categoria ──
  const pct = Math.round(score * 100);
  if (scoreBox) {
    scoreBox.textContent = `${pct}%`;
    scoreBox.classList.remove("alto", "medio", "baixo");
    scoreBox.classList.add(classe);
  }

  if (scoreBadge) {
    scoreBadge.textContent = categoria;
    scoreBadge.className = `score-badge ${classe}`;
  }

  const marcados = sintomasMarcados();

  const countEl = document.getElementById("metrica-contagem");
  if (countEl) {
    const n = marcados.length;
    countEl.textContent = `${n} de 12 ${n === 1 ? "sintoma" : "sintomas"}`;
  }

  // A barra reflete o próprio score (0–100%), com a cor da categoria
  const metricaBarra = document.getElementById("metrica-barra");
  if (metricaBarra) {
    metricaBarra.style.width = `${pct}%`;
    metricaBarra.className = `metrica-barra ${classe}`;
  }

  // Chips dos sintomas apresentados (labels legíveis do relatorio.js)
  const pontosEl = document.getElementById("metrica-pontos");
  if (pontosEl) {
    pontosEl.innerHTML = marcados.length
      ? marcados.map((nome) => {
          const label = typeof SINTOMAS_LABELS !== "undefined"
            ? (SINTOMAS_LABELS[nome] || nome.replace(/_/g, " "))
            : nome.replace(/_/g, " ");
          return `<span class="sintoma-chip ${classe}">${label}</span>`;
        }).join("")
      : `<span class="sem-sintomas">Nenhum sintoma assinalado.</span>`;
  }

  // ── Indicação clínica, recomendação e ações ──
  if (classe === "alto") {
    if (indicacaoTexto) {
      indicacaoTexto.innerHTML = `O score do paciente é <strong>${pct}%</strong> (≥ 56%), o que representa
         <span class="destaque-alto">alta probabilidade clínica</span>.
         Indicado priorizar a realização do teste molecular (FMR1).`;
    }
    if (asteriscoInfo) {
      asteriscoInfo.style.display = "flex";
      asteriscoInfo.className = "asterisco-info alto";
      asteriscoInfo.innerHTML = `★ Recomendado encaminhar o paciente para o teste FMR1`;
    }
    if (botoesRes) {
      botoesRes.innerHTML = `
        <button class="btn-acao primario" onclick="acaoEncaminhar()">
          Encaminhar para teste FMR1
        </button>
        <button class="btn-acao secundario" onclick="acaoMonitoramento()">
          Colocar em monitoramento
        </button>`;
    }
  } else if (classe === "medio") {
    if (indicacaoTexto) {
      indicacaoTexto.innerHTML = `O score do paciente é <strong>${pct}%</strong> (entre 40% e 55%), o que representa
         <span class="destaque-medio">média probabilidade clínica</span>.
         Indicado analisar com mais detalhe para confirmar a necessidade do teste molecular (FMR1).`;
    }
    if (asteriscoInfo) asteriscoInfo.style.display = "none";
    if (botoesRes) {
      botoesRes.innerHTML = `
        <button class="btn-acao secundario" onclick="acaoEncaminhar()">
          Recomendar teste FMR1
        </button>
        <button class="btn-acao secundario" onclick="acaoMonitoramento()">
          Colocar em espera / monitoramento
        </button>`;
    }
  } else {
    if (indicacaoTexto) {
      indicacaoTexto.innerHTML = `O score do paciente é <strong>${pct}%</strong> (&lt; 40%), o que representa
         <span class="destaque-baixo">baixa probabilidade clínica</span>.
         Indicado analisar e monitorar o paciente.`;
    }
    if (asteriscoInfo) {
      asteriscoInfo.style.display = "flex";
      asteriscoInfo.className = "asterisco-info baixo";
      asteriscoInfo.innerHTML = `★ Monitoramento recomendado`;
    }
    if (botoesRes) {
      botoesRes.innerHTML = `
        <button class="btn-acao secundario" onclick="acaoEncaminhar()">
          Recomendar teste FMR1
        </button>
        <button class="btn-acao primario" onclick="acaoMonitoramento()">
          Colocar em espera / monitoramento
        </button>`;
    }
  }

  if (botoesRes) {
    // Botão de relatório formal (PDF), disponível em todas as categorias
    botoesRes.insertAdjacentHTML(
      "beforeend",
      `<button class="btn-acao relatorio" onclick="gerarRelatorioResultado()">
         Gerar relatório (PDF)
       </button>`
    );

    const btnVoltarAntigo = document.querySelector(".btn-voltar");
    if (btnVoltarAntigo) btnVoltarAntigo.remove();
    botoesRes.insertAdjacentHTML(
      "afterend",
      `<button class="btn-voltar" onclick="voltarFormulario()">← Voltar ao formulário</button>`
    );
  }

  mostrarTela("tela-resultado");
}

// ─────────────────────────────────────────────
// Histórico de Triagens (API)
// ─────────────────────────────────────────────

async function registrarTriagem(recomendacaoEncaminhamento) {
  if (!PACIENTE_ID) return null;
  try {
    const token = localStorage.getItem("aura_token");
    const res = await fetch("/api/triagens/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        paciente_id: PACIENTE_ID,
        score_total: Math.round(ultimoScore * 100),
        recomendacao_encaminhamento: recomendacaoEncaminhamento,
        sintomas: sintomasMarcados(),
      }),
    });
    if (!res.ok) return null;
    const criada = await res.json();
    return criada.id || null;
  } catch (e) {
    console.error(e);
    return null;
  }
}

async function definirConduta(recomendacaoEncaminhamento) {
  if (!ultimaTriagemId) {
    ultimaTriagemId = await registrarTriagem(recomendacaoEncaminhamento);
    return ultimaTriagemId !== null;
  }
  try {
    const token = localStorage.getItem("aura_token");
    const res = await fetch(`/api/triagens/${ultimaTriagemId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        recomendacao_encaminhamento: recomendacaoEncaminhamento,
      }),
    });
    return res.ok;
  } catch (e) {
    console.error(e);
    return false;
  }
}

// ─────────────────────────────────────────────
// Relatório formal (PDF) 
// ─────────────────────────────────────────────

function gerarRelatorioResultado() {
  const usuario = JSON.parse(localStorage.getItem("aura_user") || "null") || {};
  const nomeInput = document.getElementById("nomePaciente");
  const titleEl = document.getElementById("titleName");
  const nascInput = document.getElementById("dataNascimento");
  const pacienteNome =
    (nomeInput && nomeInput.value.trim()) ||
    (titleEl && titleEl.textContent.trim()) ||
    "Não informado";

  if (typeof gerarRelatorioPDF === 'function') {
    gerarRelatorioPDF({
      pacienteNome,
      pacienteNascimento: nascInput && nascInput.value ? nascInput.value : null,
      dataHora: new Date(),
      scorePct: Math.round(ultimoScore * 100),
      sintomas: sintomasMarcados(),
      conduta: null, 
      medicoNome: usuario.nome || null,
      medicoCrm: usuario.crm || null,
    });
  } else {
    alert("Para gerar o PDF, verifique se a função relatorio.js foi importada corretamente.");
  }
}

// ─────────────────────────────────────────────
// Ações dos botões finais de resultado
// ─────────────────────────────────────────────

async function acaoEncaminhar() {
  const ok = await definirConduta(true);
  alert(ok ? "✅ Paciente encaminhado para teste molecular FMR1.\nConduta registrada com sucesso!" : "✅ Encaminhamento indicado.\n⚠️ Aviso: Não foi possível registrar a conduta no histórico.");
  window.location.href = 'dashboardMedico.html'; // Volta para a SPA
}

async function acaoMonitoramento() {
  const ok = await definirConduta(false);
  alert(ok ? "📋 Paciente colocado em monitoramento/espera.\nConduta registrada com sucesso!" : "📋 Monitoramento indicado.\n⚠️ Aviso: Não foi possível registrar a conduta no histórico.");
  window.location.href = 'dashboardMedico.html'; // Volta para a SPA
}

function voltarFormulario() {
  const btnVoltar = document.querySelector(".btn-voltar");
  if (btnVoltar) btnVoltar.remove();
  mostrarTela("tela-formulario");
}
