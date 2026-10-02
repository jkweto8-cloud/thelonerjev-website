// Adds a fan to jev.'s Laylo when they enter their email or phone on the phone welcome screen.
// The Laylo API key lives in Netlify (Site configuration -> Environment variables -> LAYLO_API_KEY),
// never in the website itself, as Laylo requires.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^\+\d{8,15}$/;

export default async (req, context) => {
  if (req.method !== "POST") return Response.json({ ok: false }, { status: 405 });
  const key = process.env.LAYLO_API_KEY;
  if (!key) return Response.json({ ok: false, error: "LAYLO_API_KEY is not set" }, { status: 500 });

  let body = {};
  try { body = await req.json(); } catch { /* empty or bad body */ }
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";

  // Laylo takes exactly one contact per signup
  let variables;
  if (email && EMAIL.test(email)) variables = { email };
  else if (phone && PHONE.test(phone)) variables = { phoneNumber: phone };
  else return Response.json({ ok: false, error: "invalid contact" }, { status: 400 });
  if (context && context.ip) variables.ipAddress = context.ip; // lets Laylo show where fans are

  try {
    const res = await fetch("https://laylo.com/api/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        query: "mutation($email:String,$phoneNumber:String,$ipAddress:String){subscribeToUser(email:$email,phoneNumber:$phoneNumber,ipAddress:$ipAddress)}",
        variables,
      }),
    });
    const data = await res.json().catch(() => null);
    const ok = res.ok && data && data.data && data.data.subscribeToUser === true;
    return Response.json({ ok }, { status: ok ? 200 : 502 });
  } catch {
    return Response.json({ ok: false }, { status: 502 });
  }
};

export const config = { path: "/api/subscribe" };
