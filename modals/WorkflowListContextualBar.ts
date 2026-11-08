import {
    IModify,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import {
    ButtonStyle,
    InputElementDispatchAction,
} from "@rocket.chat/apps-engine/definition/uikit";
import { IUIKitContextualBarViewParam } from "@rocket.chat/apps-engine/definition/uikit/UIKitInteractionResponder";
import { Modals } from "../definitions/ModalsEnum";
import {
    findTriggerResponsesByCreatorAndLLM,
    TriggerResponseData,
} from "../utils/PersistenceMethods";

export interface IWorkflowListContextualBarParams {
    read: IRead;
    modify: IModify;
    userId: string;
    searchQuery?: string;
    selectedSection?: string; // "all" | "chat" | "ui"
}

export async function WorkflowListContextualBar({
    read,
    modify,
    userId,
    searchQuery = "",
    selectedSection = "all",
}: IWorkflowListContextualBarParams): Promise<IUIKitContextualBarViewParam> {
    const blocks = modify.getCreator().getBlockBuilder();

    // Fetch all user workflows
    const chatWorkflows = await findTriggerResponsesByCreatorAndLLM(
        read,
        userId,
        true
    );
    const uiWorkflows = await findTriggerResponsesByCreatorAndLLM(
        read,
        userId,
        false
    );

    // 1. Search Input Block (with live character dispatch where supported)
    blocks.addInputBlock({
        blockId: "workflowSearchBlock",
        label: blocks.newPlainTextObject("Search Workflows"),
        element: blocks.newPlainTextInputElement({
            actionId: "workflow_search_input",
            placeholder: blocks.newPlainTextObject(
                "Search by workflow ID or command..."
            ),
            initialValue: searchQuery,
            dispatchActionConfig: [
                InputElementDispatchAction.ON_CHARACTER_ENTERED,
            ],
        }),
    });

    // 2. Section Selector to preserve / switch active view section
    blocks.addInputBlock({
        blockId: "workflowSectionBlock",
        label: blocks.newPlainTextObject("Filter by Section"),
        element: blocks.newStaticSelectElement({
            actionId: "workflow_section_select",
            placeholder: blocks.newPlainTextObject("Select Section"),
            initialValue: selectedSection,
            options: [
                {
                    text: blocks.newPlainTextObject("All Workflows"),
                    value: "all",
                },
                {
                    text: blocks.newPlainTextObject("Chat-Created Workflows"),
                    value: "chat",
                },
                {
                    text: blocks.newPlainTextObject("UI-Created Workflows"),
                    value: "ui",
                },
            ],
            dispatchActionConfig: [
                InputElementDispatchAction.ON_ITEM_SELECTED,
            ],
        }),
    });

    // 3. Search and Clear Action Buttons (fallback / manual search for non-live UI Kit clients)
    blocks.addActionsBlock({
        blockId: "workflowSearchActionsBlock",
        elements: [
            blocks.newButtonElement({
                actionId: "workflow_search_button",
                text: blocks.newPlainTextObject("Search"),
                style: ButtonStyle.PRIMARY,
            }),
            blocks.newButtonElement({
                actionId: "workflow_search_clear",
                text: blocks.newPlainTextObject("Clear"),
            }),
        ],
    });

    blocks.addDividerBlock();

    // Filter logic: Search by workflow ID or command (case-insensitive substring)
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const matchesQuery = (item: { data: TriggerResponseData }) => {
        if (!normalizedQuery) {
            return true;
        }
        const idMatches = item.data.id.toLowerCase().includes(normalizedQuery);
        const commandMatches = item.data.command
            .toLowerCase()
            .includes(normalizedQuery);
        return idMatches || commandMatches;
    };

    const filteredChatWorkflows = chatWorkflows.filter(matchesQuery);
    const filteredUiWorkflows = uiWorkflows.filter(matchesQuery);

    const showChatSection = selectedSection === "all" || selectedSection === "chat";
    const showUiSection = selectedSection === "all" || selectedSection === "ui";

    // 4. Chat-Created Workflows Section
    if (showChatSection) {
        blocks.addSectionBlock({
            text: blocks.newMarkdownTextObject("*💬 Chat-Created Workflows*"),
        });

        if (filteredChatWorkflows.length > 0) {
            filteredChatWorkflows.forEach((workflowItem, index) => {
                const data: TriggerResponseData = workflowItem.data;
                blocks.addSectionBlock({
                    text: blocks.newMarkdownTextObject(
                        `*${index + 1}. ID:* \`${data.id}\`\n` +
                        `*Command:* ${data.command}\n` +
                        `*Notification:* ${data.toNotify ? "ON" : "OFF"}\n` +
                        `*Active Status:* ${data.isActive ? "Enabled" : "Disabled"}`
                    ),
                });
                if (index < filteredChatWorkflows.length - 1) {
                    blocks.addDividerBlock();
                }
            });
        } else {
            const emptyMsg = normalizedQuery
                ? `_No chat-created workflows match "${searchQuery.trim()}"._`
                : "_No chat-created workflows found._";
            blocks.addContextBlock({
                elements: [blocks.newMarkdownTextObject(emptyMsg)],
            });
        }
    }

    if (showChatSection && showUiSection) {
        blocks.addDividerBlock();
    }

    // 5. UI-Created Workflows Section
    if (showUiSection) {
        blocks.addSectionBlock({
            text: blocks.newMarkdownTextObject("*🖥️ UI-Created Workflows*"),
        });

        if (filteredUiWorkflows.length > 0) {
            filteredUiWorkflows.forEach((workflowItem, index) => {
                const data: TriggerResponseData = workflowItem.data;
                blocks.addSectionBlock({
                    text: blocks.newMarkdownTextObject(
                        `*${index + 1}. ID:* \`${data.id}\`\n` +
                        `*Command:* ${data.command}\n` +
                        `*Notification:* ${data.toNotify ? "ON" : "OFF"}\n` +
                        `*Active Status:* ${data.isActive ? "Enabled" : "Disabled"}`
                    ),
                });
                if (index < filteredUiWorkflows.length - 1) {
                    blocks.addDividerBlock();
                }
            });
        } else {
            const emptyMsg = normalizedQuery
                ? `_No UI-created workflows match "${searchQuery.trim()}"._`
                : "_No UI-created workflows found._";
            blocks.addContextBlock({
                elements: [blocks.newMarkdownTextObject(emptyMsg)],
            });
        }
    }

    return {
        id: Modals.WorkflowListContextualBar,
        title: blocks.newPlainTextObject("Workflow Manager"),
        close: blocks.newButtonElement({
            text: blocks.newPlainTextObject("Close"),
            actionId: "workflow_list_close",
        }),
        blocks: blocks.getBlocks(),
    };
}
