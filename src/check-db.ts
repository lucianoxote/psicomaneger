import clientPromise from './src/lib/mongodb.ts';

async function checkUsers() {
  const client = await clientPromise;
  const db = client.db();
  const users = await db.collection('users').find({}).toArray();
  console.log('--- USERS ---');
  users.forEach(u => console.log(u._id, u.email, u.name));
  
  const patientsCount = await db.collection('pacientes').countDocuments();
  console.log('\n--- DATA ---');
  console.log('Total Patients:', patientsCount);
}

checkUsers().catch(console.error);
