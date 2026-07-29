import { Resend } from "resend";

function getResendClient(): Resend | null {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  return new Resend(key);
}

function fromAddress(): string {
  return (
    process.env.RESEND_FROM_EMAIL?.trim() ||
    process.env.EMAIL_FROM?.trim() ||
    "Kualisto <onboarding@resend.dev>"
  );
}

export interface TripEmailContext {
  tripId: string;
  ref: string;
  guestName: string;
  startDate: string | null;
  endDate: string | null;
  adultCount: number;
  childCount: number;
  crewCount: number;
  estimatedTotalLabel?: string;
}

/** HTML template: guest order confirmation. */
export function GuestConfirmationEmail(ctx: TripEmailContext, locale: string): string {
  return guestConfirmationEmailHtml(ctx, locale);
}

/** HTML template: chef / ops alert. */
export function ChefAlertEmail(ctx: TripEmailContext): string {
  return chefAlertEmailHtml(ctx);
}

export function guestConfirmationEmailHtml(ctx: TripEmailContext, locale: string): string {
  const isEs = locale === "es";
  const dates =
    ctx.startDate && ctx.endDate ? `${ctx.startDate} → ${ctx.endDate}` : isEs ? "Por confirmar" : "TBD";
  const title = isEs
    ? "¡Gracias por confirmar tu menú a bordo!"
    : "Thank you for confirming your onboard menu!";
  const intro = isEs
    ? "Hemos recibido la confirmación de tu orden. Aquí tienes un resumen de tu viaje:"
    : "We received your order confirmation. Here is a summary of your trip:";
  const footer = isEs
    ? "El equipo de Kualisto revisará tu orden y se pondrá en contacto si hace falta algún ajuste."
    : "The Kualisto team will review your order and reach out if any adjustments are needed.";

  return `<!DOCTYPE html>
<html>
  <body style="font-family: Georgia, serif; color: #1B3A4B; background: #FAFAF8; padding: 24px;">
    <div style="max-width: 560px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 28px; border: 1px solid #e5e5e5;">
      <p style="letter-spacing: 0.2em; text-transform: uppercase; color: #C4A052; font-size: 12px; font-weight: 700;">Kualisto</p>
      <h1 style="font-size: 24px; margin: 12px 0 16px;">${title}</h1>
      <p style="line-height: 1.5;">${intro}</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
        <tr><td style="padding: 8px 0; color: #666;">${isEs ? "Referencia" : "Reference"}</td><td style="padding: 8px 0; font-weight: 600;">#${ctx.ref}</td></tr>
        <tr><td style="padding: 8px 0; color: #666;">${isEs ? "Huésped" : "Guest"}</td><td style="padding: 8px 0; font-weight: 600;">${ctx.guestName}</td></tr>
        <tr><td style="padding: 8px 0; color: #666;">${isEs ? "Fechas" : "Dates"}</td><td style="padding: 8px 0; font-weight: 600;">${dates}</td></tr>
        <tr><td style="padding: 8px 0; color: #666;">${isEs ? "Pasajeros" : "Passengers"}</td><td style="padding: 8px 0; font-weight: 600;">${ctx.adultCount} ${isEs ? "adultos" : "adults"} · ${ctx.childCount} ${isEs ? "niños" : "children"} + ${ctx.crewCount} ${isEs ? "tripulación" : "crew"}</td></tr>
        ${
          ctx.estimatedTotalLabel
            ? `<tr><td style="padding: 8px 0; color: #666;">${isEs ? "Estimado" : "Estimate"}</td><td style="padding: 8px 0; font-weight: 600;">${ctx.estimatedTotalLabel}</td></tr>`
            : ""
        }
      </table>
      <p style="line-height: 1.5; color: #555;">${footer}</p>
    </div>
  </body>
</html>`;
}

export function chefAlertEmailHtml(ctx: TripEmailContext): string {
  const dates =
    ctx.startDate && ctx.endDate ? `${ctx.startDate} → ${ctx.endDate}` : "TBD";

  return `<!DOCTYPE html>
<html>
  <body style="font-family: system-ui, sans-serif; color: #111; background: #f4f4f5; padding: 24px;">
    <div style="max-width: 560px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 28px; border: 1px solid #e4e4e7;">
      <p style="letter-spacing: 0.15em; text-transform: uppercase; color: #C4A052; font-size: 11px; font-weight: 700;">Kualisto Ops</p>
      <h1 style="font-size: 22px; margin: 12px 0 8px;">Nueva Orden de Servicio confirmada</h1>
      <p style="margin: 0 0 16px; color: #52525b;">Viaje Ref <strong>#${ctx.ref}</strong> acaba de ser confirmado por el huésped.</p>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr><td style="padding: 6px 0; color: #71717a;">Huésped</td><td style="padding: 6px 0; font-weight: 600;">${ctx.guestName}</td></tr>
        <tr><td style="padding: 6px 0; color: #71717a;">Fechas</td><td style="padding: 6px 0; font-weight: 600;">${dates}</td></tr>
        <tr><td style="padding: 6px 0; color: #71717a;">Pax</td><td style="padding: 6px 0; font-weight: 600;">${ctx.adultCount}A / ${ctx.childCount}C + ${ctx.crewCount} crew</td></tr>
        <tr><td style="padding: 6px 0; color: #71717a;">Trip ID</td><td style="padding: 6px 0; font-family: monospace; font-size: 12px;">${ctx.tripId}</td></tr>
      </table>
      <p style="margin-top: 20px; font-size: 13px; color: #52525b;">Revisa la orden de servicio y genera la lista de compras en el panel Chef.</p>
    </div>
  </body>
</html>`;
}

export async function sendGuestConfirmationEmail(params: {
  to: string;
  ctx: TripEmailContext;
  locale: string;
}): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const client = getResendClient();
  if (!client) return { ok: false, skipped: true, error: "RESEND_API_KEY missing" };

  const { error } = await client.emails.send({
    from: fromAddress(),
    to: params.to,
    subject:
      params.locale === "es"
        ? `Confirmación de menú — Viaje #${params.ctx.ref}`
        : `Menu confirmation — Trip #${params.ctx.ref}`,
    html: GuestConfirmationEmail(params.ctx, params.locale),
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function sendChefAlertEmail(params: {
  ctx: TripEmailContext;
}): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const client = getResendClient();
  if (!client) return { ok: false, skipped: true, error: "RESEND_API_KEY missing" };

  const to =
    process.env.ADMIN_EMAIL?.trim() ||
    process.env.CHEF_ALERT_EMAIL?.trim() ||
    process.env.OPS_EMAIL?.trim();
  if (!to) return { ok: false, skipped: true, error: "ADMIN_EMAIL missing" };

  const { error } = await client.emails.send({
    from: fromAddress(),
    to,
    subject: `Nueva orden confirmada — Ref #${params.ctx.ref}`,
    html: ChefAlertEmail(params.ctx),
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
