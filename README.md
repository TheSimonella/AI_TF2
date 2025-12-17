# AI_TF2: Automated AI Show Generator

An automated, interactive "TV show" generator featuring Team Fortress 2 characters. This system allows users to suggest topics via Discord, which are then turned into scripts by an LLM, voiced by AI (FakeYou), and acted out in a Unity 3D environment.

![Architecture Diagram](./architecture_diagram_v2.png)

## 📺 Watch the Demo

[![AI_TF2 Demo](https://img.youtube.com/vi/btB0fUyeYF8/0.jpg)](https://www.youtube.com/watch?v=btB0fUyeYF8&t=14318s)

*Click the image above to watch a demo of the system in action (starts at 3:58:38).*

## Download & Play

**[Download the latest release here](https://github.com/TheSimonella/AI_TF2/releases)**

> [!IMPORTANT]
> **You must run the backend services locally for the client to work.**
> The client connects to `localhost:3001` to fetch stories. If you only run the `.exe`, it will sit on a loading screen forever.

## Prerequisites

To run the full system (Backend + Client), you need:

1.  **Node.js** (v16+): [Download](https://nodejs.org/)
2.  **MongoDB**: [Download Community Server](https://www.mongodb.com/try/download/community) or use [MongoDB Atlas](https://www.mongodb.com/atlas).
3.  **Local LLM**: A text generation API running on port `5001`. We recommend [Oobabooga Text Generation WebUI](https://github.com/oobabooga/text-generation-webui) with the `api` flag enabled.
4.  **FakeYou Account**: Sign up at [FakeYou.com](https://fakeyou.com/) (needed for voice generation).
5.  **Unity** (Optional): Only needed if you want to modify the game client (add characters, maps, etc.). Recommended version: 2021.3 LTS.

## Setup Guide

### 1. Configure the Director (The Brain)
1.  Navigate to `ai_director-fake-you/ai_director-fake-you`.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file (copy from `.env.example`) and fill in your details:
    ```env
    OPENAI_API_KEY=sk-... (Or your local LLM key if applicable)
    MONGODB_URI=mongodb://localhost:27017/Director
    ```
    *Note: By default, the system expects a Local LLM on port 5001. If using OpenAI, you may need to modify `src/storyController.js`.*

### 2. Configure the Discord Bot (The Interface)
1.  Navigate to `ai_discord_bot-main/ai_discord_bot-main`.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file:
    ```env
    DISCORD_TOKEN=your_bot_token
    MONGODB_URI=mongodb://localhost:27017/Director
    ```

### 3. Launching the Show
Order matters! Run these in separate terminals:

1.  **Start the Director**:
    ```bash
    cd ai_director-fake-you/ai_director-fake-you
    npm start
    ```
2.  **Start the Bot**:
    ```bash
    cd ai_discord_bot-main/ai_discord_bot-main
    npm start
    ```
3.  **Start the Client**:
    *   **Players**: Run `2fort.exe` from the downloaded release.
    *   **Developers**: Open the `2fort` folder in Unity and press Play.

## Customization Guide

Want to change the show? Here is how to modify each part.

### 🧠 Changing the LLM / Story
To change how stories are written (e.g., make them scarier, funnier, or use different characters):
1.  Open `ai_director-fake-you/ai_director-fake-you/config/default.json`.
2.  Edit the `chatGpt.dialoguePrompt` field.
    *   **Tip**: Keep the formatting instructions (`'Character Name: Dialogue'`) intact, or the system won't be able to parse the script!

### 🎭 Adding New Characters
This requires changes in **both** the Director and Unity.

1.  **Director (Voices)**:
    *   Find a voice model token on [FakeYou.com](https://fakeyou.com/).
    *   Open `ai_director-fake-you/ai_director-fake-you/config/default.json`.
    *   Add the character to the `fakeYou.voices` list: `"MyChar": "model_token_here"`.
    *   Update the `dialoguePrompt` to include the new character name.

2.  **Unity (Visuals)**:
    *   Import your character model into the `2fort` Unity project.
    *   Add the `CharacterBehaviour` script to the model.
    *   Assign an **Animator Controller** with `walking`, `talking`, and `idling` boolean parameters.
    *   Find the `ScenarioManager` object in the scene.
    *   Add your new character GameObject to the `Characters` list in the Inspector.
    *   **Important**: The GameObject name in Unity MUST match the name used in `default.json` exactly.

### 🗺️ Changing the Map
1.  Create a new Scene in Unity.
2.  Copy the `ScenarioManager` object from the `SampleScene` to your new scene.
3.  Move the characters and cameras to fit your new map.
4.  Bake the NavMesh (Window > AI > Navigation) so characters can walk around.

### 💃 Adding Custom Actions (Dancing, Fighting)
Currently, the system only supports **Talking**, **Walking**, and **Idling**. To add new actions:
1.  **Unity**: Add the animation to your Animator Controller and create a trigger/bool (e.g., `dancing`).
2.  **Code**: Modify `CharacterBehaviour.cs` to handle the new state.
3.  **Logic**: Modify `ScenarioManager.cs` to trigger the action.
    *   *Advanced*: You will need to update the LLM prompt to output actions (e.g., `[Action: Dance]`) and update `storyController.js` to parse them.

## License

[ISC](LICENSE)
