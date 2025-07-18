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
    findTriggerResponsesByCreatorAndLLM,
} from "../utils/PersistenceMethodsCreationWorkflow";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { sendMessageInChannel } from "../utils/Messages";

export class ChatAutomation implements ISlashCommand {
    public constructor(private readonly app: AiChatWorkflowsAutomationApp) {}

    public command = "chat-automation";
    public i18nDescription = "chat automation config";
    public providesPreview = false;
    public i18nParamsExample = "list";

    public async executor(
        context: SlashCommandContext,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persistence: IPersistence
    ): Promise<void> {
        const sender = context.getSender();
        const room = context.getRoom();

        const appUser = (await read.getUserReader().getAppUser()) as IUser;

        const command = context.getArguments();
        const [subcommand] = context.getArguments();
        const filter = subcommand ? subcommand.toLowerCase() : "";

        // let ids: string[] | undefined;

        if (filter === "list") {
            const userCommands = await findTriggerResponsesByCreatorAndLLM(
                read,
                sender.id,
                true
            );

            let messageToSend: string;

            if (userCommands.length > 0) {
                let counter = 1;
                messageToSend = userCommands
                    .map((command) => {
                        const line = `${counter}. ${command.data.id} => ${command.data.command}`;
                        counter++;
                        return line;
                    })
                    .join("\n");
            } else {
                messageToSend =
                    "No automation workflows found. Please create a workflow first.";
            }
            await sendMessageInChannel(
                modify,
                appUser,
                room,
                "Created using chat: "
            );
            await sendMessageInChannel(modify, appUser, room, messageToSend);

            // ==================================================================
            const userCommandsUI = await findTriggerResponsesByCreatorAndLLM(
                read,
                sender.id,
                false
            );

            let messageToSendUI: string;

            if (userCommandsUI.length > 0) {
                let counter = 1;
                messageToSendUI = userCommandsUI
                    .map((command) => {
                        const line = `${counter}. ${command.data.id} => ${command.data.command}`;
                        counter++;
                        return line;
                    })
                    .join("\n");
            } else {
                messageToSendUI =
                    "No automation workflows found. Please create a workflow first.";
            }
            await sendMessageInChannel(
                modify,
                appUser,
                room,
                "Created using UI Block: "
            );
            await sendMessageInChannel(modify, appUser, room, messageToSendUI);
        } else if (filter === "delete") {
            if (command[1]) {
                await deleteTriggerResponse(persistence, command[1]);
                await sendMessageInChannel(
                    modify,
                    appUser,
                    room,
                    `deleted the workflow with id ${command[1]}`
                );
            }
        } else {
            await sendMessageInChannel(
                modify,
                appUser,
                room,
                `Please provide filter eg: list, delete <id>`
            );
            // ids = command.map((name) => name.replace(/^@/, ''));
        }
    }
}
