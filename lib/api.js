export const E = (r) => { if (r.error) throw new Error(r.error.message); return r.data; };
export const h = (fn) => async (req, ctx) => {
  try { return Response.json(await fn(req, ctx)); }
  catch (e) { return Response.json({ error: e.message }, { status: e.status || 500 }); }
};
export const fail = (msg, status = 400) => Object.assign(new Error(msg), { status });
