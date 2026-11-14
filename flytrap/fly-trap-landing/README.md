# Fly Trap — landing page

Landing page estática e responsiva em português, pronta para hospedar em qualquer serviço de arquivos estáticos.

## Visualização local

Na pasta `fly-trap-landing`, execute:

```powershell
python -m http.server 4173 --directory dist
```

Depois acesse `http://localhost:4173`.

## Antes de anunciar

- Substitua as condições genéricas dos três kits por preço, parcelamento, frete e garantia reais.
- Conecte os botões de oferta ao checkout definitivo ou integre o formulário ao CRM. Na versão de demonstração, os leads ficam apenas no `localStorage` do navegador.
- Revise instruções, composição da isca, duração e advertências conforme a embalagem real do produto.

## Estrutura

- `dist/index.html`: conteúdo e estrutura
- `dist/styles.css`: identidade visual e responsividade
- `dist/script.js`: animações, FAQ e formulário
- `dist/assets/fly-trap-hero.png`: imagem de produto gerada para a página
