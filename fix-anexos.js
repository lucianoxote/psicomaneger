const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    throw new Error('.env.local não encontrado');
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = {};
  envContent.split(/\r?\n/).forEach((line) => {
    const match = line.match(/^([A-Za-z0-9_]+)=(.*)$/);
    if (match) {
      env[match[1]] = match[2];
    }
  });

  return env;
}

async function fixAnexos() {
  const env = loadEnv();
  const uri = env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI não encontrada em .env.local');
  }

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();

  console.log('Fixing anexos...');

  // Find anexos without tenantId
  const anexosWithoutTenant = await db.collection('anexos').find({ tenantId: { $exists: false } }).toArray();
  console.log(`Found ${anexosWithoutTenant.length} anexos without tenantId`);

  for (const anexo of anexosWithoutTenant) {
    console.log('Anexo:', anexo.pacienteId, anexo.pacienteNome);

    // Try to find by pacienteId first
    if (anexo.pacienteId) {
      const paciente = await db.collection('pacientes').findOne({ _id: anexo.pacienteId });
      if (paciente) {
        console.log(`Found paciente by ID: ${paciente.nome}, tenantId: ${paciente.tenantId}`);
        await db.collection('anexos').updateOne(
          { _id: anexo._id },
          { $set: { tenantId: paciente.tenantId } }
        );
        console.log('Anexo fixed!');
        continue;
      }
    }

    // Fallback to main tenant
    console.log('Using fallback tenantId');
    await db.collection('anexos').updateOne(
      { _id: anexo._id },
      { $set: { tenantId: '69ced783eefbb6f337cd6d70' } } // lucianoxote@hotmail.com tenantId
    );
  }

  await client.close();
  console.log('Done!');
}

fixAnexos().catch(console.error);