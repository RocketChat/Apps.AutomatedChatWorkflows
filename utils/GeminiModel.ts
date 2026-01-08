import { IHttp, IRead } from "@rocket.chat/apps-engine/definition/accessors";
import { SettingEnum } from "../settings/settings";

export async function createTextCompletionGemini(
    read: IRead,
    http: IHttp,
    prompt: string
): Promise<string> {
    const geminiApiKey = await read
        .getEnvironmentReader()
        .getSettings()
        .getValueById(SettingEnum.ID_GEMINI_API_KEY);

    if (!geminiApiKey) {
        throw new Error("geminiApiKey not configured.");
    }

    const geminiModel = await read
        .getEnvironmentReader()
        .getSettings()
        .getValueById(SettingEnum.ID_GEMINI_MODEL);

    if (!geminiModel) {
        throw new Error("geminiModel not configured.");
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`;

    const body = {
        contents: [{ parts: [{ text: prompt }] }],
    };

    const response = await http.post(url, {
        headers: {
            "Content-Type": "application/json",
        },
        content: JSON.stringify(body),
    });

    if (response.statusCode !== 200 || !response.content) {
        throw new Error(
            "Sorry! I was unable to process your request. Please try again."
        );
    }

    let text =
        JSON.parse(response.content)?.candidates?.[0]?.content?.parts?.[0]
            ?.text;

    if (!text) {
        throw new Error("Empty response from Gemini");
    }

    // Remove markdown wrappers if present
    if (text.startsWith("```") && text.endsWith("```")) {
        text = text.replace(/^```[a-z]*\n?|```$/g, "").trim();
    }

    return text;
}
