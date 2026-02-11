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
    findTriggerResponsesByCreatorAndLLM,
} from "../utils/PersistenceMethods";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { MessageEnum } from "../definitions/MessageEnum";
import { sendDirectMessage, sendNotification } from "../utils/Messages";
import { listWorkflowContextualBar } from "../modals/ListContextualBar";

export class ChatAutomation implements ISlashCommand {
    public constructor(private readonly app: AiChatWorkflowsAutomationApp) { }

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

        const [subcommand] = context.getArguments();
        const filter = subcommand ? subcommand.toLowerCase() : "";

        if (filter === "list") {
            await this.openWorkflowListContextualBar(context, read, modify);
        } else if (filter === "ping") {
            await sendDirectMessage(
                read,
                modify,
                user,
                `_Hello ${user.name}, I'm ${appUser.name} App. I can help you create Chat Automation workflows!_
                Here's how it works:
                _"Whenever @<username> posts any welcome messages in #<channel name>, immediately DM them with a thank-you note."_
                _Just describe what you'd like to automate, and I'll take care of the rest!_`
            );
        } else {
            // Show help message for unknown commands
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

    private async openWorkflowListContextualBar(
        context: SlashCommandContext,
        read: IRead,
        modify: IModify,
    ): Promise<void> {
        const room = context.getRoom();
        const user = context.getSender();

        // Fetch chat-based workflows (usedLLM = true)
        const chatWorkflows = await findTriggerResponsesByCreatorAndLLM(
            read,
            user.id,
            true
        );

        // Fetch UI-based workflows (usedLLM = false)
        const uiWorkflows = await findTriggerResponsesByCreatorAndLLM(
            read,
            user.id,
            false
        );

        // Transform the data to match the interface expected by the contextual bar
        const transformedChatWorkflows = chatWorkflows.map((cmd) => ({
            id: cmd.data.id,
            command: cmd.data.command,
            toNotify: cmd.data.toNotify,
            isActive: cmd.data.isActive,
            createdViaUI: false,
        }));

        const transformedUIWorkflows = uiWorkflows.map((cmd) => ({
            id: cmd.data.id,
            command: cmd.data.command,
            toNotify: cmd.data.toNotify,
            isActive: cmd.data.isActive,
            createdViaUI: true,
        }));

        // Create the contextual bar view
        const contextualBarView = await listWorkflowContextualBar(
            transformedChatWorkflows,
            transformedUIWorkflows,
        );

        // Open the contextual bar
        const triggerId = context.getTriggerId();
        if (triggerId) {
            await modify
                .getUiController()
                .openSurfaceView(contextualBarView, { triggerId }, user);
        }
    }
}
