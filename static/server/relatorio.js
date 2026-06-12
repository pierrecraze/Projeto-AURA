/**
 * PLATAFORMA DE ASSISTÊNCIA CLÍNICA — AURA
 * Geração do relatório formal da avaliação de triagem (Síndrome do X Frágil / FMR1).
 *
 * O relatório é montado como um documento HTML formal em uma nova janela e a
 * caixa de impressão é aberta automaticamente — o médico escolhe "Salvar como PDF".
 *
 * Usado em duas páginas:
 *   - paciente.html (tela de resultado, logo após o cálculo do score)
 *   - relatoriosPacientes.html (página de avaliações, para triagens já registradas)
 */

// Rótulos legíveis dos sintomas do checklist (chave = name do input do formulário)
const SINTOMAS_LABELS = {
  deficiencia_intelectual: "Deficiência intelectual",
  macroorquidismo: "Macroorquidismo",
  dificuldades_aprendizagem: "Dificuldades de aprendizagem",
  movimentos_repetitivos: "Movimentos repetitivos",
  hiperatividade: "Hiperatividade",
  evita_contato_fisico: "Evita contato físico",
  face_alongada: "Face alongada / orelhas proeminentes",
  hipermobilidade: "Hipermobilidade articular",
  deficit_atencao: "Déficit de atenção",
  atraso_fala: "Atraso na fala",
  evita_contato_visual: "Evita contato visual",
  agressividade: "Agressividade",
};

// Classificação clínica a partir do score percentual (0–100)
function classificarScorePct(scorePct) {
  if (scorePct >= 56) {
    return {
      classe: "alto",
      categoria: "Alta probabilidade clínica",
      indicacao:
        "Indicado priorizar a realização do teste molecular (FMR1).",
    };
  }
  if (scorePct >= 40) {
    return {
      classe: "medio",
      categoria: "Média probabilidade clínica",
      indicacao:
        "Indicado analisar com mais detalhe para confirmar a necessidade do teste molecular (FMR1).",
    };
  }
  return {
    classe: "baixo",
    categoria: "Baixa probabilidade clínica",
    indicacao: "Indicado analisar e monitorar o paciente.",
  };
}

function _esc(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function _fmtDataBR(d) {
  const data = d instanceof Date ? d : new Date(d);
  if (isNaN(data)) return "—";
  return data.toLocaleDateString("pt-BR");
}

function _fmtDataExtenso(d) {
  const data = d instanceof Date ? d : new Date(d);
  if (isNaN(data)) return "";
  return data.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function _fmtHoraBR(d) {
  const data = d instanceof Date ? d : new Date(d);
  if (isNaN(data)) return "—";
  return data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

/**
 * Gera o relatório formal e abre a caixa de impressão (Salvar como PDF).
 *
 * @param {Object} dados
 * @param {string}        dados.pacienteNome        Nome do paciente
 * @param {string|null}   [dados.pacienteNascimento] Data de nascimento (ISO) — opcional
 * @param {Date|string}   dados.dataHora            Data/hora da avaliação
 * @param {number}        dados.scorePct            Score em percentual (0–100)
 * @param {string[]|null} dados.sintomas            Chaves dos sintomas assinalados (null = não registrados)
 * @param {boolean|null}  [dados.conduta]           true = encaminhado p/ FMR1, false = monitoramento, null = não registrada
 * @param {string|null}   [dados.medicoNome]        Nome do profissional responsável
 * @param {string|null}   [dados.medicoCrm]         CRM do profissional responsável
 * @param {Window|null}   [janela]  Janela já aberta no clique (evita bloqueio de pop-up
 *                                  quando a geração ocorre após um await). Opcional.
 */
function gerarRelatorioPDF(dados, janela) {
  const { categoria, indicacao, classe } = classificarScorePct(dados.scorePct);

  const cores = { alto: "#c0392b", medio: "#b9770b", baixo: "#1e8449" };
  const cor = cores[classe];

  // ── Tabela de características clínicas ────────────────
  let tabelaSintomas;
  if (Array.isArray(dados.sintomas)) {
    const marcados = new Set(dados.sintomas);
    const linhas = Object.keys(SINTOMAS_LABELS)
      .map((chave) => {
        const sim = marcados.has(chave);
        return `<tr>
            <td>${_esc(SINTOMAS_LABELS[chave])}</td>
            <td class="centro ${sim ? "sim" : "nao"}">${sim ? "Apresenta" : "Não apresenta"}</td>
          </tr>`;
      })
      .join("");
    tabelaSintomas = `
      <table class="tabela">
        <thead>
          <tr><th>Característica clínica avaliada</th><th class="centro">Resultado</th></tr>
        </thead>
        <tbody>${linhas}</tbody>
      </table>`;
  } else {
    tabelaSintomas = `<p class="nota">As características clínicas desta avaliação não foram registradas individualmente no sistema.</p>`;
  }

  // ── Conduta registrada (quando houver) ─────────────────
  const condutaLinha =
    dados.conduta === true
      ? `<p><strong>Conduta registrada:</strong> paciente encaminhado para a realização do teste molecular FMR1.</p>`
      : dados.conduta === false
        ? `<p><strong>Conduta registrada:</strong> paciente colocado em espera / monitoramento clínico.</p>`
        : "";

  const nomeMedico = dados.medicoNome ? `Dr(a). ${_esc(dados.medicoNome)}` : "";
  const crmMedico = dados.medicoCrm ? `CRM ${_esc(dados.medicoCrm)}` : "";

  const nascimentoLinha = dados.pacienteNascimento
    ? `<div class="info-item"><span>Data de nascimento</span><strong>${_fmtDataBR(dados.pacienteNascimento)}</strong></div>`
    : "";

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<title>Relatório de Avaliação Clínica — ${_esc(dados.pacienteNome)}</title>
<style>
  @page { size: A4; margin: 2cm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: Georgia, "Times New Roman", serif;
    font-size: 11pt;
    line-height: 1.55;
    color: #1a1a1a;
    padding: 24px;
    max-width: 760px;
    margin: 0 auto;
  }
  .cabecalho {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2.5px solid #1a6fb5;
    padding-bottom: 12px;
    margin-bottom: 22px;
  }
  .marca { font-size: 20pt; font-weight: bold; color: #1a6fb5; letter-spacing: 2px; }
  .instituto { font-size: 9.5pt; color: #555; text-align: right; line-height: 1.4; }
  h1 {
    font-size: 13.5pt;
    text-align: center;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-bottom: 4px;
  }
  .subtitulo { text-align: center; font-size: 9.5pt; color: #555; margin-bottom: 22px; }
  h2 {
    font-size: 10.5pt;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #1a6fb5;
    border-bottom: 1px solid #c9dced;
    padding-bottom: 3px;
    margin: 20px 0 10px;
  }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; }
  .info-item span { display: block; font-size: 8.5pt; text-transform: uppercase; letter-spacing: 0.04em; color: #777; }
  .info-item strong { font-size: 11pt; }
  .tabela { width: 100%; border-collapse: collapse; margin-top: 4px; }
  .tabela th, .tabela td { border: 1px solid #bbb; padding: 6px 10px; font-size: 10pt; }
  .tabela th { background: #eef4fa; text-align: left; font-size: 9pt; text-transform: uppercase; letter-spacing: 0.04em; }
  .tabela .centro { text-align: center; width: 150px; }
  .tabela .sim { font-weight: bold; }
  .tabela .nao { color: #888; }
  .resultado {
    display: flex;
    align-items: center;
    gap: 18px;
    border: 1.5px solid ${cor};
    border-radius: 6px;
    padding: 12px 16px;
    margin-top: 6px;
  }
  .resultado .score { font-size: 22pt; font-weight: bold; color: ${cor}; white-space: nowrap; }
  .resultado .detalhe strong { color: ${cor}; }
  .nota { font-size: 9.5pt; color: #666; font-style: italic; }
  .assinatura { margin-top: 64px; text-align: center; }
  .assinatura .linha { border-top: 1px solid #1a1a1a; width: 320px; margin: 0 auto 6px; }
  .assinatura .nome { font-weight: bold; }
  .assinatura .crm, .assinatura .rotulo { font-size: 9.5pt; color: #555; }
  .data-local { margin-top: 36px; text-align: right; font-size: 10.5pt; }
  .rodape {
    margin-top: 40px;
    border-top: 1px solid #ccc;
    padding-top: 8px;
    font-size: 8.5pt;
    color: #777;
    text-align: center;
  }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
  <div class="cabecalho">
    <div class="marca">AURA</div>
    <div class="instituto">
      Instituto Buko Kaesemodel<br />
      Plataforma de Assistência Clínica
    </div>
  </div>

  <h1>Relatório de Avaliação Clínica</h1>
  <p class="subtitulo">Triagem para Síndrome do X Frágil — gene FMR1</p>

  <h2>1. Identificação</h2>
  <div class="info-grid">
    <div class="info-item"><span>Paciente</span><strong>${_esc(dados.pacienteNome)}</strong></div>
    ${nascimentoLinha}
    <div class="info-item"><span>Data da avaliação</span><strong>${_fmtDataBR(dados.dataHora)}</strong></div>
    <div class="info-item"><span>Horário</span><strong>${_fmtHoraBR(dados.dataHora)}</strong></div>
    ${nomeMedico ? `<div class="info-item"><span>Profissional responsável</span><strong>${nomeMedico}${crmMedico ? " — " + crmMedico : ""}</strong></div>` : ""}
  </div>

  <h2>2. Características clínicas avaliadas</h2>
  ${tabelaSintomas}

  <h2>3. Resultado da triagem</h2>
  <div class="resultado">
    <div class="score">${dados.scorePct}%</div>
    <div class="detalhe">
      <p>Score de probabilidade clínica: <strong>${categoria}</strong>.</p>
      <p>${_esc(indicacao)}</p>
    </div>
  </div>
  ${condutaLinha}

  <p class="data-local">Emitido em ${_fmtDataExtenso(new Date())}.</p>

  <div class="assinatura">
    <div class="linha"></div>
    ${nomeMedico ? `<div class="nome">${nomeMedico}</div>` : ""}
    ${crmMedico ? `<div class="crm">${crmMedico}</div>` : ""}
    <div class="rotulo">Assinatura e carimbo do profissional responsável</div>
  </div>

  <div class="rodape">
    Este documento é um instrumento de triagem clínica gerado pela plataforma AURA e
    não substitui o diagnóstico molecular (teste FMR1) nem a avaliação médica completa.
  </div>

  <script>
    window.addEventListener("load", function () {
      setTimeout(function () { window.print(); }, 200);
    });
  </script>
</body>
</html>`;

  // Usa a janela já aberta no clique (quando fornecida) ou tenta abrir agora.
  const win = janela || window.open("", "_blank");
  if (!win) {
    alert("Não foi possível abrir o relatório. Verifique se o navegador está bloqueando pop-ups.");
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}
