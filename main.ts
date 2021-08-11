import {App} from '@slack/bolt';
import {reactionList} from './reaction_list';
import {config} from 'dotenv';

function main(){
    config()
    const app = new App({
        socketMode: true,
        appToken: process.env.APP_TOKEN,
        token: process.env.TOKEN
    })
    reactionList(app)
    app.start()
        .then(()=>{console.log("Start Reaction List")})
        .catch(console.error)
}

main()