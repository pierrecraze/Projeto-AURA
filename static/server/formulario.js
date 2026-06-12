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
  const btnSaveForm = document.getElementById('btnSaveForm');

  // ── Confirmação de Segurança (Do Repositório) ──
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

  // --- INÍCIO DA DUPLA INTEGRAÇÃO COM A API ---
  if (btnSaveForm) {
    btnSaveForm.disabled = true;
    btnSaveForm.innerHTML = 'Salvando...';
  }

  const token = localStorage.getItem('aura_token');

  // 1. Atualiza o score no perfil do Paciente (Para os Gráficos do SPA)
  if (PACIENTE_ID) {
    try {
      await fetch(`/api/pacientes/${PACIENTE_ID}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ score_clinico: score })
      });
    } catch (error) {
      console.error("Erro ao atualizar score no perfil do paciente:", error);
    }
  }

  // 2. Registra o Histórico na Triagem (Para Laudos e Relatórios)
  try {
    const triagemId = await registrarTriagem(score >= 0.56);
    ultimaTriagemId = triagemId;
    if (triagemId && typeof mostrarToast === "function") {
      mostrarToast("Avaliação registrada no sistema.");
    }
  } catch(error) {
     console.error("Erro ao registrar no histórico de triagens:", error);
  }

  if (btnSaveForm) {
    btnSaveForm.disabled = false;
    btnSaveForm.innerHTML = `
      <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
        <polyline points="17 21 17 13 7 13 7 21"></polyline>
        <polyline points="7 3 7 8 15 8"></polyline>
      </svg>
      <span>Salvar</span>`;
  }
  // --- FIM DA INTEGRAÇÃO ---

  // Mostra a tela de resultado final
  exibirResultado(score);
}

// Vincula o botão da interface à função assíncrona
document.addEventListener('DOMContentLoaded', () => {
  const btnSaveForm = document.getElementById('btnSaveForm');
  if (btnSaveForm) {
    btnSaveForm.addEventListener('click', confirmarDados);
  }
});

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

  // Atualiza blocos de pontuação
  if (scoreBox) {
    scoreBox.textContent = score.toFixed(2);
    scoreBox.classList.remove("alto", "medio", "baixo");
    scoreBox.classList.add(classe);
  }

  if (scoreBadge) {
    scoreBadge.textContent = categoria;
    scoreBadge.className = `score-badge ${classe}`;
  }

  const marcados = sintomasMarcados();
  const count = marcados.length;
  
  const countEl = document.getElementById("metrica-contagem");
  if (countEl) countEl.textContent = `${count} / 12 SIM`;

  const metricaBarra = document.getElementById("metrica-barra");
  if (metricaBarra) {
    metricaBarra.style.width = `${(count / 12) * 100}%`;
    metricaBarra.className = `metrica-barra ${classe}`;
  }

  // Preenche a listagem visual dos sintomas apresentados
  const pontosEl = document.getElementById("metrica-pontos");
  if (pontosEl) {
    // Tenta usar as labels do relatorio.js se existir, ou formata o texto cru
    pontosEl.innerHTML = marcados.length
      ? marcados.map((nome) => {
          let label = typeof SINTOMAS_LABELS !== 'undefined' ? SINTOMAS_LABELS[nome] : nome.replace(/_/g, ' ');
          return `<span class="sintoma-chip ${classe}">${label.toUpperCase()}</span>`;
        }).join("")
      : `<span class="sem-sintomas">Nenhum sintoma assinalado.</span>`;
  }

  // ── Textos e Botões (Design Estético da SPA) ─────────────────────
  if (classe === "alto") {
    if (indicacaoTexto) {
      indicacaoTexto.innerHTML = `O resultado do score do paciente é ≥ 0.56, dessa forma, representa
         <span class="destaque-alto">alta probabilidade clínica</span>.
         Indicado priorizar realização de teste molecular (FMR1)!`;
    }
    if (asteriscoInfo) {
      asteriscoInfo.style.display = "flex";
      asteriscoInfo.className = "asterisco-info alto";
      asteriscoInfo.innerHTML = `<span style="font-size:1.1rem;color:#c0392b;">★</span> É RECOMENDADO ENCAMINHAR O PACIENTE PARA TESTE FMR1`;
    }
    if (botoesRes) {
      botoesRes.innerHTML = `
        <button class="btn-acao primario" onclick="acaoEncaminhar()">
          É RECOMENDADO ENCAMINHAR<br>O PACIENTE PARA TESTE FMR1
        </button>
        <button class="btn-acao secundario" onclick="acaoMonitoramento()">
          COLOCAR PACIENTE EM<br>MONITORAMENTO
        </button>`;
    }
  } else if (classe === "medio") {
    if (indicacaoTexto) {
      indicacaoTexto.innerHTML = `O resultado do score do paciente é ≥ 0.40, dessa forma, representa
         <span class="destaque-medio">média probabilidade clínica</span>.
         É indicado analisar mais detalhadamente para confirmar a situação
         e se é preciso a realização do teste molecular (FMR1)!`;
    }
    if (asteriscoInfo) asteriscoInfo.style.display = "none";
    if (botoesRes) {
      botoesRes.innerHTML = `
        <button class="btn-acao secundario" onclick="acaoEncaminhar()">
          RECOMENDAR PACIENTE<br>PARA TESTE FMR1?
        </button>
        <button class="btn-acao secundario" onclick="acaoMonitoramento()">
          COLOCAR PACIENTE EM<br>ESPERA / MONITORAMENTO
        </button>`;
    }
  } else {
    if (indicacaoTexto) {
      indicacaoTexto.innerHTML = `O resultado do score do paciente é ≤ 0.40, dessa forma, o paciente representa
         <span class="destaque-baixo">baixa probabilidade clínica</span>.
         Indicado analisar e monitorar o paciente.`;
    }
    if (asteriscoInfo) {
      asteriscoInfo.style.display = "flex";
      asteriscoInfo.className = "asterisco-info baixo";
      asteriscoInfo.innerHTML = `<span style="font-size:1.1rem;color:#27ae60;">★</span> <span style="color:#27ae60;">MONITORAMENTO RECOMENDADO</span>`;
    }
    if (botoesRes) {
      botoesRes.innerHTML = `
        <button class="btn-acao secundario" onclick="acaoEncaminhar()">
          RECOMENDAR PACIENTE<br>PARA TESTE FMR1?
        </button>
        <button class="btn-acao primario" onclick="acaoMonitoramento()">
          COLOCAR PACIENTE EM<br>ESPERA / MONITORAMENTO
        </button>`;
    }
  }

  if (botoesRes) {
    // Injeção do Botão Gerar PDF (Repositório Original)
    botoesRes.insertAdjacentHTML(
      "beforeend",
      `<button class="btn-acao relatorio" style="margin-top: 8px;" onclick="gerarRelatorioResultado()">GERAR LAUDO (PDF)</button>`
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
