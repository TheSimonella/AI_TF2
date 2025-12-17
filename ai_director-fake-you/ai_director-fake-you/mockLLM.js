const express = require("express");
const app = express();
app.use(express.json());

app.post("/v1/chat/completions", (req, res) => {
  // Log the incoming request for debugging purposes
  console.log("Received LLM request:", req.body);
  
  // Create a simple mock response.
  // The expected format is an object with a 'choices' array,
  // and each choice has a 'message' object with a 'content' field.
  const sampleResponse = {
    choices: [
      {
        message: {
          content: `RED Scout: Hey, this is a test line\nBLU Heavy: Sure is funny!`
        }
      }
    ]
  };
  res.json(sampleResponse);
});

const port = 5001;
app.listen(port, () => {
  console.log(`Mock LLM server listening on port ${port}`);
});
