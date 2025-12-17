const { MongoClient, ObjectId } = require('mongodb');
const config = require('config');
const logger = require('./logger');

const uri = config.get("mongoDb.connectionString")
  .replace('<password>', config.get("mongoDb.password"))
  .replace('<username>', config.get("mongoDb.username"));

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
let db;

async function connect() {
  if (db) return db;
  try {
    await client.connect();
    db = client.db("Director");
    logger.info("Connected to MongoDB");
    return db;
  } catch (error) {
    logger.error("Failed to connect to MongoDB", error);
    throw error;
  }
}

// Get the oldest topic from the proposed_topics collection (sorted by date ascending)
async function getOldestTopic() {
  const database = await connect();
  return database.collection("proposed_topics").findOne({}, { sort: { date: 1 } });
}

// Store the generated story into generated_topics collection
async function storeStory(storyData) {
  const database = await connect();
  return database.collection("generated_topics").insertOne(storyData);
}

// Remove a topic from proposed_topics collection by its _id
async function moveTopicToGenerated(topicId) {
  const database = await connect();
  return database.collection("proposed_topics").deleteOne({ _id: new ObjectId(topicId) });
}

module.exports = { connect, client, getOldestTopic, storeStory, moveTopicToGenerated };
