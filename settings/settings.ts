import {
    ISetting,
    SettingType,
} from "@rocket.chat/apps-engine/definition/settings";

export enum SettingEnum {
    ID_LLM_PROVIDER = `llm-provider`,
    ID_MODEL = `model`,
    ID_GROQ_API_KEY = `groq-api-key`,
    ID_GEMINI_API_KEY = `gemini-api-key`,
    ID_CUSTOM_URL = `custom-url`,
    ID_RC_AUTH_TOKEN = `rc-auth-token`,
    ID_RC_USER_ID = `rc-user-id`,
    KEY_GROQ = `groq`,
    KEY_GEMINI = `gemini`,
    KEY_CUSTOM = `custom`,
}


export const settings: ISetting[] = [
    {
        id: SettingEnum.ID_LLM_PROVIDER,
        i18nLabel: "Service Provider",
        i18nDescription: "Which service are you using?",
        type: SettingType.SELECT,
        values: [
            { key: SettingEnum.KEY_GROQ, i18nLabel: "1. Groqcloud (groq.com)" },
            { key: SettingEnum.KEY_GEMINI, i18nLabel: "2. Google AI Studio" },
            { key: SettingEnum.KEY_CUSTOM, i18nLabel: "3. Custom Model" },
        ],
        required: true,
        public: true,
        packageValue: SettingEnum.KEY_GROQ,
    },
    {
        id: SettingEnum.ID_MODEL,
        i18nLabel: "Model Name (required for all providers)",
        i18nDescription: "Model to use (e.g., llama-3.1-8b-instant for Groq/Self-Hosted, gemini-2.5-flash for Gemini)",
        type: SettingType.STRING,
        packageValue: "llama-3.1-8b-instant",
        required: false,
        public: false,
        i18nPlaceholder: "llama-3.1-8b-instant",
    },
    {
        id: SettingEnum.ID_GROQ_API_KEY,
        type: SettingType.PASSWORD,
        packageValue: "",
        required: false,
        public: false,
        i18nLabel: "Groq API Key (required for Groqcloud)",
        i18nPlaceholder: "Groq API Key",
    },
    {
        id: SettingEnum.ID_GEMINI_API_KEY,
        type: SettingType.PASSWORD,
        packageValue: "",
        required: false,
        public: false,
        i18nLabel: "Gemini API Key (required for Google AI Studio)",
        i18nPlaceholder: "Gemini API Key",
    },
    {
        id: SettingEnum.ID_CUSTOM_URL,
        i18nLabel: "Custom Model Base URL (required for Custom Model)",
        i18nDescription: "Base API URL for your custom model (e.g., http://localhost:11434/v1/chat/completions for Ollama)",
        type: SettingType.STRING,
        required: false,
        public: false,
        packageValue: "",
        i18nPlaceholder: "http://localhost:11434/v1/chat/completions",
    },
    {
        id: SettingEnum.ID_RC_AUTH_TOKEN,
        i18nLabel:
            "Personal Access Token (required for file summary)",
        i18nDescription: "Must be filled to enable file summary add-on",
        type: SettingType.PASSWORD,
        required: false,
        public: false,
        packageValue: "",
    },
    {
        id: SettingEnum.ID_RC_USER_ID,
        i18nLabel: "User ID (required for file summary)",
        i18nDescription: "Must be filled to enable file summary add-on",
        type: SettingType.STRING,
        required: false,
        public: false,
        packageValue: "",
    },
];
