import os
import glob

# 1. Fix sidebar in pacientes/index.html
p = 'static/admin/pacientes/index.html'
with open(p, 'r', encoding='utf-8') as f:
    h = f.read()

old_s = '<button class="nav-item active"><i data-lucide="users"></i><span class="nav-label"> Pacientes</span></button>\n        <p class="nav-title" style="margin-top: 14px;">Sistema</p>'
new_s = '<button class="nav-item active"><i data-lucide="users"></i><span class="nav-label"> Pacientes</span></button>\n        <button class="nav-item" onclick="window.location.href=\'../triagens/index.html\'"><i data-lucide="clipboard-list"></i><span class="nav-label"> Triagens</span></button>\n        <p class="nav-title" style="margin-top: 14px;">Sistema</p>'

if '<span class="nav-label"> Triagens</span>' not in h:
    h = h.replace(old_s, new_s)
    with open(p, 'w', encoding='utf-8') as f:
        f.write(h)
    print("Fixed pacientes sidebar")

# 2. Fix Triagens script.js
path_t = 'static/admin/triagens/script.js'
with open(path_t, 'r', encoding='utf-8') as f:
    js = f.read()

if 'lucide.createIcons();' in js and 'document.addEventListener("DOMContentLoaded"' in js:
    # Let's bring lucide.createIcons() outside init to ensure it runs immediately
    js = js.replace('lucide.createIcons();', '')
    js = 'lucide.createIcons();\n' + js
    with open(path_t, 'w', encoding='utf-8') as f:
        f.write(js)
    print("Fixed lucide in triagens")

# Fix undefined nome_completo bug
js = js.replace('pac.nome_completo', 'pac.nome')
with open(path_t, 'w', encoding='utf-8') as f:
    f.write(js)

# 3. Fix export modal responsive
css_addon = '''
@media (max-width: 768px) {
  #modalExportOverlay > div, .modal-overlay > div { width: 100% !important; max-width: 100% !important; margin: 10px !important; max-height: 90vh; overflow-y: auto; }
  .export-format-card { flex-direction: column !important; align-items: flex-start !important; gap: 8px !important; }
  .export-live-preview { font-size: 10px !important; padding: 10px !important; }
}
'''

for css_file in glob.glob('static/admin/*/style.css'):
    with open(css_file, 'r', encoding='utf-8') as f:
        css = f.read()
    if '#modalExportOverlay > div' not in css:
        css += css_addon
        with open(css_file, 'w', encoding='utf-8') as f:
            f.write(css)

print("Fixed export modal CSS")
