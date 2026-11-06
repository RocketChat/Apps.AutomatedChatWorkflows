import { IHttp, IRead } from "@rocket.chat/apps-engine/definition/accessors";
import { createTextCompletionGroq } from "./GroqModels";
import { createTextCompletionGemini } from "./GeminiModel";
import { createTextCompletionRocketChat, createTextCompletionSelfHosted } from "./RCInHouseHostedModels";
import { SettingEnum } from "../settings/settings";

export async function createTextCompletion(
    read: IRead,
    http: IHttp,
    prompt: string
): Promise<string> {
    const aiProvider = await read
        .getEnvironmentReader()
        .getSettings()
        .getValueById(SettingEnum.ID_LLM_PROVIDER);

    if (!aiProvider) {
        throw new Error("AI provider not configured.");
    }

    switch (aiProvider) {
        case SettingEnum.KEY_GROQ: {
            return await createTextCompletionGroq(read, http, prompt);
        }
        case SettingEnum.KEY_GEMINI: {
            return await createTextCompletionGemini(read, http, prompt);
        }
        case SettingEnum.KEY_RC: {
            return await createTextCompletionRocketChat(read, http, prompt);
        }
        case SettingEnum.KEY_SELF_HOSTED: {
            return await createTextCompletionSelfHosted(read, http, prompt);
        }
        default:
            throw new Error(`Unsupported AI provider: ${aiProvider}`);
    }
}
