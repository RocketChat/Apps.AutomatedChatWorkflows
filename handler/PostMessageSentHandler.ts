import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IPostMessageSent } from "@rocket.chat/apps-engine/definition/messages";
import { IMessage } from "@rocket.chat/apps-engine/definition/messages";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { findTriggerResponsesByUserAndChannel } from "../utils/PersistenceMethodsCreationWorkflow";
import {
    createCheckConditionPrompt,
    createEditMessagePrompt,
} from "../utils/prompt-helpers";
import { createTextCompletionGroq } from "../temp/createTextCompletionGroq";
import {
    deleteMessage,
    sendDirectMessage,
    sendMessageInChannel,
    updateMessageText,
} from "../utils/Messages";

interface CheckConditionResponse {
    condition_met: boolean;
    confidence: number;
}

interface EditMessageResponse {
    message: string;
}

export class PostMessageSentHandler implements IPostMessageSent {
    public async executePostMessageSent(
        message: IMessage,
        read: IRead,
        http: IHttp,
        persistence: IPersistence,
        modify: IModify
    ): Promise<void> {
        const user = message.sender;
        const text = message.text;
        const room = message.room;

        // Get the bot user
        const appUser = (await read.getUserReader().getAppUser()) as IUser;

        if (!text) return;

        try {
            // Get all trigger responses for this user and channel
            // console.log("user: " + user.username);
            // console.log("room: " + room.slugifiedName);

            const triggerResponses = await findTriggerResponsesByUserAndChannel(
                read,
                user.username,
                room.slugifiedName ?? ""
            );

            console.log(`Found ${triggerResponses.length} trigger responses:`);

            for (const [index, response] of triggerResponses.entries()) {
                // UI Approach
                if (!response.data.usedLLM) {
                    if (!text.includes(response.data.trigger.condition))
                        continue;

                    if (response.data.response.action === "delete-message") {
                        const isDeleted = await deleteMessage(
                            modify,
                            message,
                            user
                        );
                    }

                    if (response.data.response.message) {
                        if (
                            response.data.response.action ===
                            "send-message-in-dm"
                        ) {
                            await sendDirectMessage(
                                read,
                                modify,
                                user,
                                response.data.response.message
                            );
                        } else if (
                            response.data.response.action ===
                            "send-message-in-channel"
                        ) {
                            await sendMessageInChannel(
                                modify,
                                appUser,
                                room,
                                response.data.response.message
                            );
                        }
                    }
                    continue;
                }

                // LLM Approach
                // LLM call to check if the condition is triggered
                const checkConditionPrompt = createCheckConditionPrompt(
                    text,
                    response.data.trigger.condition
                );
                const checkConditionPromptByLLM =
                    await createTextCompletionGroq(http, checkConditionPrompt);

                const checkConditionResponse: CheckConditionResponse =
                    typeof checkConditionPromptByLLM === "string"
                        ? JSON.parse(checkConditionPromptByLLM)
                        : checkConditionPromptByLLM;

                if (!checkConditionResponse.condition_met) continue;
                if (checkConditionResponse.confidence < 75) continue;

                if (response.data.response.action === "delete-message") {
                    const isDeleted = await deleteMessage(
                        modify,
                        message,
                        user
                    );
                }

                const messageToSend = response.data.response.message;
                if (!messageToSend) continue;

                if (response.data.response.action === "send-message-in-dm") {
                    await sendDirectMessage(read, modify, user, messageToSend);
                } else if (
                    response.data.response.action === "send-message-in-channel"
                ) {
                    await sendMessageInChannel(
                        modify,
                        appUser,
                        room,
                        messageToSend
                    );
                } else if (response.data.response.action === "edit-message") {
                    const editMessagePrompt = createEditMessagePrompt(
                        response.data.command,
                        text
                    );
                    const editMessagePromptByLLM =
                        await createTextCompletionGroq(http, editMessagePrompt);

                    const editMessageResponse: EditMessageResponse = {
                        message: editMessagePromptByLLM,
                    };

                    if (!editMessageResponse.message) continue;

                    await updateMessageText(
                        modify,
                        message,
                        editMessageResponse.message,
                        user
                    );
                }
            }
        } catch (error) {
            console.error("Error checking trigger responses:", error);
        }
    }
}
