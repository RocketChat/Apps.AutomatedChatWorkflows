import {
    IPersistence,
    IPersistenceRead,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import {
    RocketChatAssociationRecord,
    RocketChatAssociationModel,
} from "@rocket.chat/apps-engine/definition/metadata";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";

// Type for our user step records
interface UserStepData {
    step: number | string;
    userId: string; // Storing userId in the data for easier retrieval
}

// Association constant
const USER_STEP_TRACKER = "user_step_tracker";

/**
 * Sets or updates a user's current step
 * @param persistence IPersistence accessor
 * @param userId The user's ID
 * @param step The step number/identifier
 */
export async function setUserStep(
    persistence: IPersistence,
    userId: string,
    step: number | string
): Promise<void> {
    const userAssoc = new RocketChatAssociationRecord(
        RocketChatAssociationModel.USER,
        userId
    );
    const trackerAssoc = new RocketChatAssociationRecord(
        RocketChatAssociationModel.MISC,
        USER_STEP_TRACKER
    );

    const data: UserStepData = {
        step,
        userId,
    };

    await persistence.updateByAssociations(
        [userAssoc, trackerAssoc],
        data,
        true // upsert enabled
    );
}

/**
 * Gets a user's current step
 * @param read IRead accessor
 * @param userId The user's ID
 * @returns The current step or undefined if not found
 */
export async function getUserStep(
    read: IRead,
    userId: string
): Promise<number | string | undefined> {
    const userAssoc = new RocketChatAssociationRecord(
        RocketChatAssociationModel.USER,
        userId
    );
    const trackerAssoc = new RocketChatAssociationRecord(
        RocketChatAssociationModel.MISC,
        USER_STEP_TRACKER
    );

    const [record] = (await read
        .getPersistenceReader()
        .readByAssociations([userAssoc, trackerAssoc])) as UserStepData[];

    return record?.step;
}

/**
 * Clears a user's step data
 * @param persistence IPersistence accessor
 * @param userId The user's ID
 */
export async function clearUserStep(
    persistence: IPersistence,
    userId: string
): Promise<void> {
    const userAssoc = new RocketChatAssociationRecord(
        RocketChatAssociationModel.USER,
        userId
    );
    const trackerAssoc = new RocketChatAssociationRecord(
        RocketChatAssociationModel.MISC,
        USER_STEP_TRACKER
    );

    await persistence.removeByAssociations([userAssoc, trackerAssoc]);
}

// =======================================================================

// Type for our user questions data
interface UserQuestionsData {
    userId: string; // Storing userId in the data for safety
    questions: string[]; // Array of questions
}

// Association constant
const USER_QUESTIONS_TRACKER = "user_questions_tracker";

/**
 * Stores/replaces questions for a specific user
 * @param persistence IPersistence accessor
 * @param userId The user's ID
 * @param questions Array of questions to store
 */
export async function setUserQuestions(
    persistence: IPersistence,
    userId: string,
    questions: string[]
): Promise<void> {
    const userAssoc = new RocketChatAssociationRecord(
        RocketChatAssociationModel.USER,
        userId
    );
    const trackerAssoc = new RocketChatAssociationRecord(
        RocketChatAssociationModel.MISC,
        USER_QUESTIONS_TRACKER
    );

    const data: UserQuestionsData = {
        userId,
        questions,
    };

    await persistence.updateByAssociations(
        [userAssoc, trackerAssoc],
        data,
        true // upsert enabled
    );
}

/**
 * Gets questions for a specific user
 * @param read IRead accessor
 * @param userId The user's ID
 * @returns Array of questions or undefined if not found
 */
export async function getUserQuestions(
    read: IRead,
    userId: string
): Promise<string[] | undefined> {
    const userAssoc = new RocketChatAssociationRecord(
        RocketChatAssociationModel.USER,
        userId
    );
    const trackerAssoc = new RocketChatAssociationRecord(
        RocketChatAssociationModel.MISC,
        USER_QUESTIONS_TRACKER
    );

    const [record] = (await read
        .getPersistenceReader()
        .readByAssociations([userAssoc, trackerAssoc])) as UserQuestionsData[];

    return record?.questions;
}

/**
 * Adds a new question for a specific user
 * @param persistence IPersistence accessor
 * @param read IRead accessor
 * @param userId The user's ID
 * @param newQuestion The question to add
 */
/*
export async function addUserQuestion(
    persistence: IPersistence,
    read: IRead,
    userId: string,
    newQuestion: string
): Promise<void> {
    const existing = await getUserQuestions(read, userId) || [];
    await setUserQuestions(persistence, userId, [...existing, newQuestion]);
}
*/

/**
 * Clears all questions for a user
 * @param persistence IPersistence accessor
 * @param userId The user's ID
 */
export async function clearUserQuestions(
    persistence: IPersistence,
    userId: string
): Promise<void> {
    const userAssoc = new RocketChatAssociationRecord(
        RocketChatAssociationModel.USER,
        userId
    );
    const trackerAssoc = new RocketChatAssociationRecord(
        RocketChatAssociationModel.MISC,
        USER_QUESTIONS_TRACKER
    );

    await persistence.removeByAssociations([userAssoc, trackerAssoc]);
}

// ==========================================================================

// Define the shape of our stored command data
interface StoredCommand {
    command: string;
    _id?: string; // Optional persistence internal fields
    _updatedAt?: Date;
}

const USER_COMMAND_TRACKER = "user_command";

export async function setUserCommand(
    persistence: IPersistence,
    userId: string,
    command: string
): Promise<void> {
    const associations = [
        new RocketChatAssociationRecord(
            RocketChatAssociationModel.USER,
            userId
        ),
        new RocketChatAssociationRecord(
            RocketChatAssociationModel.MISC,
            USER_COMMAND_TRACKER
        ),
    ];

    await persistence.updateByAssociations(associations, { command }, true);
}

export async function getUserCommand(
    read: IRead,
    userId: string
): Promise<string | undefined> {
    const associations = [
        new RocketChatAssociationRecord(
            RocketChatAssociationModel.USER,
            userId
        ),
        new RocketChatAssociationRecord(
            RocketChatAssociationModel.MISC,
            USER_COMMAND_TRACKER
        ),
    ];

    // Add type assertion here
    const [record] = (await read
        .getPersistenceReader()
        .readByAssociations(associations)) as StoredCommand[];
    return record?.command;
}

export async function clearUserCommand(
    persistence: IPersistence,
    userId: string
): Promise<void> {
    const associations = [
        new RocketChatAssociationRecord(
            RocketChatAssociationModel.USER,
            userId
        ),
        new RocketChatAssociationRecord(
            RocketChatAssociationModel.MISC,
            USER_COMMAND_TRACKER
        ),
    ];

    await persistence.removeByAssociations(associations);
}

export async function hasUserCommand(
    read: IRead,
    userId: string,
    command: string
): Promise<boolean> {
    const storedCommand = await getUserCommand(read, userId);
    return storedCommand === command;
}

// =======================================================================

export const storeInteractionRoomData = async (
    persistence: IPersistence,
    userId: string,
    roomId: string
): Promise<void> => {
    await deleteInteractionRoomData(persistence, userId);

    const association = new RocketChatAssociationRecord(
        RocketChatAssociationModel.USER,
        `${userId}#RoomId`
    );
    await persistence.updateByAssociation(
        association,
        { roomId: roomId },
        true
    );
};

export const getInteractionRoomData = async (
    persistenceRead: IPersistenceRead,
    userId: string
): Promise<any> => {
    const association = new RocketChatAssociationRecord(
        RocketChatAssociationModel.USER,
        `${userId}#RoomId`
    );
    const result = (await persistenceRead.readByAssociation(
        association
    )) as Array<any>;
    return result && result.length ? result[0] : null;
};

export const deleteInteractionRoomData = async (
    persistence: IPersistence,
    userId: string
): Promise<void> => {
    const association = new RocketChatAssociationRecord(
        RocketChatAssociationModel.USER,
        `${userId}#RoomId`
    );
    await persistence.removeByAssociation(association);
};

export const getRoom = async (
    read: IRead,
    userId: string
): Promise<{ room: IRoom | null; error: string | null }> => {
    const { roomId } = await getInteractionRoomData(
        read.getPersistenceReader(),
        userId
    );

    if (!roomId) {
        return { room: null, error: "No room to send a message" };
    }

    const room = (await read.getRoomReader().getById(roomId)) as IRoom;

    if (!room) {
        return { room: null, error: "Room not found" };
    }

    return { room, error: null };
};

// =======================================================================

// Type for our trigger-response records
export interface TriggerResponseData {
    id: string;
    command: string;
    createdBy: string;
    usedLLM: boolean;
    toNotify: boolean;
    isActive: boolean;
    trigger: {
        user: string | null;
        channel: string | null;
        condition: string;
    };
    response: {
        action: string;
        message: string | null;
    };
    createdAt?: Date;
    updatedAt?: Date;
}

// Association constants
const TRIGGER_RESPONSE_TRACKER = "trigger_response_tracker";
const TRIGGER_RESPONSE_ID_PREFIX = "workflowId_";

/**
 * Generates a unique ID for each trigger-response record
 */
function generateTriggerResponseId(): string {
    return `${TRIGGER_RESPONSE_ID_PREFIX}${Date.now()}`;
}

/**
 * Saves a new trigger-response record
 * @param persistence IPersistence accessor
 * @param data The trigger-response data to save
 * @param createdBy The user id who created the current automation
 * @param usedLLM 'true' if usedLLM to create automation otherwise 'false'
 * @returns The ID of the created record
 */
export async function saveTriggerResponse(
    persistence: IPersistence,
    data: Omit<
        TriggerResponseData,
        | "createdAt"
        | "updatedAt"
        | "createdBy"
        | "usedLLM"
        | "id"
        | "toNotify"
        | "isActive"
    >,
    createdBy: string,
    usedLLM: boolean,
    toNotify: boolean,
    isActive: boolean
): Promise<string> {
    const recordId = generateTriggerResponseId();
    const miscAssoc = new RocketChatAssociationRecord(
        RocketChatAssociationModel.MISC,
        TRIGGER_RESPONSE_TRACKER
    );
    const idAssoc = new RocketChatAssociationRecord(
        RocketChatAssociationModel.MISC,
        recordId
    );

    const completeData: TriggerResponseData = {
        ...data,
        id: recordId,
        createdBy,
        usedLLM,
        toNotify,
        isActive,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    await persistence.updateByAssociations(
        [miscAssoc, idAssoc],
        completeData,
        true
    );

    return recordId;
}

/**
 * Gets all trigger-response records
 * @param read IRead accessor
 * @returns Array of all trigger-response records with their IDs
 */
export async function getAllTriggerResponses(
    read: IRead
): Promise<Array<{ id: string; data: TriggerResponseData }>> {
    const miscAssoc = new RocketChatAssociationRecord(
        RocketChatAssociationModel.MISC,
        TRIGGER_RESPONSE_TRACKER
    );

    const records = (await read
        .getPersistenceReader()
        .readByAssociations([miscAssoc])) as Array<
        TriggerResponseData & { _id: string }
    >;

    return records.map((record) => ({
        id: record._id,
        data: {
            id: record.id,
            command: record.command,
            createdBy: record.createdBy,
            usedLLM: record.usedLLM,
            toNotify: record.toNotify,
            isActive: record.isActive,
            trigger: record.trigger,
            response: record.response,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
        },
    }));
}

/**
 * Gets a specific trigger-response record by ID
 * @param read IRead accessor
 * @param id The ID of the record to retrieve
 * @returns The trigger-response data or undefined if not found
 */
export async function getTriggerResponse(
    read: IRead,
    id: string
): Promise<TriggerResponseData | undefined> {
    const miscAssoc = new RocketChatAssociationRecord(
        RocketChatAssociationModel.MISC,
        TRIGGER_RESPONSE_TRACKER
    );
    const idAssoc = new RocketChatAssociationRecord(
        RocketChatAssociationModel.MISC,
        id
    );

    const [record] = (await read
        .getPersistenceReader()
        .readByAssociations([miscAssoc, idAssoc])) as TriggerResponseData[];

    return record;
}

/**
 * Updates an existing trigger-response record
 * @param persistence IPersistence accessor
 * @param id The ID of the record to update
 * @param newData The new data to store
 */
export async function updateTriggerResponse(
    persistence: IPersistence,
    read: IRead,
    id: string,
    newData: Partial<Omit<TriggerResponseData, "createdAt" | "updatedAt">>
): Promise<void> {
    const miscAssoc = new RocketChatAssociationRecord(
        RocketChatAssociationModel.MISC,
        TRIGGER_RESPONSE_TRACKER
    );
    const idAssoc = new RocketChatAssociationRecord(
        RocketChatAssociationModel.MISC,
        id
    );

    const existing = await getTriggerResponse(read, id);
    if (!existing) {
        throw new Error(`Trigger-response record with ID ${id} not found`);
    }

    const updatedData: TriggerResponseData = {
        ...existing,
        ...newData,
        updatedAt: new Date(),
    };

    await persistence.updateByAssociations(
        [miscAssoc, idAssoc],
        updatedData,
        true // upsert enabled
    );
}

/**
 * Deletes a trigger-response record
 * @param persistence IPersistence accessor
 * @param id The ID of the record to delete
 */
export async function deleteTriggerResponse(
    persistence: IPersistence,
    id: string
): Promise<void> {
    const miscAssoc = new RocketChatAssociationRecord(
        RocketChatAssociationModel.MISC,
        TRIGGER_RESPONSE_TRACKER
    );
    const idAssoc = new RocketChatAssociationRecord(
        RocketChatAssociationModel.MISC,
        id
    );

    await persistence.removeByAssociations([miscAssoc, idAssoc]);
}

/**
 * Finds trigger-response records by command
 * @param read IRead accessor
 * @param command The command to search for
 * @returns Array of matching records
 */
export async function findTriggerResponsesByCommand(
    read: IRead,
    command: string
): Promise<Array<{ id: string; data: TriggerResponseData }>> {
    const allRecords = await getAllTriggerResponses(read);
    return allRecords.filter(
        (record) => record.data.command.toLowerCase() === command.toLowerCase()
    );
}

/**
 * Finds trigger-response records by trigger condition
 * @param read IRead accessor
 * @param condition The condition to search for
 * @returns Array of matching records
 */
export async function findTriggerResponsesByCondition(
    read: IRead,
    condition: string
): Promise<Array<{ id: string; data: TriggerResponseData }>> {
    const allRecords = await getAllTriggerResponses(read);
    return allRecords.filter((record) =>
        record.data.trigger.condition.includes(condition)
    );
}

/**
 * Finds trigger-response records by response action
 * @param read IRead accessor
 * @param action The action to search for
 * @returns Array of matching records
 */
export async function findTriggerResponsesByAction(
    read: IRead,
    action: string
): Promise<Array<{ id: string; data: TriggerResponseData }>> {
    const allRecords = await getAllTriggerResponses(read);
    return allRecords.filter(
        (record) => record.data.response.action === action
    );
}

/**
 * Finds trigger-response records by channel
 * @param read IRead accessor
 * @param channel The channel name to search for (with or without # prefix)
 * @returns Array of matching records
 */
export async function findTriggerResponsesByChannel(
    read: IRead,
    channel: string
): Promise<Array<{ id: string; data: TriggerResponseData }>> {
    // Normalize channel input (accept with or without # prefix)
    const normalizedChannel = channel.startsWith("#") ? channel : `#${channel}`;

    const allRecords = await getAllTriggerResponses(read);
    return allRecords.filter(
        (record) =>
            record.data.trigger.channel &&
            record.data.trigger.channel.toLowerCase() ===
                normalizedChannel.toLowerCase()
    );
}

/**
 * Finds trigger-response records by user mention
 * @param read IRead accessor
 * @param user The user mention to search for (with or without @ prefix)
 * @returns Array of matching records
 */
export async function findTriggerResponsesByUser(
    read: IRead,
    user: string
): Promise<Array<{ id: string; data: TriggerResponseData }>> {
    // Normalize user input (accept with or without @ prefix)
    const normalizedUser = user.startsWith("@") ? user : `@${user}`;

    const allRecords = await getAllTriggerResponses(read);
    return allRecords.filter(
        (record) =>
            record.data.trigger.user &&
            record.data.trigger.user.toLowerCase() ===
                normalizedUser.toLowerCase()
    );
}

/**
 * Finds active trigger-response records by both user and channel
 * @param read IRead accessor
 * @param user The user mention to search for
 * @param channel The channel name to search for
 * @returns Array of matching records where isActive is true
 */
export async function findTriggerResponsesByUserAndChannel(
    read: IRead,
    user: string,
    channel: string
): Promise<Array<{ id: string; data: TriggerResponseData }>> {
    // Remove any existing prefixes for consistent comparison
    const normalizedSearchUser = user.replace(/^@/, "").toLowerCase();
    const normalizedSearchChannel = channel.replace(/^#/, "").toLowerCase();

    const allRecords = await getAllTriggerResponses(read);

    return allRecords.filter((record) => {
        if (
            !record.data.isActive ||
            !record.data.trigger?.user ||
            !record.data.trigger?.channel
        ) {
            return false;
        }

        // Normalize stored values by removing prefixes
        const recordUser = record.data.trigger.user
            .replace(/^@/, "")
            .toLowerCase();
        const recordChannel = record.data.trigger.channel
            .replace(/^#/, "")
            .toLowerCase();

        return (
            recordUser === normalizedSearchUser &&
            recordChannel === normalizedSearchChannel
        );
    });
}

/**
 * Finds trigger-response records by creator and LLM usage
 * @param read IRead accessor
 * @param createdBy The creator's ID to filter by (optional)
 * @param usedLLM Whether to filter by LLM usage (optional)
 * @returns Array of matching records
 */
export async function findTriggerResponsesByCreatorAndLLM(
    read: IRead,
    createdBy?: string,
    usedLLM?: boolean
): Promise<Array<{ data: TriggerResponseData }>> {
    const allRecords = await getAllTriggerResponses(read);

    return allRecords.filter((record) => {
        const matchesCreator = createdBy
            ? record.data.createdBy === createdBy
            : true;
        const matchesLLM =
            usedLLM !== undefined ? record.data.usedLLM === usedLLM : true;

        return matchesCreator && matchesLLM;
    });
}

/**
 * Updates the toNotify status of a trigger-response record
 * @param persistence IPersistence accessor
 * @param id The ID of the record to update
 * @param toNotify The new notification status (true/false)
 */
export async function updateToNotifyStatus(
    persistence: IPersistence,
    read: IRead,
    id: string,
    toNotify: boolean
): Promise<void> {
    await updateTriggerResponse(persistence, read, id, { toNotify });
}

/**
 * Updates the isActive status of a trigger-response record
 * @param persistence IPersistence accessor
 * @param id The ID of the record to update
 * @param isActive The new active status (true/false)
 */
export async function updateIsActiveStatus(
    persistence: IPersistence,
    read: IRead,
    id: string,
    isActive: boolean
): Promise<void> {
    await updateTriggerResponse(persistence, read, id, { isActive });
}

/**
 * Finds trigger-response records by user and channel null combinations
 * @param read IRead accessor
 * @returns Array of records matching:
 *   - Case 1: both user and channel are null (global triggers)
 *   - Case 2: user is specified but channel is null (user-specific triggers)
 *   - Case 3: user is null but channel is specified (channel-specific triggers)
 */
export async function findTriggerResponsesByNullCombinations(
    read: IRead
): Promise<Array<{ id: string; data: TriggerResponseData }>> {
    const allRecords = await getAllTriggerResponses(read);

    return allRecords.filter((record) => {
        const { user, channel } = record.data.trigger;

        // Case 1: Both user and channel are null (global triggers)
        const case1 = user === null && channel === null;

        // Case 2: User is specified but channel is null (user-specific triggers)
        const case2 = user !== null && channel === null;

        // Case 3: User is null but channel is specified (channel-specific triggers)
        const case3 = user === null && channel !== null;

        return case1 || case2 || case3;
    });
}

// =======================================================================

export interface WorkflowSearchState {
    searchQuery: string;
    selectedSection: string;
}

const WORKFLOW_SEARCH_STATE_TRACKER = "workflow_search_state";

export async function setWorkflowSearchState(
    persistence: IPersistence,
    userId: string,
    state: Partial<WorkflowSearchState>
): Promise<void> {
    const userAssoc = new RocketChatAssociationRecord(
        RocketChatAssociationModel.USER,
        userId
    );
    const trackerAssoc = new RocketChatAssociationRecord(
        RocketChatAssociationModel.MISC,
        WORKFLOW_SEARCH_STATE_TRACKER
    );

    await persistence.updateByAssociations(
        [userAssoc, trackerAssoc],
        state,
        true
    );
}

export async function getWorkflowSearchState(
    read: IRead,
    userId: string
): Promise<WorkflowSearchState | undefined> {
    const userAssoc = new RocketChatAssociationRecord(
        RocketChatAssociationModel.USER,
        userId
    );
    const trackerAssoc = new RocketChatAssociationRecord(
        RocketChatAssociationModel.MISC,
        WORKFLOW_SEARCH_STATE_TRACKER
    );

    const [record] = (await read
        .getPersistenceReader()
        .readByAssociations([userAssoc, trackerAssoc])) as WorkflowSearchState[];

    return record;
}

