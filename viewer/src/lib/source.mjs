import { fixtureBatches } from '../data/fixtures.mjs';

export const BATCH_QUERY = `*[_type == "testBatch" && !(_id in path("drafts.**"))] | order(label asc) {
  _id, label, sampleSize, startDate, conditions, synthetic,
  "lotId": lot->_id, "lotLabel": lot->label, "cultivarId": lot->cultivar->_id, "cultivarLabel": lot->cultivar->label,
  "protocol": protocol->{_id, label, version, criterion, days, finalDay},
  "observations": *[_type == "observation" && !(_id in path("drafts.**")) && batch._ref == ^._id] | order(day asc) {_id, day, date, state, count, note},
  "revisions": *[_type == "observationRevision" && !(_id in path("drafts.**")) && observation->batch._ref == ^._id] | order(_createdAt asc) {_id, _createdAt, "observationId": observation._ref, previousState, previousCount, state, count, reason}
}`;

export function publicConfig(projectId, dataset) {
  if (!/^[a-z0-9]{8}$/.test(projectId ?? '')) throw new Error('A public Sanity project ID must have eight lowercase letters/numbers.');
  if (!/^[a-z0-9][a-z0-9_-]{0,63}$/.test(dataset ?? '')) throw new Error('Invalid public dataset name.');
  return { projectId, dataset, apiVersion:'2026-10-01', useCdn:false, perspective:'published' };
}

export async function loadSource(config = {}) {
  if (!config.projectId) return { mode:'fixture', batches:fixtureBatches(), message:'Synthetic local demo — invented observations; changes remain in this tab.' };
  const validated = publicConfig(config.projectId, config.dataset);
  const { createClient } = await import('@sanity/client');
  const client = createClient(validated); // Public read only: no token, writes or AI.
  const batches = await client.fetch(BATCH_QUERY);
  if (!Array.isArray(batches) || !batches.length) throw new Error('No published test batches were returned. Fixture fallback is intentionally disabled for Sanity mode.');
  if (batches.some(b=>b.synthetic !== true)) throw new Error('Only explicitly synthetic batches are supported by this demonstration.');
  return { mode:'sanity', batches, message:'Synthetic published dataset — refresh to read stored corrections. Local trials remain in this tab.' };
}
