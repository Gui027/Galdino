# Fly Trap — landing page

Página estática de venda, servida em `/flytrap` (os caminhos são absolutos, então ela precisa ficar nessa pasta na raiz do site).

## Arquivos

- `index.html` — conteúdo e estrutura
- `styles.css` — visual e responsividade (mobile-first)
- `script.js` — botões de compra, formulário e FAQ
- `assets/` — imagens em WebP geradas a partir de `fly-trap-hero.png` (a PNG original fica só como fonte; a página não a carrega)

## Antes de anunciar

1. **Preços** — os valores dos kits são exemplos. Ajuste no `index.html` (hero, cards dos kits e barra fixa do celular).
2. **Checkout** — no topo de `script.js`, cole o link de checkout de cada kit em `CONFIG.checkout`. Com o link preenchido, o botão leva direto ao pagamento.
3. **WhatsApp** — sem checkout, o botão abre um formulário (nome + WhatsApp). Preencha `CONFIG.whatsapp` para que o envio abra uma conversa com os dados do pedido. Sem nenhum dos dois, o lead fica salvo apenas no `localStorage` do navegador.
4. **Depoimentos** — os três depoimentos são ilustrativos. Troque por avaliações reais de clientes ou remova a seção.
5. **Promessas** — "frete grátis", "garantia de 7 dias", "envio em até 2 dias úteis" e "Pix, cartão ou boleto" precisam refletir sua operação real.
6. **Instruções de uso** — confira o passo a passo e as advertências com a embalagem do produto.
