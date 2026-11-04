/**
 * ============================================================================
 * AUTOMAÇÃO PREV MOTO CAR — PLANILHA GOOGLE SHEETS + E-MAIL COM TABELA ATUALIZADA
 * ============================================================================
 *
 * COMO ATIVAR EM 2 MINUTOS (100% GRATUITO):
 * 1. Abra o Google Sheets (https://sheets.new) e crie uma planilha chamada "Leads Prev Moto Car".
 * 2. No menu superior da planilha, clique em: Extensões -> Apps Script.
 * 3. Apague tudo que estiver lá, cole este código inteiro e troque o EMAIL_DESTINO abaixo.
 * 4. Clique em "Implantar" (botão azul no topo direito) -> "Nova implantação":
 *    - Tipo: "App da Web"
 *    - Executar como: "Eu"
 *    - Quem pode acessar: "Qualquer pessoa"
 * 5. Copie a URL gerada ("URL do app da Web") e cole em `googleSheetsWebhookUrl` dentro do `script.js`.
 *
 * O QUE ELE FAZ AUTOMATICAMENTE:
 * - Cria o cabeçalho colorido da tabela na planilha se ainda não existir.
 * - Toda vez que alguém responde o formulário no site, adiciona uma nova linha na tabela.
 * - Envia na mesma hora um E-mail em HTML com o Novo Lead + a TABELA ATUALIZADA de todos os leads recentes!
 * - Também possui a função `enviarResumoDiarioPorEmail()` caso queira agendar envio diário.
 */

const EMAIL_DESTINO = "teraescritoriomarketing@gmail.com"; // <-- E-mail configurado para receber a tabela atualizada
const NOME_ABA = "Cotações";

function obterOuCriarAba() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(NOME_ABA);

  if (!sheet) {
    sheet = ss.insertSheet(NOME_ABA);
    const cabecalhos = [
      "Data e Hora",
      "Nome do Cliente",
      "WhatsApp",
      "Modelo da Moto",
      "Ano",
      "Cilindrada",
      "Cidade",
      "Pré-Cotação Calculada",
      "Origem",
      "Link Direto WhatsApp"
    ];
    sheet.appendRow(cabecalhos);

    // Estiliza o cabeçalho nas cores da Prev Moto Car (#E51C23 e branco)
    const headerRange = sheet.getRange(1, 1, 1, cabecalhos.length);
    headerRange.setBackground("#E51C23");
    headerRange.setFontColor("#FFFFFF");
    headerRange.setFontWeight("bold");
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function doPost(e) {
  try {
    const dados = JSON.parse(e.postData.contents);
    const sheet = obterOuCriarAba();

    const numLimpo = String(dados.whatsapp || "").replace(/\D/g, "");
    const linkWa = numLimpo ? `https://wa.me/55${numLimpo}` : "-";

    const novaLinha = [
      dados.dataHora || new Date().toLocaleString("pt-BR"),
      dados.nome || "-",
      dados.whatsapp || "-",
      dados.modelo || "-",
      dados.ano || "-",
      dados.cilindrada || "-",
      dados.cidade || "-",
      dados.preCotacao || "-",
      dados.origem || "Landing Page",
      linkWa
    ];

    // 1. Insere na tabela do Google Sheets
    sheet.appendRow(novaLinha);
    sheet.autoResizeColumns(1, novaLinha.length);

    // 2. Dispara o e-mail com a tabela atualizada
    if (EMAIL_DESTINO && !EMAIL_DESTINO.includes("SEU_EMAIL_AQUI")) {
      enviarEmailComTabelaAtualizada(sheet, dados);
    }

    return ContentService.createTextOutput(
      JSON.stringify({ status: "ok", message: "Lead salvo e tabela enviada por e-mail" })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ status: "erro", message: err.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function enviarEmailComTabelaAtualizada(sheet, ultimoLead) {
  const todasLinhas = sheet.getDataRange().getValues();
  const totalLeads = todasLinhas.length - 1;
  const urlPlanilha = SpreadsheetApp.getActiveSpreadsheet().getUrl();

  // Pega os últimos 25 leads da tabela (do mais recente para o mais antigo)
  const linhasDados = todasLinhas.slice(1).reverse().slice(0, 25);

  let linhasHtml = "";
  linhasDados.forEach((row, idx) => {
    const bgRow = idx === 0 ? "#FFF5F5" : idx % 2 === 0 ? "#FFFFFF" : "#F8F8FA";
    const badgeNovo = idx === 0 ? '<span style="background:#E51C23;color:#FFF;padding:2px 6px;border-radius:4px;font-size:10px;margin-left:6px;">NOVO</span>' : '';

    linhasHtml += `
      <tr style="background:${bgRow}; border-bottom:1px solid #EEEFF2;">
        <td style="padding:10px 12px; font-size:13px; color:#4F5665;">${row[0]}</td>
        <td style="padding:10px 12px; font-size:13px; font-weight:700; color:#0B132A;">${row[1]} ${badgeNovo}</td>
        <td style="padding:10px 12px; font-size:13px; color:#0B132A;">${row[2]}</td>
        <td style="padding:10px 12px; font-size:13px; color:#0B132A;">${row[3]} (${row[4]})</td>
        <td style="padding:10px 12px; font-size:13px; color:#4F5665;">${row[5]}</td>
        <td style="padding:10px 12px; font-size:13px; color:#0B132A;">${row[6]}</td>
        <td style="padding:10px 12px; font-size:13px; font-weight:700; color:#E51C23;">${row[7]}</td>
      </tr>
    `;
  });

  const htmlBody = `
    <div style="font-family:'Segoe UI',Arial,sans-serif; max-width:860px; margin:0 auto; background:#F8F8FA; padding:24px; border-radius:12px;">
      <div style="background:#FFFFFF; padding:28px; border-radius:10px; border-top:5px solid #E51C23;">
        <h2 style="margin:0 0 8px; color:#0B132A; font-size:20px;">
          Nova Cotação Recebida — Prev Moto Car
        </h2>
        <p style="margin:0 0 20px; color:#4F5665; font-size:14px;">
          <strong>${ultimoLead.nome}</strong> acabou de simular a proteção para uma <strong>${ultimoLead.modelo} (${ultimoLead.ano})</strong> em <strong>${ultimoLead.cidade}</strong> — Pré-cotação: <strong style="color:#E51C23;">${ultimoLead.preCotacao}</strong>.
        </p>

        <h3 style="margin:24px 0 12px; color:#0B132A; font-size:16px;">
          Tabela de Cotações Atualizada (Total acumulado: ${totalLeads})
        </h3>

        <div style="overflow-x:auto;">
          <table style="width:100%; border-collapse:collapse; text-align:left; background:#FFFFFF; border:1px solid #EEEFF2; border-radius:8px;">
            <thead>
              <tr style="background:#0B132A; color:#FFFFFF;">
                <th style="padding:11px 12px; font-size:12px;">Data/Hora</th>
                <th style="padding:11px 12px; font-size:12px;">Nome</th>
                <th style="padding:11px 12px; font-size:12px;">WhatsApp</th>
                <th style="padding:11px 12px; font-size:12px;">Moto / Ano</th>
                <th style="padding:11px 12px; font-size:12px;">Cilindrada</th>
                <th style="padding:11px 12px; font-size:12px;">Cidade</th>
                <th style="padding:11px 12px; font-size:12px;">Pré-Cotação</th>
              </tr>
            </thead>
            <tbody>
              ${linhasHtml}
            </tbody>
          </table>
        </div>

        <div style="margin-top:24px;">
          <a href="${urlPlanilha}" style="display:inline-block; background:#E51C23; color:#FFFFFF; text-decoration:none; font-weight:700; font-size:14px; padding:12px 22px; border-radius:8px;">
            Abrir Planilha Completa no Google Sheets
          </a>
        </div>
      </div>
    </div>
  `;

  MailApp.sendEmail({
    to: EMAIL_DESTINO,
    subject: `[Prev Moto Car] Nova Cotação: ${ultimoLead.nome} - ${ultimoLead.modelo} (${ultimoLead.preCotacao})`,
    htmlBody: htmlBody
  });
}

