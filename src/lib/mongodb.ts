import { MongoClient } from 'mongodb';

if (!process.env.MONGODB_URI) {
  if (process.env.NODE_ENV === 'production') {
    console.warn('⚠️ MONGODB_URI não encontrada. Certifique-se de configurar as variáveis de ambiente na Vercel.');
  } else {
    throw new Error('Please add your Mongo URI to .env.local');
  }
}

const uri = process.env.MONGODB_URI || "";
const options = {};

if (!uri && process.env.NODE_ENV === 'production') {
  console.warn('⚠️ MONGODB_URI não encontrada. Certifique-se de configurar as variáveis de ambiente na Vercel.');
}

let client;
let clientPromise: Promise<MongoClient>;

if (!uri) {
  // During build time if MONGODB_URI is missing, provide a dummy promise to prevent crash
  clientPromise = new Promise(() => {}); 
} else if (process.env.NODE_ENV === 'development') {
  if (!(global as any)._mongoClientPromise) {
    client = new MongoClient(uri, options);
    (global as any)._mongoClientPromise = client.connect();
  }
  clientPromise = (global as any)._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;
