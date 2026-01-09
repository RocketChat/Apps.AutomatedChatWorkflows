import { IHttp, IRead } from "@rocket.chat/apps-engine/definition/accessors";
import { SettingEnum } from "../settings/settings";

export async function createTextCompletionGroq(
    read: IRead,
    http: IHttp,
    prompt: string
): Promise<string> {
    const apiKeyGroq = await read
        .getEnvironmentReader()
        .getSettings()
        .getValueById(SettingEnum.ID_GROQ_API_KEY);

    if (!apiKeyGroq) {
        throw new Error("apiKeyGroq not configured.");
    }

    const url = `https://api.groq.com/openai/v1`;

    const groqModel = await read
        .getEnvironmentReader()
        .getSettings()
        .getValueById(SettingEnum.ID_GROQ_MODEL);

    if (!groqModel) {
        throw new Error("groqModel not configured.");
    }

    const body = {
        groqModel,
        messages: [
            {
                role: "system",
                content: prompt,
            },
        ],
        temperature: 0,
    };

    const response = await http.post(url + "/chat/completions", {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKeyGroq}`,
        },
        content: JSON.stringify(body),
    });

    if (!response.content) {
        throw new Error("Something is wrong with AI. Please try again later");
    }

    return response.data.choices[0].message.content;
}
