export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  const delimiter = detectDelimiter(text);

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || (ch === "\r" && next === "\n")) {
      if (ch === "\r") i++;
      row.push(cell);
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      row = [];
      cell = "";
    } else if (ch !== "\r") {
      cell += ch;
    }
  }
  row.push(cell);
  if (row.some((value) => value.trim() !== "")) rows.push(row);
  return rows;
}

function detectDelimiter(text: string): "," | ";" | "\t" {
  const first = text.split(/\r?\n/).find((line) => line.trim()) || "";
  const counts = {
    ",": (first.match(/,/g) || []).length,
    ";": (first.match(/;/g) || []).length,
    "\t": (first.match(/\t/g) || []).length,
  };
  if (counts[";"] > counts[","] && counts[";"] >= counts["\t"]) return ";";
  if (counts["\t"] > counts[","] && counts["\t"] >= counts[";"]) return "\t";
  return ",";
}

export function normalizeHeader(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .replace(/[_\-]+/g, " ")
    .replace(/\s+/g, " ");
}

export function headerUnit(header: string): "lb" | "kg" | "mi" | "km" | undefined {
  const lower = header.toLowerCase();
  if (/\(kg\)|_kg\b|kilogram/.test(lower)) return "kg";
  if (/\(lbs?\)|_lb\b|pound/.test(lower)) return "lb";
  if (/\(km\)|_km\b|kilomet/.test(lower)) return "km";
  if (/\(mi\)|_mi\b|mile/.test(lower)) return "mi";
  return undefined;
}

export function parseNumber(value: string | undefined): number | undefined {
  if (value == null) return undefined;
  const cleaned = String(value).replace(/[^\d.+-]/g, "");
  if (!cleaned) return undefined;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : undefined;
}

export function parseDateCell(value: string): string | null {
  const raw = value.trim();
  if (!raw) return null;
  const iso = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  if (iso) return iso[1];
  const mdy = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (mdy) {
    const month = mdy[1].padStart(2, "0");
    const day = mdy[2].padStart(2, "0");
    let year = mdy[3];
    if (year.length === 2) year = Number(year) > 50 ? `19${year}` : `20${year}`;
    return `${year}-${month}-${day}`;
  }
  const parsed = Date.parse(raw);
  if (!Number.isNaN(parsed)) {
    const d = new Date(parsed);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  return null;
}

export function rowsToObjects(table: string[][]): { headers: string[]; records: Record<string, string>[] } {
  if (table.length === 0) return { headers: [], records: [] };
  const headers = table[0].map((h) => h.trim());
  const records = table.slice(1).map((line) => {
    const record: Record<string, string> = {};
    headers.forEach((header, i) => {
      record[header] = line[i] ?? "";
    });
    return record;
  });
  return { headers, records };
}

export function pick(record: Record<string, string>, aliases: string[]): string {
  const keys = Object.keys(record);
  for (const alias of aliases) {
    const want = normalizeHeader(alias);
    const found = keys.find((key) => normalizeHeader(key) === want);
    if (found && record[found] != null && String(record[found]).trim() !== "") {
      return record[found];
    }
  }
  return "";
}
