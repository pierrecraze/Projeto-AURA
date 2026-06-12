path_t = 'static/admin/triagens/script.js'
with open(path_t, 'r', encoding='utf-8') as f:
    js = f.read()

js = js.replace('lucide.createIcons();\n', '')
js = js.replace('lucide.createIcons();', '')

new_evt = '''document.addEventListener("DOMContentLoaded", () => {
    if (typeof lucide !== 'undefined') lucide.createIcons();
    init();
});'''

js = js.replace('document.addEventListener("DOMContentLoaded", init);', new_evt)

with open(path_t, 'w', encoding='utf-8') as f:
    f.write(js)
