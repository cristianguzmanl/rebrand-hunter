import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse';
import { createObjectCsvWriter as createCsvWriter } from 'csv-writer';
import pLimit from './lib/plimit.js';
import { auditOne } from './lib/audit.js';
import { scoreAll } from './lib/score.js';
import { ensureDir, domainFromUrl, readFileSafe, writeJson, bytesToMB } from './lib/util.js';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const argv = yargs(hideBin(process.argv))
  .option('input', { type: 'string', default: 'leads.csv' })
  .option('limit', { type: 'number', default: 0 })
  .option('concurrency', { type: 'number', default: 2 })
  .argv;

const OUT_DIR = path.join(__dirname, 'out');
await ensureDir(OUT_DIR);

function readLeads(csvPath){
  return new Promise((resolve, reject) => {
    const recs = [];
    fs.createReadStream(csvPath)
      .pipe(parse({ columns: true, skip_empty_lines: true, trim: true }))
      .on('data', r => recs.push(r))
      .on('end', () => resolve(recs))
      .on('error', reject);
  });
}

const leads = await readLeads(argv.input);
const sliced = argv.limit ? leads.slice(0, argv.limit) : leads;

const limit = pLimit(argv.concurrency);
const results = [];

console.log(`Procesando ${sliced.length} leads con concurrencia ${argv.concurrency}…`);

for (const lead of sliced){
  results.push(limit(async() => {
    const url = (lead.url || '').trim();
    if(!url){ return null; }
    const dom = domainFromUrl(url);
    const dir = path.join(OUT_DIR, dom);
    await ensureDir(dir);

    try {
      const res = await auditOne(url, dir);
      const scored = scoreAll(res);
      await writeJson(path.join(dir, 'report.json'), scored);
      return {
        name: lead.name || '',
        city: lead.city || '',
        phone: lead.phone || '',
        url,
        domain: dom,
        rebrand: scored.scores.rebrand,
        conversion: scored.scores.conversion,
        performance: scored.scores.performance,
        mobile: scored.scores.mobile,
        seo: scored.scores.seo,
        lcp_s: scored.findings.lcp_s,
        tbt_ms: scored.findings.tbt_ms,
        weight_mb: scored.findings.weight_mb,
        tel_above_fold: scored.findings.cta_tel_above_fold,
        whatsapp: scored.findings.whatsapp,
        sticky_cta: scored.findings.sticky_cta_mobile,
        https: scored.findings.https,
        zones_pages: scored.findings.zones_pages
      };
    } catch(e){
      console.error('Error en', url, e.message);
      return {
        name: lead.name || '',
        city: lead.city || '',
        phone: lead.phone || '',
        url,
        domain: dom,
        rebrand: -1
      };
    }
  }));
}

const done = (await Promise.all(results)).filter(Boolean);

// CSV resumen
const csvWriter = createCsvWriter({
  path: path.join(OUT_DIR, 'summary.csv'),
  header: [
    {id:'name', title:'name'},
    {id:'city', title:'city'},
    {id:'phone', title:'phone'},
    {id:'url', title:'url'},
    {id:'domain', title:'domain'},
    {id:'rebrand', title:'rebrand_score'},
    {id:'conversion', title:'conversion'},
    {id:'performance', title:'performance'},
    {id:'mobile', title:'mobile'},
    {id:'seo', title:'seo'},
    {id:'lcp_s', title:'lcp_s'},
    {id:'tbt_ms', title:'tbt_ms'},
    {id:'weight_mb', title:'weight_mb'},
    {id:'tel_above_fold', title:'tel_above_fold'},
    {id:'whatsapp', title:'whatsapp'},
    {id:'sticky_cta', title:'sticky_cta'},
    {id:'https', title:'https'},
    {id:'zones_pages', title:'zones_pages'}
  ]
});
await csvWriter.writeRecords(done);
console.log('Listo. Mira /out/summary.csv y carpetas por dominio.');
