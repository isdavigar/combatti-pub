#!/usr/bin/env node
/**
 * Importa los datos maestros del POS anterior (export de localStorage) a la
 * nueva plataforma, usando sus APIs REST a través del gateway.
 *
 * Importa: categorías, productos, mesas y los datos del negocio (marca →
 * configuración). NO importa históricos de ventas/caja ni usuarios.
 *
 * Uso:
 *   node import-legacy.mjs --file combatti-export.json \
 *     --gateway https://api.tu-dominio.com --user admin --password <clave>
 *
 * Opciones:
 *   --dry-run   No escribe nada; solo muestra lo que haría.
 *
 * Requisitos: Node 18+ (usa fetch global). Sin dependencias externas.
 */

import { readFile } from 'node:fs/promises';

// ---------- Parseo de argumentos ----------
function parseArgs(argv) {
  const args = { dryRun: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') args.dryRun = true;
    else if (a === '--file') args.file = argv[++i];
    else if (a === '--gateway') args.gateway = argv[++i];
    else if (a === '--user') args.user = argv[++i];
    else if (a === '--password') args.password = argv[++i];
  }
  return args;
}

const args = parseArgs(process.argv);
if (!args.file || !args.gateway || !args.user || !args.password) {
  console.error('Uso: node import-legacy.mjs --file <json> --gateway <url> --user <u> --password <p> [--dry-run]');
  process.exit(1);
}

const GATEWAY = args.gateway.replace(/\/+$/, '');
let token = '';

// ---------- Helpers HTTP ----------
async function api(method, path, body) {
  const res = await fetch(`${GATEWAY}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body != null ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const msg = (data && (data.error || data.message)) || text || res.statusText;
    const err = new Error(`${method} ${path} -> ${res.status}: ${msg}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

function num(v, def = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

function categoryName(c) {
  if (typeof c === 'string') return c.trim();
  if (c && typeof c === 'object') return String(c.name || '').trim();
  return '';
}

// ---------- Importadores ----------
async function login() {
  const res = await api('POST', '/api/auth/login', { username: args.user, password: args.password });
  token = res.token;
  console.log(`✓ Autenticado como ${args.user}`);
}

async function importCategories(data, report) {
  const nameToId = new Map();

  // Mapea las categorías ya existentes en el destino (evita duplicados).
  const existing = await api('GET', '/api/catalog/categories');
  for (const c of existing || []) nameToId.set(c.name, c.id);

  // Nombres del export: array combatti_categories + categorías referenciadas por productos.
  const names = new Set();
  for (const c of data.combatti_categories || []) {
    const n = categoryName(c);
    if (n) names.add(n);
  }
  for (const p of data.combatti_products || []) {
    const n = categoryName(p.category);
    if (n) names.add(n);
  }

  let order = 1;
  for (const name of names) {
    if (nameToId.has(name)) { report.categories.skipped++; order++; continue; }
    if (args.dryRun) {
      console.log(`  [dry-run] crear categoría "${name}"`);
      nameToId.set(name, -1);
      report.categories.created++;
      order++;
      continue;
    }
    try {
      const created = await api('POST', '/api/catalog/categories', { name, displayOrder: order, active: true });
      nameToId.set(name, created.id);
      report.categories.created++;
    } catch (e) {
      report.categories.errors.push(`${name}: ${e.message}`);
    }
    order++;
  }
  return nameToId;
}

async function importProducts(data, nameToId, report) {
  // Productos ya existentes por nombre (evita duplicar).
  const existing = await api('GET', '/api/catalog/products');
  const existingNames = new Set((existing || []).map((p) => p.name));

  for (const p of data.combatti_products || []) {
    const name = String(p.name || '').trim();
    if (!name) { report.products.errors.push('producto sin nombre'); continue; }
    if (existingNames.has(name)) { report.products.skipped++; continue; }

    const catName = categoryName(p.category);
    const categoryId = nameToId.get(catName);
    if (!categoryId || categoryId === -1) {
      if (args.dryRun) { console.log(`  [dry-run] crear producto "${name}" (cat "${catName}")`); report.products.created++; continue; }
      report.products.errors.push(`${name}: categoría "${catName}" no encontrada`);
      continue;
    }
    const body = {
      name,
      description: p.description || null,
      price: num(p.price, 0),
      stockManaged: !!p.stockManaged,
      minStock: p.minStock != null ? num(p.minStock) : null,
      active: p.active !== false,
      categoryId,
    };
    if (args.dryRun) { console.log(`  [dry-run] crear producto "${name}" ($${body.price})`); report.products.created++; continue; }
    try {
      await api('POST', '/api/catalog/products', body);
      report.products.created++;
    } catch (e) {
      report.products.errors.push(`${name}: ${e.message}`);
    }
  }
}

async function importTables(data, report) {
  const existing = await api('GET', '/api/orders/tables');
  const existingNames = new Set((existing || []).map((t) => t.name));

  for (const t of data.combatti_tables || []) {
    const name = String(t.name || '').trim();
    if (!name) { report.tables.errors.push('mesa sin nombre'); continue; }
    if (existingNames.has(name)) { report.tables.skipped++; continue; }

    const body = {
      name,
      kind: t.kind || 'Mesa',
      icon: t.icon || null,
      posX: t.x != null ? num(t.x) : null,
      posY: t.y != null ? num(t.y) : null,
      size: t.size != null ? num(t.size) : null,
      active: true,
    };
    if (args.dryRun) { console.log(`  [dry-run] crear mesa "${name}"`); report.tables.created++; continue; }
    try {
      await api('POST', '/api/orders/tables', body);
      report.tables.created++;
    } catch (e) {
      report.tables.errors.push(`${name}: ${e.message}`);
    }
  }
}

async function importBrand(data, report) {
  const brand = data.combatti_brand;
  if (!brand || typeof brand !== 'object') { report.settings = 'sin marca en el export'; return; }

  const body = {
    restaurantName: brand.name || brand.logo || 'Combatti',
    taxId: brand.nit || null,
    address: brand.fiscalAddress || brand.info || null,
    phone: brand.fiscalPhone || null,
    email: brand.adminEmail || null,
    currency: 'COP',
    taxRatePercent: 0,
    serviceChargePercent: 0,
    tipSuggestedPercent: 10,
    receiptFooter: brand.info || null,
    printerTransport: 'noop',
    receiptPrinterHost: null,
    receiptPrinterPort: null,
    kitchenPrinterHost: null,
    kitchenPrinterPort: null,
  };
  if (args.dryRun) { console.log(`  [dry-run] PUT settings (negocio "${body.restaurantName}")`); report.settings = 'dry-run'; return; }
  try {
    await api('PUT', '/api/settings', body);
    report.settings = `actualizado ("${body.restaurantName}")`;
  } catch (e) {
    report.settings = `error: ${e.message}`;
  }
}

// ---------- Main ----------
async function main() {
  const raw = await readFile(args.file, 'utf8');
  const parsed = JSON.parse(raw);
  const data = parsed.data || parsed; // admite el export completo o solo "data"

  console.log(`Importando desde ${args.file} hacia ${GATEWAY}${args.dryRun ? ' (DRY RUN)' : ''}\n`);

  const report = {
    categories: { created: 0, skipped: 0, errors: [] },
    products: { created: 0, skipped: 0, errors: [] },
    tables: { created: 0, skipped: 0, errors: [] },
    settings: '—',
  };

  await login();

  console.log('→ Categorías…');
  const nameToId = await importCategories(data, report);
  console.log('→ Productos…');
  await importProducts(data, nameToId, report);
  console.log('→ Mesas…');
  await importTables(data, report);
  console.log('→ Datos del negocio…');
  await importBrand(data, report);

  console.log('\n===== RESUMEN =====');
  console.log(`Categorías: ${report.categories.created} creadas, ${report.categories.skipped} ya existían`);
  console.log(`Productos:  ${report.products.created} creados, ${report.products.skipped} ya existían`);
  console.log(`Mesas:      ${report.tables.created} creadas, ${report.tables.skipped} ya existían`);
  console.log(`Configuración: ${report.settings}`);

  const allErrors = [
    ...report.categories.errors.map((e) => `[categoría] ${e}`),
    ...report.products.errors.map((e) => `[producto] ${e}`),
    ...report.tables.errors.map((e) => `[mesa] ${e}`),
  ];
  if (allErrors.length) {
    console.log(`\n⚠ ${allErrors.length} incidencias:`);
    allErrors.forEach((e) => console.log('  - ' + e));
    process.exitCode = 2;
  } else {
    console.log('\n✓ Importación completada sin errores.');
  }
}

main().catch((e) => {
  console.error('\n✗ Falló la importación:', e.message);
  process.exit(1);
});
