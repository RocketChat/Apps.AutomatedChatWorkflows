import { IHttp } from "@rocket.chat/apps-engine/definition/accessors";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { App } from "@rocket.chat/apps-engine/definition/App";
import { sendNotification } from "./Messages";

export async function createTextCompletion(
    app: App,
    http: IHttp,
    prompt: string,
    room?: IRoom,
    user?: IUser
): Promise<string> {
    const model = await app
        .getAccessors()
        .environmentReader.getSettings()
        .getValueById("model");
    const url = `http://${model}/v1`;

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
        /*
        await sendNotification(
            this.read,
            this.modify,
            user,
            room,
            `Something is wrong with AI. Please try again later`
        );
        */
        console.log("Something is wrong with AI. Please try again later");

        throw new Error("Something is wrong with AI. Please try again later");
    }

    return JSON.parse(response.content).choices[0].message.content;
}
