import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { SlashCommandContext } from "@rocket.chat/apps-engine/definition/slashcommands";
import { UIKitInteractionContext } from "@rocket.chat/apps-engine/definition/uikit";
import { IUIKitModalViewParam } from "@rocket.chat/apps-engine/definition/uikit/UIKitInteractionResponder";
import { TextObjectType } from "@rocket.chat/apps-engine/definition/uikit/blocks";
import { Modals } from "../definitions/ModalsEnum";
import { t } from "../i18n/translation";

export async function AutomationCreateModal({
    modify,
    read,
    persistence,
    http,
    slashCommandContext,
    uiKitContext,
}: {
    modify: IModify;
    read: IRead;
    persistence: IPersistence;
    http: IHttp;
    slashCommandContext?: SlashCommandContext;
    uiKitContext?: UIKitInteractionContext;
}): Promise<IUIKitModalViewParam> {
    const room =
        slashCommandContext?.getRoom() ||
        uiKitContext?.getInteractionData().room;
    const user =
        slashCommandContext?.getSender() ||
        uiKitContext?.getInteractionData().user;

    const blocks = modify.getCreator().getBlockBuilder();

    // User/Group selection
    blocks.addInputBlock({
        label: {
            text: t("automation_users_label"),
            type: TextObjectType.PLAINTEXT,
        },
        element: blocks.newPlainTextInputElement({
            actionId: "users",
            placeholder: {
                text: t("automation_users_placeholder"),
                type: TextObjectType.PLAINTEXT,
            },
        }),
        blockId: "usersBlock",
    });

    // Channel selection
    blocks.addInputBlock({
        label: {
            text: t("automation_channels_label"),
            type: TextObjectType.PLAINTEXT,
        },
        element: blocks.newPlainTextInputElement({
            actionId: "channels",
            placeholder: {
                text: t("automation_channels_placeholder"),
                type: TextObjectType.PLAINTEXT,
            },
        }),
        blockId: "channelsBlock",
    });

    // Trigger condition
    blocks.addInputBlock({
        label: {
            text: t("automation_condition_label"),
            type: TextObjectType.PLAINTEXT,
        },
        element: blocks.newPlainTextInputElement({
            actionId: "condition",
            placeholder: {
                text: t("automation_condition_placeholder"),
                type: TextObjectType.PLAINTEXT,
            },
        }),
        blockId: "conditionBlock",
    });

    // Action selection (new dropdown)
    blocks.addInputBlock({
        label: {
            text: t("automation_action_label"),
            type: TextObjectType.PLAINTEXT,
        },
        element: blocks.newStaticSelectElement({
            actionId: "action",
            placeholder: {
                text: t("automation_action_placeholder"),
                type: TextObjectType.PLAINTEXT,
            },
            options: [
                {
                    text: {
                        text: t("automation_action_send_dm"),
                        type: TextObjectType.PLAINTEXT,
                    },
                    value: "send-message-in-dm",
                },
                {
                    text: {
                        text: t("automation_action_send_channel"),
                        type: TextObjectType.PLAINTEXT,
                    },
                    value: "send-message-in-channel",
                },
                {
                    text: {
                        text: t("automation_action_delete"),
                        type: TextObjectType.PLAINTEXT,
                    },
                    value: "delete-message",
                },
                {
                    text: {
                        text: t("automation_action_edit"),
                        type: TextObjectType.PLAINTEXT,
                    },
                    value: "edit-message",
                },
            ],
        }),
        blockId: "actionBlock",
    });

    // Response message
    blocks.addInputBlock({
        label: {
            text: t("automation_response_label"),
            type: TextObjectType.PLAINTEXT,
        },
        element: blocks.newPlainTextInputElement({
            actionId: "response",
            multiline: true,
            placeholder: {
                text: t("automation_response_placeholder"),
                type: TextObjectType.PLAINTEXT,
            },
        }),
        blockId: "responseBlock",
    });

    return {
        id: Modals.AutomationCreate,
        title: blocks.newPlainTextObject(t("automation_create_title")),
        submit: blocks.newButtonElement({
            text: blocks.newPlainTextObject(t("create_automation")),
            actionId: 'automation_create_config',
        }),
        blocks: blocks.getBlocks(),
    };
}
