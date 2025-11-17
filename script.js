import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";

const apiKeySetup = document.getElementById('apiKeySetup');
const chatContainer = document.getElementById('chatContainer');
const apiKeyInput = document.getElementById('apiKeyInput');
const saveApiKeyButton = document.getElementById('saveApiKeyButton');
const chatHistory = document.getElementById('chatHistory');
const messageInput = document.getElementById('messageInput');
const sendMessageButton = document.getElementById('sendMessageButton');
const typingIndicator = document.querySelector('.typing-indicator');
const suggestionArea = document.getElementById('suggestionArea');

let genAI;
let chat;
const GEMINI_API_KEY_LS = "GEMINI_API_KEY";

function initializeChat() {
    const apiKey = localStorage.getItem(GEMINI_API_KEY_LS);
    if (apiKey) {
        try {
            genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            chat = model.startChat({
                history: [],
                generationConfig: {
                    maxOutputTokens: 4000,
                },
            });
            apiKeySetup.classList.add('hidden');
            chatContainer.classList.remove('hidden');
        } catch (error) {
            console.error("Gemini API 初始化失敗:", error);
            alert("無效的 API 金鑰或初始化失敗，請重新輸入。");
            localStorage.removeItem(GEMINI_API_KEY_LS);
        }
    }
    toggleSuggestionArea();
}

function toggleSuggestionArea() {
    if (chatHistory.children.length === 0) {
        suggestionArea.classList.remove('hidden');
    } else {
        suggestionArea.classList.add('hidden');
    }
}

function appendMessage(sender, message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', `${sender}-message`);

    if (sender === 'model') {
        // 使用 marked.js 將 Markdown 轉換為 HTML
        messageElement.innerHTML = marked.parse(message);
    } else {
        // 對使用者訊息進行純文字處理，避免 HTML 注入
        const textNode = document.createTextNode(message);
        messageElement.appendChild(textNode);
    }

    chatHistory.appendChild(messageElement);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}


async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message) return;

    appendMessage('user', message);
    messageInput.value = '';
    sendMessageButton.disabled = true;
    typingIndicator.classList.remove('hidden');

    try {
        const result = await chat.sendMessage(message);
        const response = await result.response;
        const text = response.text();
        appendMessage('model', text);
    } catch (error) {
        console.error("訊息傳送失敗:", error);
        appendMessage('model', `發生錯誤：\n\n${error.toString()}`);
    } finally {
        sendMessageButton.disabled = false;
        typingIndicator.classList.add('hidden');
        toggleSuggestionArea();
    }
}

suggestionArea.addEventListener('click', (e) => {
    if (e.target.classList.contains('suggestionButton')) {
        const message = e.target.textContent;
        messageInput.value = message;
        sendMessage();
    }
});

saveApiKeyButton.addEventListener('click', () => {
    const apiKey = apiKeyInput.value.trim();
    if (apiKey) {
        localStorage.setItem(GEMINI_API_KEY_LS, apiKey);
        initializeChat();
    } else {
        alert("請輸入有效的 API 金鑰。");
    }
});

sendMessageButton.addEventListener('click', sendMessage);

messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// 初始化
initializeChat();
