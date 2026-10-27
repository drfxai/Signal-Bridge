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
const toAsciiDigits = value => value.replace(/[\u0660-\u0669\u06f0-\u06f9]/g, char => {
  const code = char.charCodeAt(0);
  return String(code >= 0x06f0 ? code - 0x06f0 : code - 0x0660);
});
export function parseTelegramSignal(raw) {
  const original = String(raw ?? '');
  const text = toAsciiDigits(original.toUpperCase().replace(/[\u200c\u200d]/g, '').replace(/[\u066b]/g, '.').replace(/[\u066c]/g, ''));
  const warnings = [];
  const directions = [...text.matchAll(/\b(BUY|SELL|LONG|SHORT)\b/g)].map(m => ['BUY','LONG'].includes(m[1]) ? 'BUY' : 'SELL');
  const uniqueDirections = [...new Set(directions)];
  if (uniqueDirections.length !== 1) warnings.push('Direction is missing or contradictory.');
  const symbolMatches = [...text.matchAll(/\b(XAUUSD|GOLD|XAU|EURUSD|GBPUSD|USDJPY|BTCUSD|BTC|ETHUSD|US30)\b/g)].map(m => normalizeSymbol(m[1]));
  const uniqueSymbols = [...new Set(symbolMatches)];
  if (!uniqueSymbols.length) warnings.push('Recognized symbol is missing.');
  if (uniqueSymbols.length > 1) warnings.push('Conflicting instruments.');
  const stops = [...text.matchAll(/\b(?:SL|STOP\s*LOSS)\s*[:=@]?\s*(\d+(?:\.\d+)?)/g)].map(m => Number(m[1]));
  if (!stops.length) warnings.push('Stop loss is missing.');
  if (stops.length > 1) warnings.push('Repeated stop-loss fields require manual review.');
  const entries = [...text.matchAll(/\b(?:ENTRY|ENTER|AT|@)\s*[:=@]?\s*(\d+(?:\.\d+)?)/g)].map(m => Number(m[1]));
  if (entries.length > 1) warnings.push('Repeated entry fields require manual review.');
  const targetTokens = [...text.matchAll(/\bTP\s*([1-9])?\s*[:=@]?\s*(\d+(?:\.\d+)?)/g)].map(m => ({index:m[1] || null,price:Number(m[2])}));
  if (!targetTokens.length) warnings.push('Take profit is missing.');
  if (targetTokens.length > 4) warnings.push('Too many target levels for demo parser.');
  const targetIds = targetTokens.map(t => t.index).filter(Boolean);
  if (new Set(targetIds).size !== targetIds.length) warnings.push('Repeated take-profit identifiers.');
  if (targetIds.length > 0 && targetIds.length !== targetTokens.length) warnings.push('Mixed labeled and unlabeled targets.');
  const takeProfits = targetTokens.map(t => t.price);
  if (new Set(takeProfits).size !== takeProfits.length) warnings.push('Duplicate target prices.');
  const side = uniqueDirections.length === 1 ? uniqueDirections[0] : null;
  const symbol = uniqueSymbols.length === 1 ? uniqueSymbols[0] : null;
  const sl = stops.length === 1 ? stops[0] : null;
  const entryPrice = entries.length === 1 ? entries[0] : null;
  if (symbol && !ALLOWED_SYMBOLS.includes(symbol)) warnings.push('Unsupported symbol.');
  if ([...stops, ...entries, ...takeProfits].some(value => !Number.isFinite(value) || value <= 0)) warnings.push('Non-positive or invalid prices.');
  if (entryPrice !== null && sl !== null && side) {
    if ((side === 'BUY' && sl >= entryPrice) || (side === 'SELL' && sl <= entryPrice)) warnings.push('Stop price conflicts with direction and entry.');
    if (takeProfits.some(tp => side === 'BUY' ? tp <= entryPrice : tp >= entryPrice)) warnings.push('Target price conflicts with direction and entry.');
  }
  if (symbol === 'XAUUSD' && /\b(GOLD|XAU)\b/.test(text)) warnings.push('GOLD/XAU alias mapped for preview only; broker symbol must be verified.');
  return {
    source:'telegram',parser:'deterministic-demo-v3',side,symbol,entry:entryPrice,stopLoss:sl,takeProfits,
    approval:warnings.some(w => !w.startsWith('GOLD/XAU')) ? 'REVIEW_REQUIRED' : 'PENDING_BROKER_VALIDATION',
    executable:false,warnings
  };
}
const validNumber = (x, min, max = Infinity, integer = false) =>
  x !== null && x !== undefined && x !== '' && Number.isFinite(Number(x)) &&
  Number(x) >= min && Number(x) <= max && (!integer || Number.isInteger(Number(x)));
export function evaluateDemoRisk({lots,openPositions=0,dailyLossPercent=0,spreadPoints=0,ageSeconds=0,hasStopLoss=true} = {},policy = {}) {
  const reasons = [];
  const maxLots = policy.maxLots ?? 0.1;
  const maxOpen = policy.maxOpen ?? 3;
  const maxDailyLoss = policy.dailyLoss ?? 3;
  const maxSpread = policy.maxSpread ?? 50;
  if (!validNumber(maxLots,0.000001) || !validNumber(maxOpen,1,Infinity,true) || !validNumber(maxDailyLoss,0.000001,100) || !validNumber(maxSpread,0)) reasons.push('INVALID_POLICY');
  if (!validNumber(lots,0.000001) || Number(lots) > Number(maxLots)) reasons.push('LOT_LIMIT');
  if (!validNumber(openPositions,0,Infinity,true) || Number(openPositions) >= Number(maxOpen)) reasons.push('POSITION_LIMIT');
  if (!validNumber(dailyLossPercent,0,100) || Number(dailyLossPercent) >= Number(maxDailyLoss)) reasons.push('DAILY_LOSS_LIMIT');
  if (!validNumber(spreadPoints,0) || Number(spreadPoints) > Number(maxSpread)) reasons.push('SPREAD_LIMIT');
  if (!validNumber(ageSeconds,0) || Number(ageSeconds) > 30) reasons.push('STALE_SIGNAL');
  if (hasStopLoss !== true) reasons.push('MISSING_STOP_LOSS');
  return {decision:reasons.length?'REJECTED':'LOCAL_PREVIEW_PASS',reasons,executionAllowed:false};
}
export function safeText(text) {
  return String(text ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
}