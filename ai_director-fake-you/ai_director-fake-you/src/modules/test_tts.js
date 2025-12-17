const axios = require("axios");
const readline = require("readline");
const crypto = require("crypto");  // Import crypto for UUID generation

// Mapping TF2 characters to their correct weight model tokens
const TF2_VOICES = {
  Scout: "weight_bwbb3f6zq39wx37ppnagbzcx6",
  Engineer: "weight_ppqs5038bvkm6wc29w0xfebzy",  // Ensure this is correct
  Soldier: "weight_d93dk482gjrvxjssvkeh1jp7m",
  Medic: "weight_fdcf1csc43mmnza5t9pbdhs5c",
  Demoman: "weight_w57evactjaav749evbv9n4wdj",
  Spy: "weight_fnpejsx4hkzcn9150ahyqgkmj",
  Heavy: "weight_gvy6kw2qjym9zt0xxffrq0pz6",
  Sniper: "weight_d6s8p0ennetbj132eqgrcan47",
  Pyro: "weight_msq6440ch8hj862nz5y255n8j"
};

// Create interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function requestTTS(character, text) {
  try {
    if (!TF2_VOICES[character]) {
      console.error("❌ Error: Invalid character name. Make sure you entered one of the TF2 characters.");
      return;
    }

    console.log(`📢 Sending TTS request for ${character}...`);

    const response = await axios.post("https://api.fakeyou.com/tts/inference", {
      uuid_idempotency_token: crypto.randomUUID(),  // Ensure valid UUID format
      tts_model_token: TF2_VOICES[character], // Use weight-based model token
      inference_text: text
    });

    if (!response.data.success) {
      console.error("❌ TTS request failed:", response.data);
      return;
    }

    const jobToken = response.data.inference_job_token;
    console.log(`✅ TTS Request Successful! Job Token: ${jobToken}`);

    // Poll for job completion
    let jobStatus = "pending";
    let audioPath = null;
    let attemptCount = 0;

    while (jobStatus !== "complete_success" && attemptCount < 20) { // Retry up to 20 times
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds between status checks

      const statusResponse = await axios.get(`https://api.fakeyou.com/tts/job/${jobToken}`);
      if (!statusResponse.data.success) {
        console.error("❌ Error fetching job status:", statusResponse.data);
        return;
      }

      jobStatus = statusResponse.data.state.status;
      console.log(`🔄 Job Status: ${jobStatus}`);

      if (jobStatus === "attempt_failed") {
        console.log("⚠️ Job attempt failed. Possible issue with the voice model.");
        console.log("🔍 Full API Response:", statusResponse.data);
        return;
      }

      if (jobStatus === "complete_success") {
        audioPath = statusResponse.data.state.maybe_public_bucket_wav_audio_path;
      }

      attemptCount++;
    }

    if (!audioPath) {
      console.error("❌ Error: No audio file path found in response.");
      return;
    }

    // ✅ Fix the audio URL to use the new FakeYou CDN
    const audioURL = `https://cdn-2.fakeyou.com${audioPath}`;
    console.log(`🎧 Play audio here: ${audioURL}`);
    console.log("📂 To manually download: Copy & paste the link into your browser.");

  } catch (error) {
    console.error("❌ Error:", error.response ? error.response.data : error.message);
  }
}

// Prompt user for input
rl.question("Enter the name of a TF2 character (Scout, Soldier, etc.): ", (character) => {
  rl.question("Enter the text you want them to say: ", (text) => {
    requestTTS(character, text);
    rl.close();
  });
});
