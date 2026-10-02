import {defineConfig} from 'sanity';
import {structureTool} from 'sanity/structure';
import {schemaTypes} from './vendor/notebook/sanity/schemaTypes.mjs';
export default defineConfig({
  name:'germination-notebook',title:'Germination Notebook',
  projectId:'pa0x69l2',dataset:'production',
  plugins:[structureTool()],schema:{types:schemaTypes},
});
