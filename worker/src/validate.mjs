// Fail-closed, deterministic TradingView ingress contract v1.
// This validates message shape, NOT broker-side execution safety.
const S = (value, max = 128) => typeof value === 'string' && value.length > 0 && value.length <= max;
const POSITIVE = value => typeof value === 'number' && Number.isFinite(value) && value > 0;
const PLAIN = value => value !== null && typeof value === 'object' && !Array.isArray(value) && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
const KEYS = (obj, allowed) => Object.keys(obj).every(key => allowed.includes(key));

export class ValidationError extends Error {
  constructor(code) { super(code); this.name = 'ValidationError'; this.code = code; }
}
const reject = code => { throw new ValidationError(code); };

function parseIso(value) {
  if (!S(value, 35) || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(value)) return NaN;
  const time = Date.parse(value);
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 19) === value.slice(0, 19) ? time : NaN;
}

export function validateTradingView(body, nowMs = Date.now()) {
  if (!PLAIN(body) || !KEYS(body, ['schema_version','external_signal_id','source_type','action','side','symbol','order','occurred_at','expires_at','metadata'])) reject('INVALID_SIGNAL_SCHEMA');
  if (body.schema_version !== '1.0' || body.source_type !== 'tradingview') reject('UNSUPPORTED_SIGNAL_SCHEMA');
  if (!S(body.external_signal_id, 96) || !/^[a-zA-Z0-9][a-zA-Z0-9_.:-]{0,95}$/.test(body.external_signal_id)) reject('INVALID_SIGNAL_ID');
  if (body.action !== 'OPEN' || !['BUY','SELL'].includes(body.side)) reject('UNSUPPORTED_ACTION');
  if (!S(body.symbol, 32) || !/^[A-Z0-9][A-Z0-9._-]{0,31}$/.test(body.symbol)) reject('INVALID_SYMBOL');
  const {order} = body;
  if (!PLAIN(order) || !KEYS(order,['type','volume','stop_loss','take_profits']) || order.type !== 'MARKET') reject('INVALID_ORDER');
  if (!PLAIN(order.volume) || !KEYS(order.volume,['mode','value']) || order.volume.mode !== 'FIXED_LOTS' || !POSITIVE(order.volume.value) || order.volume.value > 100) reject('INVALID_VOLUME');
  if (!POSITIVE(order.stop_loss)) reject('INVALID_STOP_LOSS');
  if (!Array.isArray(order.take_profits) || order.take_profits.length < 1 || order.take_profits.length > 3 || !order.take_profits.every(POSITIVE) || new Set(order.take_profits).size !== order.take_profits.length) reject('INVALID_TAKE_PROFITS');
  const occurred = parseIso(body.occurred_at), expires = parseIso(body.expires_at);
  if (!Number.isFinite(occurred) || !Number.isFinite(expires) || expires <= occurred || expires - occurred > 300_000) reject('INVALID_TIME_WINDOW');
  if (occurred > nowMs + 30_000 || expires <= nowMs || occurred < nowMs - 300_000) reject('EXPIRED_OR_FUTURE_SIGNAL');
  if (body.metadata !== undefined && (!PLAIN(body.metadata) || !KEYS(body.metadata,['strategy']) || (body.metadata.strategy !== undefined && (!S(body.metadata.strategy, 120) || /[\u0000-\u001f]/.test(body.metadata.strategy))))) reject('INVALID_METADATA');
  return {
    schema_version:'1.0', external_signal_id:body.external_signal_id,
    source_type:'tradingview', action:'OPEN',side:body.side,symbol:body.symbol,
    order:{type:'MARKET',volume:{mode:'FIXED_LOTS',value:order.volume.value},stop_loss:order.stop_loss,take_profits:[...order.take_profits]},
    occurred_at:new Date(occurred).toISOString(),expires_at:new Date(expires).toISOString(),
    ...(body.metadata?.strategy ? {metadata:{strategy:body.metadata.strategy}} : {})
  };
}

// Hash a canonical representation so insignificant whitespace or key ordering will not spuriously create a conflict.
export function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (PLAIN(value)) return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(',')}}`;
  return JSON.stringify(value);
}
