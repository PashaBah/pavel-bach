# Раскладки фокуса «Ваш ход» (3 варианта, 28.11.2026). Принцип — как в AGT (мячи → слоны → ангелы → красное):
# взглядом S (любая) → ближайшая B → ближайшая C → ближайшая D = загаданная вещь T.
# Просьба Павла: загаданная вещь не уникальна — на столе есть такие же в других цветах И ровно такая же (двойник T2)
# в дальнем углу, куда цепочка никак не доходит.
#   1) любые часы → кошелёк → кольцо → красная вещь = красные очки (есть чёрные, черепаховые и вторые красные)
#   2) любое кольцо → кошелёк → телефон → часы = Apple Watch (есть другие часы и вторые такие же Apple Watch)
#   3) любой кошелёк → часы → кольцо → телефон = белый телефон (есть чёрные, красный и второй белый)
# Доска 300×400 условных единиц. Печатает JS-массив VARIANTS для js/new/trick.js.
# Клетки карты media/trick_items.jpg (8×5): 0–7 часы (2 — Apple Watch, 5 — Rolex: не ставим), 8–15 кошельки, 16–21 кольца,
# 22 жемчужные серьги, 23 кольца-серьги, 24 помада, 25 красный телефон, 26 красные серьги, 27 красный галстук, 28 красные очки,
# 29 красный брелок, 30 красный паспорт (не ставим), 31 красные духи, 32 чёрный телефон, 33 белый телефон, 34 ключи,
# 35 чёрные очки, 36 черепаховые очки, 37 прозрачные духи, 38 наушники, 39 чёрная карта (логотип банка: не ставим).
import json, math, random, sys

W, H = 300, 400
MARGIN = 0.72        # нужная вещь должна быть заметно ближе: ≤ 0.72 расстояния до любой другой того же вида
MIN_D = 37           # минимальное расстояние между центрами вещей
d = lambda a, b: math.hypot(a[0] - b[0], a[1] - b[1])

def poisson(rnd, n_try=6000):
    pts = []
    for _ in range(n_try):
        p = (rnd.uniform(18, W - 18), rnd.uniform(20, H - 20))
        if all(d(p, q) >= MIN_D for q in pts):
            pts.append(p)
    return pts

def cells(pts, cols=3, rows=4):
    return len({(min(cols - 1, int(p[0] / (W / cols))), min(rows - 1, int(p[1] / (H / rows)))) for p in pts})

def attempt(rnd, nD):
    P = poisson(rnd)
    if len(P) < 48: return None
    rnd.shuffle(P)
    free = list(P)
    take = lambda p: free.remove(p)
    mids = [p for p in free if 80 < p[0] < 220 and 150 < p[1] < 290]
    if not mids: return None
    T = rnd.choice(mids); take(T)
    # воронка: три вещи вида C вокруг T в разные стороны
    F = []
    for p in sorted([p for p in free if 44 < d(p, T) < 80], key=lambda _: rnd.random()):
        ang = math.atan2(p[1] - T[1], p[0] - T[0])
        if all(abs((ang - math.atan2(q[1] - T[1], q[0] - T[0]) + math.pi) % (2 * math.pi) - math.pi) > 1.6 for q in F):
            F.append(p)
        if len(F) == 3: break
    if len(F) < 3: return None
    for p in F: take(p)
    okD = lambda p: all(d(f, T) <= MARGIN * d(f, p) for f in F)
    # двойник T2: такой же предмет как можно дальше от T и от воронки (в углу)
    cand = [p for p in free if okD(p) and d(p, T) > 190]
    if not cand: return None
    T2 = max(cand, key=lambda p: min([d(p, T)] + [d(p, f) for f in F]))
    take(T2)
    # прочие вещи вида D: подальше от воронки, по всему столу
    Ds = []
    for p in sorted(free, key=lambda _: rnd.random()):
        if okD(p) and all(d(p, q) > 66 for q in Ds + [T2]):
            Ds.append(p)
        if len(Ds) == nD: break
    if len(Ds) < nD: return None
    for p in Ds: take(p)
    # B: широкой полосой вокруг воронки, не рядом друг с другом
    Bs = []
    for p in sorted(free, key=lambda _: rnd.random()):
        near = min(d(p, f) for f in F)
        if 40 < near < 105 and all(d(p, q) > 62 for q in Bs):
            Bs.append(p)
        if len(Bs) == 6: break
    if len(Bs) < 6: return None
    for p in Bs: take(p)
    # прочие C: так, чтобы от каждой B ближайшая C была из воронки
    Cs = []
    for p in sorted(free, key=lambda _: rnd.random()):
        if all(min(d(b, f) for f in F) <= MARGIN * d(b, p) for b in Bs) and all(d(p, q) > 70 for q in Cs):
            Cs.append(p)
        if len(Cs) == 6: break
    if len(Cs) < 5: return None
    for p in Cs: take(p)
    # S: по всему столу
    Ss = []
    for p in sorted(free, key=lambda _: rnd.random()):
        if all(d(p, q) > 58 for q in Ss):
            Ss.append(p)
        if len(Ss) == 12: break
    if len(Ss) < 11: return None
    for p in Ss: take(p)
    if cells(Ss) < 11 or cells(Ds + [T, T2]) < 7 or cells(Cs + F) < 7: return None
    w1 = max(min(d(b, f) for f in F) / min(d(b, c) for c in Cs) for b in Bs)
    w2 = max(d(f, T) / min(d(f, q) for q in Ds + [T2]) for f in F)
    allC = F + Cs; allD = [T, T2] + Ds
    for s in Ss:  # проверка всей цепочки из любой стартовой вещи
        b = min(Bs, key=lambda q: d(s, q)); c = min(allC, key=lambda q: d(b, q)); e = min(allD, key=lambda q: d(c, q))
        if e != T: return None
    cx = sum(p[0] for p in Bs) / 6; cy = sum(p[1] for p in Bs) / 6
    spread = sum(d(p, (cx, cy)) for p in Bs) / 6
    return dict(T=T, T2=T2, F=F, Ds=Ds, Bs=Bs, Cs=Cs, Ss=Ss, other=free, worst=max(w1, w2), spread=spread)

def solve(tries, nD, seed0):
    best = None
    for seed in range(seed0, seed0 + tries):
        r = attempt(random.Random(seed), nD)
        if not r: continue
        score = r['worst'] - r['spread'] / 400
        if best is None or score < best[0]:
            best = (score, seed, r)
    return best

# 23 (серьги-кольца) не ставим: их можно принять за кольцо
VARIANTS = [
    dict(key='glasses', S='w', B='l', C='r', D='x', T=28, Dcells=[24, 25, 26, 27, 29, 31], Dk='x',
         other=[22, 32, 33, 34, 35, 36, 37, 38, 35, 36, 32, 33, 34, 37, 38]),
    dict(key='awatch', S='r', B='l', C='p', D='w', T=2, Dcells=[0, 1, 3, 4, 6, 7], Dk='w',
         other=[22, 24, 26, 27, 28, 29, 31, 34, 35, 36, 37, 38, 28, 35, 22]),
    dict(key='wphone', S='l', B='w', C='r', D='p', T=33, Dcells=[32, 25, 32, 25, 32, 25], Dk='p',
         other=[22, 24, 26, 27, 28, 29, 31, 34, 35, 36, 37, 38, 28, 37, 22]),
]
SCALE = {'w': 1.0, 'l': 1.1, 'r': 0.8, 'x': 1.0, 'p': 0.95, 'o': 0.95}
CELLS = {'w': [0, 1, 2, 3, 4, 6, 7], 'l': [8, 9, 10, 11, 12, 13, 14, 15], 'r': [16, 17, 18, 19, 20, 21], 'p': [32, 25, 33], 'x': [24, 25, 26, 27, 29, 31]}

out = []
for vi, V in enumerate(VARIANTS):
    best = solve(4000, len(V['Dcells']), 1 + vi * 10000)
    if not best: sys.exit(f'нет решения для {V["key"]}')
    score, seed, L = best
    rnd = random.Random(seed * 7 + 1)
    items = []
    def add(p, cls, cell, kind):
        s = SCALE[kind] * rnd.uniform(0.92, 1.08)
        items.append([round(p[0], 1), round(p[1], 1), round(rnd.uniform(-28, 28)), round(s, 2), cls, cell])
    dk = V['Dk']
    add(L['T'], 't', V['T'], dk)
    add(L['T2'], dk, V['T'], dk)                       # двойник — такой же предмет
    for i, p in enumerate(L['Ds']): add(p, dk, V['Dcells'][i % len(V['Dcells'])], dk)
    # в варианте с Apple Watch стартовые кольца и т. д. — обычные клетки своего вида; часы в «прочих» не ставим
    def cyc(kind, i):
        cs = [c for c in CELLS[kind] if c != V['T']] if kind == dk else CELLS[kind]
        return cs[i % len(cs)]
    for i, p in enumerate(L['F'] + L['Cs']): add(p, V['C'], cyc(V['C'], i), V['C'])
    for i, p in enumerate(L['Bs']): add(p, V['B'], cyc(V['B'], i * 3), V['B'])
    for i, p in enumerate(L['Ss']): add(p, V['S'], cyc(V['S'], i), V['S'])
    for i, p in enumerate(L['other']): add(p, 'o', V['other'][i % len(V['other'])], 'o')
    print(f'{V["key"]}: seed {seed} worst {L["worst"]:.3f} spread {L["spread"]:.0f} items {len(items)} T2 {L["T2"]}', file=sys.stderr)
    out.append(dict(key=V['key'], items=items))
print('const VARIANTS = [')
for v in out:
    rows = [json.dumps(it, ensure_ascii=False).replace('"', "'").replace(',', ', ') for it in v['items']]
    print(f"  {{ key: '{v['key']}', items: [")
    for i in range(0, len(rows), 4):
        print('    ' + ', '.join(rows[i:i + 4]) + ',')
    print('  ] },')
print('];')
