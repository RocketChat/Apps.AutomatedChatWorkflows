import { IHttp, IRead } from "@rocket.chat/apps-engine/definition/accessors";
import { SettingEnum } from "../settings/settings";


export async function createTextCompletionRocketChat(
    read: IRead,
    http: IHttp,
    prompt: string
): Promise<string> {
    const rcModel = await read
        .getEnvironmentReader()
        .getSettings()
        .getValueById(SettingEnum.ID_RC_MODEL);

    if (!rcModel) {
        throw new Error("rcModel not configured.");
    }

    const url = `http://${rcModel}/v1`;

    const body = {
        model: rcModel,
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
        },
        content: JSON.stringify(body),
    });

    if (!response.content) {
        console.log("Something is wrong with AI. Please try again later");
        throw new Error("Something is wrong with AI. Please try again later");
    }

    return JSON.parse(response.content).choices[0].message.content;
}

export async function createTextCompletionSelfHosted(
    read: IRead,
    http: IHttp,
    prompt: string
): Promise<string> {
    const baseUrl = await read
        .getEnvironmentReader()
        .getSettings()
        .getValueById(SettingEnum.ID_SELF_HOSTED_URL);

    if (!baseUrl) {
        throw new Error("Self-Hosted URL not configured.");
    }

    const model = await read
        .getEnvironmentReader()
        .getSettings()
        .getValueById(SettingEnum.ID_SELF_HOSTED_MODEL);

    if (!model) {
        throw new Error("Self-Hosted Model not configured.");
    }

    // Normalise: strip trailing slash so we can safely append the path
    const url = baseUrl.replace(/\/+$/, "");

    const body = {
        model,
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
        },
        content: JSON.stringify(body),
    });

    if (!response.content) {
        console.log("Something is wrong with AI. Please try again later");
        throw new Error("Something is wrong with AI. Please try again later");
    }

    return JSON.parse(response.content).choices[0].message.content;
}

