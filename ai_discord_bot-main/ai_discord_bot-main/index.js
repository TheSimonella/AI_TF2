const { Client, GatewayIntentBits, EmbedBuilder, Collection } = require("discord.js");
const { MongoClient, ObjectId } = require('mongodb');
const fetch = require('node-fetch');
const config = require('config'); // <-- New import

let reconnectInterval = 5000;  // Initial reconnect interval (5 seconds)
const maxReconnectInterval = 60000;  // Maximum reconnect interval (1 minute)


const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions
    ]
});

const uri = config.get("mongoDb.connectionString"); // <-- Using config here
const mongoClient = new MongoClient(uri);

const token = config.get("discord.token");  // <-- Using config here

let votingRound = false;
let roundStartTime = null;  
let endingRound = false;
let startingRound = false;

const topicCache = new Collection();

client.on("ready", () => {
    console.log("Bot online");
    connectToMongoDB();
    reconnectInterval = 5000;  // Reset the reconnect interval upon successful connection
});

client.on("disconnect", () => {
    console.error('Bot disconnected from Discord. Retrying in', reconnectInterval / 1000, 'seconds...');
    setTimeout(() => {
        client.login(token)
            .catch(err => {
                console.error('Failed to reconnect:', err);
                // Increase the reconnect interval, but cap it at maxReconnectInterval
                reconnectInterval = Math.min(reconnectInterval * 2, maxReconnectInterval);
            });
    }, reconnectInterval);
});


async function connectToMongoDB() {
    try {
        await mongoClient.connect();
        console.log('Connected to MongoDB');
    } catch (err) {
        console.error('Failed to connect to MongoDB. Retrying in 5 seconds...', err);
        setTimeout(connectToMongoDB, 5000);
    }

    mongoClient.on('close', () => {
        console.error('MongoDB connection closed!');
        reconnectToMongoDB();
    });
}

function reconnectToMongoDB() {
    console.log('Attempting to reconnect to MongoDB...');
    setTimeout(connectToMongoDB, 5000);
}

// Call this function at the start of your bot
connectToMongoDB();

client.on("messageCreate", async (message) => {
    if (message.author.bot) return; // Don't process messages from bots

    if (message.content.startsWith("!topic")) {
        // Check if the message is in the correct channel
        if (message.channel.id !== '1137114143883808778') {
            message.reply("You can only suggest topics in the designated channel.");
            return;
        }

        const topic = message.content.substring(7).trim();
    
        // Check if the topic is empty, undefined, or too long.
        if (!topic || topic === '' || topic.length > 250) {
            message.react('❌');
            return;
        }
    
        topicCache.set(message.id, {
            topic: topic,
            user: message.author.id,
            votes: 0,
            timestamp: Date.now()
        });
    
        message.react('✅');  // Reacts to the topic for voting
        
    } else if (message.content === "!queue") {
        const db = mongoClient.db('Director');
        const proposedTopicsCollection = db.collection('proposed_topics');
        const generatedTopicsCollection = db.collection('generated_topics');
        
        const proposedTopicsCursor = proposedTopicsCollection.find({});
        const generatedTopicsCursor = generatedTopicsCollection.find({});
    
        const proposedTopics = await proposedTopicsCursor.toArray();
        const generatedTopics = await generatedTopicsCursor.toArray();
    
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('Topics in Queue');
    
        const allTopics = generatedTopics.concat(proposedTopics);
    
        if (allTopics.length === 0) {
            embed.setDescription("No topics in the queue.");
        } else {
            const topicsDescription = allTopics.map((t, index) => `Topic ${index + 1}: ${t.topic} (Submitted by: ${t.requestor_id})`).join('\n');
            embed.setDescription(topicsDescription);
        }
    
        message.channel.send({ embeds: [embed] });
        
    } else if (message.content === "!queueclear") {
        const db = mongoClient.db('Director'); // define db here
        const proposedTopicsCollection = db.collection('proposed_topics');
        const generatedTopicsCollection = db.collection('generated_topics');
        if (message.member.permissions.has(8)) {
            await db.collection('proposed_topics').deleteMany({});
            await db.collection('generated_topics').deleteMany({});
            message.channel.send("Queue has been cleared.");
        } else {
            message.channel.send("You do not have permission to use this command.");
        }
    }
});

client.on("messageReactionAdd", async (reaction, user) => {
    if (reaction.message.channel.id !== '1137114143883808778') return; // Ensure it's the correct channel

    if (reaction.emoji.name === '✅' && !user.bot && topicCache.has(reaction.message.id)) {
        topicCache.get(reaction.message.id).votes++;  
    }
});

setInterval(monitorTopicLogForCancellations, 1000);  // Check every second

async function monitorTopicLogForCancellations() {
    const topicLogChannel = client.channels.cache.get('1148722750467342437');
    const messages = await topicLogChannel.messages.fetch({ limit: 10 }); // Fetch last 10 messages, adjust as needed

    for (const message of messages.values()) {
        if (message.embeds.length > 0) {
            const embed = message.embeds[0];
            const topicMessage = embed.description;
            const topicObjectID = embed.fields.find(field => field.name === 'ObjectID')?.value; // Extract ObjectID from the embed

            // Check if this message's ❌ reaction count is 2
            const xReaction = message.reactions.cache.get('❌');
            if (xReaction && xReaction.count >= 2) { // Check for 2 or more reactions instead
                const xReactionUsers = await xReaction.users.fetch();
                const cancellingUser = xReactionUsers.find(u => !u.bot);

                // Use ObjectID to check if the topic exists
                const db = mongoClient.db('Director');
                const topicExists = await db.collection('proposed_topics').findOne({ _id: new ObjectId(topicObjectID) }) || 
                                     await db.collection('generated_topics').findOne({ _id: new ObjectId(topicObjectID) });

                // Inside the monitorTopicLogForCancellations function
                if (topicExists) {
                    console.log(`Reaction count for :x: on message with ObjectID "${topicObjectID}" has reached 2.`);
                    requestTopicDeletionByObjectID(topicObjectID); // Call function with the ObjectId as a string

                    const embedNotification = new EmbedBuilder()
                        .setColor('#ff0000')
                        .setTitle('Topic Cancelled!')
                        .setDescription(`Topic: "${topicMessage}"`)
                        .addFields({ name: 'Suggested By', value: embed.footer.text.replace('Suggested by ', '') })
                        .addFields({ name: 'Cancelled By', value: cancellingUser.username })
                        .addFields({ name: 'ObjectID', value: topicObjectID }); // Include ObjectID in cancellation embed
                    
                    topicLogChannel.send({ embeds: [embedNotification] });

                    message.delete().catch(error => console.error('Failed to delete message:', error));
                }
            }
        }
    }
}


async function endVotingRound(channel) {
    if (endingRound) return;
    endingRound = true;

    if (topicCache.size === 0) {
        endingRound = false;
        return;
    }

    const db = mongoClient.db('Director');
    const proposedTopicsCollection = db.collection('proposed_topics');
    const generatedTopicsCollection = db.collection('generated_topics');
    const proposedTopicCount = await proposedTopicsCollection.countDocuments();
    const generatedTopicCount = await generatedTopicsCollection.countDocuments();

    if (proposedTopicCount + generatedTopicCount >= 4) {
        setTimeout(() => endVotingRound(channel), 10 * 1000);
        endingRound = false;
        return;
    }

    const sortedTopicsArray = [...topicCache.values()].sort((a, b) => b.votes - a.votes);
    const winningEntry = sortedTopicsArray[0];

    try {
        // Insert the winning topic into the 'generated_topics' collection
        const insertResult = await generatedTopicsCollection.insertOne({
            topic: winningEntry.topic,
            user: winningEntry.user,
            votes: winningEntry.votes,
            timestamp: new Date()
        });

        if (!insertResult.acknowledged || !insertResult.insertedId) {
            throw new Error('Failed to insert winning topic into the database.');
        }

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('Winning Topic!')
            .setDescription(winningEntry.topic)
            .addFields({ name: 'ObjectID', value: insertResult.insertedId.toString(), inline: true })
            .setFooter({
                text: `Suggested by ${channel.guild.members.cache.get(winningEntry.user).user.username}`,
                iconURL: channel.guild.members.cache.get(winningEntry.user).user.displayAvatarURL()
            });

        await channel.send({ embeds: [embed] });

        const request = {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                requestor_id: channel.guild.members.cache.get(winningEntry.user).user.id, // Assuming you want to send the user's ID
                topic: winningEntry.topic
            })
        };

        const response = await fetch("http://localhost:3001/story/suggest", request);
        const jsonResponse = await response.json();

        if (jsonResponse.status !== "Success") {
            channel.send("An error occurred while submitting the topic to the Director...");
        }

        const topicLogChannel = client.channels.cache.get('1148722750467342437');
        const embedLog = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('New Topic Suggestion')
            .setDescription(winningEntry.topic)
            .addFields({ name: 'ObjectID', value: insertResult.insertedId.toString(), inline: true })
            .setFooter({
                text: `Suggested by ${channel.guild.members.cache.get(winningEntry.user).user.username}`,
                iconURL: channel.guild.members.cache.get(winningEntry.user).user.displayAvatarURL()
            });

        const logMessage = await topicLogChannel.send({ embeds: [embedLog] });
        await logMessage.react('❌');

    } catch (error) {
        channel.send("An error occurred while processing the winning topic.");
        console.error(error);
    } finally {
        topicCache.clear();
        votingRound = false;
        startNewRound(channel);
        endingRound = false;
    }
}



function startNewRound(channel) {
    if (startingRound) return;
    startingRound = true;
    votingRound = true; // Start the voting round at the beginning
    roundStartTime = Date.now();

    const embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle('New round of topic suggestions begins!')
        .setDescription('Use !topic to suggest a topic and vote for your favorite one.');
    
    channel.send({ embeds: [embed] });
    votingRound = true;
    roundStartTime = Date.now();

    startingRound = false;

}

async function requestTopicDeletionByObjectID(objectIdString) {
    try {
        const objectId = new ObjectId(objectIdString); // Convert the string to an ObjectId

        const db = mongoClient.db('Director');
        const proposedTopicsCollection = db.collection('proposed_topics');
        const generatedTopicsCollection = db.collection('generated_topics');

        // Attempt to delete from both collections
        const deleteFromProposed = await proposedTopicsCollection.deleteOne({ _id: objectId });
        const deleteFromGenerated = await generatedTopicsCollection.deleteOne({ _id: objectId });

        if (deleteFromProposed.deletedCount === 0 && deleteFromGenerated.deletedCount === 0) {
            console.error('Topic with ObjectID not found or already deleted.');
            // Send a message to the Discord channel
            channel.send("The topic has already been played or does not exist.");
        } else {
            console.log('Topic with ObjectID deleted successfully.');
        }
    } catch (err) {
        console.error('Error deleting topic with ObjectID:', err);
        // Send a message to the Discord channel
        channel.send("An error occurred while trying to delete the topic.");
    }
}


// Monitor MongoDB and handle voting rounds
setInterval(async () => {
    const db = mongoClient.db('Director');
    const proposedTopicsCollection = db.collection('proposed_topics');
    const generatedTopicsCollection = db.collection('generated_topics');
    const proposedTopicCount = await proposedTopicsCollection.countDocuments();
    const generatedTopicCount = await generatedTopicsCollection.countDocuments();

    const channel = client.channels.cache.get('1137114143883808778');

    if (proposedTopicCount + generatedTopicCount < 4 && !votingRound) {
        startNewRound(channel);
    } 

    if (votingRound) {  
        const timeSinceRoundStart = Date.now() - roundStartTime;
        
        if (timeSinceRoundStart >= 60000) {
            endVotingRound(channel);
        }
    }
}, 10000);

client.login(token);  // <-- Using config here