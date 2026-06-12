import glob, os
p = 'static/admin/dashboard/script.js'
with open(p, 'r', encoding='utf-8') as f: t = f.read()
t = t.replace('bar: "#BFDBFE" }', 'bar: "#BFDBFE", link: "../convenios/index.html" }')
t = t.replace('bar: "#BAE6FD" }', 'bar: "#BAE6FD", link: "../medicos/index.html" }')
t = t.replace('bar: "#DDD6FE" }', 'bar: "#DDD6FE", link: "../pacientes/index.html" }')
t = t.replace('bar: "#A7F3D0" }', 'bar: "#A7F3D0", link: "../triagens/index.html" }')
r_old = 'div.className = "kpi-card";'
r_new = 'div.className = "kpi-card";\n        div.style.cursor = "pointer";\n        div.style.transition = "border-color 0.2s, transform 0.2s";\n        div.setAttribute("onmouseover", "this.style.borderColor=\\'#94A3B8\\'; this.style.transform=\\'translateY(-2px)\\'");\n        div.setAttribute("onmouseout", "this.style.borderColor=\\'#E8EEF6\\'; this.style.transform=\\'none\\'");\n        if (kpi.link) div.onclick = function() { window.location.href = kpi.link; };'
t = t.replace(r_old, r_new)
with open(p, 'w', encoding='utf-8') as f: f.write(t)
o_n = '<button class="nav-item" onclick="window.location.href=\\'../pacientes/index.html\\'\\"'
n_n = '<button class="nav-item" onclick="window.location.href=\\'../triagens/index.html\\'\\"'
for fp in glob.glob('static/admin/*/index.html'):
    if 'triagens' in fp: continue
    with open(fp, 'r', encoding='utf-8') as f: h = f.read()
    if 'Triagens</span></button>' not in h:
        p_o = o_n + '><i data-lucide="users"></i><span class="nav-label"> Pacientes</span></button>'
        p_n = p_o + '\n        ' + n_n + '><i data-lucide="clipboard-list"></i><span class="nav-label"> Triagens</span></button>'
        h = h.replace(p_o, p_n)
        with open(fp, 'w', encoding='utf-8') as f: f.write(h)
print('Done')
