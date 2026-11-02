import { getStore } from "@netlify/blobs";
import { gzipSync, gunzipSync } from "node:zlib";
import { timingSafeEqual } from "node:crypto";

const MAX_BYTES = 5 * 1024 * 1024; // batas body terkompres (limit function Netlify ~6 MB)

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

const sameKey = (a, b) => {
  const x = Buffer.from(String(a ?? "")), y = Buffer.from(String(b ?? ""));
  return x.length === y.length && timingSafeEqual(x, y);
};

const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);

// Setiap dashboard punya "ruang" data sendiri. Tanpa ?name= dipakai "akurasi" (kompatibel dengan versi lama).
const DASHBOARDS = {
  akurasi: {
    blobKey: "latest",
    // Data diganti seluruhnya setiap simpan.
    merge: (_old, incoming) => incoming,
    valid: (d) => isObj(d) && Array.isArray(d.wms) && Array.isArray(d.swbl),
  },
  outstandingnp: {
    blobKey: "latest-outstandingnp",
    // Laporan OTS NP, PO, dan TR disimpan terpisah: yang tidak dikirim tetap memakai data lama.
    merge: (old, incoming) => ({
      main: incoming.main ?? old?.main,
      docs: { ...(old?.docs || {}), ...(incoming.docs || {}) },
    }),
    valid: (d) =>
      isObj(d) &&
      (d.main === undefined || (isObj(d.main) && Array.isArray(d.main.raw) && typeof d.main.report === "string")) &&
      (d.docs === undefined || isObj(d.docs)) &&
      (d.main !== undefined || d.docs !== undefined),
  },
};

export function createHandler(openStore, env = process.env) {
  return async (req) => {
    const name = new URL(req.url).searchParams.get("name") || "akurasi";
    const cfg = Object.hasOwn(DASHBOARDS, name) ? DASHBOARDS[name] : null;
    if (!cfg) return json({ error: "Dashboard tidak dikenal." }, 400);
    const store = openStore();

    if (req.method === "GET") {
      const buf = await store.get(cfg.blobKey, { type: "arrayBuffer" });
      if (!buf) return json({ error: "Belum ada data." }, 404);
      return new Response(buf, {
        headers: {
          "Content-Type": "application/json",
          "Content-Encoding": "gzip",
          "Cache-Control": "no-store",
        },
      });
    }

    if (req.method === "PUT") {
      // Outstanding NP boleh punya kunci sendiri (UPLOAD_KEY_OUTSTANDINGNP); bila belum diatur, memakai UPLOAD_KEY.
      const wantKey = (name === "outstandingnp" && env.UPLOAD_KEY_OUTSTANDINGNP) || env.UPLOAD_KEY;
      if (!wantKey) return json({ error: "UPLOAD_KEY belum diatur di Netlify." }, 500);
      if (!sameKey(req.headers.get("x-upload-key"), wantKey))
        return json({ error: "Kunci admin salah." }, 401);
      const raw = Buffer.from(await req.arrayBuffer());
      if (raw.length > MAX_BYTES) return json({ error: "Data terlalu besar." }, 413);
      let incoming;
      try {
        incoming = JSON.parse(gunzipSync(raw).toString("utf8"));
      } catch {
        return json({ error: "Data tidak bisa dibaca." }, 400);
      }
      if (!cfg.valid(incoming)) return json({ error: "Format data tidak sesuai." }, 400);

      let old;
      if (name !== "akurasi") {
        const prev = await store.get(cfg.blobKey, { type: "arrayBuffer" });
        if (prev) {
          try { old = JSON.parse(gunzipSync(Buffer.from(prev)).toString("utf8")).data; } catch { old = undefined; }
        }
      }
      const savedAt = new Date().toISOString();
      const packed = gzipSync(Buffer.from(JSON.stringify({ data: cfg.merge(old, incoming), savedAt })));
      await store.set(cfg.blobKey, packed.buffer.slice(packed.byteOffset, packed.byteOffset + packed.byteLength));
      return json({ ok: true, savedAt });
    }

    return json({ error: "Method tidak didukung." }, 405);
  };
}

export default createHandler(() => getStore({ name: "dashboard-shared", consistency: "strong" }));
