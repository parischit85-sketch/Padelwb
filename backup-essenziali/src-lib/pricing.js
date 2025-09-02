// =============================================
// FILE: src/lib/pricing.js
// =============================================
import { isWeekend, isPeakHour, minutesSinceMidnight, hmToMinutes, addMinutes } from './date.js';
const toMin = (hhmm = '00:00') => {
  const [h, m] = String(hhmm)
    .split(':')
    .map((n) => +n || 0);
  return h * 60 + m;
};
const dayOf = (d) => d.getDay(); // 0=Dom .. 6=Sab
const timeOf = (d) => d.getHours() * 60 + d.getMinutes();

function ruleMatches(date, rule, courtId) {
  if (!rule) return false;
  const t = timeOf(date);
  const inTime = t >= toMin(rule.from) && t < toMin(rule.to);
  const inDay = Array.isArray(rule.days) ? rule.days.includes(dayOf(date)) : true;
  const inCourt =
    Array.isArray(rule.courts) && rule.courts.length ? rule.courts.includes(courtId) : true; // vuoto = tutti i campi
  return inTime && inDay && inCourt;
}

/**
 * Ritorna { rate, source, rule } dove source: 'discounted' | 'full' | 'none'
 */
export function getRateInfo(date, cfg, courtId) {
  const pricing = cfg?.pricing || {};
  const disc = (pricing.discounted || []).find((r) => ruleMatches(date, r, courtId));
  if (disc) return { rate: Number(disc.eurPerHour) || 0, source: 'discounted', rule: disc };
  const full = (pricing.full || []).find((r) => ruleMatches(date, r, courtId));
  if (full) return { rate: Number(full.eurPerHour) || 0, source: 'full', rule: full };
  return { rate: 0, source: 'none', rule: null };
}

/**
 * Calcola il prezzo totale su intervallo (in minuti) tenendo conto delle fasce court-specifiche
 */
export function computePrice(startDate, durationMin, cfg, addons = {}, courtId) {
  const slot = Math.max(5, Number(cfg?.slotMinutes) || 30);
  const steps = Math.ceil(durationMin / slot);
  let d = new Date(startDate);
  let euro = 0;

  for (let i = 0; i < steps; i++) {
    const { rate } = getRateInfo(d, cfg, courtId);
    euro += (rate * slot) / 60;
    d = new Date(d.getTime() + slot * 60 * 1000);
  }

  // Opzioni a costo fisso
  const a = cfg?.addons || {};
  if (addons.lighting && a.lightingEnabled) euro += Number(a.lightingFee || 0);
  if (addons.heating && a.heatingEnabled) euro += Number(a.heatingFee || 0);

  return Math.round(euro * 100) / 100;
}
