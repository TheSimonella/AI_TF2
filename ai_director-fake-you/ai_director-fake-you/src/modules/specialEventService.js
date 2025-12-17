const dbService = require('./dbService');
const logger = require('./logger');

async function handleSpecialEvent(specialEvent) {
  const db = await dbService.connect();
  try {
    await db.collection("generated_topics").insertOne({
      isSpecialEvent: true,
      specialEventName: specialEvent.name,
      scenario: specialEvent.scenarios
    });
    logger.info("Special event handled: " + specialEvent.name);
  } catch (error) {
    logger.error("Error handling special event:", error);
  }
}

module.exports = { handleSpecialEvent };
