import {writeFileSync,existsSync} from 'node:fs';
import {documents} from '../src/data/fixtures.mjs';
const destination=new URL('../sanity/synthetic-fixtures__v002.ndjson',import.meta.url);
if(existsSync(destination))throw new Error('Refusing to overwrite fixture export.');
writeFileSync(destination,documents.map(d=>JSON.stringify(d)).join('\n')+'\n',{flag:'wx'});
console.log(`${documents.length} explicitly synthetic documents exported; no remote write.`);
