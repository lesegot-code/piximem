import { MongoClient } from "mongodb";
import "dotenv/config";

let client;
let db;

export async function connectToMongoDB(){
    try{
        //connection string comes from backend/.env
        const uri = process.env.MONGODB_URI;
        if(!uri){
            throw new Error("MONGODB_URI is missing. Add it to backend/.env");
        }

        //give up after 10s instead of hanging
        client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });
        await client.connect();
        db = client.db("DBExample");
        console.log("You successfully connected to MongoDB!");

        return client;
    } 
    catch(err){
        console.error("MongoDB connection failed:", err.message);
        throw err;
    }
}

export function getDB(){
    if(!db){
        throw new Error("Database is not connected");
    }

    return db;
}

//lets routes check if the db is ready
export function isConnected(){
    return Boolean(db);
}

export async function disconnectFromMongoDB(){
    if(client) await client.close();
}
