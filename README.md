# Maifa-agent
AI "Maifa" is coming! As night falls,9 ChatGPT AI players each harbor their own sinister motives. Let's see who will have the last laugh... 

Based on phaser3+vue3+typescript, and chatgpt (70% of the code is written by chatgpt).

You can directly experience the demo I deployed on huggingface here [Maifa-Agent](https://huggingface.co/spaces/JasonCaoCJX/Maifa-Agent)

Welcome to add stars to my project.

Welome to join my discord group. 

[![Discord](https://dcbadge.vercel.app/api/server/t2D84xMz39?compact=true)](https://discord.gg/t2D84xMz39)

https://github.com/JasonCaoCJX/mafia-agent/assets/58477254/72be8b1a-1213-44ee-8177-7dbc98d5804b

# Quick Start
This project is based on [Node.js](https://nodejs.org/en), and you can install the required dependencies by
```
npm install
# or
yarn
```

Then you need to configure your own `OPENAI_API_KEY`. You can get it from [OpenAI API Key](https://platform.openai.com/account/api-keys). It is recommended that you use a paid account, otherwise you will receive frequency restrictions during use. For details, please refer to [OpenAI rate limits](https://platform.openai.com/docs/guides/rate-limits/overview)

Set it in `src/utils/chatgpt.ts`.
```ts
const openai_api_key = "OPENAI_API_KEY"
```

Finally, run the demo
```
npm run dev
# or
yarn dev
```

Or you may want to package your project for deployment.
```
npm run build
# or
yarn build
```

# Support
Chinese is used in this project. And there is no backend service deployed for the time being, which means your apikey may not be safe. If you need other languages or other support, you can join Discord to contact me. Or 

[![Discord](https://dcbadge.vercel.app/api/server/t2D84xMz39?compact=true)](https://discord.gg/t2D84xMz39)

# References

1. https://arxiv.org/abs/2304.03442
2. https://python.langchain.com/en/latest/use_cases/agent_simulations/characters.html#create-a-generative-character
3. https://medium.com/swlh/grid-based-movement-in-a-top-down-2d-rpg-with-phaser-3-e3a3486eb2fd
4. https://finalbossblues.itch.io/
