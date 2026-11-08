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
    setWorkflowSearchState,
} from "../utils/PersistenceMethods";
import { sendNotification } from "../utils/Messages";
import { MessageEnum } from "../definitions/MessageEnum";
import { WorkflowListContextualBar } from "../modals/WorkflowListContextualBar";

export class ExecuteViewSubmitHandler {
    constructor(
        private readonly app: AiChatWorkflowsAutomationApp,
        private readonly read: IRead,
        private readonly http: IHttp,
        private readonly modify: IModify,
        private readonly persistence: IPersistence
    ) {}

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

            case Modals.WorkflowListContextualBar:
                return await this.handleWorkflowListContextualBar(context);

            default:
                return {
                    success: false,
                    error: "Unknown modal ID",
                };
        }
    }

    private async handleWorkflowListContextualBar(
        context: UIKitViewSubmitInteractionContext
    ) {
        const { user, view } = context.getInteractionData();
        const state = view.state as
            | {
                  workflowSearchBlock?: {
                      workflow_search_input?: string;
                  };
                  workflowSectionBlock?: {
                      workflow_section_select?: string;
                  };
              }
            | undefined;

        const searchQuery =
            state?.workflowSearchBlock?.workflow_search_input || "";
        const selectedSection =
            state?.workflowSectionBlock?.workflow_section_select || "all";

        await setWorkflowSearchState(this.persistence, user.id, {
            searchQuery,
            selectedSection,
        });

        const updatedContextualBar = await WorkflowListContextualBar({
            read: this.read,
            modify: this.modify,
            userId: user.id,
            searchQuery,
            selectedSection,
        });

        return context
            .getInteractionResponder()
            .updateContextualBarViewResponse(updatedContextualBar);
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

            const id = await saveTriggerResponse(
                this.persistence,
                {
                    command: command,
                    trigger: {
                        user: users,
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

            const { room, error } = await getRoom(this.read, user.id);
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
