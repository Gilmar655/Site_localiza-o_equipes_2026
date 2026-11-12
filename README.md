# SIGEO · Localização de Equipes (Enel SP)

Site estático (HTML + CSS + JS) publicado no GitHub Pages:
https://gilmar655.github.io/Site_localiza-o_equipes_2026/

## Conteúdo
- `index.html`, `css/style.css`, `js/app.js`: página e lógica.
- `data/programacao.js`: programação SIGEO futura de 12/11/2026 já cruzada com a base Buscapé (coordenadas, circuito, links Maps/Waze).
- `data/equipamentos.csv`: base Buscapé (258.855 equipamentos, base de 12/06/2026), carregada só ao abrir a aba "Equipamentos · Buscapé".
- `fontes/Programacao_Sigeo_12_11_2026.xlsx`: planilha original da programação.
- `ferramentas/gerar_programacao.py`: gera `data/programacao.js` a partir da planilha SIGEO e de `data/equipamentos.csv`.
- `libs/`: Leaflet, Chart.js e SheetJS (locais, sem depender de CDN).
- `.nojekyll`: faz o GitHub Pages servir os arquivos como estão.

## Atualização de dados — 12/11/2026
- Programação SIGEO futura de 12/11/2026: 2.317 programações, 1.991 projetos, de 12/11/2026 a 15/01/2027.
- 2.267 programações localizadas (97,8%): 2.063 exatas, 70 inferidas e 134 aproximadas pelo circuito; 50 sem localização.
- Base Buscapé conferida: a planilha de 12/11/2026 é idêntica à já publicada (258.855 equipamentos, base de 12/06/2026); `data/equipamentos.csv` não mudou.
- A nova planilha não traz a coluna UPS Orçada; o valor foi mantido da base de 31/10/2026 para os projetos que já constavam nela. Projetos novos aparecem como "Não encontrado".
- Regenerar: `python ferramentas/gerar_programacao.py fontes/<planilha>.xlsx data/equipamentos.csv data/programacao.js data/programacao.js DD/MM/AAAA`

## Atualização visual — 02/11/2026
- Filtros à esquerda, com pesquisa nas listas, seleção múltipla e botão Limpar tudo.
- Cabeçalho com título, logomarca Enel Brasil e relógio com segundos, data por extenso e fuso America/Sao_Paulo.
- Layout claro e responsivo; em telas pequenas o botão Mostrar filtros abre o painel.
- Rodapé: Criado por Gilmar Campos.
- Mapa, agenda, gráficos, importação, exportação e dados existentes preservados.
- As quantidades nas opções dos filtros se referem à base completa; indicadores, mapa, gráficos e tabela acompanham a seleção.
- Dentro de uma categoria as opções somam resultados (OU); entre categorias os filtros se combinam (E).
- O relógio usa a hora do dispositivo, convertida para Brasília, e atualiza a cada segundo. Mantenha a data e a hora do dispositivo sincronizadas.

## Como publicar
O site permanece no GitHub Pages, branch `main`, pasta raiz.
Extraia o ZIP e copie seu conteúdo para a raiz do repositório, preservando as subpastas e substituindo os arquivos de mesmo nome. Faça o commit e aguarde a publicação do GitHub Pages.
Para abrir localmente, use um servidor HTTP, por exemplo `python -m http.server 8000`, e acesse http://localhost:8000. O mapa de fundo precisa de conexão à internet.

## Logomarca
`assets/enel-brasil.svg`: identidade Enel Brasil, de autoria da Enel Brasil.
Fonte vetorial: https://commons.wikimedia.org/wiki/File:Enel_Brasil_Nova_Marca.svg
Referência oficial: https://www.enel.com.br/pt/quemsomos/nova-marca.html

## Precisão da localização
- **Exata**: o código do equipamento existe na base Buscapé.
- **Inferida**: código escrito em outro formato (ex.: `ET-004443`) que combina com um único equipamento da base.
- **Aprox. (circuito)**: disjuntor de alimentador (`DJ…`); o ponto é o centro dos equipamentos do circuito.
- **Sem localização**: código não encontrado na base.

## Atualizar os dados
Use o botão "Importar Excel / CSV" na página (vale só para o seu navegador) ou gere novamente `data/programacao.js` a partir das duas planilhas.
