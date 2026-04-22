/**
 * Seed initial dropdown options into the product_options table.
 * Run once: node scripts/seed-product-options.mjs
 */
import postgres from 'postgres';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { config } from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

function toKebab(str) {
  return str.trim().toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

const seeds = [
  // ── Fabric Widths ──────────────────────────────────────────
  ...['100cm','120cm','140cm','150cm','160cm','180cm','200cm','240cm','260cm','280cm','300cm']
    .map(label => ({ type: 'fabric-widths', label, value: toKebab(label) })),

  // ── Thickness ─────────────────────────────────────────────
  ...['0.35mm','0.45mm','0.54mm','0.60mm','0.80mm','1.00mm','1.20mm']
    .map(label => ({ type: 'thickness', label, value: toKebab(label) })),

  // ── Characteristics ───────────────────────────────────────
  ...['Woodlook','Fireproof','Waterproof','Blackout','Semi-Blackout','Sunscreen','Anti-UV','Translucent']
    .map(label => ({ type: 'characteristics', label, value: toKebab(label) })),
];

try {
  console.log(`▶ Seeding ${seeds.length} product options...`);

  for (const row of seeds) {
    await sql`
      INSERT INTO product_options (type, label, value)
      VALUES (${row.type}, ${row.label}, ${row.value})
      ON CONFLICT DO NOTHING
    `;
  }

  console.log('✅ Seed complete.');
} catch (err) {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
} finally {
  await sql.end();
}
