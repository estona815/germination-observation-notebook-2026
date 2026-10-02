import { evaluateBatch, observationValue } from '../src/lib/domain.mjs';
import { BATCH_QUERY } from '../src/lib/source.mjs';

const apiVersion='2026-10-01';
const string=(name,title=name)=>({name,title,type:'string',validation:R=>R.required()});
const reference=(name,type)=>({name,type:'reference',to:[{type}],validation:R=>R.required()});
const synthetic={name:'synthetic',type:'boolean',initialValue:true,validation:R=>R.required().custom(v=>v===true||'This public demonstration accepts synthetic records only.')};
const state=name=>({...string(name),options:{list:['observed','missing']}});
const count=name=>({name,type:'number',validation:R=>R.custom(v=>v===null||v===undefined||Number.isInteger(v)&&v>=0&&v<=10000||'Count must be a nonnegative integer or empty for missing.')});
const plainId=id=>String(id??'').replace(/^drafts\./,'');
const pick=(doc,keys)=>Object.fromEntries(keys.map(k=>[k,doc?.[k]??null]));

// Studio validation is not server-enforced access control. Direct API writers can
// bypass it; the public viewer independently rejects invalid data and histories.
function freezePublished(keys) {
  return async (doc,context) => {
    if (!doc) return true;
    try {
      const prior=await context.getClient({apiVersion}).fetch('*[_id == $id][0]',{id:plainId(doc._id)});
      return !prior||JSON.stringify(pick(prior,keys))===JSON.stringify(pick(doc,keys))||'Published experimental facts are immutable. Create a new version/batch, or an observation revision.';
    } catch {return 'Could not verify published facts. Validation is blocked until the lookup succeeds.';}
  };
}

async function validateObservation(doc,context) {
  if (!doc) return true;
  const frozen=await freezePublished(['batch','day','date','state','count'])(doc,context);
  if (frozen!==true) return frozen;
  try {
    const client=context.getClient({apiVersion});
    const batches=await client.fetch(BATCH_QUERY);
    const batch=batches.find(b=>b._id===plainId(doc.batch?._ref));
    if (!batch) return 'Publish the referenced lot, cultivar, protocol and batch first.';
    const id=plainId(doc._id);
    const candidate={...batch,observations:[...batch.observations.filter(o=>o._id!==id),{...doc,_id:id,count:doc.count??null}]};
    const result=evaluateBatch(candidate);
    return result.valid||result.issues.join(' ');
  } catch {return 'Observation references could not be validated. Do not publish until the lookup succeeds.';}
}

async function validateRevision(doc,context) {
  if (!doc) return true;
  const frozen=await freezePublished(['observation','previousState','previousCount','state','count','reason'])(doc,context);
  if (frozen!==true) return frozen;
  if (typeof doc.reason!=='string'||!doc.reason.trim()) return 'A correction reason is required.';
  try {
    const client=context.getClient({apiVersion});
    const batches=await client.fetch(BATCH_QUERY);
    const obsId=plainId(doc.observation?._ref), id=plainId(doc._id);
    const batch=batches.find(b=>b.observations.some(o=>o._id===obsId));
    if (!batch) return 'Publish the original observation first.';
    const otherRevisions=batch.revisions.filter(r=>r._id!==id);
    const previous=observationValue(batch.observations.find(o=>o._id===obsId),otherRevisions,batch.sampleSize);
    if (previous.revisionIssue) return previous.revisionIssue;
    if (previous.state!==doc.previousState||previous.count!==(doc.previousCount??null)) return 'Previous value is stale. Read the latest published value and create a fresh revision.';
    const revision={...doc,_id:id,observationId:obsId,previousCount:doc.previousCount??null,count:doc.count??null,_createdAt:doc._createdAt??new Date().toISOString()};
    const result=evaluateBatch({...batch,revisions:[...otherRevisions,revision]});
    return result.valid||result.issues.join(' ');
  } catch {return 'Correction chain could not be validated. Do not publish until the lookup succeeds.';}
}

export const schemaTypes=[
  {name:'cultivar',title:'Synthetic cultivar',type:'document',fields:[string('label'),synthetic],validation:R=>R.custom(freezePublished(['label','synthetic']))},
  {name:'seedLot',title:'Lot identity (no inventory)',type:'document',fields:[string('label'),reference('cultivar','cultivar'),synthetic],validation:R=>R.custom(freezePublished(['label','cultivar','synthetic']))},
  {name:'testProtocol',title:'Observation protocol version',type:'document',fields:[string('label'),string('version'),string('criterion','Observation criterion (synthetic and unvalidated)'),{name:'days',type:'array',of:[{type:'number'}],validation:R=>R.required().custom((v,c)=>Array.isArray(v)&&v.length>0&&new Set(v).size===v.length&&v.every(d=>Number.isInteger(d)&&d>=0&&d<=c.document.finalDay)&&v.includes(c.document.finalDay)||'Unique scheduled integers including the endpoint are required.')},{name:'finalDay',type:'number',validation:R=>R.required().integer().min(1).max(365)},synthetic],validation:R=>R.custom(freezePublished(['version','criterion','days','finalDay','synthetic']))},
  {name:'testBatch',title:'Replicate test batch',type:'document',fields:[string('label'),reference('lot','seedLot'),reference('protocol','testProtocol'),{name:'sampleSize',type:'number',validation:R=>R.required().integer().min(1).max(10000)},{name:'startDate',type:'date',validation:R=>R.required()},string('conditions'),synthetic],validation:R=>R.custom(freezePublished(['lot','protocol','sampleSize','startDate','conditions','synthetic']))},
  {name:'observation',title:'Original observation',type:'document',fields:[reference('batch','testBatch'),{name:'day',type:'number',validation:R=>R.required().integer().min(0).max(365)},{name:'date',type:'date',validation:R=>R.required()},state('state'),count('count'),{name:'note',type:'text'},synthetic],validation:R=>R.custom(validateObservation)},
  {name:'observationRevision',title:'Observation correction (append only)',type:'document',fields:[reference('observation','observation'),state('previousState'),count('previousCount'),state('state'),count('count'),{name:'reason',type:'text',validation:R=>R.required().min(3)},synthetic],validation:R=>R.custom(validateRevision)}
];
