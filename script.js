/**
 * PREV MOTO CAR — INTERATIVIDADE & INTEGRAÇÃO DIRETA COM WHATSAPP (88) 99799-1122
 * - Máscara automática de WhatsApp nos formulários
 * - Filtro dinâmico da tabela de planos por cilindrada
 * - Clique em qualquer plano preenche automaticamente o formulário de cotação e rola suavemente
 * - Envio dos formulários formatado direto para o WhatsApp da Prev Moto Car
 * - Accordion do FAQ
 */

document.addEventListener('DOMContentLoaded', () => {
  const WHATSAPP_NUMBER = '5588997991122';

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

  // 4. ENVIO DOS FORMULÁRIOS DIRETO PARA O WHATSAPP COM OS DADOS DA MOTO
  const handleQuoteSubmit = (form) => {
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

      const mensagem = [
        `Olá! Vim pelo site da *Prev Moto Car* e quero receber minha cotação:`,
        ``,
        `*Nome:* ${nome}`,
        whatsapp ? `*WhatsApp:* ${whatsapp}` : null,
        `*Moto:* ${modelo}`,
        ano ? `*Ano:* ${ano}` : null,
        cilindrada ? `*Cilindrada:* ${cilindrada}` : null,
        cidade ? `*Cidade:* ${cidade}` : null,
      ]
        .filter(Boolean)
        .join('\n');

      const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensagem)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    });
  };

  const formTopo = document.getElementById('form-cotacao-topo');
  const formRodape = document.getElementById('form-cotacao-rodape');

  if (formTopo) handleQuoteSubmit(formTopo);
  if (formRodape) handleQuoteSubmit(formRodape);

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
