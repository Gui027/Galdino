/* ============================================================
   FLY TRAP — configuração da venda
   ------------------------------------------------------------
   1) CHECKOUT: cole o link de checkout de cada kit. Se preenchido,
      o botão do kit leva direto para o pagamento.
   2) WHATSAPP: número com DDI e DDD, só dígitos (ex.: 5511999999999).
      Sem checkout, o formulário abre uma conversa no WhatsApp com
      os dados do pedido. Sem os dois, o lead fica salvo só no navegador.
   ============================================================ */
const CONFIG = {
  whatsapp: '',
  checkout: {
    essencial: '',
    familia: '',
    pro: '',
  },
};

const dialog = document.querySelector('#lead-dialog');
const selectedKit = document.querySelector('#selected-kit');
const kitInput = document.querySelector('#kit-input');
const form = document.querySelector('#lead-form');
const success = dialog.querySelector('.success');

/* Botões de compra */
document.querySelectorAll('.buy').forEach((button) => {
  button.addEventListener('click', () => {
    const url = CONFIG.checkout[button.dataset.kit];
    if (url) {
      window.location.href = url;
      return;
    }
    selectedKit.textContent = button.dataset.label;
    kitInput.value = button.dataset.label;
    form.hidden = false;
    success.hidden = true;
    dialog.showModal();
  });
});

dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close();
});

/* Máscara simples de telefone */
const phone = form.querySelector('[name="whatsapp"]');
phone.addEventListener('input', () => {
  const digits = phone.value.replace(/\D/g, '').slice(0, 11);
  let out = digits;
  if (digits.length > 2) out = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length > 7) out = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  phone.value = out;
});

/* Envio do formulário */
form.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  let valid = true;
  form.querySelectorAll('input[required]').forEach((input) => {
    const ok = input.name === 'whatsapp'
      ? input.value.replace(/\D/g, '').length >= 10
      : input.value.trim().length >= 2;
    input.classList.toggle('invalid', !ok);
    if (!ok) valid = false;
  });
  if (!valid) return;

  try {
    const leads = JSON.parse(localStorage.getItem('flytrap-leads') || '[]');
    leads.push({ ...data, createdAt: new Date().toISOString() });
    localStorage.setItem('flytrap-leads', JSON.stringify(leads));
  } catch (_) { /* armazenamento indisponível: segue sem salvar */ }

  if (CONFIG.whatsapp) {
    const text = `Olá! Quero o ${data.kit}.\nNome: ${data.nome}\nWhatsApp: ${data.whatsapp}`;
    window.open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  }

  form.hidden = true;
  success.hidden = false;
});

/* FAQ: só uma pergunta aberta por vez */
document.querySelectorAll('details').forEach((detail) => {
  detail.addEventListener('toggle', () => {
    if (!detail.open) return;
    document.querySelectorAll('details').forEach((other) => {
      if (other !== detail) other.removeAttribute('open');
    });
  });
});
