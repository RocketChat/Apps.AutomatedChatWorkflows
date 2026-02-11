import { BlockElementType, TextObjectType } from '@rocket.chat/ui-kit';
import { UIKitSurfaceType, } from '@rocket.chat/apps-engine/definition/uikit';
import { TriggerResponseData } from '../utils/PersistenceMethods';
import { EditWorkflowModalEnum } from '../definitions/ModalsEnum/Editworkflow';


export async function createEditWorkflowModal(
    workflow: TriggerResponseData
): Promise<any> {
    const blocks: any[] = [];

    const actionOptions = [
        { text: 'Send Message', value: 'send-message' },
        { text: 'Reply to Message', value: 'reply-message' },
        { text: 'Delete Message', value: 'delete-message' },
    ];

    const notifyOptions = [
        { text: 'Yes', value: 'true' },
        { text: 'No', value: 'false' },
    ];
    const activeOptions = [
        { text: 'Enabled', value: 'true' },
        { text: 'Disabled', value: 'false' },
    ];

    blocks.push({
        type: 'section',
        text: {
            type: TextObjectType.MRKDWN,
            text: `*Edit Workflow*\n_ID: \`${workflow.id}\`_`,
        },
    });

    blocks.push({ type: 'divider' });

    blocks.push({
        type: 'input',
        blockId: EditWorkflowModalEnum.USERS_BLOCK,
        label: {
            type: TextObjectType.PLAIN_TEXT,
            text: 'User',
        },
        element: {
            type: 'plain_text_input',
            actionId: EditWorkflowModalEnum.USERS_ACTION,
            placeholder: {
                type: TextObjectType.PLAIN_TEXT,
                text: 'Enter username',
            },
            initialValue: workflow.trigger?.user || '',
        },
    });

    blocks.push({
        type: 'input',
        blockId: EditWorkflowModalEnum.CHANNELS_BLOCK,
        label: {
            type: TextObjectType.PLAIN_TEXT,
            text: 'Channel',
        },
        element: {
            type: 'plain_text_input',
            actionId: EditWorkflowModalEnum.CHANNELS_ACTION,
            placeholder: {
                type: TextObjectType.PLAIN_TEXT,
                text: 'Enter channel name',
            },
            initialValue: workflow.trigger?.channel || '',
        },
    });

    blocks.push({
        type: 'input',
        blockId: EditWorkflowModalEnum.CONDITION_BLOCK,
        label: {
            type: TextObjectType.PLAIN_TEXT,
            text: 'Trigger Condition',
        },
        element: {
            type: 'plain_text_input',
            actionId: EditWorkflowModalEnum.CONDITION_ACTION,
            placeholder: {
                type: TextObjectType.PLAIN_TEXT,
                text: 'Enter trigger phrase',
            },
            initialValue: workflow.trigger?.condition || '',
        },
    });

    const currentAction = workflow.response?.action || 'send-message';
    const selectedAction = actionOptions.find(opt => opt.value === currentAction);

    blocks.push({
        type: 'input',
        blockId: EditWorkflowModalEnum.ACTION_BLOCK,
        label: {
            type: TextObjectType.PLAIN_TEXT,
            text: 'Action',
        },
        element: {
            type: BlockElementType.STATIC_SELECT,
            actionId: EditWorkflowModalEnum.ACTION_ACTION,
            placeholder: {
                type: TextObjectType.PLAIN_TEXT,
                text: 'Select action',
            },
            initialOption: {
                text: {
                    type: TextObjectType.PLAIN_TEXT,
                    text: selectedAction?.text || 'Send Message',
                },
                value: selectedAction?.value || 'send-message',
            },
            options: actionOptions.map(opt => ({
                text: {
                    type: TextObjectType.PLAIN_TEXT,
                    text: opt.text,
                },
                value: opt.value,
            })),
        },
    });

    blocks.push({
        type: 'input',
        blockId: EditWorkflowModalEnum.RESPONSE_BLOCK,
        label: {
            type: TextObjectType.PLAIN_TEXT,
            text: 'Response Message',
        },
        element: {
            type: 'plain_text_input',
            actionId: EditWorkflowModalEnum.RESPONSE_ACTION,
            multiline: true,
            placeholder: {
                type: TextObjectType.PLAIN_TEXT,
                text: 'Enter response message',
            },
            initialValue: workflow.response?.message || '',
        },
        optional: true,
    });

    const selectedNotify = workflow.toNotify ? notifyOptions[0] : notifyOptions[1];

    blocks.push({
        type: 'input',
        blockId: EditWorkflowModalEnum.NOTIFY_BLOCK,
        label: {
            type: TextObjectType.PLAIN_TEXT,
            text: 'Enable Notifications',
        },
        element: {
            type: BlockElementType.STATIC_SELECT,
            actionId: EditWorkflowModalEnum.NOTIFY_ACTION,
            placeholder: {
                type: TextObjectType.PLAIN_TEXT,
                text: 'Select preference',
            },
            initialOption: {
                text: {
                    type: TextObjectType.PLAIN_TEXT,
                    text: selectedNotify.text,
                },
                value: selectedNotify.value,
            },
            options: notifyOptions.map(opt => ({
                text: {
                    type: TextObjectType.PLAIN_TEXT,
                    text: opt.text,
                },
                value: opt.value,
            })),
        },
    });

    const selectedActive = workflow.isActive ? activeOptions[0] : activeOptions[1];

    blocks.push({
        type: 'input',
        blockId: EditWorkflowModalEnum.ACTIVE_BLOCK,
        label: {
            type: TextObjectType.PLAIN_TEXT,
            text: 'Workflow Status',
        },
        element: {
            type: BlockElementType.STATIC_SELECT,
            actionId: EditWorkflowModalEnum.ACTIVE_ACTION,
            placeholder: {
                type: TextObjectType.PLAIN_TEXT,
                text: 'Select status',
            },
            initialOption: {
                text: {
                    type: TextObjectType.PLAIN_TEXT,
                    text: selectedActive.text,
                },
                value: selectedActive.value,
            },
            options: activeOptions.map(opt => ({
                text: {
                    type: TextObjectType.PLAIN_TEXT,
                    text: opt.text,
                },
                value: opt.value,
            })),
        },
    });

    return {
        id: `${EditWorkflowModalEnum.VIEW_ID}---${workflow.id}`,
        type: UIKitSurfaceType.MODAL,
        title: {
            type: TextObjectType.PLAIN_TEXT,
            text: 'Edit Workflow',
        },
        blocks,
        close: {
            type: 'button',
            text: {
                type: TextObjectType.PLAIN_TEXT,
                text: 'Cancel',
            },
        },
        submit: {
            type: 'button',
            text: {
                type: TextObjectType.PLAIN_TEXT,
                text: 'Save Changes',
            },
        },
    };
}
