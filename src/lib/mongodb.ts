import { MongoClient, MongoClientOptions } from 'mongodb';

if (!process.env.MONGODB_URI) {
  if (process.env.NODE_ENV !== 'production') {
    throw new Error('Please add your Mongo URI to .env.local');
  }
}

const uri = process.env.MONGODB_URI || '';

// Opções otimizadas para serverless (Vercel)
const options: MongoClientOptions = {
  maxPoolSize: 10,          // máximo de conexões simultâneas por instância
  minPoolSize: 1,           // manter pelo menos 1 conexão aquecida
  maxIdleTimeMS: 30000,     // descartar conexões ociosas após 30s
  serverSelectionTimeoutMS: 5000, // timeout de seleção do servidor
  socketTimeoutMS: 30000,   // timeout de socket
};

let clientPromise: Promise<MongoClient>;

// CRÍTICO: Em produção (Vercel serverless), o global é o único jeito
// de reutilizar conexões entre invocações da mesma instância.
// Sem isso, cada requisição abre uma nova conexão TCP → lentidão!
if (!(global as any)._mongoClientPromise) {
  const client = new MongoClient(uri, options);
  (global as any)._mongoClientPromise = uri ? client.connect() : new Promise(() => {});
}

clientPromise = (global as any)._mongoClientPromise;

export default clientPromise;
