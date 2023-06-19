import axios from 'axios';

const openai_api_key = "OPENAI_API_KEY"

interface Message {
    role: ChatRole,
    content: string
}

enum ChatRole {
    SYSTEM = 'system',
    USER = 'user',
    ASSISTANT = 'assistant'
}

class ChatGPT {
    private config = {
        model: "gpt-3.5-turbo-0613",
        temperature: 0.7,
        max_tokens: 500,
    }

    private system: string = ""

    constructor() {

    }

    setSystem(system: string) {
        this.system = system
    }

    promptToMessages(prompt: string) {
        let messages = []
        messages.push({role: ChatRole.SYSTEM, content: this.system})
        messages.push({role: ChatRole.USER, content: prompt})
        return messages
    }

    chat(messages: Message[], temperature?: number) {
        return new Promise((resolve, reject) => {
            // console.log(messages)
            let requestData = { 
                messages: messages,
                ...this.config
            }

            if (temperature) {
                requestData.temperature = temperature
            }

            axios({ 
                method: 'post', 
                url: 'https://api.openai.com/v1/chat/completions',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + String(openai_api_key),
                },
                data: JSON.stringify(requestData), 
            }).then((response) => {
                const result = response.data
                const message = result.choices[0].message
                resolve(message.content)
            }).catch(error => {
                reject(error)
            });
        })
    }
}

export default ChatGPT;