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

const PACIENTE_ID = new URLSearchParams(window.location.search).get("paciente_id");

let ultimoScore = 0;

// ─────────────────────────────────────────────
// Utilitários
// ─────────────────────────────────────────────

function getRespostaCampo(nome) {
  const selecionado = document.querySelector(`input[name="${nome}"]:checked`);
  return selecionado ? selecionado.value : null;
}

function todosRespondidos() {
  return Object.keys(PESOS).every((nome) => getRespostaCampo(nome) !== null);
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
  // Limpa todas as respostas do formulário
  document
    .querySelectorAll('input[type="radio"]')
    .forEach((r) => (r.checked = false));
  document.getElementById("erro-formulario").style.display = "none";
}

// ─────────────────────────────────────────────
// Ação: Confirmar dados
// ─────────────────────────────────────────────

function confirmarDados() {
  const erroEl = document.getElementById("erro-formulario");

  if (!todosRespondidos()) {
    erroEl.style.display = "block";
    erroEl.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

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
  const indicacaoTexto = document.getElementById("indicacao-texto");
  const asteriscoInfo = document.getElementById("asterisco-info");
  const botoesRes = document.getElementById("botoes-resultado");

  // 🌟 BONUS: Atualiza automaticamente a interface de contagem "x / 12 SIM" e a barra!
  const count = document.querySelectorAll('input[type="radio"][value="sim"]:checked').length;
  const countEl = document.getElementById("metrica-contagem");
  if (countEl) countEl.textContent = `${count} / 12 SIM`;
  const metricaBarra = document.getElementById("metrica-barra");
  if (metricaBarra) metricaBarra.style.width = `${(count / 12) * 100}%`;

  // Exibe score
  scoreBox.textContent = score.toFixed(2);

  // Remove classes anteriores
  scoreBox.classList.remove("alto", "medio", "baixo");

  // ── ALTA PROBABILIDADE ─────────────────────
  if (score >= 0.56) {
    scoreBox.classList.add("alto");

    indicacaoTexto.innerHTML = `O resultado do score do paciente é ≥ 0.56, dessa forma, representa
       <span class="destaque-alto">alta probabilidade clínica</span>.
       Indicado priorizar realização de teste molecular (FMR1)!`;

    asteriscoInfo.style.display = "flex";
    asteriscoInfo.innerHTML = `<span style="font-size:1.1rem;color:#c0392b;">★</span>
       É RECOMENDADO ENCAMINHAR O PACIENTE PARA TESTE FMR1`;

    botoesRes.innerHTML = `
      <button class="btn-acao primario" onclick="acaoEncaminhar()">
        É RECOMENDADO ENCAMINHAR<br>O PACIENTE PARA TESTE FMR1
      </button>
      <button class="btn-acao secundario" onclick="acaoMonitoramento()">
        COLOCAR PACIENTE EM<br>MONITORAMENTO
      </button>`;

    // ── MÉDIA PROBABILIDADE ────────────────────
  } else if (score >= 0.4) {
    scoreBox.classList.add("medio");

    indicacaoTexto.innerHTML = `O resultado do score do paciente é ≥ 0.40, dessa forma, representa
       <span class="destaque-medio">média probabilidade clínica</span>.
       É indicado analisar mais detalhadamente para confirmar a situação
       e se é preciso a realização do teste molecular (FMR1)!`;

    asteriscoInfo.style.display = "none";

    botoesRes.innerHTML = `
      <button class="btn-acao secundario" onclick="acaoEncaminhar()">
        RECOMENDAR PACIENTE<br>PARA TESTE FMR1?
      </button>
      <button class="btn-acao secundario" onclick="acaoMonitoramento()">
        COLOCAR PACIENTE EM<br>ESPERA / MONITORAMENTO
      </button>`;

    // ── BAIXA PROBABILIDADE ────────────────────
  } else {
    scoreBox.classList.add("baixo");

    indicacaoTexto.innerHTML = `O resultado do score do paciente é ≤ 0.40, dessa forma, o paciente representa
       <span class="destaque-baixo">baixa probabilidade clínica</span>.
       Indicado analisar e monitorar o paciente.`;

    asteriscoInfo.style.display = "flex";
    asteriscoInfo.innerHTML = `<span style="font-size:1.1rem;color:#27ae60;">★</span>
       <span style="color:#27ae60;">MONITORAMENTO RECOMENDADO</span>`;

    botoesRes.innerHTML = `
      <button class="btn-acao secundario" onclick="acaoEncaminhar()">
        RECOMENDAR PACIENTE<br>PARA TESTE FMR1?
      </button>
      <button class="btn-acao primario" onclick="acaoMonitoramento()">
        COLOCAR PACIENTE EM<br>ESPERA / MONITORAMENTO
      </button>`;
  }

  // Botão voltar
  botoesRes.insertAdjacentHTML(
    "afterend",
    `<button class="btn-voltar" onclick="voltarFormulario()">← Voltar ao formulário</button>`,
  );

  mostrarTela("tela-resultado");
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
