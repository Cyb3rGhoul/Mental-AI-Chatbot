const prompt = document.querySelector("#prompt");
const submitBtn = document.querySelector("#submit");
const messagesArea = document.querySelector("#messagesArea");
const imageBtn = document.querySelector("#image");
const imageInput = document.querySelector("#image input");

const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=";


let user = {
    message: "Provide compassionate, professional mental health guidance. Focus on supportive advice, coping strategies, and understanding emotional well-being. Respond in markdown with empathy and actionable insights.", 
    file: {
        mime_type: null,
        data: null
    }
};

async function generateResponse(aiChatBox) {
    const text = aiChatBox.querySelector(".ai-chat-area");

    // Strict mental health context validation
    if (user.file.data && !['image/jpeg', 'image/png'].includes(user.file.mime_type)) {
        text.innerHTML = "**Invalid Support Resource**\n\nPlease upload a relevant mental health support document or image.";
        return;
    }

    const requestOptions = {
        method: "POST", 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            "contents": [{ 
                "parts": [
                    { "text": user.message },
                    ...(user.file.data ? [{"inline_data": user.file}] : [])
                ]
            }]
        })
    };

    try {
        const response = await fetch(API_URL, requestOptions);
        const data = await response.json();
        const apiResponse = convertMarkdownToHTML(
            data.candidates[0].content.parts[0].text
                .replace(/^(?!(\*\*|#|-))/gm, '## ')  // Ensure structured response
        );
        text.innerHTML = apiResponse;
        text.classList.add('fade-in');
    } catch (error) {
        text.innerHTML = "**Mental Health Support Temporarily Unavailable**\n\n*Please reach out to a professional counselor if you need immediate support.*";
    } finally {
        messagesArea.scrollTo({ top: messagesArea.scrollHeight, behavior: "smooth" });
        imageInput.value = '';
        user.file = {};
    }
}

function convertMarkdownToHTML(markdown) {
    return markdown
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^- (.*$)/gim, '<li>$1</li>')
        .replace(/\n/g, '<br>');
}

function createChatBox(content, isUser = false) {
    const div = document.createElement("div");
    div.classList.add(isUser ? "user-chat-box" : "ai-chat-box");
    
    const avatarSrc = isUser ? "user-avatar.png" : "ai-health.png";
    const messageClass = isUser ? "user-chat-area" : "ai-chat-area";
    
    div.innerHTML = `
        <img src="${avatarSrc}" alt="${isUser ? 'User' : 'AI'}" class="${isUser ? 'user-avatar' : 'ai-avatar'}">
        <div class="${messageClass}">
            ${content}
            ${user.file.data ? `<img src="data:${user.file.mime_type};base64,${user.file.data}" class="chooseimg" />` : ''}
        </div>
    `;
    
    return div;
}

function handleChatResponse(userMessage) {
    user.message = userMessage;
    const userChatBox = createChatBox(user.message, true);
    messagesArea.appendChild(userChatBox);
    prompt.value = "";

    setTimeout(() => {
        const aiChatBox = createChatBox('<div class="typing-loader">Analyzing...</div>', false);
        messagesArea.appendChild(aiChatBox);
        generateResponse(aiChatBox);
    }, 600);

    messagesArea.scrollTo({ top: messagesArea.scrollHeight, behavior: "smooth" });
}

prompt.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && prompt.value.trim()) {
        handleChatResponse(prompt.value);
    }
});

submitBtn.addEventListener("click", () => {
    if (prompt.value.trim()) {
        handleChatResponse(prompt.value);
    }
});

imageInput.addEventListener("change", () => {
    const file = imageInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
        const base64String = e.target.result.split(",")[1];
        user.file = {
            mime_type: file.type,
            data: base64String
        };
    };
    reader.readAsDataURL(file);
});

imageBtn.addEventListener("click", () => {
    imageInput.click();
});

// Optional: Add welcome message animation
document.addEventListener('DOMContentLoaded', () => {
    const welcomeMessage = document.querySelector('.initial-welcome');
    if (welcomeMessage) {
        welcomeMessage.classList.add('fade-in');
    }
});