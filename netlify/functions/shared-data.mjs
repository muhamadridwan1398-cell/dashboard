import { getStore } from "@netlify/blobs";
import { gzipSync, gunzipSync } from "node:zlib";
import { timingSafeEqual } from "node:crypto";

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

const sameKey = (a, b) => {
  const x = Buffer.from(String(a ?? "")), y = Buffer.from(String(b ?? ""));
  return x.length === y.length && timingSafeEqual(x, y);
};

export function createHandler(openStore, env = process.env) {
  return async (req) => {
    const store = openStore();

    if (req.method === "GET") {
      const buf = await store.get("latest", { type: "arrayBuffer" });
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
      if (!env.UPLOAD_KEY) return json({ error: "UPLOAD_KEY belum diatur di Netlify." }, 500);
      if (!sameKey(req.headers.get("x-upload-key"), env.UPLOAD_KEY))
        return json({ error: "Kunci admin salah." }, 401);
      let data;
      try {
        data = JSON.parse(gunzipSync(Buffer.from(await req.arrayBuffer())).toString("utf8"));
      } catch {
        return json({ error: "Data tidak bisa dibaca." }, 400);
      }
      if (!data || !Array.isArray(data.wms) || !Array.isArray(data.swbl))
        return json({ error: "Format data tidak sesuai." }, 400);
      const savedAt = new Date().toISOString();
      const packed = gzipSync(Buffer.from(JSON.stringify({ data, savedAt })));
      await store.set("latest", packed.buffer.slice(packed.byteOffset, packed.byteOffset + packed.byteLength));
      return json({ ok: true, savedAt });
    }

    return json({ error: "Method tidak didukung." }, 405);
  };
}

export default createHandler(() => getStore({ name: "dashboard-shared", consistency: "strong" }));
