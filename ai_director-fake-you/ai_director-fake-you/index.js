const express = require("express");
const config = require("config");
const cron = require("node-cron");
const storyController = require("./src/storyController");

const app = express();
app.use(express.json());
const port = 3001;

// Ensure imported functions exist
if (!storyController.suggestTopic) console.error("❌ Error: suggestTopic function is missing in storyController.js");
if (!storyController.getScenario) console.error("❌ Error: getScenario function is missing in storyController.js");
if (!storyController.deleteTopic) console.error("❌ Error: deleteTopic function is missing in storyController.js");

if (storyController.suggestTopic) app.post("/story/suggest", storyController.suggestTopic);
if (storyController.getScenario) app.get("/story/getScenario", storyController.getScenario);
if (storyController.deleteTopic) app.post("/story/delete", storyController.deleteTopic);

cron.schedule("*/5 * * * * *", () => {
    if (storyController.generateStory) {
        storyController.generateStory();
    } else {
        console.error("❌ Error: generateStory function is missing in storyController.js");
    }
});

app.listen(port, () => {
    console.log(`🎬 Director is listening on port ${port}`);
});
