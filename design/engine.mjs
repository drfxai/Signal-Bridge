/**
 * SignalBridge demonstration-only utilities.
 * These pure functions NEVER send an order and are not a substitute for broker validation.
 */
export const SYMBOL_ALIASES = Object.freeze({ GOLD: 'XAUUSD', XAU: 'XAUUSD', BTC: 'BTCUSD' });
export const ALLOWED_SYMBOLS = Object.freeze(['XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'BTCUSD', 'ETHUSD', 'US30']);
const normal = s => String(s || '').trim().toUpperCase();
export function normalizeSymbol(input) {
  const symbol = normal(input);
  return SYMBOL_ALIASES[symbol] || symbol;
}
export function parseTelegramSignal(raw) {
  const original = String(raw ?? '');
  const text = original.toUpperCase().replace(/[\u200c\u200d]/g, '').replace(/\u066b/g, '.');
  const directions = [...text.matchAll(/\b(BUY|SELL|LONG|SHORT)\b/g)];
  const unique = [...new Set(directions.map(m => ['BUY', 'LONG'].includes(m[1]) ? 'BUY' : 'SELL'))];
  const instrument = text.match(/\b(XAUUSD|GOLD|XAU|EURUSD|GBPUSD|USDJPY|BTCUSD|BTC|ETHUSD|US30)\b/);
  const stop = text.match(/\b(?:SL|STOP\s*LOSS)\s*[:=@]?\s*(\d+(?:\.\d+)?)/);
  const targetTokens = [...text.matchAll(/\bTP(?:\s*[1-9])?\s*[:=@]?\s*(\d+(?:\.\d+)?)/g)];
  const entry = text.match(/\b(?:ENTRY|ENTER|AT|@)\s*[:=@]?\s*(\d+(?:\.\d+)?)/);
  const warnings = [];
  if (unique.length !== 1) warnings.push('Direction is missing or contradictory.');
  if (!instrument) warnings.push('Recognized symbol is missing.');
  if (!stop) warnings.push('Stop loss is missing.');
  if (!targetTokens.length) warnings.push('Take profit is missing.');
  if (targetTokens.length > 4) warnings.push('Too many target levels for demo parser.');
  const symbol = instrument ? normalizeSymbol(instrument[1]) : null;
  if (symbol && !ALLOWED_SYMBOLS.includes(symbol)) warnings.push('Unsupported symbol.');
  const side = unique.length === 1 ? unique[0] : null;
  const sl = stop ? Number(stop[1]) : null;
  const takeProfits = targetTokens.map(m => Number(m[1]));
  const entryPrice = entry ? Number(entry[1]) : null;
  if (entryPrice !== null && sl !== null && side) {
    if ((side === 'BUY' && sl >= entryPrice) || (side === 'SELL' && sl <= entryPrice)) warnings.push('Stop price conflicts with direction and entry.');
    if (takeProfits.some(tp => side === 'BUY' ? tp <= entryPrice : tp >= entryPrice)) warnings.push('Target price conflicts with direction and entry.');
  }
  if (new Set(takeProfits).size !== takeProfits.length) warnings.push('Duplicate target prices.');
  if (symbol === 'XAUUSD' && /\b(GOLD|XAU)\b/.test(text)) warnings.push('GOLD/XAU alias mapped for preview only; broker symbol must be verified.');
  return {
    source: 'telegram', parser: 'deterministic-demo-v2', side, symbol,
    entry: entryPrice, stopLoss: sl, takeProfits,
    approval: warnings.some(w => !w.startsWith('GOLD/XAU')) ? 'REVIEW_REQUIRED' : 'PENDING_BROKER_VALIDATION',
    executable: false, warnings
  };
}
export function evaluateDemoRisk({lots, openPositions = 0, dailyLossPercent = 0, spreadPoints = 0, ageSeconds = 0, hasStopLoss = true} = {}, policy = {}) {
  const reasons = [];
  const maxLots = Number(policy.maxLots ?? 0.1);
  const maxOpen = Number(policy.maxOpen ?? 3);
  const maxDailyLoss = Number(policy.dailyLoss ?? 3);
  const maxSpread = Number(policy.maxSpread ?? 50);
  if (!Number.isFinite(Number(lots)) || Number(lots) <= 0 || Number(lots) > maxLots) reasons.push('LOT_LIMIT');
  if (!Number.isFinite(Number(openPositions)) || Number(openPositions) >= maxOpen) reasons.push('POSITION_LIMIT');
  if (!Number.isFinite(Number(dailyLossPercent)) || Number(dailyLossPercent) >= maxDailyLoss) reasons.push('DAILY_LOSS_LIMIT');
  if (!Number.isFinite(Number(spreadPoints)) || Number(spreadPoints) > maxSpread) reasons.push('SPREAD_LIMIT');
  if (!Number.isFinite(Number(ageSeconds)) || Number(ageSeconds) > 30) reasons.push('STALE_SIGNAL');
  if (!hasStopLoss) reasons.push('MISSING_STOP_LOSS');
  return {decision: reasons.length ? 'REJECTED' : 'LOCAL_PREVIEW_PASS', reasons, executionAllowed: false};
}
export function safeText(text) {
  return String(text ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
}