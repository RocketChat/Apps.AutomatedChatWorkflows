import { IHttp, IRead } from "@rocket.chat/apps-engine/definition/accessors";
import { SettingEnum } from "../settings/settings";


export async function createTextCompletionCustom(
    read: IRead,
    http: IHttp,
    prompt: string
): Promise<string> {
    const baseUrl = await read
        .getEnvironmentReader()
        .getSettings()
        .getValueById(SettingEnum.ID_CUSTOM_URL);

    if (!baseUrl) {
        throw new Error("Custom model base URL not configured.");
    }

    const customModel = await read
        .getEnvironmentReader()
        .getSettings()
        .getValueById(SettingEnum.ID_MODEL);

    if (!customModel) {
        throw new Error("Model not configured.");
    }

    const body = {
        model: customModel,
        messages: [
            {
                role: "system",
                content: prompt,
            },
        ],
        temperature: 0,
    };

    const response = await http.post(baseUrl, {
        headers: {
            "Content-Type": "application/json",
        },
        content: JSON.stringify(body),
    });

    if (!response.content) {
        console.log(response);
        throw new Error("Something is wrong with AI. Please try again later");
    }

    return JSON.parse(response.content).choices[0].message.content;
}
