// Reads the public product list of jev.'s Shopify store so the shop page on thelonerjev.com always shows
// current prices and sold-out sizes. Nothing secret is needed: it's the same list any visitor's browser can load.
// While the store is password-protected the list can't be read, and the page keeps the products built into it.
const STORE = "https://rgy88y-1y.myshopify.com";

const headers = {
  "Cache-Control": "public, max-age=60",
  "Netlify-CDN-Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
};

export default async () => {
  try {
    const res = await fetch(`${STORE}/products.json?limit=250`, { headers: { Accept: "application/json" } });
    const type = res.headers.get("content-type") || "";
    if (!res.ok || !type.includes("json")) return Response.json({ ok: false }, { headers });
    const data = await res.json();
    const products = (data.products || []).map((p) => {
      const at = (p.options || []).findIndex((o) => /size/i.test(o.name));
      return {
        handle: p.handle,
        variants: (p.variants || []).map((v) => ({
          id: v.id,
          size: at >= 0 ? v[`option${at + 1}`] : v.title,
          price: Number(v.price),
          available: Boolean(v.available),
        })),
      };
    });
    return Response.json({ ok: true, products }, { headers });
  } catch {
    return Response.json({ ok: false }, { headers });
  }
};

export const config = { path: "/api/shop" };
