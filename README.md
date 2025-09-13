# Rebrand Hunter (Local Trades Edition)

Encuentra webs malas y véndeles un rebranding con datos, no con promesas.

## Qué hace
- Lee `leads.csv` (name,city,url,phone opcionales).
- Audita cada web: CTA de llamada, WhatsApp, sticky CTA en móvil, HTTPS, SEO básico, responsive, performance (Lighthouse).
- Saca **screenshots** (móvil + desktop), un **informe JSON** por lead y un **summary.csv** con el **Rebrand Score (0-100)**.
- Marca lo _caliente_ ≥ 70 para ir a cerrar.

## Requisitos
- Node.js 20+
- Chrome o Chromium (Lighthouse lo lanzará solo con `chrome-launcher`).
- Permisos para instalar paquetes.

## Instalación
```bash
npm install
```

## Uso
1) Crea un `leads.csv` con columnas:
```
name,city,url,phone
Electricista Pepe,Barcelona,https://electropepe.es,+34 6XX XXX XXX
Fontanero Lola,Madrid,http://fontalola.com,
```
2) Ejecuta:
```bash
node index.js --input leads.csv --limit 50 --concurrency 3
```
Parámetros:
- `--input` ruta al CSV (por defecto `leads.csv`).
- `--limit` máximo de registros a procesar (opcional).
- `--concurrency` paralelismo para Playwright/Lighthouse (por defecto 2).

3) Mira resultados en `/out`:
- `summary.csv`: tabla con puntuaciones y motivos.
- Carpeta por dominio: `out/<dominio>/mobile.png`, `desktop.png`, `report.json`.

## Interpretación rápida
- **Rebrand Score ≥ 70**: CALIENTE. Rebranding completo (nuevo hero, CTA sticky llamada + WhatsApp, performance <2.5 s, páginas por barrio).
- **55–69**: templado. Mini-rebrand + performance sprint.
- **≤54**: frío. Nurture o starter barato.

## Notas
- Esta herramienta no hace scraping de SERPs. Tú aportas la lista de webs (desde mapas o directorios). Así evitas líos y te enfocas en cerrar.

## Seguridad y ética
- Respeta robots.txt y leyes locales.
- No envíes spam. Contacta con sentido y aporta valor claro.

— Hecho para cerrar ventas, no para escribir poetry.


## Implantación 100% automática con GitHub Actions (sin tocar tu PC)
1) Crea un repo nuevo y sube todo el contenido de esta carpeta.
2) Sube/edita `leads.csv` en el repo.
3) Ve a la pestaña **Actions** y ejecuta el workflow **Audit & Publish** (botón "Run workflow").
4) Al terminar:
   - Descarga el artefacto **out** con capturas y CSV, o
   - Visita **GitHub Pages** del repo (el workflow publica `out/` en gh-pages).

Puedes programar la ejecución diaria: ya viene una regla `cron` a las 02:20 UTC.
