const header = document.querySelector('.site-header');
const dialog = document.querySelector('#lead-dialog');
const selectedKit = document.querySelector('#selected-kit');
const kitInput = document.querySelector('#kit-input');
const form = document.querySelector('#lead-form');

window.addEventListener('scroll', () => header.classList.toggle('scrolled', window.scrollY > 24), { passive: true });

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));

document.querySelectorAll('.choose-offer').forEach((button) => {
  button.addEventListener('click', () => {
    const kit = button.dataset.kit;
    selectedKit.textContent = kit;
    kitInput.value = kit;
    form.hidden = false;
    dialog.querySelector('.success-message').hidden = true;
    dialog.showModal();
  });
});

dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close();
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  const leads = JSON.parse(localStorage.getItem('flytrap-leads') || '[]');
  leads.push({ ...data, createdAt: new Date().toISOString() });
  localStorage.setItem('flytrap-leads', JSON.stringify(leads));
  form.hidden = true;
  dialog.querySelector('.success-message').hidden = false;
});

document.querySelectorAll('details').forEach((detail) => {
  detail.addEventListener('toggle', () => {
    if (!detail.open) return;
    document.querySelectorAll('details').forEach((other) => {
      if (other !== detail) other.removeAttribute('open');
    });
  });
});
