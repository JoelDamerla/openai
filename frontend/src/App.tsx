import { useState } from "react";

import "./App.css";

import WorldCard from "./components/WorldCard.tsx";
 
function App() {

  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);

  const [input, setInput] = useState("");

  const [worldEntity, setWorldEntity] = useState<any>(null);

  const [world, setWorld] = useState("");

  const [name, setName] = useState("");
 
  const sendMessage = async () => {

    if (!input.trim()) return;

    const newMessages = [...messages, { role: "user", content: input }];

    setMessages(newMessages);

    setInput("");

    const res = await fetch("http://localhost:5000/api/chat", {

      method: "POST",

      headers: { "Content-Type": "application/json" },

      body: JSON.stringify({ messages: newMessages }),

    });

    const data = await res.json();

    if (data.message) setMessages([...newMessages, { role: "assistant", content: data.message.content }]);

  };
 
  const generateStage2 = async () => {

    if (!world || !name) return;

    const res = await fetch("http://localhost:5000/api/stage2", {

      method: "POST",

      headers: { "Content-Type": "application/json" },

      body: JSON.stringify({ world, name }),

    });

    const data = await res.json();

    if (data.worldEntity) setWorldEntity(data.worldEntity);

  };
 
  const generateWorld = async () => {

    if (!world || !name) return;

    const res = await fetch("http://localhost:5000/api/world", {

      method: "POST",

      headers: { "Content-Type": "application/json" },

      body: JSON.stringify({ world, name }),

    });

    const data = await res.json();

    if (data.worldEntity) setWorldEntity(data.worldEntity);

  };
 
  return (
<div className="app-container">
<div className="chat-box">
<div className="messages">

          {messages.map((msg, i) => (
<div key={i} className={`message ${msg.role}`}>

              {msg.content}
</div>

          ))}
</div>
<div className="input-container">
<input

            type="text"

            value={input}

            onChange={(e) => setInput(e.target.value)}

            onKeyDown={(e) => e.key === "Enter" && sendMessage()}

            placeholder="Type your message..."

          />
<button onClick={sendMessage}>Send</button>
</div>
</div>
 
      <div className="world-controls">
<input type="text" value={world} onChange={(e) => setWorld(e.target.value)} placeholder="Enter world" />
<input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter name" />
<button onClick={generateStage2}>Stage 2</button>
<button onClick={generateWorld}>Stage 3 (Image)</button>
</div>
 
      {worldEntity && <WorldCard data={worldEntity} />}
</div>

  );

}
 
export default App;

 