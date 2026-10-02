export function validRecordedValue(state, count, sampleSize) {
  return state === 'missing' ? count === null : state === 'observed' && Number.isInteger(count) && count >= 0 && count <= sampleSize;
}

export function observationValue(observation, revisions = [], sampleSize = 10000) {
  if (!observation || typeof observation !== 'object') return { revisionIssue:'Invalid observation record.' };
  if (!validRecordedValue(observation.state, observation.count, sampleSize)) return { ...observation, revisionIssue:'Original observation state/count is invalid.' };
  const applicable = (Array.isArray(revisions) ? revisions : []).filter(r => r && r.observationId === observation._id)
    .sort((a, b) => String(a._createdAt ?? '').localeCompare(String(b._createdAt ?? '')) || String(a._id ?? '').localeCompare(String(b._id ?? '')));
  let current = { ...observation };
  for (const revision of applicable) {
    if (!validRecordedValue(revision.previousState, revision.previousCount, sampleSize) || !validRecordedValue(revision.state, revision.count, sampleSize)) return { ...current, revisionIssue:'Every historical correction value must use a valid observed count or missing/null state.' };
    if (typeof revision.reason !== 'string' || !revision.reason.trim() || revision.previousState !== current.state || revision.previousCount !== current.count) return { ...current, revisionIssue: 'Correction history has a missing reason or stale previous value.' };
    current = { ...current, state: revision.state, count: revision.count, amendment: revision };
  }
  return current;
}

function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function evaluateBatch(batch, { asOf = new Date().toISOString().slice(0,10) } = {}) {
  if (!batch || typeof batch !== 'object') return {valid:false,complete:false,issues:['Invalid test batch.'],unobserved:[],observations:[],finalCount:null,proportion:null};
  const issues = [];
  const protocol = batch.protocol;
  if (!Number.isInteger(batch.sampleSize) || batch.sampleSize < 1 || batch.sampleSize > 10000) issues.push('Sample size must be an integer from 1 to 10,000.');
  if (!validDate(batch.startDate)) issues.push('A valid start date is required.');
  if (!validDate(asOf)) issues.push('A valid review date is required.');
  if (typeof batch._id !== 'string' || !batch._id || typeof batch.lotId !== 'string' || !batch.lotId || typeof batch.cultivarId !== 'string' || !batch.cultivarId || typeof batch.conditions !== 'string' || !batch.conditions.trim()) issues.push('Batch, lot, cultivar and declared conditions must be known.');
  if (typeof protocol?._id !== 'string' || !protocol._id || typeof protocol?.version !== 'string' || !protocol.version.trim()) issues.push('Protocol ID and version must be known.');
  if (typeof protocol?.criterion !== 'string' || !protocol.criterion.trim()) issues.push('An explicit observation criterion is required.');
  if (!protocol || !Number.isInteger(protocol.finalDay) || protocol.finalDay < 1 || protocol.finalDay > 365) issues.push('A valid protocol endpoint is required.');
  const schedule = Array.isArray(protocol?.days) ? protocol.days : [];
  if (!schedule.length || new Set(schedule).size !== schedule.length || schedule.some(d => !Number.isInteger(d) || d < 0 || d > protocol.finalDay) || !schedule.includes(protocol.finalDay)) issues.push('Protocol days must be unique, bounded integers including the final day.');
  if (!Array.isArray(batch.observations) || !Array.isArray(batch.revisions ?? [])) issues.push('Observation and revision collections must be arrays.');
  for (const r of Array.isArray(batch.revisions) ? batch.revisions : []) {
    if (!r || typeof r._id !== 'string' || !r._id || typeof r.observationId !== 'string' || !(batch.observations ?? []).some?.(o=>o?._id===r.observationId) || typeof r._createdAt !== 'string' || !Number.isFinite(Date.parse(r._createdAt))) issues.push('Correction records require a valid ID, timestamp and observation reference.');
  }
  const observations = (Array.isArray(batch.observations) ? batch.observations : []).map(o => observationValue(o, batch.revisions ?? [], batch.sampleSize)).sort((a,b) => a.day - b.day);
  const seen = new Set();
  const ids = new Set();
  let previous = 0;
  for (const o of observations) {
    if (o.revisionIssue) issues.push(`Day ${o.day}: ${o.revisionIssue}`);
    if (typeof o._id !== 'string' || !o._id || ids.has(o._id)) issues.push('Observation IDs must be nonempty and unique.');
    ids.add(o._id);
    if (seen.has(o.day)) issues.push(`Day ${o.day} has duplicate observations.`);
    seen.add(o.day);
    if (!Number.isInteger(o.day) || !schedule.includes(o.day)) issues.push(`Day ${o.day} is outside the observation schedule.`);
    if (!validDate(o.date)) issues.push(`Day ${o.day} has an invalid observation date.`);
    else if (validDate(batch.startDate) && Number.isInteger(o.day) && o.day >= 0 && o.day <= 365) {
      const expected = new Date(`${batch.startDate}T00:00:00Z`); expected.setUTCDate(expected.getUTCDate() + o.day);
      if (expected.toISOString().slice(0,10) !== o.date) issues.push(`Day ${o.day} date must match the start date plus the day index.`);
    }
    if (o.state === 'missing') {
      if (o.count !== null && o.count !== undefined) issues.push(`Day ${o.day}: missing observations must not carry a count.`);
    } else if (o.state === 'observed') {
      if (validDate(o.date) && validDate(asOf) && o.date > asOf) issues.push(`Day ${o.day}: future observations cannot be treated as measured.`);
      if (!Number.isInteger(o.count) || o.count < 0 || o.count > batch.sampleSize) issues.push(`Day ${o.day}: count must be an integer between zero and the sample size.`);
      else {
        if (o.count < previous) issues.push(`Day ${o.day}: cumulative count cannot decrease.`);
        previous = o.count;
      }
    } else issues.push(`Day ${o.day}: observation state must be observed or missing.`);
  }
  const unobserved = schedule.filter(day => !observations.some(o => o.day === day && o.state === 'observed'));
  const valid = issues.length === 0;
  const endpoint = validDate(batch.startDate) && Number.isInteger(protocol?.finalDay) && protocol.finalDay >= 1 && protocol.finalDay <= 365 ? new Date(`${batch.startDate}T00:00:00Z`) : null;
  if (endpoint) endpoint.setUTCDate(endpoint.getUTCDate() + protocol.finalDay);
  const complete = valid && unobserved.length === 0 && endpoint?.toISOString().slice(0,10) <= asOf;
  const final = observations.find(o => o.day === protocol?.finalDay && o.state === 'observed');
  return { valid, complete, issues, unobserved, observations, finalCount: complete ? final.count : null, proportion: complete ? final.count / batch.sampleSize : null };
}

export function compareBatches(left, right) {
  left = left ?? {}; right = right ?? {};
  const reasons = [];
  const a = evaluateBatch(left), b = evaluateBatch(right);
  if (left._id === right._id) reasons.push('Choose two different test batches.');
  if (!a.valid || !b.valid) reasons.push('At least one batch has invalid observations.');
  if (!a.complete || !b.complete) reasons.push('Both batches must have every scheduled observation recorded.');
  if (!left.cultivarId || left.cultivarId !== right.cultivarId) reasons.push('Cultivars differ or are unknown.');
  if (!left.lotId || left.lotId !== right.lotId) reasons.push('Only same-lot replicates can be compared; seed lots differ or are unknown.');
  if (typeof left.protocol?.version !== 'string' || !left.protocol.version.trim() || typeof right.protocol?.version !== 'string' || !right.protocol.version.trim() || !left.protocol?._id || left.protocol._id !== right.protocol?._id || left.protocol.version !== right.protocol.version) reasons.push('Protocol versions differ or are unknown.');
  if (left.protocol?.finalDay !== right.protocol?.finalDay) reasons.push('Observation endpoints differ.');
  if (typeof left.protocol?.criterion !== 'string' || !left.protocol.criterion.trim() || typeof right.protocol?.criterion !== 'string' || !right.protocol.criterion.trim() || left.protocol.criterion !== right.protocol.criterion) reasons.push('Observation criteria differ or are unknown.');
  if (typeof left.conditions !== 'string' || !left.conditions.trim() || typeof right.conditions !== 'string' || !right.conditions.trim() || left.conditions !== right.conditions) reasons.push('Declared conditions differ or are unknown.');
  return { comparable: reasons.length === 0, reasons, left: a, right: b };
}

export function correctLocally(batch, observationId, state, count, reason, timestamp = new Date().toISOString()) {
  if (!reason?.trim()) throw new Error('A correction reason is required.');
  if (!(batch.observations ?? []).some(o => o._id === observationId)) throw new Error('Observation does not belong to this batch.');
  const previous = observationValue(batch.observations.find(o => o._id === observationId), batch.revisions ?? [], batch.sampleSize);
  const revision = { _id: `local-${timestamp}-${batch.revisions?.length ?? 0}`, observationId, previousState:previous.state, previousCount:previous.count, state, count: state === 'missing' ? null : count, reason: reason.trim(), _createdAt: timestamp, localOnly: true };
  const corrected = { ...batch, revisions: [...(batch.revisions ?? []), revision] };
  const result = evaluateBatch(corrected);
  if (!result.valid) throw new Error(result.issues.join(' '));
  return corrected;
}
