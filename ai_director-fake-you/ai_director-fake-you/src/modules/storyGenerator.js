// storyGenerator.js
const fetch = require('node-fetch');
const config = require('config');
const { ObjectId } = require('mongodb');
const dbService = require('./dbService');
const voiceService = require('./voiceService');
const logger = require('./logger');

// Global flag and step tracker to ensure sequential processing
let processingTopic = false;
let currentStep = '';

async function generateStory() {
  if (processingTopic) {
    logger.info(`Already processing a topic. Current step: ${currentStep}. Skipping new fetch.`);
    return;
  }
  processingTopic = true;
  
  currentStep = 'Waiting for topics';
  logger.info(`Step: ${currentStep}`);
  
  const db = await dbService.connect();
  try {
    // Retrieve the oldest topic from proposed_topics
    const topic = await db.collection("proposed_topics").findOne({}, { sort: { date: 1 } });
    if (!topic) {
      logger.info("No user-submitted topics available; waiting for new submissions.");
      processingTopic = false;
      return;
    }

    currentStep = 'Sending topic to LLM';
    logger.info(`Step: ${currentStep}`);
    const dialoguePrompt = config.get("chatGpt.dialoguePrompt").replace("<topic>", topic.topic);
    const requestBody = {
      messages: [{
        role: "user",
        content: dialoguePrompt
      }],
      temperature: 1
    };

    const response = await fetch("http://127.0.0.1:5001/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + config.get("chatGpt.secret")
      },
      body: JSON.stringify(requestBody)
    });
    
    currentStep = 'Waiting for LLM to finish script';
    logger.info(`Step: ${currentStep}`);
    const responseText = await response.text();
    let jsonResponse;
    try {
      jsonResponse = JSON.parse(responseText);
    } catch (err) {
      logger.error("Error parsing LLM response JSON:", err);
      processingTopic = false;
      return;
    }
    if (!jsonResponse.choices || !jsonResponse.choices[0].message.content) {
      logger.error("Unexpected LLM response structure:", jsonResponse);
      processingTopic = false;
      return;
    }
    
    let rawStory = jsonResponse.choices[0].message.content;
    logger.info(`Step: LLM script received. Preview: ${rawStory.substring(0, 100)}...`);
    
    currentStep = 'Parsing dialogue';
    logger.info(`Step: ${currentStep}`);
    const dialogueLines = processText(rawStory);
    logger.info(`Parsed ${dialogueLines.length} dialogue lines`);
    
    currentStep = 'Sending dialogue to FakeYou for TTS';
    logger.info(`Step: ${currentStep}`);
    
    // For each dialogue line, generate TTS audio sequentially
    let ttsResults = [];
    for (const line of dialogueLines) {
      logger.info(`Generating TTS for "${line.character}": "${line.dialogue}"`);
      const audioFilePath = await voiceService.generateTTS(line.character, line.dialogue);
      if (!audioFilePath) {
        logger.error(`TTS generation failed for character: ${line.character}`);
      }
      ttsResults.push(audioFilePath);
    }
    
    currentStep = 'TTS generation complete';
    logger.info(`Step: ${currentStep}`);
    
    // Build final story object with TTS file paths for each dialogue line
    const scenarios = dialogueLines.map((line, index) => ({
      character: line.character,
      dialogue: line.dialogue,
      audio: ttsResults[index] || null
    }));
    
    currentStep = 'Storing generated story in database';
    logger.info(`Step: ${currentStep}`);
    await db.collection("generated_topics").insertOne({
      requestor_id: topic.requestor_id,
      topic: topic.topic,
      story: scenarios
    });
    await db.collection("proposed_topics").deleteOne({ _id: new ObjectId(topic._id) });
    
    currentStep = 'Story generated and stored successfully';
    logger.info(`Step: ${currentStep}`);
    processingTopic = false;
  } catch (error) {
    logger.error("Error in generateStory:", error);
    processingTopic = false;
  }
}

function processText(rawStory) {
  // Split the generated text by newline and filter out empty lines
  const lines = rawStory.split("\n").filter(line => line.trim() !== "");
  const dialogues = [];
  for (const line of lines) {
    // Expect format "Character Name: Dialogue"
    const match = line.match(/^([\w\s]+):\s*(.+)$/);
    if (match) {
      dialogues.push({
        character: match[1].trim(),
        dialogue: match[2].trim()
      });
    }
  }
  return dialogues;
}

module.exports = { generateStory };
