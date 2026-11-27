# Раскладка для фокуса «через экран»: любая пика → ближайший король → ближайшая дама → ближайшая красная = одна и та же карта.
# Доска 300×400 условных единиц (вертикальная), карта 34×48. Сетка 6×7 ячеек с дрожанием, часть ячеек пустая.
import json, math, random, sys

W, H = 300, 400
COLS, ROWS = 6, 7
CW, CH = W / COLS, H / ROWS
MARGIN = 0.72  # «ближайшая» должна быть явно ближе: расстояние до нужной ≤ 0.72 × до любой другой того же вида
JX, JY, RR = 11, 9, 17  # дрожание по сетке и наклон карт: чтобы стол не выглядел расчерченным

def centre(c, r, jx, jy):
    return (CW * (c + 0.5) + jx, CH * (r + 0.5) + jy)

def d(a, b):
    return math.hypot(a[0] - b[0], a[1] - b[1])

def nearest(p, pts):
    return min(pts, key=lambda q: d(p, q))

def check(K, Q3, T, Qo, Ro):
    Q = Q3 + Qo
    R = [T] + Ro
    worst = 0
    for k in K:
        best_in = min(d(k, q) for q in Q3)
        best_out = min((d(k, q) for q in Qo), default=1e9)
        if best_in > MARGIN * best_out: return None
        # не должно быть почти равных дам внутри Q3? не важно — любая из Q3 ведёт к T
        worst = max(worst, best_in / best_out)
    for q in Q3:
        dt = d(q, T)
        do = min((d(q, r) for r in Ro), default=1e9)
        if dt > MARGIN * do: return None
        worst = max(worst, dt / do)
    return worst

def solve(seed):
    rnd = random.Random(seed)
    cells = [(c, r) for c in range(COLS) for r in range(ROWS)]
    jit = {cell: (rnd.uniform(-JX, JX), rnd.uniform(-JY, JY)) for cell in cells}
    P = {cell: centre(*cell, *jit[cell]) for cell in cells}
    # короли — в одной части доски (левый низ, 3×3 ячейки), но не плотной кучкой
    region = [(c, r) for c in range(0, 3) for r in range(4, 7)]
    for _ in range(20000):
        kc = rnd.sample(region, 4)
        # хотя бы двое не соседи: разносим
        if max(abs(a[0] - b[0]) + abs(a[1] - b[1]) for a in kc for b in kc) < 3: continue
        rest = [c for c in cells if c not in kc]
        q3 = rnd.sample([c for c in rest if min(abs(c[0] - k[0]) + abs(c[1] - k[1]) for k in kc) <= 1], 3) if len([c for c in rest if min(abs(c[0] - k[0]) + abs(c[1] - k[1]) for k in kc) <= 1]) >= 3 else None
        if not q3: continue
        rest2 = [c for c in rest if c not in q3]
        near_t = [c for c in rest2 if max(abs(c[0] - q[0]) + abs(c[1] - q[1]) for q in q3) <= 3 and min(abs(c[0] - q[0]) + abs(c[1] - q[1]) for q in q3) >= 1]
        if not near_t: continue
        t = rnd.choice(near_t)
        rest3 = [c for c in rest2 if c != t]
        far = [c for c in rest3 if min(abs(c[0] - k[0]) + abs(c[1] - k[1]) for k in kc + q3 + [t]) >= 2]
        if len(far) < 8: continue
        qo = rnd.sample(far, 3)
        far2 = [c for c in far if c not in qo]
        ro = rnd.sample(far2, 5)
        K = [P[c] for c in kc]; Q3 = [P[c] for c in q3]; T = P[t]; Qo = [P[c] for c in qo]; Ro = [P[c] for c in ro]
        w = check(K, Q3, T, Qo, Ro)
        if w is None or w > 0.66: continue
        used = set(kc + q3 + [t] + qo + ro)
        free = [c for c in cells if c not in used]
        rnd.shuffle(free)
        n_black = 34 - len(used)          # всего 34 карты, остальные ячейки пустые
        black = free[:n_black]
        spades = black[:12]; clubs = black[12:]
        # пики должны быть по всей доске (первый шаг — свободный выбор)
        rows_with_spades = {c[1] for c in spades}; cols_with_spades = {c[0] for c in spades}
        if len(rows_with_spades) < 6 or len(cols_with_spades) < 5: continue
        return dict(seed=seed, worst=w, P=P, kc=kc, q3=q3, t=t, qo=qo, ro=ro, spades=spades, clubs=clubs, rnd=rnd)
    return None

best = None
for s in range(1, 400):
    r = solve(s)
    if r and (best is None or r['worst'] < best['worst']):
        best = r
    if best and best['worst'] < 0.55: break
if not best:
    sys.exit('нет решения')

rnd = best['rnd']
P = best['P']
cards = []
def add(cell, rank, suit, role):
    x, y = P[cell]
    cards.append(dict(x=round(x, 1), y=round(y, 1), r=round(rnd.uniform(-RR, RR), 1), rank=rank, suit=suit, role=role))
for c in best['kc']: add(c, 'K', rnd.choice('sc'), 'king')
for c in best['q3']: add(c, 'Q', rnd.choice('sc'), 'queen')
add(best['t'], '7', 'h', 'target')
for c in best['qo']: add(c, 'Q', rnd.choice('sc'), 'queen')
reds = ['3h', '5d', '9d', '4h', '8d', '10h', '2d']
rnd.shuffle(reds)
for c, rs in zip(best['ro'], reds): add(c, rs[:-1], rs[-1], 'red')
nums = ['2', '3', '4', '5', '6', '8', '9', '10', 'A']
for c in best['spades']: add(c, rnd.choice(nums), 's', 'spade')
for c in best['clubs']: add(c, rnd.choice(nums), 'c', 'club')

# итоговая проверка по готовым координатам: из любой пики путь приходит в 7♥
pt = lambda c: (c['x'], c['y'])
K = [c for c in cards if c['rank'] == 'K']; Qs = [c for c in cards if c['rank'] == 'Q']; R = [c for c in cards if c['suit'] in 'hd']
ends = set()
for s in [c for c in cards if c['suit'] == 's' and c['rank'] not in 'KQ']:
    k = nearest(pt(s), [pt(c) for c in K])
    q = nearest(k, [pt(c) for c in Qs])
    r = nearest(q, [pt(c) for c in R])
    ends.add(r)
target = [pt(c) for c in cards if c['role'] == 'target'][0]
print('seed', best['seed'], 'worst ratio', round(best['worst'], 3), 'ends', ends, 'target', target, file=sys.stderr)
assert ends == {target}
# стоп-проверка на подвох: дамы и короли только чёрные, красные — только числа
assert all(c['suit'] in 'sc' for c in K + Qs)
json.dump(cards, sys.stdout, ensure_ascii=False)
