"use strict";

const Collection = require("../util/Collection");
const GuildChannel = require("./GuildChannel");
const Message = require("./Message");
const ThreadMember = require("./ThreadMember");

/**
* Represents a thread channel. You also probably want to look at NewsThreadChannel, PublicThreadChannel, and PrivateThreadChannel. See GuildChannel for extra properties.
* @extends GuildChannel
* @prop {String} lastMessageID The ID of the last message in this channel
* @prop {Object?} member Thread member for the current user, if they have joined the thread
* @prop {Number} member.flags The user's thread settings
* @prop {String} member.id The ID of the thread
* @prop {Number} member.joinTimestamp The time the user last joined the thread
* @prop {String} member.userID The ID of the user
* @prop {Number} memberCount An approximate number of users in the thread (stops at 50)
* @prop {Collection<ThreadMember>} members Collection of members in this channel
* @prop {Number} messageCount An approximate number of messages in the thread (stops at 50)
* @prop {Collection<Message>} messages Collection of Messages in this channel
* @prop {String} ownerID The ID of the user that created the thread
* @prop {Number} rateLimitPerUser The ratelimit of the channel, in seconds. 0 means no ratelimit is enabled
* @prop {Object} threadMetadata Metadata for the thread
* @prop {Number} threadMetadata.archiveTimestamp Timestamp when the thread's archive status was last changed, used for calculating recent activity
* @prop {Boolean} threadMetadata.archived Whether the thread is archived
* @prop {String?} threadMetadata.archiverID The ID of the user that last (un)archived the thread
* @prop {Number} threadMetadata.autoArchiveDuration Duration in minutes to automatically archive the thread after recent activity, either 60, 1440, 4320 or 10080
* @prop {Boolean?} threadMetadata.locked Whether the thread is locked
*/
class ThreadChannel extends GuildChannel {
    constructor(data, client, messageLimit) {
        super(data, client);
        this._client = client
        this.messages = new Collection(Message, messageLimit == null ? client.options.messageLimit : messageLimit);
        this.members = new Collection(ThreadMember);
        this.lastMessageID = data.last_message_id || null;
        this.ownerID = data.ownerID;
        this.parentChannelID = data.parent_id
        this.update(data);
    }

    update(data) {
        super.update(data);
        if(data.member_count !== undefined) {
            this.memberCount = data.member_count;
        }
        if(data.message_count !== undefined) {
            this.messageCount = data.message_count;
        }
        if(data.rate_limit_per_user !== undefined) {
            this.rateLimitPerUser = data.rate_limit_per_user;
        }
        if(data.thread_metadata !== undefined) {
            this.threadMetadata = {
                archiveTimestamp: Date.parse(data.thread_metadata.archive_timestamp),
                archived: data.thread_metadata.archived,
                archiverID: data.thread_metadata.archiver_id,
                autoArchiveDuration: data.thread_metadata.auto_archive_duration,
                locked: data.thread_metadata.locked
            };
        }
        if(data.member !== undefined) {
            this.member = new ThreadMember(data.member, this.client);
        }
    }

    /**
    * Create a message in the channel
    * Note: If you want to DM someone, the user ID is **not** the DM channel ID. use Client.getDMChannel() to get the DM channel ID for a user
    * @arg {String | Object} content A string or object. If an object is passed:
    * @arg {Object} [content.allowedMentions] A list of mentions to allow (overrides default)
    * @arg {Boolean} [content.allowedMentions.everyone] Whether or not to allow @everyone/@here.
    * @arg {Boolean | Array<String>} [content.allowedMentions.roles] Whether or not to allow all role mentions, or an array of specific role mentions to allow.
    * @arg {Boolean | Array<String>} [content.allowedMentions.users] Whether or not to allow all user mentions, or an array of specific user mentions to allow.
    * @arg {Boolean} [options.allowedMentions.repliedUser] Whether or not to mention the author of the message being replied to
    * @arg {String} content.content A content string
    * @arg {Object} [content.embed] An embed object. See [the official Discord API documentation entry](https://discord.com/developers/docs/resources/channel#embed-object) for object structure
    * @arg {Object} [content.messageReference] The message reference, used when replying to messages
    * @arg {String} [content.messageReference.channelID] The channel ID of the referenced message
    * @arg {Boolean} [content.messageReference.failIfNotExists=true] Whether to throw an error if the message reference doesn't exist. If false, and the referenced message doesn't exist, the message is created without a referenced message
    * @arg {String} [content.messageReference.guildID] The guild ID of the referenced message
    * @arg {String} content.messageReference.messageID The message ID of the referenced message. This cannot reference a system message
    * @arg {String} [content.messageReferenceID] [DEPRECATED] The ID of the message should be replied to. Use `messageReference` instead
    * @arg {Boolean} [content.tts] Set the message TTS flag
    * @arg {Object} [file] A file object
    * @arg {Buffer} file.file A buffer containing file data
    * @arg {String} file.name What to name the file
    * @returns {Promise<Message>}
    */
     createMessage(content, file) {
        return this._client.createMessage.call(this._client, this.id, content, file);
    }

    /**
    * Get the channel-specific permissions of a member
    * @arg {String | Member} memberID The ID of the member or a Member instance
    * @returns {Permission}
    */
     permissionsOf(memberID) {
        return this._client.getChannel(this.parentChannelID)?.permissionsOf(memberID)
    }


    /**
    * Get a list of members that are part of this thread channel
    * @returns {Promise<Array<ThreadMember>>}
    */
    getMembers() {
        return this.client.getThreadMembers.call(this.client, this.id);
    }

    /**
    * Join a thread
    * @arg {String} [userID="@me"] The user ID of the user joining
    * @returns {Promise}
    */
    join(userID) {
        return this.client.joinThread.call(this.client, this.id, userID);
    }

    /**
    * Leave a thread
    * @arg {String} [userID="@me"] The user ID of the user leaving
    * @returns {Promise}
    */
    leave(userID) {
        return this.client.leaveThread.call(this.client, this.id, userID);
    }

    toJSON(props = []) {
        return super.toJSON([
            "lastMessageID",
            "memberCount",
            "messageCount",
            "messages",
            "ownerID",
            "rateLimitPerUser",
            "threadMetadata",
            "member",
            ...props
        ]);
    }
}

module.exports = ThreadChannel;
