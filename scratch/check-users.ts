import clientPromise from './src/lib/mongodb.ts';

async function checkLiviaId() {
  const client = await clientPromise;
  const db = client.db();
  const livia = await db.collection('users').findOne({ email: 'psi.liviabrito@gmail.com' });
  const luciano = await db.collection('users').findOne({ email: 'lucianoxote@hotmail.com' });
  
  console.log('--- USERS ---');
  if (livia) console.log('Livia ID:', livia._id.toString());
  if (luciano) console.log('Luciano ID:', luciano._id.toString());
}

checkLiviaId().catch(console.error);
