import { players, roles } from './data'
import { Agent } from './agent'
import ChatGPT from '@/utils/chatgpt'

class AgentGame {

    private agentList: any = {}
    private agentNames: string[] = []
    private agentUids: string[] = []
    private chatgpt: any

    private outNames: string[] = []
    
    constructor() {
        this.init()
    }

    private init() {
        // 初始话ChatGPT
        this.chatgpt = new ChatGPT()

        for (let uid in players) {
            // 抽取角色
            const random = roles[Math.floor(Math.random() * roles.length)]
            const info = {uid: uid, name: players[uid].name, personality: players[uid].personality, role: random, status: 1}
            const player = new Agent(info, this.chatgpt)
            // 创建角色对象
            if (!this.agentList[random]) { this.agentList[random] = {} }
            // 添加玩家信息
            this.agentList[random][players[uid].name] = player
            roles.splice(roles.indexOf(random), 1) 
            this.agentNames.push(players[uid].name)
            this.agentUids.push(uid)
        }
        console.log("角色抽取完毕:", this.agentList)
        window.agentList = this.agentList

        this.setChatGPTSystem()
        this.runAgent()
    }

    async runAgent() {
        let step = 0
        let vote = ""
        window.eventBus.subscribe("V_2_A_NEXT_STEP", async() => {
            switch(step) {
                case 0:
                    window.eventBus.publish("A_2_V_TOAST", {msg: "游戏开始，随机抽取角色", duration: 5000})
                    window.eventBus.publish("A_2_P_UPDATE_NAME", this.agentList)
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    break
                case 1:
                    window.eventBus.publish("A_2_V_TOAST", {msg: `第${this.calculateDays(step)}天晚上，天黑请回到自己的屋内`, duration: 5000})
                    window.eventBus.publish("A_2_P_BACK_HOME")
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    break
                case 2:
                    window.eventBus.publish("A_2_V_TOAST", {msg: "请警察互相确认身份，并选择你们要查验的对象", duration: 5000})
                    window.eventBus.publish("A_2_P_GATHER", this.getUidsByRole("警察"))
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    await this.confirmCheckTarget()
                    break
                case 3:
                    window.eventBus.publish("A_2_V_TOAST", {msg: `请警察回到自己的屋内`, duration: 5000})
                    window.eventBus.publish("A_2_P_BACK_HOME")
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    break
                case 4:
                    window.eventBus.publish("A_2_V_TOAST", {msg: "请杀手互相确认身份，并选择你们要淘汰的对象", duration: 5000})
                    window.eventBus.publish("A_2_P_GATHER", this.getUidsByRole("杀手"))
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    await this.confirmKillTarget()
                    break
                case 5:
                    window.eventBus.publish("A_2_V_TOAST", {msg: `请杀手回到自己的屋内`, duration: 5000})
                    window.eventBus.publish("A_2_P_BACK_HOME")
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    break
                case 6:
                    this.outNames.push("Jude")
                    window.eventBus.publish("A_2_V_TOAST", {msg: `第${this.calculateDays(step)}晚过去了，请所有人到广场集合`, duration: 5000})
                    window.eventBus.publish("A_2_P_GATHER", this.getUidsByRole())
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    break
                case 7:
                    const deadName = this.outNames[this.outNames.length - 1]
                    window.eventBus.publish("A_2_V_TOAST", {msg: `昨天晚上${deadName}死了，留下了遗言`, duration: 5000})
                    await this.getLastWords(deadName)
                    break
                case 8:
                    window.eventBus.publish("A_2_V_TOAST", {msg: "开始讨论，表达自己的观点", duration: 5000})
                    await this.discussAndVote(this.calculateDays(step))
                    break
                default:
                    console.log("Waiting...")
            }   

            step++
            window.eventBus.publish("A_2_V_CONTINUE")
        })
    }

    private setChatGPTSystem() {
        const rule = `
        3个杀手:每晚和队友协商杀一人
        3个警察:通过白天的推理和夜间的验人找出杀手，并带领平民投票选出杀手。
        3个平民:帮助警察投票选出杀手。
        `
        const system = `杀人游戏桌游规则: ${rule}, 参加游戏的人员有${this.agentNames}`
        this.chatgpt.setSystem(system)
    }

    private async confirmKillTarget() {
        return new Promise(async(resolve, reject) => {
            const killerList = this.agentList["杀手"]
            let choices = []

            for (let name in killerList) {
                const kill = await killerList[name].selectKillTarget()
                choices.push(`<${name}选择了${kill.target}, 因为${kill.reason}>`)
                window.eventBus.publish("A_2_P_SPEAK", {uid: killerList[name].playerInfo.uid, msg: `我选择${kill.target}, 因为${kill.reason}`, duration: 5000})
                await new Promise(resolve => setTimeout(resolve, 2000));
            }

            window.eventBus.publish("A_2_V_TOAST", {msg: "请统一选择", duration: 5000})
            await new Promise(resolve => setTimeout(resolve, 2000));

            const prompt = `
            <>里是杀手们的选择，请最终确定一个淘汰对象${choices}, 只能选择一个人。
            请按照三个引号里的格式回复我一个json对象, 其他一句话都不要说
            '''{"target": "目标的名字", "reason": "选择的理由(20个中文字以内)"}'''
            `
            const message = this.chatgpt.promptToMessages(prompt)
            const response: any = await this.chatgpt.chat(message)
            console.log("杀手统一选择", response)
            const killTarget = JSON.parse(response)
            const targetUid = this.getUidByName(killTarget.target)

            for (let name in killerList) {
                window.eventBus.publish("A_2_P_SPEAK", {uid: killerList[name].playerInfo.uid, msg: `我们统一选择${killTarget.target}, 因为${killTarget.reason}`, duration: 5000})
            }

            await new Promise(resolve => setTimeout(resolve, 2000));
            for (let name in killerList) {
                window.eventBus.publish("A_2_P_KILL", {uid: killerList[name].playerInfo.uid, kill: targetUid})
            }

            this.outNames.push(killTarget.target)
            this.agentNames.splice(this.agentNames.indexOf(killTarget.target), 1)
            this.agentUids.splice(this.agentUids.indexOf(targetUid), 1)

            await new Promise(resolve => setTimeout(resolve, 3000));
            
            resolve(killTarget)
        })
    }

    private async confirmCheckTarget() {
        return new Promise(async(resolve, reject) => {
            const policeList = this.agentList["警察"]
            let choices = []

            for (let name in policeList) {
                const check = await policeList[name].selectCheckTarget()
                choices.push(`<${name}选择了${check.target}, 因为${check.reason}>`)
                window.eventBus.publish("A_2_P_SPEAK", {uid: policeList[name].playerInfo.uid, msg: `我选择${check.target}, 因为${check.reason}`, duration: 5000})
                await new Promise(resolve => setTimeout(resolve, 2000));
            }

            window.eventBus.publish("A_2_V_TOAST", {msg: "请统一选择", duration: 5000})
            await new Promise(resolve => setTimeout(resolve, 2000));

            const prompt = `
            <>里是警察们的选择，请最终确定唯一一个查验对象${choices}, 只能选择一个人。
            请按照三个引号里的格式回复我一个json对象, 其他一句话都不要说
            '''{"target": "目标的名字", "reason": "选择的理由(30个中文字以内)"}'''
            `
            const message = this.chatgpt.promptToMessages(prompt)
            const response: any = await this.chatgpt.chat(message)
            console.log("警察统一选择", response)
            const checkTarget = JSON.parse(response)

            for (let name in policeList) {
                window.eventBus.publish("A_2_P_SPEAK", {uid: policeList[name].playerInfo.uid, msg: `我们统一选择${checkTarget.target}, 因为${checkTarget.reason}`, duration: 5000})
            }

            await new Promise(resolve => setTimeout(resolve, 5000));
            console.log("他的身份是: ", this.checkRole(checkTarget.target))
            window.eventBus.publish("A_2_P_BROADCAST", {msg: `他/她的身份是: ${this.checkRole(checkTarget.target)}`, duration: 5000})

            resolve(checkTarget)
        })
    }

    private async discussAndVote(days: number): Promise<string> {
        return new Promise(async(resolve, reject) => {
            let agentArr = []
            for (let role in this.agentList) {
                for (let name in this.agentList[role]) {
                    if (this.outNames.indexOf(name) < 0) {
                        agentArr.push(this.agentList[role][name])
                    }
                }
            }
            const shuffledArray = this.shuffleArray(agentArr);

            let history: string[] = []
            for (let agent of shuffledArray) {
                const response = await agent.discuss(history, days, this.outNames)
                window.eventBus.publish("A_2_P_SPEAK", {uid: agent.playerInfo.uid, msg: response, duration: 5000})
                console.log(response)
                history.push(`${agent.playerInfo.name}认为${response}`)
                await new Promise(resolve => setTimeout(resolve, 3000));
            }

            window.eventBus.publish("A_2_V_TOAST", {msg: "请投票给你怀疑的对象", duration: 5000})
            await new Promise(resolve => setTimeout(resolve, 2000));
            let voteList: {[key: string]: number} = {} 
            for (let agent of shuffledArray) {
                const vote: string = await agent.vote(history, days, this.outNames)
                window.eventBus.publish("A_2_P_SPEAK", {uid: agent.playerInfo.uid, msg: vote, duration: 4000})
                await new Promise(resolve => setTimeout(resolve, 1000));
                if (!voteList[vote]) {
                    voteList[vote] = 1
                } else {
                    voteList[vote] += 1
                }
            }

            await new Promise(resolve => setTimeout(resolve, 5000));

            const [maxKey, maxValue] = this.findMax(voteList);
            window.eventBus.publish("A_2_V_TOAST", {msg: `${maxKey}的票最高淘汰，游戏继续`, duration: 5000})
            await new Promise(resolve => setTimeout(resolve, 5000));
            resolve(maxKey)
        })
    }

    private async getLastWords(deadName: string) {
        return new Promise(async(resolve, reject) => {
            let agent!: Agent
            for (let role in this.agentList) {
                for (let name in this.agentList[role]) {
                    if (name === deadName) {
                        agent = this.agentList[role][name]
                    }
                }
            }

            const lastwords = await agent.leaveLastWords()
            console.log(lastwords)
            window.eventBus.publish("A_2_P_BROADCAST", {msg: `这是${deadName}的遗言：${lastwords}`, duration: 10000})
            
            resolve(lastwords)
        })
    }   

    private checkRole(checkName: string) {
        for (let role in this.agentList) {
            for (let name in this.agentList[role]) {
                if (name === checkName) {
                    return role
                }
            }
        }
    } 

    private calculateDays(num: number) {
        return Math.floor(num / 10) + 1
    }

    private getUidsByRole(role?: string) {
        if (role) {
            let uidList: string[] = []
            for (let name in this.agentList[role]) {
                if (this.outNames.indexOf(name) < 0) {
                    uidList.push(this.agentList[role][name].playerInfo.uid)
                }
                
            }
            return uidList
        } else {
            return this.agentUids
        }
    }

    private getUidByName(name: string) {
        let result = ""
        for (let uid in players) {
            if (players[uid].name === name) {
                result = uid
            }
        }
        return result
    }

    private shuffleArray<T>(array: T[]): T[] {
        for (let i = array.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    private findMax(obj: {[key: string]: number}): [string, number] {
        console.log(obj)
        let maxKey = "";
        let maxValue = Number.NEGATIVE_INFINITY;
        for (const [key, value] of Object.entries(obj)) {
            if (value > maxValue) {
                maxKey = key;
                maxValue = value;
            }
        }
        console.log(maxKey)
        return [maxKey, maxValue];
    }
      
}

export {
    AgentGame
}