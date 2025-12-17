const axios = require("axios");
const config = require("config");
const crypto = require("crypto");
const logger = require("./logger");

const TF2_VOICES = config.get("fakeYou.voices");
const MAX_RETRIES = 5;
const INITIAL_WAIT_TIME = 5000; // Start with a 5-second wait

async function generateAllTTS(dialogueLines) {
  const totalRequests = dialogueLines.length;
  let results = [];

  logger.info(`📢 Starting sequential TTS processing for ${totalRequests} dialogue lines.`);

  for (let i = 0; i < totalRequests; i++) {
    let { character, dialogue } = dialogueLines[i];

    if (!dialogue || dialogue.trim() === "") {
      logger.warn(`⚠️ Skipping TTS for ${character} - No valid text.`);
      results.push("TTS generation failed");
      continue;
    }

    let attempt = 0;
    let success = false;
    let audioURL = null;
    let waitTime = INITIAL_WAIT_TIME;

    while (attempt < MAX_RETRIES && !success) {
      try {
        attempt++;
        logger.info(`🔄 Generating TTS (${i + 1}/${totalRequests}): ${character} (Attempt ${attempt}/${MAX_RETRIES})`);
        audioURL = await requestTTS(character, dialogue);

        if (audioURL) {
          success = true;
          logger.info(`✅ TTS completed for ${character} on attempt ${attempt}`);
        } else {
          logger.warn(`⚠️ TTS attempt ${attempt} failed for ${character}. Retrying in ${waitTime / 1000} seconds...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          waitTime *= 2; // Exponential backoff
        }
      } catch (error) {
        if (error.response && error.response.status === 429) {
          let retryAfter = error.response.headers["retry-after"];
          if (retryAfter) {
            waitTime = parseInt(retryAfter, 10) * 1000; // Use API-provided delay
          } else {
            waitTime *= 2; // Otherwise, use exponential backoff
          }
          logger.warn(`🚦 FakeYou API Rate Limit Hit! Retrying in ${waitTime / 1000} seconds...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        } else {
          logger.error(`❌ TTS Failed for ${character} on attempt ${attempt}: ${error.message}`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          waitTime *= 2; // Exponential backoff
        }
      }
    }

    results.push(audioURL || "TTS generation failed");
  }

  // 🎉 Final Summary Report
  const successCount = results.filter(url => url !== "TTS generation failed").length;
  logger.info(`🎉 TTS processing complete: ${successCount}/${totalRequests} successful.`);
  
  return results;
}

async function requestTTS(character, dialogue) {
  const modelId = TF2_VOICES[character.replace(/^(RED|BLU)\s+/i, "")];
  if (!modelId) {
    logger.error(`❌ Invalid character for TTS: ${character}`);
    return null;
  }

  try {
    logger.info(`📢 Sending TTS request for ${character}...`);

    const response = await axios.post("https://api.fakeyou.com/tts/inference", {
      uuid_idempotency_token: crypto.randomUUID(),
      tts_model_token: modelId,
      inference_text: dialogue
    });

    if (!response.data.success) throw new Error(`TTS Request Failed: ${JSON.stringify(response.data)}`);

    const jobToken = response.data.inference_job_token;
    return await waitForTTSCompletion(jobToken, character);
  } catch (error) {
    logger.error(`❌ TTS Error: ${error.message}`);
    return null;
  }
}

async function waitForTTSCompletion(jobToken, character) {
  let jobStatus = "pending";
  let attemptCount = 0;
  const maxAttempts = 30; // ✅ Retry up to 30 times (~150 seconds max)
  const retryDelayMs = 5000;

  while (jobStatus !== "complete_success" && attemptCount < maxAttempts) {
    logger.info(`⏳ Waiting for TTS generation for ${character} (Attempt ${attemptCount + 1}/${maxAttempts})...`);
    await new Promise(resolve => setTimeout(resolve, retryDelayMs));

    const statusResponse = await axios.get(`https://api.fakeyou.com/tts/job/${jobToken}`);
    jobStatus = statusResponse.data.state.status;

    if (jobStatus === "complete_success") {
      logger.info(`✅ TTS generation completed for ${character}.`);
      return `https://cdn-2.fakeyou.com${statusResponse.data.state.maybe_public_bucket_wav_audio_path}`;
    }

    attemptCount++;
  }

  logger.error(`❌ TTS generation timed out for ${character}.`);
  return null;
}

module.exports = { generateAllTTS };
