/**
 * PREV MOTO CAR — INTERATIVIDADE, COTAÇÃO AUTOMÁTICA, PLANILHA & E-MAIL + WHATSAPP
 *
 * O que este script faz quando o cliente preenche o formulário:
 * 1. Calcula automaticamente a mensalidade estimada (R$ 50 a R$ 135/mês) conforme modelo, cilindrada e ano.
 * 2. Salva na Planilha Online (Google Sheets) e dispara o E-mail com a Tabelinha Atualizada (via Webhook Google Apps Script + FormSubmit).
 * 3. Redireciona o cliente para o WhatsApp (88) 99799-1122 já com os dados e a pré-cotação pronta.
 */

document.addEventListener('DOMContentLoaded', () => {
  const WHATSAPP_NUMBER = '5588997991122';

  // ============================================================================
  // CONFIGURAÇÃO DE ARMAZENAMENTO (PLANILHA GOOGLE SHEETS + E-MAIL)
  // ============================================================================
  const INTEGRACAO_CONFIG = {
    // 1. Cole aqui a URL do Google Apps Script (que salva na tabela do Google Sheets e envia o e-mail com a tabela atualizada):
    googleSheetsWebhookUrl: '',

    // 2. Ou informe o e-mail direto aqui para envio imediato em formato de tabela via FormSubmit (ex: 'contato@prevmotocar.com.br'):
    emailDestinoDireto: 'teraescritoriomarketing@gmail.com',
  };

  // ============================================================================
  // MOTOR DE PRÉ-COTAÇÃO AUTOMÁTICA (BASEADO NA TABELA OFICIAL DA PREV MOTO CAR)
  // ============================================================================
  const calcularPreCotacao = (modelo, cilindrada, ano) => {
    const mod = (modelo || '').toLowerCase();
    const cc = (cilindrada || '').toLowerCase();
    const anoNum = parseInt(ano, 10) || 2024;
    const isNovo = anoNum >= 2024;

    if (mod.includes('pop') || cc.includes('100cc') || cc.includes('110cc')) {
      return 'R$ 50/mês';
    }
    if (mod.includes('sahara')) {
      return 'R$ 135/mês';
    }
    if (mod.includes('300') || cc.includes('300cc')) {
      return mod.includes('sahara') ? 'R$ 135/mês' : 'R$ 120 a R$ 135/mês';
    }
    if (mod.includes('190') || mod.includes('250') || mod.includes('xre') || mod.includes('cb') || cc.includes('190cc')) {
      return isNovo ? 'R$ 120/mês' : 'R$ 100/mês';
    }
    if (mod.includes('bros') && (mod.includes('160') || cc.includes('160cc'))) {
      return isNovo ? 'R$ 95/mês' : 'R$ 75/mês';
    }
    if (mod.includes('160') || cc.includes('160cc') || mod.includes('biz')) {
      return isNovo ? 'R$ 85/mês' : 'R$ 75/mês';
    }
    if (mod.includes('bros') || mod.includes('xtz')) {
      return 'R$ 70/mês';
    }
    if (mod.includes('125') || mod.includes('150') || cc.includes('125cc') || cc.includes('150cc')) {
      return 'R$ 60/mês';
    }
    return 'A partir de R$ 50/mês';
  };

  // ============================================================================
  // ENVIO EM SEGUNDO PLANO PARA PLANILHA GOOGLE SHEETS + E-MAIL COM TABELA
  // ============================================================================
  const registrarLeadNaBase = (lead) => {
    // Salva também um histórico local de segurança no navegador
    try {
      const historico = JSON.parse(localStorage.getItem('prevmotocar_leads') || '[]');
      historico.push(lead);
      localStorage.setItem('prevmotocar_leads', JSON.stringify(historico));
    } catch (_) {
      // Ignora erro de storage privado
    }

    // A) Dispara para o Google Sheets + E-mail com Tabela Atualizada (Google Apps Script)
    if (INTEGRACAO_CONFIG.googleSheetsWebhookUrl) {
      fetch(INTEGRACAO_CONFIG.googleSheetsWebhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        keepalive: true,
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(lead),
      }).catch(() => {});
    }

    // B) Dispara para o E-mail Direto em Formato de Tabela (FormSubmit AJAX)
    if (INTEGRACAO_CONFIG.emailDestinoDireto) {
      fetch(`https://formsubmit.co/ajax/${encodeURIComponent(INTEGRACAO_CONFIG.emailDestinoDireto)}`, {
        method: 'POST',
        keepalive: true,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          _subject: `Nova Cotação Prev Moto Car — ${lead.nome} (${lead.modelo})`,
          _template: 'table',
          _captcha: 'false',
          'Data e Hora': lead.dataHora,
          'Nome do Cliente': lead.nome,
          WhatsApp: lead.whatsapp,
          'Modelo da Moto': lead.modelo,
          'Ano da Moto': lead.ano,
          Cilindrada: lead.cilindrada,
          Cidade: lead.cidade,
          'Pré-Cotação Calculada': lead.preCotacao,
          'Origem do Formulário': lead.origem,
        }),
      }).catch(() => {});
    }
  };

  // 1. MÁSCARA DE TELEFONE / WHATSAPP
  const phoneInputs = document.querySelectorAll('input[type="tel"]');
  phoneInputs.forEach((input) => {
    input.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\D/g, '');
      if (val.length > 11) val = val.slice(0, 11);

      if (val.length > 6) {
        e.target.value = `(${val.slice(0, 2)}) ${val.slice(2, 7)}-${val.slice(7)}`;
      } else if (val.length > 2) {
        e.target.value = `(${val.slice(0, 2)}) ${val.slice(2)}`;
      } else if (val.length > 0) {
        e.target.value = `(${val}`;
      }
    });
  });

  // 2. FILTRO DA TABELA DE PLANOS POR CILINDRADA
  const filterBtns = document.querySelectorAll('.plan-filter-btn');
  const planCards = document.querySelectorAll('.plan-row-card');

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const category = btn.getAttribute('data-category');

      planCards.forEach((card) => {
        const cardCat = card.getAttribute('data-category');
        if (category === 'all' || cardCat === category) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // 3. CLIQUE EM "SIMULAR" NA TABELA DE PLANOS -> PREENCHE O FORMULÁRIO E ROLA ATÉ LÁ
  const selectPlanBtns = document.querySelectorAll('.btn-select-plan');
  const modeloInputTopo = document.getElementById('modelo-topo');
  const cilindradaSelectTopo = document.getElementById('cilindrada-topo');
  const nomeInputTopo = document.getElementById('nome-topo');
  const quoteSection = document.getElementById('cotacao');

  selectPlanBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const motoName = btn.getAttribute('data-moto');
      const motoCc = btn.getAttribute('data-cc');

      if (modeloInputTopo && motoName) {
        modeloInputTopo.value = motoName;
      }

      if (cilindradaSelectTopo && motoCc) {
        for (let i = 0; i < cilindradaSelectTopo.options.length; i++) {
          if (cilindradaSelectTopo.options[i].value === motoCc) {
            cilindradaSelectTopo.selectedIndex = i;
            break;
          }
        }
      }

      if (quoteSection) {
        quoteSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
          if (nomeInputTopo) nomeInputTopo.focus();
        }, 600);
      }
    });
  });

  // 4. ENVIO DOS FORMULÁRIOS -> SALVA NA TABELA / E-MAIL E ABRE WHATSAPP COM PRÉ-COTAÇÃO
  const handleQuoteSubmit = (form, origemLabel) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const formData = new FormData(form);
      const nome = (formData.get('nome') || '').toString().trim();
      const whatsapp = (formData.get('whatsapp') || '').toString().trim();
      const modelo = (formData.get('modelo') || '').toString().trim();
      const ano = (formData.get('ano') || '').toString().trim();
      const cilindrada = (formData.get('cilindrada') || '').toString().trim();
      const cidade = (formData.get('cidade') || '').toString().trim();

      if (!nome || !modelo) {
        const firstEmpty = form.querySelector('input:invalid, select:invalid');
        if (firstEmpty) firstEmpty.focus();
        return;
      }

      const preCotacao = calcularPreCotacao(modelo, cilindrada, ano);
      const dataHora = new Date().toLocaleString('pt-BR', {
        timeZone: 'America/Fortaleza',
      });

      const leadData = {
        dataHora,
        nome,
        whatsapp: whatsapp || 'Não informado',
        modelo,
        ano: ano || 'Não informado',
        cilindrada: cilindrada || 'Não informada',
        cidade: cidade || 'Não informada',
        preCotacao,
        origem: origemLabel,
      };

      // Dispara para a Planilha + E-mail em background sem travar o redirecionamento
      registrarLeadNaBase(leadData);

      const mensagem = [
        `Olá! Vim pelo site da *Prev Moto Car* e quero receber minha cotação:`,
        ``,
        `*Nome:* ${nome}`,
        whatsapp ? `*WhatsApp:* ${whatsapp}` : null,
        `*Moto:* ${modelo}`,
        ano ? `*Ano:* ${ano}` : null,
        cilindrada ? `*Cilindrada:* ${cilindrada}` : null,
        cidade ? `*Cidade:* ${cidade}` : null,
        `*Pré-cotação na tabela:* ${preCotacao}`,
      ]
        .filter(Boolean)
        .join('\n');

      const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensagem)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    });
  };

  const formTopo = document.getElementById('form-cotacao-topo');
  const formRodape = document.getElementById('form-cotacao-rodape');

  if (formTopo) handleQuoteSubmit(formTopo, 'Formulário Principal (Topo)');
  if (formRodape) handleQuoteSubmit(formRodape, 'Formulário Final (Rodapé)');

  // 5. ACCORDION DE PERGUNTAS FREQUENTES (FAQ)
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach((item) => {
    const questionBtn = item.querySelector('.faq-question');
    if (!questionBtn) return;

    questionBtn.addEventListener('click', () => {
      const isOpen = item.classList.contains('active');

      faqItems.forEach((other) => {
        other.classList.remove('active');
        const btn = other.querySelector('.faq-question');
        if (btn) btn.setAttribute('aria-expanded', 'false');
      });

      if (!isOpen) {
        item.classList.add('active');
        questionBtn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // 6. SINCRONIZAÇÃO INTERATIVA ENTRE O MAPA DO CEARÁ E OS CARDS DE ICÓ & LIMOEIRO DO NORTE
  const unitElements = document.querySelectorAll('[data-unit]');
  const setUnitFocus = (unitName, active) => {
    unitElements.forEach((el) => {
      if (el.getAttribute('data-unit') === unitName) {
        el.classList.toggle('is-focused', active);
      }
    });
  };

  unitElements.forEach((el) => {
    const unit = el.getAttribute('data-unit');
    if (!unit) return;

    el.addEventListener('mouseenter', () => setUnitFocus(unit, true));
    el.addEventListener('mouseleave', () => setUnitFocus(unit, false));
    el.addEventListener('click', () => {
      const targetCard = document.querySelector(`.location-card[data-unit="${unit}"]`);
      if (targetCard && !el.classList.contains('location-card')) {
        targetCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  });
});
