import { TextObjectType } from '@rocket.chat/ui-kit';
import { UIKitSurfaceType } from '@rocket.chat/apps-engine/definition/uikit';
import { DeleteWorkflowModalEnum } from '../definitions/ModalsEnum/DeleteWorkflowModal';


export async function createDeleteWorkflowModal(
    workflowId: string,
    workflowCommand?: string
): Promise<any> {
    const blocks: any[] = [];

    blocks.push({
        type: 'section',
        text: {
            type: TextObjectType.MRKDWN,
            text: `⚠️ *Are you sure you want to delete this workflow?*`,
        },
    });

    blocks.push({
        type: 'section',
        text: {
            type: TextObjectType.MRKDWN,
            text: `*Workflow ID:* ${workflowId}${workflowCommand ? `\n*Command:* ${workflowCommand.slice(0, 100)}` : ''}`,
        },
    });

    blocks.push({
        type: 'divider',
    });

    blocks.push({
        type: 'section',
        text: {
            type: TextObjectType.PLAIN_TEXT,
            text: 'This action cannot be undone. The workflow will be permanently deleted.',
        },
    });

    blocks.push({
        type: 'input',
        blockId: DeleteWorkflowModalEnum.WORKFLOW_ID_BLOCK,
        label: {
            type: TextObjectType.PLAIN_TEXT,
            text: 'Workflow ID',
        },
        element: {
            type: 'plain_text_input',
            actionId: 'workflow_id_input',
            initialValue: workflowId,
        },
        optional: false,
    });

    return {
        id: DeleteWorkflowModalEnum.VIEW_ID,
        type: UIKitSurfaceType.MODAL,
        title: {
            type: TextObjectType.PLAIN_TEXT,
            text: 'Delete Workflow',
        },
        blocks,
        close: {
            type: 'button',
            text: {
                type: TextObjectType.PLAIN_TEXT,
                text: 'Cancel',
            },
            actionId: DeleteWorkflowModalEnum.CANCEL_ACTION,
        },
        submit: {
            type: 'button',
            text: {
                type: TextObjectType.PLAIN_TEXT,
                text: 'Delete',
            },
            actionId: DeleteWorkflowModalEnum.SUBMIT_ACTION,
            style: 'danger',
        },
    };
}
