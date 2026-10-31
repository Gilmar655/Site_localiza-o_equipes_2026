/* SIGEO · Localização de Equipes — aplicação do site (sem dependências além de Leaflet, Chart.js e SheetJS) */
(function () {
'use strict';

/* ---------- utilidades ---------- */
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const nf = new Intl.NumberFormat('pt-BR');
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const norm = s => String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const pct = (n, t) => t ? (n / t * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + '%' : '0%';

// Datas: internamente ISO (aaaa-mm-dd); exibição sempre dd/mm/aaaa
const fmtBR = iso => (iso && /^\d{4}-\d{2}-\d{2}/.test(iso)) ? iso.slice(8, 10) + '/' + iso.slice(5, 7) + '/' + iso.slice(0, 4) : '';
function parseBR(s) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(s).trim());
  if (!m) return null;
  const d = +m[1], mo = +m[2], y = +m[3];
  const t = new Date(Date.UTC(y, mo - 1, d));
  if (t.getUTCFullYear() !== y || t.getUTCMonth() !== mo - 1 || t.getUTCDate() !== d) return null;
  return `${m[3]}-${m[2]}-${m[1]}`;
}
const hojeISO = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
function somaDias(iso, n) { const [y, m, d] = iso.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10); }
function diaSemana(iso) { return new Date(iso + 'T12:00:00Z').toLocaleDateString('pt-BR', { weekday: 'long', timeZone: 'UTC' }); }

const gmaps = (la, lo) => `https://www.google.com/maps?q=${la},${lo}`;
const waze = (la, lo) => `https://waze.com/ul?ll=${la},${lo}&navigate=yes`;
const coord = (la, lo) => `${(+la).toFixed(6)}, ${(+lo).toFixed(6)}`;

const PREC = {
  'Exata': { rot: 'Exata', cls: 'ok' },
  'Inferida': { rot: 'Inferida', cls: 'ap' },
  'Circuito (aprox.)': { rot: 'Aprox. (circuito)', cls: 'ap' }
};
const precSelo = r => r.loc ? `<span class="selo ${PREC[r.loc[3]].cls}">${PREC[r.loc[3]].rot}</span>` : '<span class="selo sem">Sem localização</span>';
const linksHTML = (la, lo) => `<a class="lk" href="${gmaps(la, lo)}" target="_blank" rel="noopener">Google Maps</a><a class="lk" href="${waze(la, lo)}" target="_blank" rel="noopener">Waze</a>`;

/* ---------- dados ---------- */
let FONTE_TXT = `Programação SIGEO 31/10/2026 · Base Buscapé de 12/06/2026 (258.855 equipamentos)`;
let ROWS = [];
function prep(r, i) {
  r._i = i;
  r.dtBR = fmtBR(r.dt);
  const circ = r.loc ? r.loc[2] : '';
  r._b = norm([r.p, r.d, r.pw, r.q.join(' '), r.c, r.s, r.t, r.rg, circ, r.dtBR].join(' '));
  return r;
}
function setRows(rows) { ROWS = rows.map(prep); }
setRows(window.SIGEO_DATA.rows);

/* ---------- filtros ---------- */
const F0 = { busca: '', de: '', ate: '', regional: '', contratada: '', status: '', tipo: '', descricao: '', geo: '', circuito: '' };
let F = Object.assign({}, F0);
const GEO = [['', 'Todas'], ['com', 'Com localização'], ['exata', 'Localização exata'], ['aprox', 'Aproximada / inferida'], ['sem', 'Sem localização']];
const SEL = { fRegional: 'regional', fContratada: 'contratada', fStatus: 'status', fTipo: 'tipo', fDescricao: 'descricao', fGeo: 'geo', fCircuito: 'circuito' };

function contagem(fn) { const m = new Map(); ROWS.forEach(r => { const k = fn(r); if (k) m.set(k, (m.get(k) || 0) + 1); }); return m; }
function opcoes(sel, mapa, todos, ordem) {
  const el = $('#' + sel); const cur = el.value;
  const ks = [...mapa.keys()].sort(ordem || ((a, b) => a.localeCompare(b, 'pt-BR')));
  el.innerHTML = `<option value="">${todos}</option>` + ks.map(k => `<option value="${esc(k)}">${esc(k)} (${nf.format(mapa.get(k))})</option>`).join('');
  el.value = cur && mapa.has(cur) ? cur : '';
}
function montarSelects() {
  opcoes('fRegional', contagem(r => r.rg), 'Todas');
  opcoes('fContratada', contagem(r => r.c), 'Todas');
  opcoes('fStatus', contagem(r => r.s), 'Todos');
  opcoes('fTipo', contagem(r => r.t), 'Todos');
  opcoes('fDescricao', contagem(r => r.d), 'Todas');
  opcoes('fCircuito', contagem(r => r.loc && r.loc[2]), 'Todos');
  $('#fGeo').innerHTML = GEO.map(([v, t]) => `<option value="${v}">${t}</option>`).join('');
  const regs = [...contagem(r => r.rg).keys()].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  $('#chipsRegiao').innerHTML = ['Todas', ...regs].map(n => `<button type="button" class="chip" data-reg="${n === 'Todas' ? '' : esc(n)}">${esc(n)}</button>`).join('');
}
function passa(r) {
  if (F.busca && !r._b.includes(norm(F.busca))) return false;
  if (F.de && r.dt < F.de) return false;
  if (F.ate && r.dt > F.ate) return false;
  if (F.regional && r.rg !== F.regional) return false;
  if (F.contratada && r.c !== F.contratada) return false;
  if (F.status && r.s !== F.status) return false;
  if (F.tipo && r.t !== F.tipo) return false;
  if (F.descricao && r.d !== F.descricao) return false;
  if (F.circuito && (!r.loc || r.loc[2] !== F.circuito)) return false;
  if (F.geo) {
    const p = r.loc ? r.loc[3] : null;
    if (F.geo === 'com' && !p) return false;
    if (F.geo === 'exata' && p !== 'Exata') return false;
    if (F.geo === 'aprox' && !(p === 'Inferida' || p === 'Circuito (aprox.)')) return false;
    if (F.geo === 'sem' && p) return false;
  }
  return true;
}
let VIEW = [];

function sincronizarCampos() {
  Object.entries(SEL).forEach(([id, k]) => { $('#' + id).value = F[k]; });
  $('#fBusca').value = F.busca;
  $('#fDe').value = fmtBR(F.de); $('#fAte').value = fmtBR(F.ate);
  $$('.chip').forEach(c => c.classList.toggle('on', c.dataset.reg === F.regional));
}
function rotuloFiltros() {
  const nomes = { busca: 'Busca', de: 'De', ate: 'Até', regional: 'Regional', contratada: 'Contratada', status: 'Status', tipo: 'Tipo de intervenção', descricao: 'Descrição', geo: 'Geolocalização', circuito: 'Circuito' };
  const tags = Object.keys(F).filter(k => F[k]).map(k => {
    let v = F[k];
    if (k === 'de' || k === 'ate') v = fmtBR(v);
    if (k === 'geo') v = GEO.find(g => g[0] === v)[1];
    return `<span class="tag">${nomes[k]}: ${esc(v)}</span>`;
  });
  $('#filtrosAtivos').innerHTML = tags.length ? 'Filtros ativos: ' + tags.join('') : 'Nenhum filtro ativo: exibindo toda a programação.';
}
let temporizador;
function mudou(ajustarMapa = true) {
  VIEW = ROWS.filter(passa);
  agendaLimite = 150;
  sincronizarCampos(); rotuloFiltros();
  renderKpis(); renderMapa(ajustarMapa); renderAgenda(); renderGraficos(); renderTabela(true);
}
function agendar() { clearTimeout(temporizador); temporizador = setTimeout(() => mudou(), 200); }

function mascaraData(el, chave) {
  el.addEventListener('input', () => {
    let d = el.value.replace(/\D/g, '').slice(0, 8);
    if (d.length > 4) d = d.slice(0, 2) + '/' + d.slice(2, 4) + '/' + d.slice(4);
    else if (d.length > 2) d = d.slice(0, 2) + '/' + d.slice(2);
    el.value = d;
    if (d === '') { F[chave] = ''; el.removeAttribute('aria-invalid'); mudou(); }
    else if (d.length === 10) {
      const iso = parseBR(d);
      if (iso) { F[chave] = iso; el.removeAttribute('aria-invalid'); mudou(); } else el.setAttribute('aria-invalid', 'true');
    }
  });
}

/* ---------- KPIs ---------- */
function renderKpis() {
  const proj = new Set(VIEW.map(r => r.p)), contr = new Set(VIEW.map(r => r.c));
  const com = VIEW.filter(r => r.loc).length, sem = VIEW.length - com;
  const projSem = new Set(VIEW.filter(r => !r.loc).map(r => r.p)).size;
  const aprox = VIEW.filter(r => r.loc && r.loc[3] !== 'Exata').length;
  $('#kpis').innerHTML = [
    ['Programações na seleção', nf.format(VIEW.length), `de ${nf.format(ROWS.length)} no total`],
    ['Projetos distintos', nf.format(proj.size), `${nf.format(contr.size)} contratadas`],
    ['Com localização', nf.format(com), `${pct(com, VIEW.length)} da seleção · ${nf.format(aprox)} aproximadas`],
    ['Pendências de localização', nf.format(sem), `${nf.format(projSem)} projetos sem coordenadas`]
  ].map(k => `<div class="kpi"><div class="rot">${k[0]}</div><div class="val">${k[1]}</div><div class="det">${k[2]}</div></div>`).join('');
}

/* ---------- mapa ---------- */
let mapa, camada, renderer, marcadores = new Map(), selecionada = null;
function iniciarMapa() {
  mapa = L.map('mapa', { preferCanvas: true }).setView([-23.55, -46.6], 10);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© colaboradores do OpenStreetMap' }).addTo(mapa);
  renderer = L.canvas({ padding: 0.5 });
  camada = L.layerGroup().addTo(mapa);
  const leg = L.control({ position: 'bottomleft' });
  leg.onAdd = () => { const d = L.DomUtil.create('div', 'legenda-mapa'); d.innerHTML = '● localização exata &nbsp; ◌ aproximada / inferida'; return d; };
  leg.addTo(mapa);
}
function estiloPonto(r, sel) {
  const ap = r.loc[3] !== 'Exata';
  return { renderer, radius: sel ? 10 : 6, weight: sel ? 3 : 2, color: sel ? css('--destaque') : css('--surface'), fillColor: sel ? css('--destaque') : css('--serie'), fillOpacity: ap ? 0.45 : 0.9 };
}
function popupHTML(r) {
  return `<strong>${esc(r.p)}</strong><br>${esc(r.d)}<br>${esc(r.dtBR)} · ${esc(r.t)} · ${esc(r.s)}<br><span class="nota">${esc(r.c)}</span><div class="links">${linksHTML(r.loc[0], r.loc[1])}</div><button class="btn btn-sm" type="button" data-det="${r._i}">Ver detalhes</button>`;
}
function renderMapa(ajustar) {
  camada.clearLayers(); marcadores.clear();
  const pts = [];
  VIEW.forEach(r => {
    if (!r.loc) return;
    const m = L.circleMarker([r.loc[0], r.loc[1]], estiloPonto(r, r._i === selecionada));
    m.bindPopup(() => popupHTML(r));
    m.on('click', () => destacarAgenda(r._i));
    m.addTo(camada); marcadores.set(r._i, m); pts.push([r.loc[0], r.loc[1]]);
  });
  const sem = VIEW.length - pts.length;
  $('#mapaNota').textContent = `${nf.format(pts.length)} serviços no mapa` + (sem ? ` · ${nf.format(sem)} sem coordenadas (ver pendências nos indicadores)` : '') + '.';
  if (ajustar) enquadrar();
}
function enquadrar() { const pts = [...marcadores.values()].map(m => m.getLatLng()); if (pts.length) mapa.fitBounds(L.latLngBounds(pts), { padding: [24, 24], maxZoom: 16 }); }
function selecionarLinha(i, abrirPopup) {
  const ant = marcadores.get(selecionada);
  if (ant) ant.setStyle(estiloPonto(ROWS[selecionada], false));
  selecionada = i;
  const m = marcadores.get(i);
  if (m) { m.setStyle(estiloPonto(ROWS[i], true)); m.bringToFront(); if (abrirPopup) { mapa.setView(m.getLatLng(), Math.max(mapa.getZoom(), 15)); m.openPopup(); } }
}

/* ---------- agenda ---------- */
let agendaLimite = 150;
function ordenaAgenda(a, b) { return a.dt.localeCompare(b.dt) || (a.hi || '').localeCompare(b.hi || '') || a.p.localeCompare(b.p); }
function renderAgenda() {
  const ord = VIEW.slice().sort(ordenaAgenda);
  $('#agendaNota').textContent = `${nf.format(ord.length)} serviços, em ordem de data. Clique para ver o link de localização.`;
  if (!ord.length) { $('#agenda').innerHTML = '<div class="vazio">Nenhuma programação para os filtros escolhidos.</div>'; return; }
  let h = '', dia = '';
  ord.slice(0, agendaLimite).forEach(r => {
    if (r.dt !== dia) { dia = r.dt; h += `<div class="agenda-dia">${esc(r.dtBR)} · ${esc(diaSemana(r.dt))}</div>`; }
    h += `<button class="agenda-item${r._i === selecionada ? ' sel' : ''}" type="button" data-i="${r._i}">
      <span class="l1"><span>${esc(r.p)}</span>${precSelo(r)}</span>
      <span class="l2">${esc(r.d)} · ${esc(r.t)} · ${esc(r.hi)}${r.hf ? '–' + esc(r.hf) : ''}</span>
      <span class="l2">${esc(r.c)} · ${esc(r.rg)}</span></button>`;
  });
  if (ord.length > agendaLimite) h += `<div class="vazio"><button class="btn btn-sm" type="button" id="agMais">Mostrar mais (${nf.format(ord.length - agendaLimite)} restantes)</button></div>`;
  $('#agenda').innerHTML = h;
}
function destacarAgenda(i) {
  selecionarLinha(i, false);
  $$('.agenda-item').forEach(b => b.classList.toggle('sel', +b.dataset.i === i));
  const b = $(`.agenda-item[data-i="${i}"]`); if (b) b.scrollIntoView({ block: 'nearest' });
}
function abrirDetalhe(i) {
  const r = ROWS[i];
  const loc = r.loc;
  const eqs = r.eq.length ? r.eq.map(q => `<li><strong>${esc(q[0])}</strong> — ${q[1] != null ? `circuito ${esc(q[3])} · ${coord(q[1], q[2])} · ${esc(PREC[q[4]].rot)}<div class="links">${linksHTML(q[1], q[2])}</div>` : 'sem coordenadas na base'}</li>`).join('') : '<li>Nenhum equipamento informado na programação.</li>';
  $('#detCorpo').innerHTML = `<h2 id="detTitulo">${esc(r.p)}</h2><p class="nota">${esc(r.d)}</p>
    <dl class="det-grade">
      <dt>Data da programação</dt><dd>${esc(r.dtBR)} (${esc(diaSemana(r.dt))})</dd>
      <dt>Horário</dt><dd>${esc(r.hi)}${r.hf ? ' às ' + esc(r.hf) : ''}</dd>
      <dt>Status</dt><dd>${esc(r.s)}</dd>
      <dt>Tipo de intervenção</dt><dd>${esc(r.t)}</dd>
      <dt>Regional</dt><dd>${esc(r.rg)}${r.rs === 'Código do projeto' ? ' <span class="nota">(deduzida do código do projeto)</span>' : ''}</dd>
      <dt>Contratada</dt><dd>${esc(r.c)}</dd>
      <dt>Número PowerOn</dt><dd>${esc(r.pw) || '—'}</dd>
      <dt>UPS orçada</dt><dd>${r.u != null ? r.u.toLocaleString('pt-BR') : '—'}</dd>
      <dt>CHI</dt><dd>${r.chi != null ? r.chi.toLocaleString('pt-BR') : '—'}</dd>
    </dl>
    <h3>Link de localização</h3>
    ${loc ? `<p>${precSelo(r)} equipamento <strong>${esc(loc[4])}</strong>, circuito ${esc(loc[2])}, ${coord(loc[0], loc[1])}</p><div class="links">${linksHTML(loc[0], loc[1])}</div>` : '<p><span class="selo sem">Sem localização</span> Nenhum equipamento deste projeto foi encontrado na base Buscapé.</p>'}
    <h3 style="margin-top:12px">Equipamentos da programação</h3><ul>${eqs}</ul>`;
  $('#detalhe').showModal();
}

/* ---------- gráficos ---------- */
const GR = {
  descricao: { card: '#cartaoDescricao', filtro: 'descricao', chave: r => r.d, titulo: 'Descrição do projeto', nota: '#notaDescricao', alt: true },
  tipo: { card: '#cartaoTipo', filtro: 'tipo', chave: r => r.t, titulo: 'Tipo de intervenção', nota: '#notaTipo' },
  contratada: { card: '#cartaoContratada', filtro: 'contratada', chave: r => r.c, titulo: 'Contratada', topo: 8 },
  status: { card: '#cartaoStatus', filtro: 'status', chave: r => r.s, titulo: 'Status' }
};
Chart.defaults.locale = 'pt-BR';
const graficos = {};
Object.values(GR).forEach(g => { g.vis = 'g'; });

const rotuloValor = {
  id: 'rotuloValor',
  afterDatasetsDraw(c) {
    const ctx = c.ctx, meta = c.getDatasetMeta(0);
    ctx.save(); ctx.font = '12px system-ui, sans-serif'; ctx.fillStyle = css('--txt'); ctx.textBaseline = 'middle';
    meta.data.forEach((b, i) => ctx.fillText(nf.format(c.data.datasets[0].data[i]), b.x + 6, b.y));
    ctx.restore();
  }
};
function agrupar(g) {
  const m = new Map(); VIEW.forEach(r => { const k = g.chave(r); m.set(k, (m.get(k) || 0) + 1); });
  let a = [...m.entries()].sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0], 'pt-BR'));
  if (g.topo) a = a.slice(0, g.topo);
  return a;
}
function renderGraficos() { Object.keys(GR).forEach(desenhaGrafico); }
function desenhaGrafico(nome) {
  const g = GR[nome], card = $(g.card), corpo = $('[data-corpo]', card);
  if (graficos[nome]) { graficos[nome].destroy(); graficos[nome] = null; }
  const dados = agrupar(g), total = VIEW.length;
  if (g.nota) $(g.nota).textContent = `${nf.format(dados.length)} ${nome === 'tipo' ? 'tipos' : 'descrições'} na seleção · ${nf.format(total)} programações.`;
  if (!dados.length) { corpo.innerHTML = '<div class="vazio">Sem dados para a seleção.</div>'; return; }
  if (g.vis === 't') {
    corpo.innerHTML = `<div class="gr-rolagem"><table class="mini-tab"><thead><tr><th>${esc(g.titulo)}</th><th>Quantidade</th><th>%</th></tr></thead><tbody>${dados.map(([k, v]) => `<tr><td>${esc(k)}</td><td>${nf.format(v)}</td><td>${pct(v, total)}</td></tr>`).join('')}</tbody></table></div>`;
    return;
  }
  const h = Math.max(150, dados.length * (g.alt ? 26 : 34) + 50);
  corpo.innerHTML = `<div style="height:${h}px"><canvas role="img" aria-label="Gráfico de barras: quantidade por ${esc(g.titulo.toLowerCase())}"></canvas></div>`;
  const ativo = F[g.filtro];
  const labels = dados.map(d => d[0]), vals = dados.map(d => d[1]);
  graficos[nome] = new Chart($('canvas', corpo), {
    type: 'bar',
    data: { labels, datasets: [{ data: vals, backgroundColor: labels.map(l => !ativo || l === ativo ? css('--serie') : css('--serie-fraca')), borderRadius: { topRight: 4, bottomRight: 4 }, barThickness: g.alt ? 14 : 20 }] },
    options: {
      indexAxis: 'y', responsive: true, maintainAspectRatio: false, animation: false,
      layout: { padding: { right: 36 } },
      scales: {
        x: { beginAtZero: true, grace: '8%', grid: { color: css('--grade') }, border: { display: false }, ticks: { color: css('--txt-2'), precision: 0 } },
        y: { grid: { display: false }, border: { color: css('--borda-forte') }, ticks: { color: css('--txt'), autoSkip: false, callback(v) { const t = this.getLabelForValue(v); return t.length > 38 ? t.slice(0, 37) + '…' : t; } } }
      },
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: c => ` ${nf.format(c.parsed.x)} programações (${pct(c.parsed.x, total)})` } }
      },
      onClick(_, els) {
        if (!els.length) return;
        const l = labels[els[0].index];
        F[g.filtro] = F[g.filtro] === l ? '' : l; mudou(false);
      },
      onHover(e, els) { e.native.target.style.cursor = els.length ? 'pointer' : 'default'; }
    },
    plugins: [rotuloValor]
  });
}

/* ---------- tabelas ---------- */
const celLinks = r => r.loc ? `<a href="${gmaps(r.loc[0], r.loc[1])}" target="_blank" rel="noopener">Maps</a> · <a href="${waze(r.loc[0], r.loc[1])}" target="_blank" rel="noopener">Waze</a>` : '—';
const dtHora = (dt, hm) => dt && hm ? fmtBR(dt) + ' ' + hm : '';
const COLS = {
  cons: [
    { h: 'Projeto', v: r => r.p }, { h: 'Descrição do projeto', v: r => r.d }, { h: 'Data da programação', v: r => r.dtBR, s: r => r.dt },
    { h: 'Início', v: r => r.hi }, { h: 'Fim', v: r => r.hf }, { h: 'Tipo', v: r => r.t }, { h: 'Status', v: r => r.s },
    { h: 'Regional', v: r => r.rg }, { h: 'Contratada', v: r => r.c },
    { h: 'Equipamento', v: r => r.loc ? r.loc[4] : (r.q[0] || '') }, { h: 'Circuito', v: r => r.loc ? r.loc[2] : '' },
    { h: 'Coordenadas', v: r => r.loc ? coord(r.loc[0], r.loc[1]) : '' }, { h: 'Precisão', v: r => r.loc ? PREC[r.loc[3]].rot : 'Sem localização' },
    { h: 'Google Maps', v: r => r.loc ? gmaps(r.loc[0], r.loc[1]) : '', html: r => r.loc ? `<a href="${gmaps(r.loc[0], r.loc[1])}" target="_blank" rel="noopener">Abrir no Maps</a>` : '—', ns: true },
    { h: 'Waze', v: r => r.loc ? waze(r.loc[0], r.loc[1]) : '', html: r => r.loc ? `<a href="${waze(r.loc[0], r.loc[1])}" target="_blank" rel="noopener">Abrir no Waze</a>` : '—', ns: true }
  ],
  orig: [
    { h: 'Projeto', v: r => r.p }, { h: 'Descrição do Projeto', v: r => r.d }, { h: 'UPS Orçada', v: r => r.u == null ? 'Não encontrado' : r.u.toLocaleString('pt-BR'), s: r => r.u == null ? -1 : r.u },
    { h: 'Data Programacao', v: r => r.dtBR, s: r => r.dt }, { h: 'Status Programacao', v: r => r.s }, { h: 'Tipo Intervencao', v: r => r.t },
    { h: 'Numero PowerON', v: r => r.pw }, { h: 'Equipamentos', v: r => r.q.join('; ') }, { h: 'Regiao', v: r => r.rg },
    { h: 'CHI', v: r => r.chi == null ? '' : r.chi.toLocaleString('pt-BR'), s: r => r.chi == null ? -1 : r.chi },
    { h: 'Horario Inicio', v: r => dtHora(r.dt, r.hi), s: r => r.dt + r.hi }, { h: 'Horario Fim', v: r => dtHora(r.dt, r.hf), s: r => r.dt + r.hf }, { h: 'Contratada', v: r => r.c }
  ],
  proj: [
    { h: 'Projeto', v: r => r.p }, { h: 'Descrição do projeto', v: r => r.d }, { h: 'Regional', v: r => r.rg },
    { h: 'UPS orçada', v: r => r.u == null ? '' : r.u.toLocaleString('pt-BR'), s: r => r.u == null ? -1 : r.u },
    { h: 'Programações', v: r => nf.format(r.n), s: r => r.n }, { h: 'Primeira data', v: r => fmtBR(r.d1), s: r => r.d1 }, { h: 'Última data', v: r => fmtBR(r.d2), s: r => r.d2 },
    { h: 'Tipos', v: r => r.tipos }, { h: 'Contratadas', v: r => r.contr }, { h: 'Circuito', v: r => r.loc ? r.loc[2] : '' },
    { h: 'Precisão', v: r => r.loc ? PREC[r.loc[3]].rot : 'Sem localização' },
    { h: 'Google Maps', v: r => r.loc ? gmaps(r.loc[0], r.loc[1]) : '', html: r => r.loc ? `<a href="${gmaps(r.loc[0], r.loc[1])}" target="_blank" rel="noopener">Abrir no Maps</a>` : '—', ns: true },
    { h: 'Waze', v: r => r.loc ? waze(r.loc[0], r.loc[1]) : '', html: r => r.loc ? `<a href="${waze(r.loc[0], r.loc[1])}" target="_blank" rel="noopener">Abrir no Waze</a>` : '—', ns: true }
  ],
  equip: [
    { h: 'Número do Equipamento', v: r => r[0] }, { h: 'Circuito', v: r => r[1] },
    { h: 'Latitude', v: r => r[2].toFixed(8), s: r => r[2] }, { h: 'Longitude', v: r => r[3].toFixed(8), s: r => r[3] },
    { h: 'Google Maps', v: r => gmaps(r[2], r[3]), html: r => `<a href="${gmaps(r[2], r[3])}" target="_blank" rel="noopener">Abrir no Maps</a>`, ns: true },
    { h: 'Waze', v: r => waze(r[2], r[3]), html: r => `<a href="${waze(r[2], r[3])}" target="_blank" rel="noopener">Abrir no Waze</a>`, ns: true }
  ]
};
const ABAS = { cons: 'Visao_consolidada', orig: 'Programacao_original', proj: 'Cadastro_de_projetos', equip: 'Equipamentos_Buscape' };
let aba = 'cons', pagina = 0, ordem = { col: -1, dir: 1 }, tBusca = '';
function projetosAgregados() {
  const m = new Map();
  VIEW.forEach(r => {
    let p = m.get(r.p);
    if (!p) { p = { p: r.p, d: r.d, rg: r.rg, u: r.u, n: 0, d1: r.dt, d2: r.dt, t: new Set(), c: new Set(), loc: null }; m.set(r.p, p); }
    p.n++; if (r.dt < p.d1) p.d1 = r.dt; if (r.dt > p.d2) p.d2 = r.dt; p.t.add(r.t); p.c.add(r.c);
    if (r.loc && (!p.loc || (p.loc[3] !== 'Exata' && r.loc[3] === 'Exata'))) p.loc = r.loc;
  });
  return [...m.values()].map(p => Object.assign(p, { tipos: [...p.t].sort().join(', '), contr: [...p.c].sort().join('; ') }));
}
let EQ = null, EQP = null; // base Buscapé (sob demanda)
function carregarEquip() {
  if (EQP) return EQP;
  EQP = fetch('data/equipamentos.csv').then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); }).then(txt => {
    const linhas = txt.split('\n'); const out = [];
    for (let i = 1; i < linhas.length; i++) {
      const l = linhas[i]; if (!l) continue;
      const p = l.replace(/\r$/, '').split(',');
      out.push([p[0], p[1], +p[2], +p[3]]);
    }
    EQ = out; return out;
  });
  return EQP;
}
function dadosAba() {
  if (aba === 'cons' || aba === 'orig') return VIEW;
  if (aba === 'proj') return projetosAgregados();
  return EQ || [];
}
function filtraBusca(arr) {
  if (!tBusca) return arr;
  const q = norm(tBusca);
  const cols = COLS[aba];
  if (aba === 'equip') return arr.filter(r => norm(r[0] + ' ' + r[1]).includes(q));
  return arr.filter(r => norm(cols.filter(c => !c.ns).map(c => c.v(r)).join(' ')).includes(q));
}
function renderTabela(reset) {
  if (reset) pagina = 0;
  const cols = COLS[aba], tabela = $('#tabela');
  if (aba === 'equip' && !EQ) {
    tabela.innerHTML = '<tbody><tr><td>Carregando a base Buscapé (cerca de 12 MB)…</td></tr></tbody>';
    $('#tContagem').textContent = '';
    carregarEquip().then(() => { if (aba === 'equip') renderTabela(true); }).catch(e => { tabela.innerHTML = `<tbody><tr><td>Não foi possível carregar a base: ${esc(e.message)}</td></tr></tbody>`; EQP = null; });
    return;
  }
  let arr = filtraBusca(dadosAba());
  if (ordem.col >= 0 && cols[ordem.col] && !cols[ordem.col].ns) {
    const c = cols[ordem.col], f = c.s || c.v;
    arr = arr.slice().sort((a, b) => { const x = f(a), y = f(b); return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'pt-BR', { numeric: true })) * ordem.dir; });
  }
  const n = +$('#tLinhas').value, paginas = Math.max(1, Math.ceil(arr.length / n));
  pagina = Math.min(pagina, paginas - 1);
  const fatia = arr.slice(pagina * n, pagina * n + n);
  tabela.innerHTML = `<thead><tr>${cols.map((c, i) => `<th data-c="${i}" title="Ordenar">${esc(c.h)}${ordem.col === i ? (ordem.dir > 0 ? ' ▲' : ' ▼') : ''}</th>`).join('')}</tr></thead><tbody>${fatia.map(r => `<tr>${cols.map(c => `<td>${c.html ? c.html(r) : esc(c.v(r))}</td>`).join('')}</tr>`).join('') || `<tr><td colspan="${cols.length}">Nenhum registro.</td></tr>`}</tbody>`;
  $('#tContagem').textContent = `${nf.format(arr.length)} registros`;
  $('#pgInfo').textContent = `Página ${nf.format(pagina + 1)} de ${nf.format(paginas)}`;
  $('#pgAnt').disabled = pagina === 0; $('#pgProx').disabled = pagina >= paginas - 1;
  $('#dadosNota').textContent = {
    cons: 'Visão consolidada: cada programação com a localização do equipamento e os links de rota. Acompanha os filtros acima.',
    orig: 'Colunas e valores da planilha SIGEO original (datas no padrão brasileiro). Acompanha os filtros acima.',
    proj: 'Um registro por projeto da seleção atual.',
    equip: 'Base Buscapé completa (258.855 equipamentos), sem relação com os filtros acima.'
  }[aba];
}

/* ---------- exportação ---------- */
function matriz(cols, arr) { return [cols.map(c => c.h)].concat(arr.map(r => cols.map(c => c.v(r)))); }
function baixar(nome, blob) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nome; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000); }
function exportarXlsx(nome, aoa) { const ws = XLSX.utils.aoa_to_sheet(aoa); ws['!cols'] = aoa[0].map(() => ({ wch: 22 })); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, nome.slice(0, 31)); XLSX.writeFile(wb, nome + '.xlsx'); }
function exportarCsv(nome, aoa) { const t = aoa.map(l => l.map(v => { v = String(v == null ? '' : v); return /[;"\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(';')).join('\r\n'); baixar(nome + '.csv', new Blob(['﻿' + t], { type: 'text/csv;charset=utf-8' })); }
const aoaAba = () => matriz(COLS[aba], filtraBusca(dadosAba()));
const carimbo = () => fmtBR(hojeISO()).replace(/\//g, '-');

/* ---------- resolução de localização (importação) ---------- */
let CENT = null, TAIL = null, EQMAP = null;
function prepararIndice() {
  if (EQMAP) return;
  EQMAP = new Map(); TAIL = new Map(); const soma = new Map();
  EQ.forEach(e => {
    EQMAP.set(e[0], e);
    const m = /([A-Z]{2})(\d{3,6})$/.exec(e[0]); if (m) { const k = m[1] + '|' + m[2].replace(/^0+/, ''); (TAIL.get(k) || TAIL.set(k, []).get(k)).push(e); }
    if (e[1]) { (soma.get(e[1]) || soma.set(e[1], { la: [], lo: [] }).get(e[1])); soma.get(e[1]).la.push(e[2]); soma.get(e[1]).lo.push(e[3]); }
  });
  const med = a => { a.sort((x, y) => x - y); const n = a.length; return n % 2 ? a[(n - 1) / 2] : (a[n / 2 - 1] + a[n / 2]) / 2; };
  CENT = new Map(); soma.forEach((v, k) => CENT.set(k, [med(v.la), med(v.lo)]));
}
function resolver(x) {
  let e = EQMAP.get(x); if (e) return [x, e[2], e[3], e[1], 'Exata'];
  let m = /^DJ([A-Z]{3})(\d{4})$/.exec(x);
  if (m) { const c = m[1] + ' ' + m[2], ct = CENT.get(c); if (ct) return [x, ct[0], ct[1], c, 'Circuito (aprox.)']; }
  m = /^(?:\d{3})?([A-Z]{2})-?0*(\d{3,6})$/.exec(x);
  if (m) { const l = TAIL.get(m[1] + '|' + m[2]); if (l && l.length === 1) return [x, l[0][2], l[0][3], l[0][1], 'Inferida']; }
  return [x, null, null, '', 'Sem localização'];
}

/* ---------- importação ---------- */
const REG = { nor: 'Norte', sul: 'Sul', les: 'Leste', oes: 'Oeste', abc: 'ABC' };
let importacao = null;
function isoDe(v) {
  if (v instanceof Date && !isNaN(v)) { const d = new Date(v.getTime() + 30000); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
  const s = String(v == null ? '' : v).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const m = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(s); return m ? `${m[3]}-${m[2]}-${m[1]}` : '';
}
function horaDe(v) {
  if (v instanceof Date && !isNaN(v)) { const d = new Date(v.getTime() + 30000); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }
  const m = /(\d{1,2}):(\d{2})/.exec(String(v == null ? '' : v)); return m ? m[1].padStart(2, '0') + ':' + m[2] : '';
}
async function lerArquivo(arq) {
  const corpo = $('#impCorpo'); $('#modalImp').hidden = false; $('#impAplicar').disabled = true; importacao = null;
  corpo.innerHTML = '<p>Lendo o arquivo…</p>';
  try {
    let wb;
    if (/\.csv$/i.test(arq.name)) { const t = await arq.text(); const fs = (t.split('\n')[0].match(/;/g) || []).length >= (t.split('\n')[0].match(/,/g) || []).length ? ';' : ','; wb = XLSX.read(t, { type: 'string', cellDates: true, FS: fs }); }
    else wb = XLSX.read(await arq.arrayBuffer(), { type: 'array', cellDates: true });
    let linhas = null;
    for (const nome of wb.SheetNames) {
      const aoa = XLSX.utils.sheet_to_json(wb.Sheets[nome], { header: 1, raw: true, defval: '' });
      const hi = aoa.findIndex(l => l.map(norm).includes('projeto') && l.map(norm).some(h => h.startsWith('data prog')));
      if (hi >= 0) { linhas = { cab: aoa[hi].map(norm), dados: aoa.slice(hi + 1).filter(l => l.some(c => c !== '')) }; break; }
    }
    if (!linhas) { corpo.innerHTML = '<p>Não encontrei uma aba de programação. A planilha precisa ter as colunas <code>Projeto</code> e <code>Data Programacao</code>.</p>'; return; }
    const col = n => linhas.cab.findIndex(h => h === norm(n));
    const ix = { p: col('Projeto'), d: col('Descrição do Projeto'), u: col('UPS Orçada'), dt: col('Data Programacao'), s: col('Status Programacao'), t: col('Tipo Intervencao'), pw: col('Numero PowerON'), q: col('Equipamentos'), rg: col('Regiao'), chi: col('CHI'), hi: col('Horario Inicio'), hf: col('Horario Fim'), c: col('Contratada') };
    corpo.innerHTML = '<p>Carregando a base Buscapé para localizar os equipamentos…</p>';
    await carregarEquip(); prepararIndice();
    const g = (l, k) => ix[k] >= 0 ? l[ix[k]] : '';
    const rows = linhas.dados.map(l => {
      const ids = String(g(l, 'q')).split(/[;,\s]+/).map(s => s.trim()).filter(Boolean);
      const eq = ids.map(resolver);
      const ok = eq.filter(q => q[1] != null).sort((a, b) => ({ 'Exata': 0, 'Inferida': 1, 'Circuito (aprox.)': 2 }[a[4]] - { 'Exata': 0, 'Inferida': 1, 'Circuito (aprox.)': 2 }[b[4]]));
      const prim = ok[0];
      const proj = String(g(l, 'p')).trim();
      let rg = REG[norm(g(l, 'rg'))], rs = 'Cadastro';
      if (!rg) { const m = /\.(LES|NOR|SUL|OES|ABC)\./.exec(proj); rg = m ? REG[m[1].toLowerCase()] : 'Não identificada'; rs = m ? 'Código do projeto' : ''; }
      const u = parseFloat(String(g(l, 'u')).replace(',', '.'));
      const chi = parseFloat(String(g(l, 'chi')).replace(',', '.'));
      return { p: proj, d: String(g(l, 'd')) || 'Não encontrado', u: isNaN(u) ? null : u, dt: isoDe(g(l, 'dt')), s: String(g(l, 's')), t: String(g(l, 't')), pw: String(g(l, 'pw')), q: ids, rg, rs, chi: isNaN(chi) ? null : chi, hi: horaDe(g(l, 'hi')), hf: horaDe(g(l, 'hf')), c: String(g(l, 'c')), eq: eq.map(q => q.slice(0, 5)), loc: prim ? [prim[1], prim[2], prim[3], prim[4], prim[0]] : null };
    }).filter(r => r.p && r.dt);
    importacao = { nome: arq.name, rows };
    const com = rows.filter(r => r.loc).length;
    const dts = rows.map(r => r.dt).sort();
    corpo.innerHTML = `<p><strong>${esc(arq.name)}</strong></p><ul>
      <li>${nf.format(rows.length)} programações lidas, ${nf.format(new Set(rows.map(r => r.p)).size)} projetos.</li>
      <li>Período: ${fmtBR(dts[0])} a ${fmtBR(dts[dts.length - 1])}.</li>
      <li>${nf.format(com)} com localização (${pct(com, rows.length)}); ${nf.format(rows.length - com)} sem coordenadas.</li></ul>
      <p class="nota">Ao aplicar, a programação do site é substituída por este arquivo, apenas neste navegador.</p>`;
    $('#impAplicar').disabled = !rows.length;
  } catch (e) { corpo.innerHTML = `<p>Não foi possível ler o arquivo: ${esc(e.message)}</p>`; }
}

/* ---------- eventos ---------- */
function eventos() {
  $('#fBusca').addEventListener('input', e => { F.busca = e.target.value; agendar(); });
  mascaraData($('#fDe'), 'de'); mascaraData($('#fAte'), 'ate');
  Object.entries(SEL).forEach(([id, k]) => $('#' + id).addEventListener('change', e => { F[k] = e.target.value; mudou(); }));
  $('#chipsRegiao').addEventListener('click', e => { const b = e.target.closest('.chip'); if (b) { F.regional = b.dataset.reg; mudou(); } });
  $('#btnHoje').addEventListener('click', () => { F.de = F.ate = hojeISO(); mudou(); });
  $('#btn7').addEventListener('click', () => { F.de = hojeISO(); F.ate = somaDias(F.de, 7); mudou(); });
  $('#btnLimpar').addEventListener('click', () => { F = Object.assign({}, F0); $('#fDe').removeAttribute('aria-invalid'); $('#fAte').removeAttribute('aria-invalid'); mudou(); });
  $('#btnEnquadrar').addEventListener('click', enquadrar);
  $('#btnPosicao').addEventListener('click', () => {
    if (!navigator.geolocation) return alert('Seu navegador não oferece localização.');
    navigator.geolocation.getCurrentPosition(p => { const ll = [p.coords.latitude, p.coords.longitude]; L.circleMarker(ll, { radius: 8, color: css('--surface'), weight: 3, fillColor: css('--destaque'), fillOpacity: 1 }).addTo(mapa).bindPopup('Você está aqui').openPopup(); mapa.setView(ll, 14); }, () => alert('Não foi possível obter a sua posição.'));
  });
  $('#agenda').addEventListener('click', e => {
    if (e.target.id === 'agMais') { agendaLimite += 200; renderAgenda(); return; }
    const b = e.target.closest('.agenda-item'); if (!b) return;
    const i = +b.dataset.i; destacarAgenda(i);
    if (ROWS[i].loc) selecionarLinha(i, true); abrirDetalhe(i);
  });
  document.addEventListener('click', e => { const b = e.target.closest('[data-det]'); if (b) abrirDetalhe(+b.dataset.det); });
  $$('.alterna').forEach(a => a.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    const nome = Object.keys(GR).find(k => $(GR[k].card).contains(a));
    GR[nome].vis = b.dataset.vis; $$('button', a).forEach(x => x.classList.toggle('on', x === b)); desenhaGrafico(nome);
  }));
  $('#abas').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; aba = b.dataset.aba; ordem = { col: -1, dir: 1 }; $$('#abas button').forEach(x => x.classList.toggle('on', x === b)); renderTabela(true); });
  $('#tabela').addEventListener('click', e => { const th = e.target.closest('th[data-c]'); if (!th) return; const c = +th.dataset.c; ordem = { col: c, dir: ordem.col === c ? -ordem.dir : 1 }; renderTabela(false); });
  let tt; $('#tBusca').addEventListener('input', e => { clearTimeout(tt); tt = setTimeout(() => { tBusca = e.target.value; renderTabela(true); }, 250); });
  $('#tLinhas').addEventListener('change', () => renderTabela(true));
  $('#pgAnt').addEventListener('click', () => { pagina--; renderTabela(false); });
  $('#pgProx').addEventListener('click', () => { pagina++; renderTabela(false); });
  $('#btnXlsxTab').addEventListener('click', () => exportarXlsx(`${ABAS[aba]}_${carimbo()}`, aoaAba()));
  $('#btnCsvTab').addEventListener('click', () => exportarCsv(`${ABAS[aba]}_${carimbo()}`, aoaAba()));
  $('#btnExportar').addEventListener('click', () => exportarXlsx(`Selecao_SIGEO_${carimbo()}`, matriz(COLS.cons, VIEW.slice().sort(ordenaAgenda))));
  $('#btnBaseCons').addEventListener('click', () => exportarXlsx(`Base_consolidada_${carimbo()}`, matriz(COLS.cons, ROWS.slice().sort(ordenaAgenda))));
  $('#btnBase').addEventListener('click', () => { $('#secDados').scrollIntoView({ behavior: 'smooth' }); $('#tBusca').focus({ preventScroll: true }); });
  $('#btnImportar').addEventListener('click', () => $('#arquivoImportar').click());
  $('#arquivoImportar').addEventListener('change', e => { const f = e.target.files[0]; e.target.value = ''; if (f) lerArquivo(f); });
  $('#impCancelar').addEventListener('click', () => { $('#modalImp').hidden = true; });
  $('#impAplicar').addEventListener('click', () => {
    if (!importacao) return; setRows(importacao.rows); FONTE_TXT = `Importação local: ${importacao.nome} (somente neste navegador)`;
    F = Object.assign({}, F0); selecionada = null; montarSelects(); $('#fonteResumo').textContent = FONTE_TXT; $('#modalImp').hidden = true; mudou();
  });
  $('#btnRestaurar').addEventListener('click', () => { setRows(window.SIGEO_DATA.rows); FONTE_TXT = fonteOriginal; F = Object.assign({}, F0); selecionada = null; montarSelects(); $('#fonteResumo').textContent = FONTE_TXT; mudou(); });
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { renderGraficos(); renderMapa(false); });
}
const fonteOriginal = FONTE_TXT;
function relogio() { $('#relogio').textContent = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' }); }

montarSelects(); iniciarMapa(); eventos();
$('#fonteResumo').textContent = FONTE_TXT;
relogio(); setInterval(relogio, 30000);
mudou();
})();
