import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const repoRoot = process.cwd();
const envPath = path.join(repoRoot, '.env');
const importedDataPath = path.join(repoRoot, 'src', 'data', 'importedPortfolio.ts');
const membersDir = path.join(repoRoot, 'public', 'imported', 'members');
const worksDir = path.join(repoRoot, 'public', 'imported', 'works');

function readEnv(filePath) {
  return Object.fromEntries(
    fs
      .readFileSync(filePath, 'utf8')
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => {
        const index = line.indexOf('=');
        return [line.slice(0, index), line.slice(index + 1)];
      })
  );
}

function loadImportedData(filePath) {
  const source = fs.readFileSync(filePath, 'utf8');
  const executable = source
    .replace(/^import .*$/m, '')
    .replace('export const importedMembers: Member[] =', 'const importedMembers =')
    .replace('export const importedCatalog: CatalogItem[] =', 'const importedCatalog =');

  return new Function(`${executable}\nreturn { importedMembers, importedCatalog };`)();
}

function fileMap(dirPath) {
  return new Map(
    fs.readdirSync(dirPath).map((fileName) => [fileName, path.join(dirPath, fileName)])
  );
}

async function uploadFile(supabase, bucket, storagePath, localPath) {
  const fileBuffer = fs.readFileSync(localPath);
  const { error } = await supabase.storage.from(bucket).upload(storagePath, fileBuffer, {
    upsert: true,
    contentType: storagePath.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg',
  });

  if (error) {
    throw new Error(`${storagePath}: ${error.message}`);
  }

  return supabase.storage.from(bucket).getPublicUrl(storagePath).data.publicUrl;
}

function storageRelativePath(publicPath) {
  return publicPath.replace(/^\//, '');
}

async function main() {
  const env = readEnv(envPath);
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY;
  const supabase = createClient(env.VITE_SUPABASE_URL, supabaseKey);
  const { importedMembers, importedCatalog } = loadImportedData(importedDataPath);
  const memberFiles = fileMap(membersDir);
  const workFiles = fileMap(worksDir);

  const { data: existingMembers, error: existingMembersError } = await supabase
    .from('members')
    .select('name');
  if (existingMembersError) {
    throw new Error(`members select failed: ${existingMembersError.message}`);
  }

  const { data: existingCatalog, error: existingCatalogError } = await supabase
    .from('catalog')
    .select('author,title');
  if (existingCatalogError) {
    throw new Error(`catalog select failed: ${existingCatalogError.message}`);
  }

  const existingMemberNames = new Set((existingMembers ?? []).map((item) => item.name));
  const existingCatalogKeys = new Set(
    (existingCatalog ?? []).map((item) => `${item.author}::${item.title}`)
  );

  const uploadedMemberRecords = [];
  for (const member of importedMembers) {
    const fileName = path.basename(member.image);
    const localPath = memberFiles.get(fileName);
    if (!localPath) {
      throw new Error(`Missing local member image: ${fileName}`);
    }

    const publicUrl = await uploadFile(supabase, 'images', `imported/members/${fileName}`, localPath);
    uploadedMemberRecords.push({ ...member, image: publicUrl });
  }

  const uploadedCatalogRecords = [];
  for (const work of importedCatalog) {
    const fileName = path.basename(work.image);
    const localPath = workFiles.get(fileName);
    if (!localPath) {
      throw new Error(`Missing local work image: ${fileName}`);
    }

    const publicUrl = await uploadFile(supabase, 'images', `imported/works/${fileName}`, localPath);
    uploadedCatalogRecords.push({ ...work, image: publicUrl });
  }

  const membersToInsert = uploadedMemberRecords.filter((member) => !existingMemberNames.has(member.name));
  const catalogToInsert = uploadedCatalogRecords
    .filter((work) => !existingCatalogKeys.has(`${work.author}::${work.title}`))
    .map(({ id, title, author, image }) => ({ id, title, author, image }));

  if (membersToInsert.length > 0) {
    const { error } = await supabase.from('members').insert(membersToInsert);
    if (error) {
      throw new Error(`members insert failed: ${error.message}`);
    }
  }

  if (catalogToInsert.length > 0) {
    const { error } = await supabase.from('catalog').insert(catalogToInsert);
    if (error) {
      throw new Error(`catalog insert failed: ${error.message}`);
    }
  }

  console.log(
    JSON.stringify(
      {
        uploadedMembers: uploadedMemberRecords.length,
        uploadedWorks: uploadedCatalogRecords.length,
        insertedMembers: membersToInsert.length,
        insertedWorks: catalogToInsert.length,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
