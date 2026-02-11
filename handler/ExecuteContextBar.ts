import {
    IUIKitResponse,
    UIKitBlockInteractionContext,
} from '@rocket.chat/apps-engine/definition/uikit';
import { IRead, IModify, IPersistence } from '@rocket.chat/apps-engine/definition/accessors';
import { listWorkflowContextualBar } from '../modals/ListContextualBar';
import { findTriggerResponsesByCreatorAndLLM } from '../utils/PersistenceMethods';
import { WorkflowContextualBarEnum } from '../definitions/ModalsEnum/ListContextualBar';

export class WorkflowContextualBarExecutor {
    constructor(
        private readonly app: any,
        private readonly read: IRead,
        private readonly modify: IModify,
        private readonly persistence: IPersistence,
    ) { }

    public async handleActions(
        context: UIKitBlockInteractionContext,
    ): Promise<IUIKitResponse> {
        const data = context.getInteractionData();
        const { actionId, user, room, value } = data;
        // Handle search input
        if (actionId === WorkflowContextualBarEnum.SEARCH_ACTION_ID) {

            // Fetch workflows again
            const chatWorkflows = await findTriggerResponsesByCreatorAndLLM(
                this.read,
                user.id,
                true
            );

            const uiWorkflows = await findTriggerResponsesByCreatorAndLLM(
                this.read,
                user.id,
                false
            );

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
            if (value) {
                console.log(`Search value: "${value}"`);
                const updatedView = await listWorkflowContextualBar(
                    transformedChatWorkflows,
                    transformedUIWorkflows,
                    value as string,
                );

                return context.getInteractionResponder().updateContextualBarViewResponse(updatedView);
            } else {
                const updatedView = await listWorkflowContextualBar(
                    transformedChatWorkflows,
                    transformedUIWorkflows,
                );

                return context.getInteractionResponder().updateContextualBarViewResponse(updatedView);
            }
        }

        // Handle close button
        if (actionId === WorkflowContextualBarEnum.CLOSE_ACTION_ID) {
            return context.getInteractionResponder().successResponse();
        }

        return context.getInteractionResponder().successResponse();
    }
}
