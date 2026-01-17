import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IPostMessageSent } from "@rocket.chat/apps-engine/definition/messages";
import { IMessage } from "@rocket.chat/apps-engine/definition/messages";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import {
    findTriggerResponsesByNullCombinations,
    findTriggerResponsesByUserAndChannel,
} from "../utils/PersistenceMethods";
import {
    createCheckConditionPrompt,
    createEditMessagePrompt,
} from "../utils/PromptHelpers";
import {
    deleteMessage,
    sendDirectMessage,
    sendMessageInChannel,
    updateMessageText,
} from "../utils/Messages";
import { ActionTypeEnum } from "../definitions/ActionTypeEnum";
import { createTextCompletion } from "../utils/AIProvider";
import { SettingEnum } from "../settings/settings";

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
        if (user.name === appUser.name) return;

        try {
            // Get all trigger responses for this user and channel
            // console.log("user: " + user.username);
            // console.log("room: " + room.slugifiedName);
            // console.log("room.type: " + room.type);

            const triggerResponses = await findTriggerResponsesByUserAndChannel(
                read,
                user.username,
                room.slugifiedName ?? ""
            );
            const triggerResponses2 =
                await findTriggerResponsesByNullCombinations(read);
            const allResponses = [...triggerResponses, ...triggerResponses2];

            const confidenceThresholdSetting = (await read
                .getEnvironmentReader()
                .getSettings()
                .getValueById(SettingEnum.ID_CONFIDENCE_THRESHOLD)) as number;

            const confidenceThreshold = Math.max(
                0,
                Math.min(100, confidenceThresholdSetting || 75)
            );

            for (const [index, response] of allResponses.entries()) {
                // UI Approach
                if (!response.data.usedLLM) {
                    if (!text.includes(response.data.trigger.condition))
                        continue;

                    if (
                        response.data.response.action ===
                        ActionTypeEnum.DELETE_MESSAGE
                    ) {
                        const isDeleted = await deleteMessage(
                            modify,
                            message,
                            user
                        );
                    }

                    if (response.data.response.message) {
                        if (
                            response.data.response.action ===
                            ActionTypeEnum.SEND_MESSAGE_IN_DM
                        ) {
                            await sendDirectMessage(
                                read,
                                modify,
                                user,
                                response.data.response.message
                            );
                        } else if (
                            response.data.response.action ===
                            ActionTypeEnum.SEND_MESSAGE_IN_CHANNEL
                        ) {
                            await sendMessageInChannel(
                                modify,
                                appUser,
                                room,
                                response.data.response.message
                            );
                        }

                        if (response.data.toNotify) {
                            const creatorUser = await read
                                .getUserReader()
                                .getById(response.data.createdBy);
                            const confirmationMessage = `Automation Workflow triggered for command: \n${response.data.command}`;

                            await sendDirectMessage(
                                read,
                                modify,
                                creatorUser,
                                confirmationMessage
                            );
                        }
                    }
                    continue;
                }

                // LLM Approach
                const checkConditionPrompt = createCheckConditionPrompt(
                    text,
                    response.data.trigger.condition
                );
                const checkConditionPromptByLLM =
                    await createTextCompletion(
                        read,
                        http,
                        checkConditionPrompt
                    );

                const checkConditionResponse: CheckConditionResponse =
                    typeof checkConditionPromptByLLM === "string"
                        ? JSON.parse(checkConditionPromptByLLM)
                        : checkConditionPromptByLLM;

                if (!checkConditionResponse.condition_met) continue;
                if (checkConditionResponse.confidence < confidenceThreshold) continue;

                if (
                    response.data.response.action ===
                    ActionTypeEnum.DELETE_MESSAGE
                ) {
                    const isDeleted = await deleteMessage(
                        modify,
                        message,
                        user
                    );
                }

                const messageToSend = response.data.response.message;
                if (!messageToSend) continue;

                if (
                    response.data.response.action ===
                    ActionTypeEnum.SEND_MESSAGE_IN_DM
                ) {
                    await sendDirectMessage(read, modify, user, messageToSend);
                } else if (
                    response.data.response.action ===
                    ActionTypeEnum.SEND_MESSAGE_IN_CHANNEL
                ) {
                    await sendMessageInChannel(
                        modify,
                        appUser,
                        room,
                        messageToSend
                    );
                } else if (
                    response.data.response.action ===
                    ActionTypeEnum.EDIT_MESSAGE
                ) {
                    const editMessagePrompt = createEditMessagePrompt(
                        response.data.command,
                        text
                    );
                    const editMessagePromptByLLM =
                        await createTextCompletion(
                            read,
                            http,
                            editMessagePrompt
                        );

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

                if (response.data.toNotify) {
                    const creatorUser = await read
                        .getUserReader()
                        .getById(response.data.createdBy);
                    const confirmationMessage = `Automation Workflow triggered for command: \n${response.data.command}`;

                    await sendDirectMessage(
                        read,
                        modify,
                        creatorUser,
                        confirmationMessage
                    );
                }
            }
        } catch (error) {
            console.error("Error checking trigger responses:", error);
        }
    }
}
