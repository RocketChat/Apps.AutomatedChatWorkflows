import {
    IAppAccessors,
    IConfigurationExtend,
    IHttp,
    ILogger,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { App } from "@rocket.chat/apps-engine/definition/App";
import { IAppInfo } from "@rocket.chat/apps-engine/definition/metadata";
import { settings } from "./settings/settings";
import { IPostMessageSentToBot } from "@rocket.chat/apps-engine/definition/messages/IPostMessageSentToBot";
import {
    IMessage,
    IPostMessageSent,
} from "@rocket.chat/apps-engine/definition/messages";
import { PostMessageSentToBotHandler } from "./handler/PostMessageSentToBotHandler";
import { ChatAutomationCreate } from "./slashCommands/ChatAutomationCreate";
import { UIKitViewSubmitInteractionContext } from "@rocket.chat/apps-engine/definition/uikit";
import { ExecuteViewSubmitHandler } from "./handler/ExecuteViewSubmitHandler";
import { PostMessageSentHandler } from "./handler/PostMessageSentHandler";
import { ChatAutomation } from "./slashCommands/ChatAutomation";

export class AiChatWorkflowsAutomationApp
    extends App
    implements IPostMessageSentToBot, IPostMessageSent
{
    constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
        super(info, logger, accessors);
    }

    public async executePostMessageSentToBot(
        message: IMessage,
        read: IRead,
        http: IHttp,
        persistence: IPersistence,
        modify: IModify
    ): Promise<void> {
        const handler = new PostMessageSentToBotHandler();
        await handler.executePostMessageSentToBot(
            message,
            read,
            http,
            persistence,
            modify
        );
    }

    public async executeViewSubmitHandler(
        context: UIKitViewSubmitInteractionContext,
        read: IRead,
        http: IHttp,
        persistence: IPersistence,
        modify: IModify
    ) {
        const handler = new ExecuteViewSubmitHandler(
            this,
            read,
            http,
            modify,
            persistence
        );
        return await handler.run(context);
    }

    public async executePostMessageSent(
        message: IMessage,
        read: IRead,
        http: IHttp,
        persistence: IPersistence,
        modify: IModify
    ): Promise<void> {
        const handler = new PostMessageSentHandler();

        await handler.executePostMessageSent(
            message,
            read,
            http,
            persistence,
            modify
        );
    }

    public async extendConfiguration(configuration: IConfigurationExtend) {
        await Promise.all([
            ...settings.map((setting) =>
                configuration.settings.provideSetting(setting)
            ),
            configuration.slashCommands.provideSlashCommand(
                new ChatAutomationCreate(this)
            ),
            configuration.slashCommands.provideSlashCommand(
                new ChatAutomation(this)
            ),
        ]);
    }
}
