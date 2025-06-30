import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { UIKitViewSubmitInteractionContext } from "@rocket.chat/apps-engine/definition/uikit";
import { AiChatWorkflowsAutomationApp } from "../AiChatWorkflowsAutomationApp";
import { Modals } from "../definitions/ModalsEnum";
import { getTriggerResponse, saveTriggerResponse } from "../utils/PersistenceMethodsCreationWorkflow";

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
        const { user, view } = context.getInteractionData();

        const action = view.state?.["actionBlock"]?.["action"] || "";
        const users = view.state?.["usersBlock"]?.["users"] || "";
        const channels = view.state?.["channelsBlock"]?.["channels"] || "";
        const condition = view.state?.["conditionBlock"]?.["condition"] || "";
        const response = view.state?.["responseBlock"]?.["response"] || "";

        const id = await saveTriggerResponse(this.persistence, {
            trigger: {
                user: users,
                channel: channels,
                condition: condition,
            },
            response: {
                action: action,
                message: response,
            },
        });

        const record = await getTriggerResponse(this.read, id);
        console.log("record : " + JSON.stringify(record));

        return {
			success: true,
			...view,
		};
    }
}
