import {
    IModify,
    IRead,
    IPersistence,
    IHttp,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IRoom, RoomType } from "@rocket.chat/apps-engine/definition/rooms";
import {
    BlockBuilder,
    IBlock,
} from "@rocket.chat/apps-engine/definition/uikit";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { NotificationsController } from "./Notifications";
import {
    IMessage,
    IMessageRaw,
} from "@rocket.chat/apps-engine/definition/messages";

export async function sendNotification(
    read: IRead,
    modify: IModify,
    user: IUser,
    room: IRoom,
    message: string,
    blocks?: BlockBuilder
): Promise<void> {
    const appUser = (await read.getUserReader().getAppUser()) as IUser;

    const msg = modify
        .getCreator()
        .startMessage()
        .setSender(appUser)
        .setRoom(room)
        .setText(message);

    if (blocks) {
        msg.setBlocks(blocks);
    }

    return read.getNotifier().notifyUser(user, msg.getMessage());
}

export async function shouldSendMessage(
    read: IRead,
    persistence: IPersistence,
    user: IUser
): Promise<boolean> {
    const notificationsController = new NotificationsController(
        read,
        persistence,
        user
    );
    const notificationStatus =
        await notificationsController.getNotificationsStatus();

    return notificationStatus ? notificationStatus.status : true;
}

export async function sendMessage(
    modify: IModify,
    room: IRoom,
    sender: IUser,
    message: string,
    blocks?: BlockBuilder | [IBlock]
): Promise<string> {
    const msg = modify
        .getCreator()
        .startMessage()
        .setSender(sender)
        .setRoom(room)
        .setGroupable(false)
        .setParseUrls(false)
        .setText(message);

    if (blocks !== undefined) {
        msg.setBlocks(blocks);
    }

    return await modify.getCreator().finish(msg);
}

export async function sendDirectMessage(
    read: IRead,
    modify: IModify,
    user: IUser,
    message: string
): Promise<string> {
    const sender = (await read.getUserReader().getAppUser()) as IUser;
    const room = (await getDirect(
        read,
        modify,
        sender,
        user.username
    )) as IRoom;

    const msg = modify
        .getCreator()
        .startMessage()
        .setSender(sender)
        .setRoom(room)
        .setGroupable(false)
        .setParseUrls(false)
        .setText(message);

    return await modify.getCreator().finish(msg);
}

export async function getDirect(
    read: IRead,
    modify: IModify,
    appUser: IUser,
    username: string
): Promise<IRoom | undefined> {
    const usernames = [appUser.username, username];
    let room: IRoom;
    try {
        room = await read.getRoomReader().getDirectByUsernames(usernames);
    } catch (error) {
        console.log(error);
        return;
    }

    if (room) {
        return room;
    } else {
        let roomId: string;

        const newRoom = modify
            .getCreator()
            .startRoom()
            .setType(RoomType.DIRECT_MESSAGE)
            .setCreator(appUser)
            .setMembersToBeAddedByUsernames(usernames);
        roomId = await modify.getCreator().finish(newRoom);
        return await read.getRoomReader().getById(roomId);
    }
}

export async function getRoomMessages(
    room: IRoom,
    read: IRead,
    user?: IUser,
    http?: IHttp,
    addOns?: string[],
    xAuthToken?: string,
    xUserId?: string
): Promise<string> {
    const messages: IMessageRaw[] = await read
        .getRoomReader()
        .getMessages(room.id, {
            limit: 100,
            sort: { createdAt: "asc" },
        });

    const messageTexts: string[] = [];
    for (const message of messages) {
        if (message.text) {
            messageTexts.push(
                `Message at ${message.createdAt}\n${message.sender.name}: ${message.text}\n`
            );
        }
    }
    return messageTexts.join("\n");
}

export async function getThreadMessages(
    room: IRoom,
    read: IRead,
    modify: IModify,
    user: IUser,
    http: IHttp,
    threadId: string,
    addOns: string[],
    xAuthToken: string,
    xUserId: string
): Promise<string> {
    const threadReader = read.getThreadReader();
    const thread = await threadReader.getThreadById(threadId);

    if (!thread) {
        await sendNotification(read, modify, user, room, `Thread not found`);
        throw new Error("Thread not found");
    }

    const messageTexts: string[] = [];
    for (const message of thread) {
        if (message.text) {
            messageTexts.push(`${message.sender.name}: ${message.text}`);
        }
    }

    // threadReader repeats the first message once, so here we remove it
    messageTexts.shift();
    return messageTexts.join("\n");
}

export async function sendMessageInChannel(
    modify: IModify,
    user: IUser,
    room: IRoom,
    message: string
): Promise<void> {
    const messageBuilder = modify
        .getCreator()
        .startMessage()
        .setSender(user)
        .setRoom(room);

    if (message) {
        messageBuilder.setText(message);
    }

    await modify.getCreator().finish(messageBuilder);
    return;
}

export async function deleteMessage(
    modify: IModify,
    message: IMessage,
    user: IUser
): Promise<boolean> {
    try {
        await modify.getDeleter().deleteMessage(message, user);
        return true;
    } catch (error) {
        console.error("Error deleting message:", error);
        return false;
    }
}

export async function updateMessageText(
    modify: IModify,
    originalMessage: IMessage,
    updatedText: string,
    user: IUser
): Promise<boolean> {
    try {
        // Get the message builder by awaiting the promise
        const messageBuilder = await modify
            .getUpdater()
            .message(originalMessage.id ?? "", originalMessage.sender);
        if (!messageBuilder) {
            console.log("Message builder not found");
            return false;
        }

        // Set the updated properties
        messageBuilder
            .setEditor(user) // Set who is editing the message
            .setText(updatedText)
            .setRoom(originalMessage.room)
            .setGroupable(originalMessage.groupable ?? false)
            .setParseUrls(originalMessage.parseUrls ?? false);

        // If the original message had blocks, preserve them
        if (originalMessage.blocks) {
            messageBuilder.setBlocks(originalMessage.blocks);
        }

        // Apply the update
        await modify.getUpdater().finish(messageBuilder);

        return true;
    } catch (error) {
        console.error("Error updating message:", error);
        return false;
    }
}
