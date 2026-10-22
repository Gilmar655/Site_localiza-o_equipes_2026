# Localização de Equipes — SIGEO

Painel de apoio ao acompanhamento de campo da Enel Distribuição São Paulo.

## Conteúdo

- 2.410 programações e 2.074 projetos distintos.
- 2.062 registros no cadastro complementar de projetos.
- 258.855 equipamentos na base Buscapé.
- 2.163 programações com ao menos um equipamento localizado (89,8%): 2.162 completas e uma parcial.
- 247 programações sem ponto identificado; nenhuma foi excluída da tabela.
- 1.717 equipamentos distintos relacionados às programações.
- Período efetivo: 22/10/2026 a 25/12/2026. O arquivo não contém programação em janeiro de 2027.
- A base original de equipamentos informa referência em 12/06/2026.

## Uso

O mapa representa os equipamentos dos locais programados dos serviços. As planilhas não contêm rastreamento em tempo real, nome do encarregado, identificação individual de equipe ou posição GPS do veículo. Contratada e empresa executante são exibidas conforme cada fonte.

Use busca, datas, regional, contratada, status da programação, intervenção, circuito, geolocalização e status do projeto. Indicadores, agenda, gráficos, mapa e tabelas Consolidada/Programação respondem aos filtros. Cadastro e Equipamentos são apresentados integralmente e têm busca própria. As tabelas têm ordenação e paginação; exportação inclui todos os registros da busca, não apenas a página atual.

Clique em um projeto para abrir os detalhes e as rotas. Na aba Equipamentos, pesquise um código e clique nele para destacá-lo no mapa.

### Excel e CSV

O botão superior Exportar seleção gera um link para baixar XLSX e uma alternativa com o mesmo Excel dentro de ZIP. O XLSX contém Consolidada, Dados, Planilha1, Equipamentos relacionados e Critérios. Base consolidada exporta todas as programações; os equipamentos desse arquivo são somente os referenciados pelas programações. Os arquivos originais completos estão disponíveis em Fontes, critérios e arquivos originais.

Excel desta tabela e CSV exportam a tabela aberta, respeitando sua busca e ordenação. Exportar os 258.855 equipamentos pode levar mais tempo. CSV usa UTF-8 com BOM e ponto e vírgula. Valores que podem ser interpretados como fórmulas no CSV são protegidos com apóstrofo.

Importar aceita XLSX, XLS e CSV. Selecione uma ou duas planilhas; confira os totais na revisão e aplique. As abas reconhecidas substituem as bases equivalentes; as demais são preservadas. Não há junção aproximada por código nem geocodificação estimada de ruas.

Cabeçalhos reconhecidos:

- Programação: Projeto, Data Programacao, Equipamentos, Status Programacao, Contratada.
- Cadastro: Projeto, Rua, Status do Projeto.
- Equipamentos: Número do Equipamento, Latitude, Longitude; Circuito opcional.

São aceitas datas do Excel e textos DD/MM/AAAA ou AAAA-MM-DD. Cada papel deve aparecer uma única vez no conjunto de arquivos selecionados. Importações com erro são recusadas antes de alterar a base.

As importações são locais ao navegador (IndexedDB); não alteram os arquivos originais nem publicam uma nova versão para outros visitantes. Use Restaurar base original para voltar à versão incluída no site. Exporte dados importantes antes de limpar os dados do navegador.

### Localização

Código completo do equipamento, ignorando espaços e diferenças de maiúsculas/minúsculas. Não são retirados prefixos nem substituídos códigos. Coordenadas precisam ser numéricas e válidas; códigos duplicados com posições conflitantes são excluídos do mapa. Programações com vários equipamentos mostram todos os pontos encontrados; as pendências permanecem identificadas.

Projeto é a chave para acrescentar os dados do cadastro. Status da programação e status do projeto são campos diferentes. Regiões são padronizadas somente para exibição; o valor original permanece na aba Programação original. As colunas CHI, Pendente e UPS Orçada são mantidas sem inferir unidades.

### Publicação / execução

O conteúdo de `dist/` é um site estático, sem compilação e sem chave de API. Abra `index.html` após extrair todos os arquivos, ou sirva a pasta por HTTP/HTTPS. Mantenha as pastas vendor e originais. O mapa de fundo e os links de rota precisam de internet. A posição do próprio usuário depende de HTTPS e da permissão do navegador e não é armazenada.

O ZIP de distribuição tem os arquivos de `dist/` na raiz. Para GitHub Pages, envie todo o conteúdo extraído para a raiz da branch escolhida, incluindo `.nojekyll`, e configure Pages para essa branch e pasta raiz. A publicação fornecida nesta tarefa tem acesso privado ao proprietário.

## Dependências

Leaflet 1.9.4 e SheetJS CE 0.20.3 incluídos localmente, com suas respectivas licenças. Tiles: OpenStreetMap, com atribuição no mapa.

## Links de localização

As colunas Google Maps e Waze ficam ao lado do projeto na Visão consolidada. Quando houver vários equipamentos, são exibidos links numerados na mesma ordem das coordenadas. A aba Localizações e rotas mostra cada equipamento separadamente. As exportações de seleção e da base completa incluem a aba Localizacoes, com hyperlinks individuais no Excel. Exportar a tabela consolidada também inclui essa aba para o recorte da busca. Sem coordenadas comprovadas, não é gerado link. As coordenadas são usadas diretamente, sem estimativa por endereço.
