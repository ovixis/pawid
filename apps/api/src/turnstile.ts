// Cloudflare Turnstile: checks that a public form (vet registration, statement of support) was sent
// by a person, not a bot. Without TURNSTILE_SECRET (local development) the check is skipped.
export interface TurnstileEnv { TURNSTILE_SECRET?: string; TURNSTILE_HOSTNAMES?: string }

export async function humanCheck(env: TurnstileEnv, token: unknown, ip: string | undefined): Promise<boolean> {
  if (!env.TURNSTILE_SECRET) return true;
  if (typeof token !== "string" || !token || token.length > 4096) return false;
  const form = new FormData();
  form.append("secret", env.TURNSTILE_SECRET);
  form.append("response", token);
  if (ip) form.append("remoteip", ip);
  try {
    const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form });
    const d = (await r.json()) as { success?: boolean; hostname?: string };
    const hosts = (env.TURNSTILE_HOSTNAMES ?? "pawid.hospet.eu").split(",").map((h) => h.trim());
    return d.success === true && (!d.hostname || hosts.includes(d.hostname));
  } catch {
    return false;
  }
}
