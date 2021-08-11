import {KnownBlock, ViewsOpenArguments, WebAPIPlatformError} from '@slack/web-api';
import {App} from "@slack/bolt";


const divider: KnownBlock = {
    type: "divider"
}

function addBlockUserReactions(blocks: Array<KnownBlock>, reaction?: string, users?: Array<string>) {
    if (reaction === undefined || users == undefined) {
        return
    }
    blocks.push({
        type: "section",
        text: {
            type: 'plain_text',
            text: reaction,
            emoji: true
        }
    })
    let text = ""
    users.forEach((user) => {
        text += `<@${user}>`
    })
    blocks.push({
        type: 'context',
        elements: [
            {
                type: 'mrkdwn',
                text: text
            }
        ],
    })
    blocks.push(divider)
}


export function reactionList(app: App) {
    app.shortcut(
        {callback_id: 'reaction_list', type: 'message_action'},
        async ({ack, shortcut, context, client, respond}) => {
            try {
                await ack()
                let reactions
                try{
                    reactions = (await client.reactions.get({
                        channel: shortcut.channel.id,
                        timestamp: shortcut.message_ts
                    })).message?.reactions
                } catch (e){
                    const err = e as WebAPIPlatformError
                    if (err.data.error === 'not_in_channel') {
                        await respond(
                            `<@${shortcut.user.id}>\nこの機能はこのアプリがチャンネルに入っていないと使えません`
                        )
                        return
                    }
                    else {
                        throw e
                    }
                }

                const {members} = await client.conversations.members({
                    channel: shortcut.channel.id
                })
                if (reactions !== undefined) {
                    const blocks: Array<KnownBlock> = [
                        divider
                    ]
                    reactions.forEach((reaction) => {
                        if (reaction === undefined) {
                            return
                        }
                        addBlockUserReactions(blocks, `:${reaction.name}:`, reaction.users)
                        reaction.users?.forEach((user) => {
                            const index = members?.indexOf(user)
                            if (index !== undefined && index !== -1) {
                                members?.splice(index, 1)
                            }
                        })
                    })
                    if (members !== undefined && members.length > 0) {
                        addBlockUserReactions(blocks, "リアクションなし", members)
                    }
                    const viewOption: ViewsOpenArguments = {
                        token: context.botToken,
                        trigger_id: shortcut.trigger_id,
                        view: {
                            type: 'modal',
                            title: {
                                type: 'plain_text',
                                text: 'リアクションリスト'
                            },
                            blocks: blocks
                        }
                    }
                    await client.views.open(viewOption)
                } else {
                    await client.chat.postEphemeral({
                        channel: shortcut.channel.id,
                        text: "このメッセージにリアクションはありません",
                        user: shortcut.user.id
                    })
                }
            } catch (e) {
                console.error(e)
            }
        }
    )
}