/**
 * PLATAFORMA DE ASSISTÊNCIA CLÍNICA
 * Lógica de pontuação FMR1 (Síndrome do X Frágil)
 *
 * Pesos por sintoma (baseados em relevância clínica):
 * A soma máxima de pesos é 1.00 (normalizada).
 * Score final = soma dos pesos dos sintomas marcados como SIM.
 *
 * Classificação:
 *   Score >= 0.56  → Alta probabilidade   (vermelho)
 *   Score >= 0.40  → Média probabilidade  (amarelo)
 *   Score <  0.40  → Baixa probabilidade  (verde)
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

// Os rótulos legíveis dos sintomas (SINTOMAS_LABELS) vivem em relatorio.js,
// carregado antes deste script nas páginas que usam o formulário.

// Aceita tanto ?paciente_id= (formulario.html) quanto ?id= (paciente.html)
const _params = new URLSearchParams(window.location.search);
const PACIENTE_ID = _params.get("paciente_id") || _params.get("id");

let ultimoScore = 0;

// ─────────────────────────────────────────────
// Utilitários
// ─────────────────────────────────────────────

function getRespostaCampo(nome) {
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
  // Limpa todas as respostas do formulário (suporta radios e checkboxes)
  document
    .querySelectorAll('input[type="radio"], input[type="checkbox"]')
    .forEach((r) => (r.checked = false));
  document.getElementById("erro-formulario").style.display = "none";
}

// ─────────────────────────────────────────────
// Ação: Confirmar dados
// ─────────────────────────────────────────────

function confirmarDados() {
  const erroEl = document.getElementById("erro-formulario");

  // O score é calculado apenas com base no que o paciente apresenta.
  // Itens não marcados são tratados como "não apresenta", portanto não é
  // necessário responder a todos os campos para gerar o resultado.
  erroEl.style.display = "none";
  const score = calcularScore();
  ultimoScore = score;
  exibirResultado(score);
}

// ─────────────────────────────────────────────
// Renderiza tela de resultado
// ─────────────────────────────────────────────

function exibirResultado(score) {
  const scoreBox = document.getElementById("score-box");
  const scoreBadge = document.getElementById("score-badge");
  const indicacaoTexto = document.getElementById("indicacao-texto");
  const asteriscoInfo = document.getElementById("asterisco-info");
  const botoesRes = document.getElementById("botoes-resultado");

  // ── Categoria com base no score ────────────────
  let classe, categoria;
  if (score >= 0.56) {
    classe = "alto";
    categoria = "Alta probabilidade";
  } else if (score >= 0.4) {
    classe = "medio";
    categoria = "Média probabilidade";
  } else {
    classe = "baixo";
    categoria = "Baixa probabilidade";
  }

  // ── Score apresentado como percentual ──────────
  const pct = Math.round(score * 100);
  scoreBox.textContent = `${pct}%`;
  scoreBox.classList.remove("alto", "medio", "baixo");
  scoreBox.classList.add(classe);

  if (scoreBadge) {
    scoreBadge.textContent = categoria;
    scoreBadge.className = `score-badge ${classe}`;
  }

  // ── Barra de probabilidade (reflete o score) ───
  const metricaBarra = document.getElementById("metrica-barra");
  if (metricaBarra) {
    metricaBarra.style.width = `${pct}%`;
    metricaBarra.className = `metrica-barra ${classe}`;
  }

  // ── Sintomas apresentados (chips) ──────────────
  const marcados = sintomasMarcados();

  const countEl = document.getElementById("metrica-contagem");
  if (countEl) {
    const n = marcados.length;
    countEl.textContent = `${n} de 12 ${n === 1 ? "sintoma" : "sintomas"}`;
  }

  const pontosEl = document.getElementById("metrica-pontos");
  if (pontosEl) {
    pontosEl.innerHTML = marcados.length
      ? marcados
          .map(
            (nome) =>
              `<span class="sintoma-chip ${classe}">${SINTOMAS_LABELS[nome] || nome}</span>`,
          )
          .join("")
      : `<span class="sem-sintomas">Nenhum sintoma assinalado.</span>`;
  }

  // ── Indicação clínica + recomendação + ações ───
  if (classe === "alto") {
    indicacaoTexto.innerHTML = `O score do paciente é <strong>${pct}%</strong> (≥ 56%), o que representa
       <span class="destaque-alto">alta probabilidade clínica</span>.
       Indicado priorizar a realização do teste molecular (FMR1).`;

    asteriscoInfo.style.display = "flex";
    asteriscoInfo.className = "asterisco-info alto";
    asteriscoInfo.innerHTML = `★ Recomendado encaminhar o paciente para o teste FMR1`;

    botoesRes.innerHTML = `
      <button class="btn-acao primario" onclick="acaoEncaminhar()">
        Encaminhar para teste FMR1
      </button>
      <button class="btn-acao secundario" onclick="acaoMonitoramento()">
        Colocar em monitoramento
      </button>`;
  } else if (classe === "medio") {
    indicacaoTexto.innerHTML = `O score do paciente é <strong>${pct}%</strong> (entre 40% e 55%), o que representa
       <span class="destaque-medio">média probabilidade clínica</span>.
       Indicado analisar com mais detalhe para confirmar a necessidade do teste molecular (FMR1).`;

    asteriscoInfo.style.display = "none";

    botoesRes.innerHTML = `
      <button class="btn-acao secundario" onclick="acaoEncaminhar()">
        Recomendar teste FMR1
      </button>
      <button class="btn-acao secundario" onclick="acaoMonitoramento()">
        Colocar em espera / monitoramento
      </button>`;
  } else {
    indicacaoTexto.innerHTML = `O score do paciente é <strong>${pct}%</strong> (&lt; 40%), o que representa
       <span class="destaque-baixo">baixa probabilidade clínica</span>.
       Indicado analisar e monitorar o paciente.`;

    asteriscoInfo.style.display = "flex";
    asteriscoInfo.className = "asterisco-info baixo";
    asteriscoInfo.innerHTML = `★ Monitoramento recomendado`;

    botoesRes.innerHTML = `
      <button class="btn-acao secundario" onclick="acaoEncaminhar()">
        Recomendar teste FMR1
      </button>
      <button class="btn-acao primario" onclick="acaoMonitoramento()">
        Colocar em espera / monitoramento
      </button>`;
  }

  // Botão de relatório formal (PDF), disponível em todas as categorias
  botoesRes.insertAdjacentHTML(
    "beforeend",
    `<button class="btn-acao relatorio" onclick="gerarRelatorioResultado()">
       Gerar relatório (PDF)
     </button>`,
  );

  // Botão voltar (evita duplicatas em reavaliações)
  const btnVoltarAntigo = document.querySelector(".btn-voltar");
  if (btnVoltarAntigo) btnVoltarAntigo.remove();
  botoesRes.insertAdjacentHTML(
    "afterend",
    `<button class="btn-voltar" onclick="voltarFormulario()">← Voltar ao formulário</button>`,
  );

  mostrarTela("tela-resultado");
}

// ─────────────────────────────────────────────
// Relatório formal (PDF) a partir do resultado
// ─────────────────────────────────────────────

function sintomasMarcados() {
  return Object.keys(PESOS)
    .filter((nome) => getRespostaCampo(nome) === "sim")
    .sort((a, b) => PESOS[b] - PESOS[a]);
}

function gerarRelatorioResultado() {
  const usuario = JSON.parse(localStorage.getItem("aura_user") || "null") || {};

  // Nome/nascimento do paciente: na página paciente.html vêm dos campos da ficha
  const nomeInput = document.getElementById("nomePaciente");
  const titleEl = document.getElementById("titleName");
  const nascInput = document.getElementById("dataNascimento");
  const pacienteNome =
    (nomeInput && nomeInput.value.trim()) ||
    (titleEl && titleEl.textContent.trim()) ||
    "Não informado";

  gerarRelatorioPDF({
    pacienteNome,
    pacienteNascimento: nascInput && nascInput.value ? nascInput.value : null,
    dataHora: new Date(),
    scorePct: Math.round(ultimoScore * 100),
    sintomas: sintomasMarcados(),
    conduta: null, // ainda não registrada neste momento
    medicoNome: usuario.nome || null,
    medicoCrm: usuario.crm || null,
  });
}

// ─────────────────────────────────────────────
// Ações dos botões de resultado
// ─────────────────────────────────────────────

async function registrarTriagem(recomendacaoEncaminhamento) {
  if (!PACIENTE_ID) return false;

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
    return res.ok;
  } catch (e) {
    console.error(e);
    return false;
  }
}

function irParaPaciente() {
  window.location.href = PACIENTE_ID
    ? `paciente.html?id=${PACIENTE_ID}`
    : "dashboardMedico.html";
}

async function acaoEncaminhar() {
  const registrado = await registrarTriagem(true);
  alert(
    registrado
      ? "✅ Paciente encaminhado para teste molecular FMR1.\nAvaliação registrada no sistema."
      : "✅ Encaminhamento indicado.\n⚠️ Não foi possível registrar a avaliação no sistema.",
  );
  irParaPaciente();
}

async function acaoMonitoramento() {
  const registrado = await registrarTriagem(false);
  alert(
    registrado
      ? "📋 Paciente colocado em monitoramento/espera.\nAvaliação registrada no sistema."
      : "📋 Monitoramento indicado.\n⚠️ Não foi possível registrar a avaliação no sistema.",
  );
  irParaPaciente();
}

function voltarFormulario() {
  // Remove botão voltar antigo para evitar duplicatas
  const btnVoltar = document.querySelector(".btn-voltar");
  if (btnVoltar) btnVoltar.remove();
  mostrarTela("tela-formulario");
}
