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
        // Basic message information extraction
        const user = message.sender;
        const text = message.text;
        const room = message.room;

        // Get the bot user
        const appUser = (await read.getUserReader().getAppUser()) as IUser;

        // Log basic information
        console.log(
            `New message from ${user.username} in ${room.slugifiedName}: ${text}`
        );

        // Skip processing if no message text (could be attachment-only)
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

            // Replace forEach with for...of to properly handle async operations
            for (const [index, response] of triggerResponses.entries()) {
                // console.log(`\nTrigger Response #${index + 1}:`);
                // console.log(`ID: ${response.id}`);

                // console.log(`Original Command: ${response.data.command}`);

                // console.log("Trigger Data:");
                // console.log(`- User: ${response.data.trigger.user}`);
                // console.log(`- Channel: ${response.data.trigger.channel}`);
                // console.log(`- Condition: ${response.data.trigger.condition}`);

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

                if (!checkConditionResponse.condition_met) {
                    continue;
                }

                if (checkConditionResponse.confidence < 75) {
                    continue;
                }

                // Log Response Data
                // console.log("Response Data:");
                // console.log(`- Action: ${response.data.response.action}`);
                // console.log(`- Message: ${response.data.response.message}`);

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
                } else if (response.data.response.action === "delete-message") {
                    const isDeleted = await deleteMessage(
                        modify,
                        message,
                        user
                    );
                    console.log(`Deleted message: ${isDeleted}`);
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

                    console.log(
                        "Edited message: " + editMessageResponse.message
                    );
                }
            }
        } catch (error) {
            console.error("Error checking trigger responses:", error);
        }
    }
}
