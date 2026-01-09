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

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;

    const body = {
        contents: [{ parts: [{ text: prompt }] }],
    };

    const response = await http.post(url, {
        headers: { "Content-Type": "application/json" },
        content: JSON.stringify(body),
    });

    if (response.statusCode !== 200 || !response.content) {
        return JSON.stringify({
            message:
                "Sorry! I was unable to process your request. Please try again.",
        });
    }

    let text = JSON.parse(response.content)?.candidates?.[0]?.content
        ?.parts?.[0]?.text;

    // Clean up the response if it's wrapped in markdown code blocks
    if (text.startsWith("```json") && text.endsWith("```")) {
        text = text.slice(7, -3).trim(); // Remove ```json and ```
    } else if (text.startsWith("```") && text.endsWith("```")) {
        text = text.slice(3, -3).trim(); // Remove ``` and ```
    }

    return text;
}
