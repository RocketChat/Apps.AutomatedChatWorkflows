<h1 align="center">🤖 AI Chat Workflows Automation App</h1>

<p align="center">
    <em>Rocket.Chat App for generating functional automated chat workflows using LLMs</em>
</p>

<div align="center" style="margin: 1rem 1rem;">
    <img width="50%" src="https://raw.githubusercontent.com/RocketChat/Apps.AutomatedChatWorkflows/refs/heads/main/icon.png" alt="AI Chat Workflows Automation App Icon">
</div>

---

## 🧠 Overview

The **AI Chat Workflows Automation App** enables you to create and manage automated chat workflows in Rocket.Chat using natural language or a structured UI. It leverages the power of Large Language Models (LLMs) to understand your instructions and generate automation rules seamlessly.

---

## 🚀 Features

- Create workflows using plain English through direct chat
- Use slash commands to manage workflows via an intuitive UI
- Enable/disable workflows
- Control notifications for triggered workflows
- Manage workflows (list, delete) with ease

---

## 🛠️ How to Create Workflows

You can create chat workflow automations using **two methods**:

### 1. 💬 Chat with the App (LLM-powered)
- Requires LLM support.
- Admins must configure settings in the UI:
  - Navigate to: `Marketplace → Private Apps → AI Chat Workflows Automation → Settings`
  - Only users with admin access can configure the app’s LLM settings.
  - **Confidence Threshold**: Adjust minimum confidence (0-100) for trigger validation. Lower (40-60) = creative/flexible, Higher (85-95) = strict/precise. Default: 75.

### 2. ⚙️ Use Slash Command `/chat-automation-create`
- Opens a UI modal where you can fill in all the necessary details to create a workflow.

---

## 💻 Slash Commands

| Command | Description |
|--------|-------------|
| `/chat-automation ping` | Sends a hello message to your Direct Messages (DM) from the app |
| `/chat-automation list` | Displays a list of all created workflows |
| `/chat-automation delete <id>` | Deletes the workflow with the specified ID |
| `/chat-automation enable <id>` | Enables the workflow with the specified ID |
| `/chat-automation disable <id>` | Disables the workflow with the specified ID |
| `/chat-automation notification off <id>` | Disables notifications for a workflow trigger |
| `/chat-automation notification on <id>` | Enables notifications for a workflow trigger |

---

## 💬 Example Messages for Chat-Based Workflow Creation

You can simply send a message to the app using natural language to create workflows. Here are a few examples:

- **DM after welcome message:**
Whenever @dhairyashil posts any welcome messages in #general, immediately DM him "Thank you for the welcome."


- **Reply in same channel:**
Whenever @dhairyashil posts any welcome messages in #general, immediately message him in the same channel "Thank you for the welcome in this channel."

- **Edit message:**
Whenever @dhairyashil posts any welcome messages in #general, immediately edit the message by appending "regards" at the end.

- **Delete message:**
Whenever @dhairyashil posts any welcome messages in #general, delete the message immediately.

- **Delete based on content:**
Whenever a message is posted that contains a four-letter word starting with the letter F, delete that message immediately.

---

<h2>Support us ❤️</h2>

If you like this project, please leave a star ⭐️. This helps more people to know this project.

---

## 🧾 Getting Started

### Requirements
- Node.js v20.18.1
- Unix-based OS (Linux, macOS, WSL2)

## 🚀 Deploying the App

#### 1. Install the Rocket.Chat Apps CLI
Install `rc-apps` globally:

```bash
npm install -g @rocket.chat/apps-cli
```

Verify the installation:

```bash
rc-apps -v
```

You should see the CLI version information:

```bash
@rocket.chat/apps-cli/1.12.1 linux-x64 node-v20.18.1
```

> **Note:** The platform information (e.g., "linux-x64") will differ depending on your operating system.

#### 2. Clone the repository

```bash
git clone https://github.com/RocketChat/Apps.AutomatedChatWorkflows.git
```

#### 3. Navigate to the app directory

```bash
cd Apps.AutomatedChatWorkflows
```

#### 4. Install dependencies

```bash
npm install
```

#### 5A. Build your app, configure and deploy

```bash
rc-apps package
```

Edit the `.rcappsconfig` file with your credentials:

```json
{
  "url": "https://workspace_server_url",
  "username": "your_username",
  "password": "your_password"
}
```

Deploy your app:

```bash
rc-apps deploy
```

#### 5B. Build and deploy using single command

Instead of following 5A, you can run the command below to build and deploy it in one go.

```bash
rc-apps deploy --url <enter server url here> --username <enter username here> --password <enter password here>
```

If I'm deploying to localhost:3000 and my username is 'dhairyashil' and my password is 'Pass@123', the command would be:

```bash
rc-apps deploy --url http://localhost:3000 --username dhairyashil --password Pass@123
```

<!-- <div align='center' width='100%'>
<a href="https://github.com/RocketChat/Apps.AutomatedChatWorkflows/graphs/contributors">
<img src="https://open-source-assets.middlewarehq.com/svgs/RocketChat-Apps.AutomatedChatWorkflows-contributor-metrics-dark-widget.svg?caching=true"></img>
</a>
</div> -->

---

### Contributors

<a href="https://github.com/RocketChat/Apps.AutomatedChatWorkflows/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=RocketChat/Apps.AutomatedChatWorkflows" />
</a>
