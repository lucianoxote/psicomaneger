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

async function checkData() {
  const env = loadEnv();
  const uri = env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI não encontrada em .env.local');
  }

  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  await client.connect();
  const db = client.db();

  console.log('Checking data status...\n');

  // Check users
  const users = await db.collection('users').find({}).toArray();
  console.log('Users:');
  users.forEach(user => {
    console.log(`  ${user.email}: tenantId=${user.tenantId}, _id=${user._id}`);
  });

  // Check collections
  const collections = ['pacientes', 'agendamentos', 'sessoes', 'financeiro', 'tarefas', 'comunicacao_familia', 'configuracoes', 'anexos'];

  for (const collection of collections) {
    console.log(`\n${collection.toUpperCase()}:`);
    const docs = await db.collection(collection).find({}).limit(3).toArray();
    docs.forEach(doc => {
      console.log(`  tenantId: ${doc.tenantId}, userId: ${doc.userId}`);
    });

    const withTenant = await db.collection(collection).countDocuments({ tenantId: { $exists: true } });
    const withoutTenant = await db.collection(collection).countDocuments({ tenantId: { $exists: false } });
    console.log(`  With tenantId: ${withTenant}, Without tenantId: ${withoutTenant}`);
  }

  await client.close();
}

checkData().catch(console.error);