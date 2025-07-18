import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IPostMessageSentToBot } from "@rocket.chat/apps-engine/definition/messages/IPostMessageSentToBot";
import { IMessage } from "@rocket.chat/apps-engine/definition/messages";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import {
    createAnswerIdentificationPrompt,
    createAutomationCommandCreationPrompt,
    createReasoningPrompt,
    createStructuredParsingPrompt,
    createValidCommandPrompt,
} from "../utils/prompt-helpers";
import { sendDirectMessage } from "../utils/Messages";
import { createTextCompletionGroq } from "../temp/createTextCompletionGroq";
import {
    clearUserCommand,
    clearUserQuestions,
    clearUserStep,
    getUserCommand,
    getUserQuestions,
    getUserStep,
    saveTriggerResponse,
    setUserCommand,
    setUserQuestions,
    setUserStep,
} from "../utils/PersistenceMethodsCreationWorkflow";

interface CommandPromptResponse {
    workflow_identification_valid: boolean;
    response: string;
}

interface ReasoningPromptResponse {
    requires_clarification: boolean;
    questions: string[];
}

interface IdentificationPromptResponse {
    answer_identification_valid: boolean;
    response?: {
        questions: string[];
        answers: string[];
    };
    message?: string;
}

interface CommandCreationResponse {
    command: string;
}

interface StructuredParsingResponse {
    trigger: {
        user: string;
        channel: string;
        condition: string;
    };
    response: {
        action: string;
        message: string;
    };
}

export class PostMessageSentToBotHandler implements IPostMessageSentToBot {
    public async executePostMessageSentToBot(
        message: IMessage,
        read: IRead,
        http: IHttp,
        persistence: IPersistence,
        modify: IModify
    ): Promise<void> {
        const user = message.sender;
        const text = message.text;
        const room = message.room;
        const appUser = (await read.getUserReader().getAppUser()) as IUser;

        if (!text) return;

        // Get a user's step
        const currentStep = await getUserStep(read, user.id);
        if (currentStep && currentStep === "clarification") {
            const questionsArr = await getUserQuestions(read, user.id);
            if (!questionsArr) return;

            // questionsArr.forEach((q, i) => console.log(`${i + 1}. ${q}`));

            const answerIdentificationPrompt = createAnswerIdentificationPrompt(
                questionsArr,
                text
            );
            const answerIdentificationPromptByLLM =
                await createTextCompletionGroq(
                    http,
                    answerIdentificationPrompt
                );

            const identificationResponse: IdentificationPromptResponse =
                typeof answerIdentificationPromptByLLM === "string"
                    ? JSON.parse(answerIdentificationPromptByLLM)
                    : answerIdentificationPromptByLLM;

            if (!identificationResponse.answer_identification_valid) {
                await sendDirectMessage(
                    read,
                    modify,
                    user,
                    identificationResponse.message ||
                        "Please answer all the questions again"
                );

                return;
            }

            if (!identificationResponse.response) return;

            const currentCommand = await getUserCommand(read, user.id);
            if (!currentCommand) return;

            const automationCommandCreationPrompt =
                createAutomationCommandCreationPrompt(
                    currentCommand,
                    identificationResponse.response?.questions,
                    identificationResponse.response?.answers
                );

            const automationCommandCreationPromptByLLM =
                await createTextCompletionGroq(
                    http,
                    automationCommandCreationPrompt
                );

            const commandCreationResponse: CommandCreationResponse = {
                command: automationCommandCreationPromptByLLM,
            };

            const structuredParsingPrompt = createStructuredParsingPrompt(
                commandCreationResponse.command
            );
            const structuredParsingPromptByLLM = await createTextCompletionGroq(
                http,
                structuredParsingPrompt
            );

            const structuredParsingResponse: StructuredParsingResponse =
                typeof structuredParsingPromptByLLM === "string"
                    ? JSON.parse(structuredParsingPromptByLLM)
                    : structuredParsingPromptByLLM;

            if (!structuredParsingResponse) return;

            const responseToSave = {
                command: commandCreationResponse.command,
                ...structuredParsingResponse,
            };

            await sendDirectMessage(
                read,
                modify,
                user,
                JSON.stringify(responseToSave)
            );

            const id = await saveTriggerResponse(
                persistence,
                responseToSave,
                user.id,
                true
            );

            await clearUserCommand(persistence, user.id);
            await clearUserStep(persistence, user.id);
            await clearUserQuestions(persistence, user.id);
        } else {
            const validCommandPrompt = createValidCommandPrompt(text);
            const validCommandPromptByLLM = await createTextCompletionGroq(
                http,
                validCommandPrompt
            );

            const response: CommandPromptResponse =
                typeof validCommandPromptByLLM === "string"
                    ? JSON.parse(validCommandPromptByLLM)
                    : validCommandPromptByLLM;

            // If the command in not valid
            if (!response.workflow_identification_valid) {
                await sendDirectMessage(read, modify, user, response.response);
                return;
            }

            const reasoningPrompt = createReasoningPrompt(text);
            const reasoningPromptByLLM = await createTextCompletionGroq(
                http,
                reasoningPrompt
            );

            const reasoningResponse: ReasoningPromptResponse =
                typeof reasoningPromptByLLM === "string"
                    ? JSON.parse(reasoningPromptByLLM)
                    : reasoningPromptByLLM;

            if (reasoningResponse.requires_clarification) {
                const questionsArr = reasoningResponse.questions;
                const questions = questionsArr.join("\n");

                await sendDirectMessage(read, modify, user, questions);

                // call persistence method
                await setUserCommand(persistence, user.id, text);
                await setUserStep(persistence, user.id, "clarification");
                await setUserQuestions(persistence, user.id, questionsArr);

                return;
            }

            const structuredParsingPrompt = createStructuredParsingPrompt(text);
            const structuredParsingPromptByLLM = await createTextCompletionGroq(
                http,
                structuredParsingPrompt
            );

            const structuredParsingResponse: StructuredParsingResponse =
                typeof structuredParsingPromptByLLM === "string"
                    ? JSON.parse(structuredParsingPromptByLLM)
                    : structuredParsingPromptByLLM;

            if (!structuredParsingResponse) return;

            const responseToSave = {
                command: text,
                ...structuredParsingResponse,
            };

            await sendDirectMessage(
                read,
                modify,
                user,
                JSON.stringify(responseToSave)
            );

            const id = await saveTriggerResponse(
                persistence,
                responseToSave,
                user.id,
                true
            );
        }
    }
}
