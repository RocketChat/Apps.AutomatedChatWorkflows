import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import {
    ISlashCommand,
    SlashCommandContext,
} from "@rocket.chat/apps-engine/definition/slashcommands";
import { AiChatWorkflowsAutomationApp } from "../AiChatWorkflowsAutomationApp";
import {
    deleteTriggerResponse,
    setWorkflowSearchState,
    updateIsActiveStatus,
    updateToNotifyStatus,
} from "../utils/PersistenceMethods";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { MessageEnum } from "../definitions/MessageEnum";
import {
    sendDirectMessage,
    sendNotification,
    sendMessageInChannel,
    sendThreadMessage,
} from "../utils/Messages";
import { IMessageRaw } from "@rocket.chat/apps-engine/definition/messages";
import { WorkflowListContextualBar } from "../modals/WorkflowListContextualBar";

export class ChatAutomation implements ISlashCommand {
    public constructor(private readonly app: AiChatWorkflowsAutomationApp) {}

    public command = "chat-automation";
    public i18nDescription = "chat automation config";
    public providesPreview = false;
    public i18nParamsExample = "";

    public async executor(
        context: SlashCommandContext,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persistence: IPersistence
    ): Promise<void> {
        const user = context.getSender();
        const room = context.getRoom();
        const threadId = context.getThreadId();

        const appUser = (await read.getUserReader().getAppUser()) as IUser;

        const command = context.getArguments();
        const [subcommand] = context.getArguments();
        const filter = subcommand ? subcommand.toLowerCase() : "";

        if (filter === "list") {
            const triggerId = context.getTriggerId();
            if (!triggerId) {
                await sendNotification(
                    read,
                    modify,
                    user,
                    room,
                    "Unable to open Workflow Manager: No trigger ID available.",
                    threadId
                );
                return;
            }

            try {
                await setWorkflowSearchState(persistence, user.id, {
                    searchQuery: "",
                    selectedSection: "all",
                });

                const contextualBar = await WorkflowListContextualBar({
                    read,
                    modify,
                    userId: user.id,
                    searchQuery: "",
                    selectedSection: "all",
                });

                await modify.getUiController().openContextualBarView(
                    contextualBar,
                    { triggerId },
                    user
                );
            } catch (error) {
                this.app.getLogger().error("Error opening WorkflowListContextualBar:", error);
                await sendNotification(
                    read,
                    modify,
                    user,
                    room,
                    "Failed to open Workflow Manager contextual bar. Please try again.",
                    threadId
                );
            }
        } else if (filter === "delete") {
            if (command[1]) {
                await deleteTriggerResponse(persistence, command[1]);

                await sendNotification(
                    read,
                    modify,
                    user,
                    room,
                    `Deleted the workflow with id ${command[1]}`,
                    threadId
                );
            }
        } else if (filter === "notification") {
            if (command[1]) {
                if (command[1].toLocaleLowerCase() === "off") {
                    if (command[2]) {
                        await updateToNotifyStatus(
                            persistence,
                            read,
                            command[2],
                            false
                        );

                        await sendNotification(
                            read,
                            modify,
                            user,
                            room,
                            `Notification config updated to 'OFF' for workflow with id: ${command[2]}`,
                            threadId
                        );
                    }
                } else if (command[1].toLocaleLowerCase() === "on") {
                    if (command[2]) {
                        await updateToNotifyStatus(
                            persistence,
                            read,
                            command[2],
                            true
                        );

                        await sendNotification(
                            read,
                            modify,
                            user,
                            room,
                            `Notification config updated to 'ON' for workflow with id: ${command[2]}`,
                            threadId
                        );
                    }
                }
            }
        } else if (filter === "enable") {
            if (command[1]) {
                await updateIsActiveStatus(persistence, read, command[1], true);

                await sendNotification(
                    read,
                    modify,
                    user,
                    room,
                    `Automation workflow with id: ${command[1]} is now enabled.`,
                    threadId
                );
            }
        } else if (filter === "disable") {
            if (command[1]) {
                await updateIsActiveStatus(
                    persistence,
                    read,
                    command[1],
                    false
                );
                await sendNotification(
                    read,
                    modify,
                    user,
                    room,
                    `Automation workflow with id: ${command[1]} is now disabled.`,
                    threadId
                );
            }
        } else if (filter === "ping") {
            await sendDirectMessage(
                read,
                modify,
                user,
                `_Hello ${user.name}, I'm ${appUser.name} App. I can help you create Chat Automation workflows!_
                Here’s how it works: 
                _"Whenever @<username> posts any welcome messages in #<channel name>, immediately DM them with a thank-you note."_
                _Just describe what you'd like to automate, and I'll take care of the rest!_`
            );
        } else {
            await sendNotification(
                read,
                modify,
                user,
                room,
                MessageEnum.CHAT_AUTOMATION_COMMAND_INSTRUCTION_MESSAGE,
                threadId
            );
        }
    }
}
