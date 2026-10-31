# SIGEO · Localização de Equipes (Enel SP)

Site estático (HTML + CSS + JS) publicado no GitHub Pages:
https://gilmar655.github.io/Site_localiza-o_equipes_2026/

## Conteúdo
- `index.html`, `css/style.css`, `js/app.js`: página e lógica.
- `data/programacao.js`: programação SIGEO de 31/10/2026 já cruzada com a base Buscapé (coordenadas, circuito, links Maps/Waze).
- `data/equipamentos.csv`: base Buscapé (258.855 equipamentos, base de 12/06/2026), carregada só ao abrir a aba "Equipamentos · Buscapé".
- `fontes/Programacao_Sigeo_31_10_2026.xlsx`: planilha original da programação.
- `libs/`: Leaflet, Chart.js e SheetJS (locais, sem depender de CDN).
- `.nojekyll`: faz o GitHub Pages servir os arquivos como estão.

## Como publicar
1. No repositório `Site_localiza-o_equipes_2026`, apague os arquivos antigos (ou mantenha-os e deixe o upload substituir os de mesmo nome).
2. Extraia o ZIP e envie **o conteúdo da pasta** (não a pasta em si) em *Add file → Upload files*. Inclua o arquivo `.nojekyll` (vazio), que alguns exploradores ocultam.
3. *Commit changes*. Em *Settings → Pages*, a origem deve ser a branch `main`, pasta `/ (root)`.
4. Aguarde 1–2 minutos e abra o link do site.

Pelo terminal: copie o conteúdo para a pasta do repositório clonado e rode
`git add -A && git commit -m "Atualiza programação 31/10/2026" && git push`.

## Precisão da localização
- **Exata**: o código do equipamento existe na base Buscapé.
- **Inferida**: código escrito em outro formato (ex.: `ET-004443`) que combina com um único equipamento da base.
- **Aprox. (circuito)**: disjuntor de alimentador (`DJ…`); o ponto é o centro dos equipamentos do circuito.
- **Sem localização**: código não encontrado na base.

## Atualizar os dados
Use o botão "Importar Excel / CSV" na página (vale só para o seu navegador) ou gere novamente `data/programacao.js` a partir das duas planilhas.
