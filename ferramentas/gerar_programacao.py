"""Gera data/programacao.js a partir da planilha SIGEO + base Buscapé (CSV do repo).
Uso: python build.py <planilha_sigeo.xlsx> <equipamentos.csv> <programacao_antiga.js> <saida.js> <data_geracao DD/MM/AAAA>
"""
import sys, csv, json, re, datetime, collections
import openpyxl

src, eqcsv, oldjs, out, gerado = sys.argv[1:6]

# ---- base Buscapé
base = {}
porCirc = collections.defaultdict(list)
porSufixo = collections.defaultdict(list)
with open(eqcsv, encoding='utf-8-sig') as f:
    rd = csv.reader(f); next(rd)
    for cod, circ, lat, lon in rd:
        circ = ' '.join(circ.split())
        lat, lon = float(lat), float(lon)
        k = cod.strip().upper()
        base[k] = (lat, lon, circ)
        if circ:
            porCirc[circ.replace(' ', '')].append((lat, lon, circ))
        m = re.match(r'^\d{3}([A-Z]{2}\d{6})$', k)
        if m:
            porSufixo[m.group(1)].append(k)

def localizar(cod):
    k = cod.strip().upper().replace(' ', '')
    if k in base:
        la, lo, ci = base[k]; return [cod, la, lo, ci, 'Exata']
    m = re.match(r'^([A-Z]{2})-?(\d{6})$', k)
    if m and not re.match(r'^\d', k):
        cand = porSufixo.get(m.group(1) + m.group(2), [])
        if len(cand) == 1:
            la, lo, ci = base[cand[0]]; return [cod, la, lo, ci, 'Inferida']
    m = re.match(r'^DJ([A-Z]{3}\d{4})$', k)
    if m and m.group(1) in porCirc:
        pts = porCirc[m.group(1)]
        import statistics
        la = round(statistics.median(p[0] for p in pts), 8)
        lo = round(statistics.median(p[1] for p in pts), 8)
        return [cod, la, lo, pts[0][2], 'Circuito (aprox.)']
    return [cod, None, None, '', 'Sem localização']

# ---- UPS da versão anterior (a nova planilha não traz a coluna)
s = open(oldjs, encoding='utf-8').read()
old = json.loads(s[s.index('=') + 1:].rstrip().rstrip(';'))
upsAnt = {r['p']: r['u'] for r in old['rows'] if r['u'] is not None}

REG = {'OES': 'Oeste', 'NOR': 'Norte', 'SUL': 'Sul', 'LES': 'Leste', 'ABC': 'ABC',
       'OESTE': 'Oeste', 'NORTE': 'Norte', 'LESTE': 'Leste'}

def hora(v):
    if isinstance(v, datetime.datetime): return v.strftime('%H:%M')
    if isinstance(v, datetime.time): return v.strftime('%H:%M')
    return str(v or '')[:5]

def data(v):
    if isinstance(v, datetime.datetime): return v.strftime('%Y-%m-%d')
    t = str(v or '').strip()
    m = re.match(r'(\d{2})/(\d{2})/(\d{4})', t)
    return f'{m[3]}-{m[2]}-{m[1]}' if m else t[:10]

wb = openpyxl.load_workbook(src, read_only=True, data_only=True)
ws = wb.worksheets[0]
it = ws.iter_rows(values_only=True)
cab = [str(c).strip() if c else '' for c in next(it)]
ix = {c: i for i, c in enumerate(cab)}
rows = []
for r in it:
    if not r or not r[ix['Projeto']]: continue
    g = lambda c: r[ix[c]] if c in ix else None
    p = str(g('Projeto')).strip()
    q = [x.strip() for x in re.split(r'[;,]', str(g('Equipamentos') or '')) if x.strip()]
    rgraw = str(g('Regiao') or '').strip()
    rg = REG.get(rgraw.upper())
    rs = 'Cadastro'
    if not rg:
        m = re.search(r'\.([A-Z]{3})\.', p)
        rg = REG.get(m.group(1), rgraw) if m else rgraw
        rs = 'Código do projeto'
    eq = [localizar(c) for c in q]
    loc = next(([e[1], e[2], e[3], e[4], e[0]] for e in eq if e[1] is not None), None)
    u = g('UPS Orçada')
    u = float(u) if isinstance(u, (int, float)) else upsAnt.get(p)
    chi = g('CHI'); chi = float(chi) if isinstance(chi, (int, float)) else 0.0
    rows.append({'p': p, 'd': str(g('Descrição do Projeto') or ''), 'u': u, 'dt': data(g('Data Programacao')),
                 's': str(g('Status Programacao') or ''), 't': str(g('Tipo Intervencao') or ''),
                 'pw': str(g('Numero PowerON') or ''), 'q': q, 'rg': rg, 'rs': rs, 'chi': chi,
                 'hi': hora(g('Horario Inicio')), 'hf': hora(g('Horario Fim')),
                 'c': str(g('Contratada') or ''), 'eq': eq, 'loc': loc})

obj = {'geradoEm': gerado, 'fonteSigeo': f'Programação Sigeo {gerado}',
       'fonteBuscape': 'Base Buscapé de 12/06/2026 (258.855 equipamentos)', 'rows': rows}
with open(out, 'w', encoding='utf-8') as f:
    f.write('window.SIGEO_DATA=' + json.dumps(obj, ensure_ascii=False, separators=(',', ':')) + ';')
print('linhas', len(rows))
