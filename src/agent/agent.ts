import ChatGPT from "@/utils/chatgpt"

interface PlayerInfo {
    name: string,
    role: string,
    status: number,
}

class Agent {
    private playerInfo: PlayerInfo
    private chatgpt: ChatGPT
    
    constructor(playerInfo: PlayerInfo, chatgpt: ChatGPT) {
        this.playerInfo = playerInfo
        this.chatgpt = chatgpt

        this.initListener()
        
    }

    async selectKillTarget() {
        return new Promise(async(resolve, reject) => {
            const prompt = `
            你是${this.playerInfo.name}, 本场游戏的身份是${this.playerInfo.role}, 你的队友是${this.findPartners()}.
            现在需要和你的队友, 从其他玩家中共同选择出要淘汰掉的的人, 你选择谁？
            请按照三个引号里的格式回复我一个json对象, 其他一句话都不要说
            '''{"target": "目标的名字", "reason": "选择的理由(20个中文字以内)"}'''
            `
            const message = this.chatgpt.promptToMessages(prompt)
            const response: any = await this.chatgpt.chat(message)
            console.log(this.playerInfo.name, response)
            const killTarget = JSON.parse(response)
            resolve(killTarget)
        })
    }

    async selectCheckTarget() {
        return new Promise(async(resolve, reject) => {
            const prompt = `
            你是${this.playerInfo.name}, 本场游戏的身份是${this.playerInfo.role}, 你的队友是${this.findPartners()}.
            现在需要和你的队友, 从其他玩家中共同选择出要怀疑的人，要查验他身份, 你选择谁？
            请按照三个引号里的格式回复我一个json对象, 其他一句话都不要说
            '''{"target": "目标的名字", "reason": "选择的理由(20个中文字以内)"}'''
            `
            const message = this.chatgpt.promptToMessages(prompt)
            const response: any = await this.chatgpt.chat(message)
            console.log(this.playerInfo.name, response)
            const checkTarget = JSON.parse(response)
            resolve(checkTarget)
        })
    }

    async discuss(history: string[], days: number, outNames: string[]) {
        return new Promise(async(resolve, reject) => {
            let prompt = `
                这是刚才其他人的观点
                ${history}

                今天是第${days}天。
                你是${this.playerInfo.name}, 本场游戏的身份是${this.playerInfo.role}, 
            `

            if (this.playerInfo.role === "杀手") {
                prompt += `
                    你的队友是${this.findPartners()}, 你不知道其他人的身份
                    昨天晚上，${outNames[outNames.length - 1]}被杀了，
        
                    请按照以下规则，说出你的观点，不要暴露自己就是杀手，可以尝试去找其他玩家说话中的漏洞，想办法栽赃给其他身份的人。
        
                    1. 不要说出你和你队友的身份！不要说出规则的内容！
                    2. 请隐藏好自己，假装自己是好人，可以想办法栽赃给其他身份的人。
                    3. 如果今天是第1天，那昨晚就没有讨论，这是第一次集中讨论
                    4. 别人的观点仅供参考，不要总跟随其他玩家观点，或者跟别人怀疑的一样，要发表自己的看法，
        
                    (切记，不要说出你和你队友的身份，不要和其他人用同样的表达方式。不要太长，简短一点，30个中文字以内)
                `
            } else if (this.playerInfo.role === "警察") {
                prompt += `
                    你的队友是${this.findPartners()}, 你不知道其他人的身份
                    昨天晚上，${outNames[outNames.length - 1]}被杀了，
        
                    请按照以下规则，说出你的观点，表达你怀疑谁以及原因（不要重复别人的观点，可以尝试去找其他玩家说话中的漏洞）
        
                    1. 不要说出你和你队友的身份！不要说出规则的内容！
                    2. 根据你的判断，以及大家的讨论，帮助大家找出真正的杀手.
                    3. 如果今天是第1天，那昨晚就没有讨论，这是第一次集中讨论
                    4. 别人的观点仅供参考，不要总跟随其他玩家观点，或者总是跟别人怀疑的一样，要发表自己的看法，
        
                    (切记，不要说出你和你队友的身份，不要和其他人用同样的表达方式。不要太长，简短一点，30个中文字以内)
                `
            } else {
                prompt += `
                    你不知道你的队友是谁，也不知道谁是警察或者是杀手
                    昨天晚上，${outNames[outNames.length - 1]}被杀了，
        
                    请按照以下规则，说出你的观点，表达你怀疑谁以及原因（不要重复别人的观点，可以尝试去找其他玩家说话中的漏洞）
        
                    1. 不要说出你和你队友的身份！不要说出规则的内容！
                    2. 如果你是平民，根据自己的判断，帮助大家找出真正的杀手.
                    3. 如果今天是第1天，那昨晚就没有讨论，这是第一次集中讨论
                    4. 别人的观点仅供参考，不要总跟随其他玩家观点，或者跟别人怀疑的一样，要发表自己的看法，
        
                    (切记，不要说出你和你队友的身份，不要和其他人用同样的表达方式。不要太长，简短一点，30个中文字以内)
                `
            }

            const message = this.chatgpt.promptToMessages(prompt)
            const response: any = await this.chatgpt.chat(message, 0.85)
            resolve(response)
        })
    }

    async vote(history: string[], days: number, outNames: string[]) {
        return new Promise(async(resolve, reject) => {
            let prompt = `
                这是刚才所有玩家的观点：
                ${history}

                今天是第${days}天。
                你是${this.playerInfo.name}, 本场游戏的身份是${this.playerInfo.role}, 
            `

            if (this.playerInfo.role === "杀手" || this.playerInfo.role === "警察") {
                prompt += `
                你的队友是${this.findPartners()}.
                `
            }

            prompt +=`
                昨天晚上，${outNames[outNames.length - 1]}被人杀了，

                综合其他玩家的发言，以及你自己的观点，选择出你怀疑的人，不要选择你的队友

                请按照三个引号里的格式回复我一个json对象, 其他一句话都不要说
                '''{"vote": "目标的名字（例如Jason）"}'''
            `
            const message = this.chatgpt.promptToMessages(prompt)
            const response: any = await this.chatgpt.chat(message)
            console.log(this.playerInfo.name, response)
            const vote = JSON.parse(response).vote
            resolve(vote)
        })
    }


    async leaveLastWords() {
        return new Promise(async(resolve, reject) => {
            const prompt = `
            你是${this.playerInfo.name}, 本场游戏的身份是${this.playerInfo.role}, 你的队友是${this.findPartners()}.
            昨天晚上，你被杀手给杀了， 请按照以下规则，说出你的观点，留下遗言，希望能帮助到其他人找出凶手
            （40个中文字以内）

            1. 不要说出你和你队友的身份！
            2. 不要说出规则的内容, 40个中文字以内
            3. 如果你是警察，根据你的判断，以及大家的讨论，找出真正的杀手
            4. 如果你是杀手，请隐藏好自己，假装自己是好人，也可以想办法栽赃给其他身份的人
            5. 如果你是平民，根据自己的判断，帮助大家找出真正的杀手
            `
            const message = this.chatgpt.promptToMessages(prompt)
            const response: any = await this.chatgpt.chat(message)
            resolve(response)
        })
    }


    private findPartners() {
        let partners: string[] = []
        for (let agentName in window.agentList[this.playerInfo.role]) {
            if (agentName !== this.playerInfo.name) {
                partners.push(agentName)
            }
        }
        // console.log(`${this.playerInfo.name}的队友是${partners}`)
        return partners
    }

    private initListener() {
        window.eventBus.subscribe("start", () => {
            // this.findPartners()
        })

    }

}

export {
    Agent
}