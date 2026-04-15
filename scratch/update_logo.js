const { MongoClient } = require('mongodb');
const uri = process.env.MONGODB_URI;

async function run() {
  const client = new MongoClient('mongodb+srv://lucianoxote:23vF3k8uW55rKkUS@cluster0.p813x.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0');
  try {
    await client.connect();
    const db = client.db('test'); // Replace with your actual DB if different
    
    // The previous migration revealed Livia's DB uses 'test' or 'psicomanager'
    // Let's check collections
    const collections = await db.listCollections().toArray();
    console.log(collections.map(c => c.name));
    
    // Update Luciano
    const user = await db.collection('users').findOne({ email: 'lucianoxote@hotmail.com' });
    if (user) {
        await db.collection('configuracoes').updateOne(
            { userId: user._id.toString() },
            { $set: { logoUrl: '/images/logo_admin_synapsis.png' } },
            { upsert: true }
        );
        console.log('Database updated successfully for Luciano.');
    } else {
        console.log('User not found.');
    }
  } finally {
    await client.close();
  }
}
run();
