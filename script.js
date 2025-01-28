const KEY = process.env.API_KEY;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${KEY}`;

const prompt = document.querySelector("#prompt");
const submitBtn = document.querySelector("#submit");
const messagesArea = document.querySelector("#messagesArea");
const imageBtn = document.querySelector("#image");
const imageInput = document.querySelector("#image input");

let user = {
    message: "You are a highly specialized assistant dedicated solely to providing accurate, evidence-based information or advice related to mental or physical health. Your responses should be concise, empathetic, and professional, addressing topics such as mental health conditions, physical well-being, nutrition, exercise, or general wellness. You will not elaborate or engage in conversations beyond health-related queries. If a question is outside this scope, respond politely with: I can only answer questions related to mental or physical health. Please ask me something in that domain. Ensure your tone remains caring and approachable while staying focused on the user's health-related concern. Do not respond to or engage with topics unrelated to health, such as technology, general knowledge, creative writing, or image-related requests. For any non-health-related question, provide the redirection message without additional elaboration or context. This ensures your interactions remain focused, professional, and aligned with your purpose of addressing mental and physical health matters.", 
    file: {
        mime_type: null,
        data: null
    }
};

// Helper function to check if text is health-related
// function isHealthRelated(text) {
//     const healthKeywords = [
//         'health', 'medical', 'wellness', 'mental', 'physical', 'symptoms',
//         'anxiety', 'depression', 'stress', 'therapy', 'doctor', 'disease',
//         'treatment', 'medication', 'exercise', 'diet', 'nutrition', 'sleep'
//     ];
//     return healthKeywords.some(keyword => 
//         text.toLowerCase().includes(keyword)
//     );
// }

async function generateResponse(aiChatBox) {
    const text = aiChatBox.querySelector(".ai-chat-area");

    if (user.file.data && !['image/jpeg', 'image/png'].includes(user.file.mime_type)) {
        text.innerHTML = formatResponse({
            isHealthQuestion: false,
            message: "Please upload only JPG or PNG images for health-related queries."
        });
        return;
    }

    const requestOptions = {
        method: "POST", 
        headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
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
        
        // Check if the question is health-related
        const isHealthQuestion = "You are a specialized assistant designed exclusively to provide precise, evidence-based information and advice related to mental or physical health. Your primary objective is to assist users with questions or concerns about topics such as mental health conditions, emotional well-being, physical fitness, nutrition, symptoms of illnesses, and general wellness practices. For every interaction, your response must be clear, professional, empathetic, and strictly limited to the health domain. If a user asks a question that directly pertains to health, provide an accurate and concise response grounded in scientific knowledge. Avoid any unnecessary elaboration or over-detailing, keeping the focus strictly on addressing the health query.For non-health-related queries—such as those about technology, coding, general knowledge, creative writing, casual conversation, or image-related requests—your response must be limited to the following strict statement: I can only answer questions related to mental or physical health. Please ask me something in that domain. Do not offer any additional context, explanations, or engagement beyond this statement. Regardless of how the question is phrased or how persistent the user may be, maintain this boundary at all times to ensure strict adherence to your purpose. Always maintain professionalism and ensure every response aligns with the intent of addressing mental or physical health concerns only. The Question is: " + user.message;
        
        const responseObject = {
            isHealthQuestion,
            message: isHealthQuestion 
                ? data.candidates[0].content.parts[0].text
                : "I'm your health assistant. Please ask questions related to health, wellness, or medical concerns.",
            timestamp: new Date().toISOString()
        };

        text.innerHTML = formatResponse(responseObject);
        text.classList.add('fade-in');
    } catch (error) {
        console.error('API Error:', error);
        text.innerHTML = formatResponse({
            isHealthQuestion: false,
            message: "I'm currently unavailable. If you need immediate health support, please contact a healthcare professional.",
            error: true
        });
    } finally {
        messagesArea.scrollTo({ top: messagesArea.scrollHeight, behavior: "smooth" });
        imageInput.value = '';
        user.file = { mime_type: null, data: null };
    }
}

function formatResponse(response) {
    if (!response.isHealthQuestion) {
        return `
            <div class="error-message">
                <h3>⚕️ Health Focus Required</h3>
                <p>${response.message}</p>
            </div>
        `;
    }

    // Convert markdown to formatted HTML with better structure
    return convertMarkdownToHTML(response.message);
}

function convertMarkdownToHTML(markdown) {
    const formattedMarkdown = markdown
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/^# (.*$)/gim, '<h1 class="response-h1">$1</h1>')
        .replace(/^## (.*$)/gim, '<h2 class="response-h2">$1</h2>')
        .replace(/^### (.*$)/gim, '<h3 class="response-h3">$1</h3>')
        .replace(/^- (.*$)/gim, '<li class="response-list-item">$1</li>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');

    return `<div class="formatted-response">${formattedMarkdown}</div>`;
}

// Rest of the event listeners and UI functions remain the same
function createChatBox(content, isUser = false) {
    const div = document.createElement("div");
    div.classList.add(isUser ? "user-chat-box" : "ai-chat-box");
    
    const avatarSrc = isUser ? "user.png" : "ai-img.png";
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
        const aiChatBox = createChatBox('<div class="typing-loader">Analyzing your health query...</div>', false);
        messagesArea.appendChild(aiChatBox);
        generateResponse(aiChatBox);
    }, 600);

    messagesArea.scrollTo({ top: messagesArea.scrollHeight, behavior: "smooth" });
}

// Event Listeners
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

// Welcome message animation
document.addEventListener('DOMContentLoaded', () => {
    const welcomeMessage = document.querySelector('.initial-welcome');
    if (welcomeMessage) {
        welcomeMessage.classList.add('fade-in');
    }
});
