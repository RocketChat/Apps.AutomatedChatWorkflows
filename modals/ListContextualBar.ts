import {
    IUIKitSurfaceViewParam,
} from '@rocket.chat/apps-engine/definition/accessors';
import { TextObjectType } from '@rocket.chat/ui-kit';
import { UIKitSurfaceType } from '@rocket.chat/apps-engine/definition/uikit';
import { BlockElementType } from '@rocket.chat/apps-engine/definition/uikit';
import { IWorkflow, ModalsAction, WorkflowContextualBarEnum } from '../definitions/ModalsEnum/ListContextualBar';


export async function listWorkflowContextualBar(
    chatWorkflows: IWorkflow[],
    uiWorkflows: IWorkflow[],
    searchValue?: string,
): Promise<IUIKitSurfaceViewParam> {
    const blocks: any[] = [];

    // Filter workflows based on search value
    const searchValueLowerCase = searchValue?.toLowerCase();

    let filteredChatWorkflows = chatWorkflows;
    let filteredUIWorkflows = uiWorkflows;

    if (searchValueLowerCase) {
        filteredChatWorkflows = chatWorkflows.filter((workflow) => {
            return (
                workflow.id.toLowerCase().includes(searchValueLowerCase) ||
                workflow.command.toLowerCase().includes(searchValueLowerCase)
            );
        });

        filteredUIWorkflows = uiWorkflows.filter((workflow) => {
            return (
                workflow.id.toLowerCase().includes(searchValueLowerCase) ||
                workflow.command.toLowerCase().includes(searchValueLowerCase)
            );
        });
    }

    const sortedChatWorkflows = filteredChatWorkflows.sort((a, b) => {
        return a.command.localeCompare(b.command);
    });

    const sortedUIWorkflows = filteredUIWorkflows.sort((a, b) => {
        return a.command.localeCompare(b.command);
    });

    // Search Input Block
    blocks.push({
        type: 'input',
        blockId: WorkflowContextualBarEnum.SEARCH_BLOCK_ID,
        label: {
            text: 'Search Workflows',
            type: TextObjectType.PLAINTEXT,
        },
        element: {
            type: 'plain_text_input',
            actionId: WorkflowContextualBarEnum.SEARCH_ACTION_ID,
            placeholder: {
                text: 'Search by ID or command...',
                type: TextObjectType.PLAINTEXT,
            },
            initialValue: searchValue || '',
            dispatchActionConfig: [ModalsAction.dispatchActionConfigOnInput],
        },
    });

    blocks.push({
        type: 'divider',
    });

    if (sortedChatWorkflows.length > 0) {
        blocks.push({
            type: 'section',
            text: {
                type: TextObjectType.MRKDWN,
                text: '*Workflows Created via Chat*',
            },
        });

        blocks.push({
            type: 'divider',
        });

        sortedChatWorkflows.forEach((workflow) => {
            // Workflow Command Section with Overflow Menu
            blocks.push({
                type: 'section',
                text: {
                    type: TextObjectType.MRKDWN,
                    text: `*Command:* ${workflow.command.slice(0, 40)}`,
                },
                accessory: {
                    type: BlockElementType.OVERFLOW_MENU,
                    actionId: `${WorkflowContextualBarEnum.OVERFLOW_ACTION_ID}_${workflow.id}`,
                    options: [
                        {
                            text: {
                                type: TextObjectType.PLAIN_TEXT,
                                text: 'Edit',
                            },
                            value: `${WorkflowContextualBarEnum.EDIT_ACTION_VALUE}_${workflow.id}`,
                        },
                        {
                            text: {
                                type: TextObjectType.PLAIN_TEXT,
                                text: 'Delete',
                            },
                            value: `${WorkflowContextualBarEnum.DELETE_ACTION_VALUE}_${workflow.id}`,
                        },
                    ],
                },
            });

            // Workflow Details Context
            blocks.push({
                type: 'context',
                elements: [
                    {
                        type: TextObjectType.MRKDWN,
                        text: `*ID:* ${workflow.id} | *Notification:* ${workflow.toNotify ? '✅ ON' : '❌ OFF'} | *Status:* ${workflow.isActive ? '🟢 Enabled' : '🔴 Disabled'}`,
                    },
                ],
            });

            blocks.push({
                type: 'divider',
            });
        });
    }

    // UI-based Workflows Section
    if (sortedUIWorkflows.length > 0) {
        blocks.push({
            type: 'section',
            text: {
                type: TextObjectType.MRKDWN,
                text: '*Workflows Created via UI*',
            },
        });

        blocks.push({
            type: 'divider',
        });

        sortedUIWorkflows.forEach((workflow) => {
            // Workflow Command Section with Overflow Menu
            blocks.push({
                type: 'section',
                text: {
                    type: TextObjectType.MRKDWN,
                    text: `*Command:* ${workflow.command.slice(0, 40)}`,
                },
                accessory: {
                    type: BlockElementType.OVERFLOW_MENU,
                    actionId: `${WorkflowContextualBarEnum.OVERFLOW_ACTION_ID}_${workflow.id}`,
                    options: [
                        {
                            text: {
                                type: TextObjectType.PLAIN_TEXT,
                                text: 'Edit',
                            },
                            value: `${WorkflowContextualBarEnum.EDIT_ACTION_VALUE}_${workflow.id}`,
                        },
                        {
                            text: {
                                type: TextObjectType.PLAIN_TEXT,
                                text: 'Delete',
                            },
                            value: `${WorkflowContextualBarEnum.DELETE_ACTION_VALUE}_${workflow.id}`,
                        },
                    ],
                },
            });

            // Workflow Details Context
            blocks.push({
                type: 'context',
                elements: [
                    {
                        type: TextObjectType.MRKDWN,
                        text: `*ID:* ${workflow.id} | *Notification:* ${workflow.toNotify ? '✅ ON' : '❌ OFF'} | *Status:* ${workflow.isActive ? '🟢 Enabled' : '🔴 Disabled'}`,
                    },
                ],
            });

            blocks.push({
                type: 'divider',
            });
        });
    }

    if (sortedChatWorkflows.length === 0 && sortedUIWorkflows.length === 0) {
        blocks.push({
            type: 'section',
            text: {
                type: TextObjectType.PLAIN_TEXT,
                text: searchValue
                    ? 'No workflows found matching your search.'
                    : 'No workflows found. Create your first workflow to get started!',
            },
        });
    }

    return {
        id: WorkflowContextualBarEnum.VIEW_ID,
        type: UIKitSurfaceType.CONTEXTUAL_BAR,
        title: {
            type: TextObjectType.PLAIN_TEXT,
            text: 'Workflows List',
        },
        blocks,
    };
}
