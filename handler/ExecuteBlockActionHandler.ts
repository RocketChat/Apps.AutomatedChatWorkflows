import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { UIKitBlockInteractionContext } from "@rocket.chat/apps-engine/definition/uikit";
import { IUIKitResponse } from "@rocket.chat/apps-engine/definition/uikit/IUIKitInteractionType";
import { AiChatWorkflowsAutomationApp } from "../AiChatWorkflowsAutomationApp";
import { Modals } from "../definitions/ModalsEnum";
import { WorkflowListContextualBar } from "../modals/WorkflowListContextualBar";
import {
    getWorkflowSearchState,
    setWorkflowSearchState,
} from "../utils/PersistenceMethods";

export class ExecuteBlockActionHandler {
    constructor(
        private readonly app: AiChatWorkflowsAutomationApp,
        private readonly read: IRead,
        private readonly http: IHttp,
        private readonly modify: IModify,
        private readonly persistence: IPersistence
    ) {}

    public async run(
        context: UIKitBlockInteractionContext
    ): Promise<IUIKitResponse> {
        const interactionData = context.getInteractionData();
        const { actionId, container } = interactionData;

        // Verify that this block action originated from the Workflow Manager contextual bar
        if (container?.id === Modals.WorkflowListContextualBar) {
            return await this.handleWorkflowListContextualBar(context);
        }

        return context.getInteractionResponder().successResponse();
    }

    private async handleWorkflowListContextualBar(
        context: UIKitBlockInteractionContext
    ): Promise<IUIKitResponse> {
        const interactionData = context.getInteractionData();
        const { actionId, value, user } = interactionData;

        if (!user) {
            return context.getInteractionResponder().errorResponse();
        }

        if (actionId === "workflow_list_close") {
            return context.getInteractionResponder().successResponse();
        }

        // Retrieve existing search state (query & selected section)
        const currentState = await getWorkflowSearchState(this.read, user.id);
        let searchQuery = currentState?.searchQuery || "";
        let selectedSection = currentState?.selectedSection || "all";

        // Also check if rawView is present on interactionData at runtime
        const rawView = (interactionData as any).view;
        const viewState = rawView?.state as
            | {
                  workflowSearchBlock?: {
                      workflow_search_input?: string;
                  };
                  workflowSectionBlock?: {
                      workflow_section_select?: string;
                  };
              }
            | undefined;

        if (viewState?.workflowSectionBlock?.workflow_section_select) {
            selectedSection =
                viewState.workflowSectionBlock.workflow_section_select;
        }

        switch (actionId) {
            case "workflow_search_input":
                if (value !== undefined) {
                    searchQuery = value;
                }
                break;

            case "workflow_search_button":
                if (
                    viewState?.workflowSearchBlock?.workflow_search_input !==
                    undefined
                ) {
                    searchQuery =
                        viewState.workflowSearchBlock.workflow_search_input;
                }
                break;

            case "workflow_search_clear":
                searchQuery = "";
                break;

            case "workflow_section_select":
                if (value !== undefined) {
                    selectedSection = value;
                }
                break;

            default:
                break;
        }

        // Persist the updated search state
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
}
