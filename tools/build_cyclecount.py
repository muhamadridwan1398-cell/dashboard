#!/usr/bin/env python3
"""Bangun docs/cyclecount/index.html (aplikasi PWA Cycle Count) dari modul CYCLECOUNT DAILY
yang ada di docs/akurasi/index.html. Jalankan setiap kali modul itu berubah:  python3 tools/build_cyclecount.py"""
import re,pathlib
root=pathlib.Path(__file__).resolve().parent.parent
src=(root/'docs/akurasi/index.html').read_text(encoding='utf-8')
base=re.search(r'<style>(.*?)</style>',src,re.S).group(1)
kdstyle=re.search(r'<style id="kd-style">.*?</style>',src,re.S).group(0)
i=src.index('<script>(function(){\nvar $=function(i){return document.getElementById(i)};\nvar API=')
j=src.index('</script>',i)+9
kdscript=src[i:j]
panel=re.search(r'<section class="panel" id="kdPanel".*?</section>',src,re.S).group(0).replace('id="kdPanel" hidden','id="kdPanel"')
page=f'''<!doctype html>
<html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Cycle Count Q-BIG</title>
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://igkdetuufvcczmiluvqd.supabase.co; base-uri 'self'; form-action 'self'">
<link rel="manifest" href="manifest.webmanifest"><meta name="theme-color" content="#14284b">
<link rel="icon" type="image/png" href="icons/icon-192.png"><link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="Cycle Count"><meta name="apple-mobile-web-app-status-bar-style" content="default">
<style>{base}</style>
{kdstyle}
<style>.top{{margin-bottom:14px}}.wrap{{padding:14px;max-width:900px}}.top h1{{font-size:20px;margin:0}}.top .sub{{display:none}}</style>
</head><body><div class="wrap">
<button id="tabKD" type="button" hidden></button>
{panel}
</div>
<script>window.__KDAPP=1;window.switchPage=function(){{}};</script>
{kdscript}
<script>if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost'))window.addEventListener('load',function(){{navigator.serviceWorker.register('../sw.js',{{scope:'./'}}).catch(function(){{}})}});</script>
</body></html>
'''
(root/'docs/cyclecount/index.html').write_text(page,encoding='utf-8')
print('ok',len(page))
