const { MongoClient } = require('mongodb');
const uri = "mongodb+srv://admin-dij:T7Ua1aRXiECf5VsS@cluster0.2cgv73m.mongodb.net/psicomanager_db?retryWrites=true&w=majority";

async function run() {
    const client = new MongoClient(uri);
    try {
        console.log("Tentando conectar ao MongoDB...");
        await client.connect();
        console.log("CONEXÃO BEM-SUCEDIDA!");
        const databases = await client.db().admin().listDatabases();
        console.log("Bancos de dados encontrados:");
        databases.databases.forEach(db => console.log(` - ${db.name}`));
    } catch (e) {
        console.error("ERRO DE CONEXÃO DETECTADO:");
        console.error(e);
    } finally {
        await client.close();
    }
}
run();
