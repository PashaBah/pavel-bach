# Раскладка фокуса «Ваш ход» с вещами (по принципу AGT: мячи → слоны → ангелы → красное).
# Взглядом: любые часы → ближайший кошелёк → ближайшее кольцо → ближайшая красная вещь = красная помада.
# Чтобы секрет не читался: стол плотный (≈50 вещей), часы, кольца и красные вещи — по всему столу,
# кошельки — широкой полосой по середине (не кучкой), между ними много посторонних вещей.
# Доска 300×400 условных единиц. Печатает JSON: [{x, y, r, s, kind, sprite}], s — масштаб.
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

def spread_ok(pts, cols=3, rows=4):
    # хотя бы по одной вещи вида в большинстве клеток грубой сетки
    cells = {(min(cols - 1, int(p[0] / (W / cols))), min(rows - 1, int(p[1] / (H / rows)))) for p in pts}
    return len(cells)

def attempt(rnd):
    P = poisson(rnd)
    if len(P) < 48: return None
    rnd.shuffle(P)
    free = list(P)
    take = lambda p: free.remove(p)
    # помада — в средней части стола
    mids = [p for p in free if 80 < p[0] < 220 and 150 < p[1] < 290]
    if not mids: return None
    T = rnd.choice(mids); take(T)
    # три «кольца-воронки» вокруг помады, в разные стороны
    ring_c = [p for p in free if 44 < d(p, T) < 80]
    R3 = []
    for p in sorted(ring_c, key=lambda _: rnd.random()):
        ang = math.atan2(p[1] - T[1], p[0] - T[0])
        if all(abs((ang - math.atan2(q[1] - T[1], q[0] - T[0]) + math.pi) % (2 * math.pi) - math.pi) > 1.6 for q in R3):
            R3.append(p)
        if len(R3) == 3: break
    if len(R3) < 3: return None
    for p in R3: take(p)
    # прочие красные вещи: подальше от воронки, по всему столу
    reds = []
    for p in sorted(free, key=lambda _: rnd.random()):
        if all(d(r, T) <= MARGIN * d(r, p) for r in R3) and all(d(p, q) > 70 for q in reds):
            reds.append(p)
        if len(reds) == 7: break
    if len(reds) < 7: return None
    for p in reds: take(p)
    # кошельки: широкой полосой вокруг воронки, не рядом друг с другом
    wal = []
    for p in sorted(free, key=lambda _: rnd.random()):
        near = min(d(p, r) for r in R3)
        if 40 < near < 105 and all(d(p, q) > 62 for q in wal):
            wal.append(p)
        if len(wal) == 6: break
    if len(wal) < 6: return None
    for p in wal: take(p)
    # прочие кольца: так, чтобы от каждого кошелька ближайшее кольцо было из воронки
    rings = []
    for p in sorted(free, key=lambda _: rnd.random()):
        if all(min(d(w, r) for r in R3) <= MARGIN * d(w, p) for w in wal) and all(d(p, q) > 70 for q in rings):
            rings.append(p)
        if len(rings) == 6: break
    if len(rings) < 5: return None
    for p in rings: take(p)
    # часы: по всему столу
    watches = []
    for p in sorted(free, key=lambda _: rnd.random()):
        if all(d(p, q) > 58 for q in watches):
            watches.append(p)
        if len(watches) == 12: break
    if len(watches) < 11: return None
    for p in watches: take(p)
    other = free
    if spread_ok(watches) < 11 or spread_ok(reds + [T]) < 7 or spread_ok(rings + R3) < 7: return None
    # худшее соотношение расстояний (чем меньше, тем надёжнее)
    w1 = max(min(d(w, r) for r in R3) / min(d(w, r) for r in rings) for w in wal)
    w2 = max(d(r, T) / min(d(r, q) for q in reds) for r in R3)
    # проверка всей цепочки из любых часов
    allrings = R3 + rings; allred = [T] + reds
    for s in watches:
        w = min(wal, key=lambda q: d(s, q)); r = min(allrings, key=lambda q: d(w, q)); e = min(allred, key=lambda q: d(r, q))
        if e != T: return None
    # кошельки не должны кучковаться: средний разброс
    cx = sum(p[0] for p in wal) / 6; cy = sum(p[1] for p in wal) / 6
    spread = sum(d(p, (cx, cy)) for p in wal) / 6
    return dict(T=T, R3=R3, reds=reds, wal=wal, rings=rings, watches=watches, other=other, worst=max(w1, w2), spread=spread)

best = None
for seed in range(1, 6000):
    r = attempt(random.Random(seed))
    if not r: continue
    score = r['worst'] - r['spread'] / 400
    if best is None or score < best[0]:
        best = (score, seed, r)
if not best: sys.exit('нет решения')
score, seed, L = best
rnd = random.Random(seed * 7 + 1)
WATCH = [f'w{i}' for i in range(8)]; WAL = [f'l{i}' for i in range(8)]; RING = [f'r{i}' for i in range(6)]
RED = ['red_phone', 'red_earrings', 'red_tie', 'red_glasses', 'red_keys', 'red_passport', 'red_perfume']
OTHER = ['e_pearl', 'e_hoops', 'phone_black', 'phone_white', 'keys', 'glasses_black', 'glasses_tortoise', 'perfume', 'earbuds', 'card']
items = []
def add(p, kind, sprite, s=1.0):
    items.append(dict(x=round(p[0], 1), y=round(p[1], 1), r=round(rnd.uniform(-28, 28)), s=round(s * rnd.uniform(0.92, 1.08), 2), kind=kind, sprite=sprite))
add(L['T'], 'target', 'lipstick')
for i, p in enumerate(L['watches']): add(p, 'watch', WATCH[i % len(WATCH)])
for i, p in enumerate(L['wal']): add(p, 'wallet', WAL[(i * 3) % len(WAL)])
for i, p in enumerate(L['R3'] + L['rings']): add(p, 'ring', RING[i % len(RING)], 0.8)
for i, p in enumerate(L['reds']): add(p, 'red', RED[i % len(RED)])
for i, p in enumerate(L['other']): add(p, 'other', OTHER[i % len(OTHER)])
print(f'seed {seed} worst {L["worst"]:.3f} wallet spread {L["spread"]:.0f} items {len(items)}', file=sys.stderr)
json.dump(items, sys.stdout, ensure_ascii=False)
