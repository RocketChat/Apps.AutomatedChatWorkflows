import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { UIKitViewSubmitInteractionContext } from "@rocket.chat/apps-engine/definition/uikit";
import { AiChatWorkflowsAutomationApp } from "../AiChatWorkflowsAutomationApp";
import { Modals } from "../definitions/ModalsEnum";
import { getRoom, saveTriggerResponse } from "../utils/PersistenceMethods";
import { sendNotification } from "../utils/Messages";
import { MessageEnum } from "../definitions/MessageEnum";

export class ExecuteViewSubmitHandler {
    constructor(
        private readonly app: AiChatWorkflowsAutomationApp,
        private readonly read: IRead,
        private readonly http: IHttp,
        private readonly modify: IModify,
        private readonly persistence: IPersistence
    ) { }

    public async run(context: UIKitViewSubmitInteractionContext) {
        const { user, view } = context.getInteractionData();

        if (!user) {
            return {
                success: false,
                error: "No user found",
            };
        }

        const modalId = view.id;

        switch (modalId) {
            case Modals.AutomationCreate:
                return await this.handleAutomationCreateModal(context);

            default:
                return {
                    success: false,
                    error: "Unknown modal ID",
                };
        }
    }

    private async handleAutomationCreateModal(
        context: UIKitViewSubmitInteractionContext
    ) {
        let { user, view, room } = context.getInteractionData();

        const action = view.state?.["actionBlock"]?.["action"] || "";
        const users = view.state?.["usersBlock"]?.["users"] || "";
        let channels = view.state?.["channelsBlock"]?.["channels"] || "";
        const condition = view.state?.["conditionBlock"]?.["condition"] || "";
        let response = view.state?.["responseBlock"]?.["response"] || "";

        if (action === "delete-message") {
            response = "N/A";
        }

        if (!room) {
            const result = await getRoom(this.read, user.id);
            room = result.room as any;
        }

        if (!channels && room && room.slugifiedName) {
            channels = room.slugifiedName;
        }

        if (condition && action && (response || action === 'delete-message')) {
            const command = `When the user @${users} sends a message in the #${channels} channel that includes the phrase "${condition}", then perform the action "${action}" with response '${response}'.`;

            const id = await saveTriggerResponse(
                this.persistence,
                {
                    command: command,
                    trigger: {
                        user: users || null,
                        channel: channels,
                        condition: condition,
                    },
                    response: {
                        action: action,
                        message: response,
                    },
                },
                user.id,
                false,
                true,
                true
            );

            if (room) {
                await sendNotification(
                    this.read,
                    this.modify,
                    user,
                    room,
                    MessageEnum.SUCCESS_MESSAGE_UI_MODAL + command
                );
            }

            return {
                success: true,
                ...view,
            };
        } else {
            return {
                success: false,
                ...view,
            };
        }
    }
}
