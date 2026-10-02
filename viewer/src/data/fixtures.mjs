const ref = id => ({ _type: 'reference', _ref: id });
const base = { _createdAt: '2026-10-02T00:00:00Z', synthetic: true };
const criterion = 'Observer-marked radicle visible. Synthetic definition; not physically validated.';
export const documents = [
  { ...base, _id:'cultivar-a', _type:'cultivar', label:'Fictional garden bean' },
  { ...base, _id:'lot-a', _type:'seedLot', label:'Demo lot A', cultivar:ref('cultivar-a') },
  { ...base, _id:'lot-b', _type:'seedLot', label:'Demo lot B', cultivar:ref('cultivar-a') },
  { ...base, _id:'protocol-1', _type:'testProtocol', label:'Paper observation', version:'1', criterion, days:[0,3,7], finalDay:7 },
  { ...base, _id:'protocol-2', _type:'testProtocol', label:'Extended observation', version:'2', criterion, days:[0,3,10], finalDay:10 },
  ...[
    ['batch-a','Replicate A','lot-a','protocol-1',20,'Paper / room A'],
    ['batch-b','Replicate B','lot-a','protocol-1',20,'Paper / room A'],
    ['batch-c','Unobserved day','lot-a','protocol-1',20,'Paper / room A'],
    ['batch-d','Different endpoint','lot-b','protocol-2',20,'Paper / room A'],
    ['batch-e','Measured zero','lot-b','protocol-1',20,'Paper / room A']
  ].map(([id,label,lot,protocol,sampleSize,conditions]) => ({...base,_id:id,_type:'testBatch',label,lot:ref(lot),protocol:ref(protocol),sampleSize,conditions,startDate:'2026-09-20'})),
  ...[
    ['batch-a',[0,9,16]],['batch-b',[0,8,14]],['batch-c',[0,null,15]],['batch-d',[0,7,18]],['batch-e',[0,0,0]]
  ].flatMap(([batch,counts]) => counts.map((count,i) => {
    const day = i === 2 && batch === 'batch-d' ? 10 : [0,3,7][i];
    const date = new Date('2026-09-20T00:00:00Z');date.setUTCDate(date.getUTCDate()+day);
    return {...base,_id:`${batch}-day-${day}`,_type:'observation',batch:ref(batch),day,date:date.toISOString().slice(0,10),state:count === null ? 'missing':'observed',count,note:'Invented demonstration record; no physical experiment performed.'};
  }))
];
export function fixtureBatches() {
  return documents.filter(d=>d._type==='testBatch').map(b => {
    const lot=documents.find(d=>d._id===b.lot._ref);
    return {...b,lotId:lot._id,lotLabel:lot.label,cultivarId:lot.cultivar._ref,cultivarLabel:documents.find(d=>d._id===lot.cultivar._ref).label,protocol:documents.find(d=>d._id===b.protocol._ref),observations:documents.filter(d=>d._type==='observation'&&d.batch._ref===b._id),revisions:[]};
  });
}
