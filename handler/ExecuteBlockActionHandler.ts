import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import {
    UIKitBlockInteractionContext,
    IUIKitResponse,
} from "@rocket.chat/apps-engine/definition/uikit";
import { AiChatWorkflowsAutomationApp } from "../AiChatWorkflowsAutomationApp";
import { getTriggerResponse } from "../utils/PersistenceMethods";
import { WorkflowContextualBarExecutor } from "./ExecuteContextBar";
import { createDeleteWorkflowModal } from "../modals/DeleteModal";
import { createEditWorkflowModal } from "../modals/EditModal";
import { WorkflowContextualBarEnum } from "../definitions/ModalsEnum/ListContextualBar";

export class ExecuteBlockActionHandler {
    private context: UIKitBlockInteractionContext;

    constructor(
        private readonly app: AiChatWorkflowsAutomationApp,
        private readonly read: IRead,
        private readonly http: IHttp,
        private readonly modify: IModify,
        private readonly persistence: IPersistence,
        context: UIKitBlockInteractionContext,
    ) {
        this.context = context;
    }

    public async handleActions(): Promise<IUIKitResponse> {
        const { actionId } = this.context.getInteractionData();

        switch (true) {
            // Search and close actions
            case actionId === WorkflowContextualBarEnum.SEARCH_ACTION_ID:
            case actionId === WorkflowContextualBarEnum.CLOSE_ACTION_ID:
                return await this.handleContextualBarActions();
            case actionId?.startsWith(WorkflowContextualBarEnum.OVERFLOW_ACTION_ID):
                return await this.handleOverflowAction();
            default:
                return this.context.getInteractionResponder().successResponse();
        }
    }

    private async handleContextualBarActions(): Promise<IUIKitResponse> {
        const executor = new WorkflowContextualBarExecutor(
            this.app,
            this.read,
            this.modify,
            this.persistence,
        );
        return await executor.handleActions(this.context);
    }

    private async handleOverflowAction(): Promise<IUIKitResponse> {
        const { value } = this.context.getInteractionData();

        if (!value) {
            return this.context.getInteractionResponder().errorResponse();
        }

        // Parse value format: "edit_workflowId_123" or "delete_workflowId_123"
        const valueParts = value.split('_');
        const actionType = valueParts[0];
        const workflowId = valueParts.slice(1).join('_');

        switch (actionType) {
            case WorkflowContextualBarEnum.EDIT_ACTION_VALUE:
                return await this.openEditModal(workflowId);
            case WorkflowContextualBarEnum.DELETE_ACTION_VALUE:
                return await this.openDeleteModal(workflowId);
            default:
                return this.context.getInteractionResponder().errorResponse();
        }
    }

    private async openEditModal(workflowId: string): Promise<IUIKitResponse> {
        try {
            const workflow = await getTriggerResponse(this.read, workflowId);

            if (!workflow) {
                console.error(`[openEditModal] Workflow not found: ${workflowId}`);
                return this.context.getInteractionResponder().errorResponse();
            }

            const modal = await createEditWorkflowModal(workflow);
            return this.context.getInteractionResponder().openModalViewResponse(modal);

        } catch (error) {
            console.error(`[openEditModal] Error:`, error);
            return this.context.getInteractionResponder().errorResponse();
        }
    }

    private async openDeleteModal(workflowId: string): Promise<IUIKitResponse> {
        try {
            const workflow = await getTriggerResponse(this.read, workflowId);
            const modal = await createDeleteWorkflowModal(workflowId, workflow?.command);
            return this.context.getInteractionResponder().openModalViewResponse(modal);
        } catch (error) {
            console.error(`[openDeleteModal] Error:`, error);
            return this.context.getInteractionResponder().errorResponse();
        }
    }
}
