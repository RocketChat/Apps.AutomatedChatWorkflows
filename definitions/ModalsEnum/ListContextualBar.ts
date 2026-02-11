export enum WorkflowContextualBarEnum {
    VIEW_ID = 'workflow_list_contextual_bar',
    SEARCH_BLOCK_ID = 'workflow_search_block',
    SEARCH_ACTION_ID = 'workflow_search_action',
    CLOSE_ACTION_ID = 'workflow_close_action',
    CLOSE_BLOCK_ID = 'workflow_close_block',
    OVERFLOW_ACTION_ID = 'workflow_overflow_action',
    EDIT_ACTION_VALUE = 'edit',
    DELETE_ACTION_VALUE = 'delete',
}

export enum ModalsAction {
    dispatchActionConfigOnInput = 'on_character_entered',
    dispatchActionConfigOnSelect = 'on_item_selected',
}

export interface IWorkflow {
    id: string;
    command: string;
    toNotify: boolean;
    isActive: boolean;
    createdViaUI: boolean;
}

