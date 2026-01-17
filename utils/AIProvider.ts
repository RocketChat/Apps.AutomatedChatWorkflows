import { IHttp, IRead } from "@rocket.chat/apps-engine/definition/accessors";
import { createTextCompletionGroq } from "./GroqModels";
import { createTextCompletionGemini } from "./GeminiModel";
import { createTextCompletionCustom } from "./CustomModels";
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
        case SettingEnum.KEY_CUSTOM: {
            return await createTextCompletionCustom(read, http, prompt);
        }
        default:
            throw new Error(`Unsupported AI provider: ${aiProvider}`);
    }
}
