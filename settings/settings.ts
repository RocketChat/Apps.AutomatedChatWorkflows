import {
    ISetting,
    SettingType,
} from "@rocket.chat/apps-engine/definition/settings";

export enum SettingEnum {
    ID_LLM_PROVIDER = `llm-provider`,
    ID_GROQ_API_KEY = `groq-model`,
    ID_GROQ_MODEL = `groq-api-key`,
    ID_GEMINI_API_KEY = `gemini-api-key`,
    ID_RC_MODEL = `rc-model`,
    ID_RC_AUTH_TOKEN = `rc-auth-token`,
    ID_RC_USER_ID = `rc-user-id`,
    KEY_GROQ = `groq`,
    KEY_GEMINI = `gemini`,
    KEY_RC = `rocketchat`,
}


export const settings: ISetting[] = [
    {
        id: SettingEnum.ID_LLM_PROVIDER,
        i18nLabel: "Service Provider",
        i18nDescription: "Who's service are you using?",
        type: SettingType.SELECT,
        values: [
            { key: SettingEnum.KEY_GROQ, i18nLabel: "1. Groqcloud (groq.com)" },
            { key: SettingEnum.KEY_GEMINI, i18nLabel: "2. Google AI Studio" },
            { key: SettingEnum.KEY_RC, i18nLabel: "3. In House (Rocket Chat)" },
        ],
        required: true,
        public: true,
        packageValue: SettingEnum.KEY_GROQ,
    },
    {
        id: SettingEnum.ID_GROQ_MODEL,
        type: SettingType.STRING,
        packageValue: "",
        required: false,
        public: false,
        i18nLabel: "Groq Model (required for Groqcloud)",
        i18nPlaceholder: "Groq Model",
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
        id: SettingEnum.ID_RC_MODEL,
        i18nLabel: "Model selection (required for In House (Rocket Chat))",
        i18nDescription: "AI model to use for summarization.",
        type: SettingType.SELECT,
        values: [
            { key: "llama3-8b:1234", i18nLabel: "Llama3 8B" },
            { key: "mistral-7b", i18nLabel: "Mistral 7B" },
        ],
        required: false,
        public: false,
        packageValue: "llama3-8b:1234",
    },
    {
        id: SettingEnum.ID_RC_AUTH_TOKEN,
        i18nLabel:
            "Personal Access Token (required for In House (Rocket Chat))",
        i18nDescription: "Must be filled to enable file summary add-on",
        type: SettingType.PASSWORD,
        required: false,
        public: false,
        packageValue: "",
    },
    {
        id: SettingEnum.ID_RC_USER_ID,
        i18nLabel: "User ID (required for In House (Rocket Chat))",
        i18nDescription: "Must be filled to enable file summary add-on",
        type: SettingType.STRING,
        required: false,
        public: false,
        packageValue: "",
    },
];
