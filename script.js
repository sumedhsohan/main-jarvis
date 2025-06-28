const userName = "Sumedh";
const mistralApiKey = "2R3RREFbjIOndWQvSGULwXeKG8CJpF6y"; // Replace with your real API key

function getCurrentDateTime() {
  const now = new Date();
  const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const timeOptions = { hour: '2-digit', minute: '2-digit' };
  const dateStr = now.toLocaleDateString('en-US', dateOptions);
  const timeStr = now.toLocaleTimeString('en-US', timeOptions);
  return { date: dateStr, time: timeStr };
}

function speak(text) {
  if (speechSynthesis.speaking) {
    speechSynthesis.cancel();
  }

  const utterance = new SpeechSynthesisUtterance(text);
  const voices = speechSynthesis.getVoices();
  utterance.voice = voices.find(v => v.name.toLowerCase().includes("female") || v.name.toLowerCase().includes("zira")) || voices[0];
  utterance.rate = 1;
  speechSynthesis.speak(utterance);
}

function greetUser() {
  const { date, time } = getCurrentDateTime();
  const greeting = `Hello ${userName}, today is ${date}. It's ${time}. How can I assist you?`;
  addMessage(greeting, "ai");
  speak(greeting);
  document.getElementById("speakBtn").style.display = "inline-block";
}

async function askMistral(question) {
  const url = "https://api.mistral.ai/v1/chat/completions";

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${mistralApiKey}`
    },
    body: JSON.stringify({
      model: "mistral-small",
      messages: [
        { role: "system", content: "You are Jarvis, a helpful assistant." },
        { role: "user", content: question }
      ]
    })
  });

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "Sorry, I couldn't find an answer.";
}

function addMessage(text, type) {
  const msg = document.createElement('div');
  msg.className = `message ${type}`;
  msg.innerText = text;
  document.getElementById('output').appendChild(msg);
  msg.scrollIntoView({ behavior: "smooth" });

  if (type === "ai") speak(text);
}

function processCommand(command) {
  addMessage(command, "user");

  if (command.includes("your name")) {
    addMessage("I am Jarvis, your AI assistant.", "ai");
  } else if (command.includes("my name")) {
    addMessage(`Your name is ${userName}.`, "ai");
  } else if (command.includes("time") || command.includes("date")) {
    const { date, time } = getCurrentDateTime();
    addMessage(`Today is ${date}, and the time is ${time}.`, "ai");
  } else {
    askMistral(command).then(answer => addMessage(answer, "ai"));
  }
}

function startSingleRecognition() {
  if (speechSynthesis.speaking) speechSynthesis.cancel();

  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.onresult = event => {
    const transcript = event.results[0][0].transcript.trim();
    processCommand(transcript.toLowerCase());
  };
  recognition.start();
}

window.onload = () => {
  setTimeout(() => {
    speechSynthesis.onvoiceschanged = greetUser;

    // 🎙️ Speak button
    document.getElementById("speakBtn").addEventListener("click", () => {
      if (speechSynthesis.speaking) speechSynthesis.cancel();
      speak("Listening...");
      startSingleRecognition();
    });

    // ⌨️ Text input + send
    const input = document.getElementById("textInput");
    const sendBtn = document.getElementById("sendBtn");

    sendBtn.addEventListener("click", () => {
      const text = input.value.trim();
      if (text !== "") {
        processCommand(text.toLowerCase());
        input.value = "";
      }
    });

    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        sendBtn.click();
      }
    });
  }, 1000);
};
