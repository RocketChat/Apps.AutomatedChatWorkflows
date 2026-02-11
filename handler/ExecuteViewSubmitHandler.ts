import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { UIKitViewSubmitInteractionContext } from "@rocket.chat/apps-engine/definition/uikit";
import { AiChatWorkflowsAutomationApp } from "../AiChatWorkflowsAutomationApp";
import { Modals } from "../definitions/ModalsEnum";
import {
    getRoom,
    saveTriggerResponse,
    updateTriggerResponse,
    deleteTriggerResponse,
} from "../utils/PersistenceMethods";
import { sendNotification } from "../utils/Messages";
import { MessageEnum } from "../definitions/MessageEnum";
import { DeleteWorkflowModalEnum } from "../definitions/ModalsEnum/DeleteWorkflowModal";
import { EditWorkflowModalEnum } from "../definitions/ModalsEnum/Editworkflow";

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
            return { success: false, error: "No user found" };
        }
        const modalId = view.id;
        console.log(`[ExecuteViewSubmitHandler] Modal ID: ${modalId}`);

        if (modalId.startsWith(EditWorkflowModalEnum.VIEW_ID)) {
            return await this.handleEditWorkflowModal(context);
        }
        switch (modalId) {
            case Modals.AutomationCreate:
                return await this.handleAutomationCreateModal(context);

            case DeleteWorkflowModalEnum.VIEW_ID:
                return await this.handleDeleteWorkflowModal(context);

            default:
                return { success: false, error: "Unknown modal ID" };
        }
    }

    private async handleAutomationCreateModal(
        context: UIKitViewSubmitInteractionContext
    ) {
        const { user, view } = context.getInteractionData();
        const action = view.state?.["actionBlock"]?.["action"] || "";
        const users = view.state?.["usersBlock"]?.["users"] || "";
        const channels = view.state?.["channelsBlock"]?.["channels"] || "";
        const condition = view.state?.["conditionBlock"]?.["condition"] || "";
        let response = view.state?.["responseBlock"]?.["response"] || "";

        if (action === "delete-message") {
            response = "N/A";
        }

        if (users && channels && condition && action && response) {
            const command = `When the user @${users} sends a message in the #${channels} channel that includes the phrase "${condition}", then perform the action "${action}" with response '${response}'.`;

            await saveTriggerResponse(
                this.persistence,
                {
                    command: command,
                    trigger: { user: users, channel: channels, condition: condition },
                    response: { action: action, message: response },
                },
                user.id,
                false,
                true,
                true
            );

            const { room } = await getRoom(this.read, user.id);
            if (room) {
                await sendNotification(
                    this.read,
                    this.modify,
                    user,
                    room,
                    MessageEnum.SUCCESS_MESSAGE_UI_MODAL + command
                );
            }

            return { success: true, ...view };
        }

        return { success: false, ...view };
    }

    private async handleEditWorkflowModal(
        context: UIKitViewSubmitInteractionContext
    ) {
        const { user, view } = context.getInteractionData();

        // Extract workflow ID from view.id (format: "edit_workflow_modal---workflowId_123")
        const workflowId = view.id.split('---')[1];

        if (!workflowId) {
            return { success: false, error: "Workflow ID not found", ...view };
        }
        const users = view.state?.[EditWorkflowModalEnum.USERS_BLOCK]?.[EditWorkflowModalEnum.USERS_ACTION] || "";
        const channels = view.state?.[EditWorkflowModalEnum.CHANNELS_BLOCK]?.[EditWorkflowModalEnum.CHANNELS_ACTION] || "";
        const condition = view.state?.[EditWorkflowModalEnum.CONDITION_BLOCK]?.[EditWorkflowModalEnum.CONDITION_ACTION] || "";
        const action = view.state?.[EditWorkflowModalEnum.ACTION_BLOCK]?.[EditWorkflowModalEnum.ACTION_ACTION] || "";
        let response = view.state?.[EditWorkflowModalEnum.RESPONSE_BLOCK]?.[EditWorkflowModalEnum.RESPONSE_ACTION] || "";
        const notify = view.state?.[EditWorkflowModalEnum.NOTIFY_BLOCK]?.[EditWorkflowModalEnum.NOTIFY_ACTION] === "true";
        const active = view.state?.[EditWorkflowModalEnum.ACTIVE_BLOCK]?.[EditWorkflowModalEnum.ACTIVE_ACTION] === "true";

        if (action === "delete-message") {
            response = "N/A";
        }

        if (users && channels && condition && action) {
            try {
                const command = `When the user @${users} sends a message in the #${channels} channel that includes the phrase "${condition}", then perform the action "${action}" with response '${response}'.`;

                await updateTriggerResponse(
                    this.persistence,
                    this.read,
                    workflowId,
                    {
                        command,
                        trigger: { user: users, channel: channels, condition: condition },
                        response: { action, message: response },
                        toNotify: notify,
                        isActive: active,
                    }
                );
                const { room } = await getRoom(this.read, user.id);
                if (room) {
                    await sendNotification(
                        this.read,
                        this.modify,
                        user,
                        room,
                        `✅ Workflow updated successfully!\n${command}`
                    );
                }
                return { success: true, ...view };
            } catch (error) {
                console.error('[handleEditWorkflowModal] Error:', error);
                return { success: false, error: "Failed to update workflow", ...view };
            }
        }
        return { success: false, error: "Missing required fields", ...view };
    }

    private async handleDeleteWorkflowModal(
        context: UIKitViewSubmitInteractionContext
    ) {
        const { user, view } = context.getInteractionData();

        const workflowId = view.state?.[DeleteWorkflowModalEnum.WORKFLOW_ID_BLOCK]?.["workflow_id_input"] || "";

        if (workflowId) {
            try {
                await deleteTriggerResponse(this.persistence, workflowId);

                const { room } = await getRoom(this.read, user.id);
                if (room) {
                    await sendNotification(
                        this.read,
                        this.modify,
                        user,
                        room,
                        `🗑️ Workflow deleted successfully (ID: ${workflowId})`
                    );
                }
                return { success: true, ...view };
            } catch (error) {
                console.error('[handleDeleteWorkflowModal] Error:', error);
                return { success: false, error: "Failed to delete workflow", ...view };
            }
        }

        return { success: false, error: "No workflow ID provided", ...view };
    }
}
