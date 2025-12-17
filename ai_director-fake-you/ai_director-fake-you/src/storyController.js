const axios = require("axios");
const { ObjectId } = require("mongodb");
const dbService = require("./modules/dbService");
const config = require("config");
const logger = require("./modules/logger");
const voiceService = require("./modules/voiceService");

const LLM_API_URL = "http://127.0.0.1:5001/v1/chat/completions";
const MAX_WAIT_TIME = 300000; // 5 minutes wait time for LLM response

let isProcessing = false;

/**
 * Generates a story based on user-submitted topics.
 */
async function generateStory() {
  if (isProcessing) {
    return;
  }

  isProcessing = true;

  const db = await dbService.connect();
  try {
    logger.info("Step: Waiting for topics");
    const topic = await db.collection("proposed_topics").findOne({});
    if (!topic) {
      logger.info("⚠️ No topics available.");
      isProcessing = false;
      return;
    }

    logger.info("Step: Sending topic to LLM and waiting for response");
    const prompt = config.get("chatGpt.dialoguePrompt").replace("<topic>", topic.topic);

    const requestBody = {
      messages: [{ role: "user", content: prompt }],
      temperature: 1.0,
    };

    let response;
    try {
      response = await axios.post(LLM_API_URL, requestBody, {
        headers: { "Content-Type": "application/json" },
        timeout: MAX_WAIT_TIME,
      });
    } catch (error) {
      logger.error(`❌ Error communicating with LLM: ${error.message}`);
      isProcessing = false;
      return;
    }

    if (!response.data?.choices?.length) {
      logger.error("⚠️ LLM returned an invalid response.");
      isProcessing = false;
      return;
    }

    const rawStory = response.data.choices[0].message.content;
    const parsedDialogue = parseDialogue(rawStory);
    if (parsedDialogue.length === 0) {
      logger.error("⚠️ Parsed dialogue is empty. Aborting processing.");
      isProcessing = false;
      return;
    }

    logger.info("Step: Sending dialogue to FakeYou for TTS");
    const ttsResults = await voiceService.generateAllTTS(parsedDialogue);

    const scenarioData = {
      requestor_id: topic.requestor_id, // ✅ Ensure requestor name is stored
      topic: topic.topic,
      scenario: parsedDialogue.map((line, index) => ({
        character: line.character,
        text: line.dialogue,
        sound: ttsResults[index] || "TTS generation failed",
      })),
    };

    await db.collection("generated_topics").insertOne(scenarioData);
    await db.collection("proposed_topics").deleteOne({ _id: topic._id });
    logger.info(`✅ Story generated successfully for requestor: ${topic.requestor_id}`);

  } catch (error) {
    logger.error(`❌ Error in generateStory: ${error.message}`);
  } finally {
    isProcessing = false;
  }
}

/**
 * ✅ Parses raw story text into structured dialogue.
 */
function parseDialogue(story) {
  return story
    .split("\n")
    .filter(line => line.trim() !== "")
    .filter(line => !line.startsWith("Generate a conversation script")) // ✅ IGNORE LLM Prompt Repeats
    .map(line => {
      const match = line.match(/^([\w\s]+):\s*(.+)$/);
      if (!match) {
        logger.error(`⚠️ Invalid dialogue format: "${line}"`);
        return null;
      }
      return {
        character: match[1].trim(),
        dialogue: match[2].trim()
      };
    })
    .filter(entry => entry !== null);
}

/**
 * ✅ Allows users to suggest a new topic.
 */
async function suggestTopic(req, res) {
  try {
    if (!req.body || !req.body.requestor_id || !req.body.topic) {
      return res.status(400).json({ status: "Failed", error: "Invalid request body" });
    }
    const db = await dbService.connect();
    await db.collection("proposed_topics").insertOne({
      requestor_id: req.body.requestor_id,
      topic: req.body.topic,
      date: new Date(),
    });

    logger.info(`✅ Topic submitted: ${req.body.topic}`);
    res.status(201).json({ status: "Success" });
  } catch (error) {
    logger.error(`❌ Error in suggestTopic: ${error.message}`);
    res.status(500).json({ status: "Failed", error: error.message });
  }
}

/**
 * ✅ Retrieves and removes the next generated scenario.
 */
async function getScenario(req, res) {
  try {
    const db = await dbService.connect();
    const scenario = await db.collection("generated_topics").findOneAndDelete({});
    if (scenario.value) {
      const { _id, ...cleanedScenario } = scenario.value; // ✅ Removes `_id`
      res.status(200).json(cleanedScenario);
    } else {
      res.status(204).json({ status: "No Scenarios Available" });
    }
  } catch (error) {
    logger.error(`❌ Error in getScenario: ${error.message}`);
    res.status(500).json({ status: "Failed", message: error.message });
  }
}

/**
 * ✅ Deletes a topic from the proposed_topics collection.
 */
async function deleteTopic(req, res) {
  try {
    const db = await dbService.connect();
    const result = await db.collection("proposed_topics").deleteOne({
      _id: new ObjectId(req.body._id),
    });
    if (result.deletedCount === 1) {
      res.status(200).json({ status: "Success", message: "Topic deleted" });
    } else {
      res.status(404).json({ status: "Failed", message: "Topic not found" });
    }
  } catch (error) {
    logger.error(`❌ Error in deleteTopic: ${error.message}`);
    res.status(500).json({ status: "Failed", message: error.message });
  }
}

/**
 * ✅ Ensures all necessary functions are exported.
 */
module.exports = { generateStory, suggestTopic, getScenario, deleteTopic };
