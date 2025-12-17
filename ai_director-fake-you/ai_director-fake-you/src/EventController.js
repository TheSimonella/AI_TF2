class EventController {
    constructor() {
        this.specialEvents = [
            {
                name: "Demoman_Beggin",
                scenarios: [
                    {
                        character: "RED Demoman",
                        text: "I'm Bacon",
                        sound: "Demoman_Beggin"
                    },
                ]
            },

            {
                name: "Demoman_Raindrops",
                scenarios: [
                    {
                        character: "BLU Demoman",
                        text: "",
                        sound: "Demoman_Raindrops"
                    },
                ]
            },

            {
                name: "Engineer_Ballin",
                scenarios: [
                    {
                        character: "RED Engineer",
                        text: "I put the new Forgis on the G",
                        sound: "Engineer_Balling"
                    },
                ]
            },
            
            {
                name: "Engineer_CountryRoads",
                scenarios: [
                    {
                        character: "BLU Engineer",
                        text: "West Virginia",
                        sound: "Engineer_CountryRoads"
                    },
                ]
            },

            {
                name: "Engineer_PleaseDontLeaveMe",
                scenarios: [
                    {
                        character: "RED Engineer",
                        text: "Valve, Please Don't Forget About TF2",
                        sound: "Engineer_PleaseDontLeaveMe"
                    },
                ]
            },

            {
                name: "Engineer_WhoKnew",
                scenarios: [
                    {
                        character: "BLU Engineer",
                        text: "Gaben, Give Us New TF2 Update",
                        sound: "Engineer_WhoKnew"
                    },
                ]
            },

            {
                name: "Heavy_Human",
                scenarios: [
                    {
                        character: "RED Heavy",
                        text: "I'm only human I'm only, I'm only I'm only human, human Maybe I'm foolish Maybe I'm blind Thinking I can see through this And see what's behind Got no way to prove it So maybe I'm blind But I'm only human after all I'm only human after all Don't put your blame on me Don't put your blame on me Take a look in the mirror And what do you see Do you see it clearer Or are you deceived In what you believe 'Cause I'm only human after all You're only human after all Don't put the blame on me Don't put your blame on me Some people got the real problem Some people out of luck Some people think I can solve them Lord heavens above I'm only human after all I'm only human after all Don't put the blame on me Don't put the blame on me Don't ask my opinion Don't ask me to lie Then beg for forgiveness For making you cry Making you cry 'Cause I'm only human after all I'm only human after all Don't put your blame on me Don't put the blame on me Oh, some people got the real problems Some people out of luck Some people think I can solve them Lord heavens above I'm only human after all I'm only human after all Don't put the blame on me Don't put the blame on me I'm only human I make mistakes I'm only human That's all it takes To put the blame on me Don't put the blame on me I'm no prophet or Messiah Should go looking somewhere higher I'm only human after all I'm only human after all Don't put the blame on me Don't put the blame on me I'm only human I do what I can I'm just a man I do what I can Don't put the blame on me Don't put your blame on me",
                        sound: "Heavy_Human"
                    },
                ]
            },

            {
                name: "Heavy_AsTheWorldCavesIn",
                scenarios: [
                    {
                        character: "BLU Heavy",
                        text: "",
                        sound: "Heavy_AsTheWorldCavesIn"
                    },
                ]
            },

            {
                name: "Heavy_CanYouFeelMyHeart",
                scenarios: [
                    {
                        character: "RED Heavy",
                        text: "",
                        sound: "Heavy_CanYouFeelMyHeart"
                    },
                ]
            },

            {
                name: "Heavy_IGotNoTime",
                scenarios: [
                    {
                        character: "BLU Heavy",
                        text: "",
                        sound: "Heavy_IGotNoTime"
                    },
                ]
            },

            {
                name: "Heavy_ItHasToBeThisWay",
                scenarios: [
                    {
                        character: "RED Heavy",
                        text: "",
                        sound: "Heavy_ItHasToBeThisWay"
                    },
                ]
            },

            {
                name: "Heavy_MyWay",
                scenarios: [
                    {
                        character: "BLU Heavy",
                        text: "I did it My Way!",
                        sound: "Heavy_MyWay"
                    },
                ]
            },

            {
                name: "Heavy_Scatman",
                scenarios: [
                    {
                        character: "RED Heavy",
                        text: "",
                        sound: "Heavy_ScatMan"
                    },
                ]
            },

            {
                name: "Heavy_UptownFunk",
                scenarios: [
                    {
                        character: "BLU Heavy",
                        text: "2fort Funk It Up!",
                        sound: "Heavy_UptownFunk"
                    },
                ]
            },

            {
                name: "Heavy_USSR",
                scenarios: [
                    {
                        character: "RED Heavy",
                        text: "",
                        sound: "Heavy_USSR"
                    },
                ]
            },

            {
                name: "Medic_Erika",
                scenarios: [
                    {
                        character: "RED Medic",
                        text: "",
                        sound: "Medic_Erika"
                    },
                ]
            },

            {
                name: "Medic_YoureWelcome",
                scenarios: [
                    {
                        character: "BLU Medic",
                        text: "*heals you 2 seconds before you die* You're Welcome!",
                        sound: "Medic_YoureWelcome"
                    },
                ]
            },

            {
                name: "Pyro_USSR",
                scenarios: [
                    {
                        character: "RED Pyro",
                        text: "Communism",
                        sound: "Pyro_USSR"
                    },
                ]
            },

            {
                name: "Pyro_Vesti",
                scenarios: [
                    {
                        character: "BLU Pyro",
                        text: "Leoncavallo: I Pagliacci - 'Vesti la giubba'",
                        sound: "Pyro_Vesti"
                    },
                ]
            },

            {
                name: "Pyro_RingOfFire",
                scenarios: [
                    {
                        character: "RED Pyro",
                        text: "You Fell Into My Fire",
                        sound: "Pyro_RingOfFire"
                    },
                ]
            },
            
            {
                name: "Pyro_ShBoom",
                scenarios: [
                    {
                        character: "BLU Pyro",
                        text: "PyroVision Be Like",
                        sound: "Pyro_ShBoom"
                    },
                ]
            },

            {
                name: "Pyro_ThatsLife",
                scenarios: [
                    {
                        character: "RED Pyro",
                        text: "This Isn't Even AI-generated",
                        sound: "Pyro_ThatsLife"
                    },
                ]
            },

            {
                name: "Scout_VirtualInsanity",
                scenarios: [
                    {
                        character: "RED Scout",
                        text: "Dancing, Walking, Rearranging Furniture, Babs is Shopping, I let the bird out of the cage",
                        sound: "Scout_VirtualInsanity"
                    },
                ]
            },

            {
                name: "Scout_ImStillStanding",
                scenarios: [
                    {
                        character: "BLU Scout",
                        text: "",
                        sound: "Scout_ImStillStanding"
                    },
                ]
            },

            {
                name: "Scout_LifeIsAHighway",
                scenarios: [
                    {
                        character: "RED Scout",
                        text: "",
                        sound: "LifeIsAHighWay"
                    },
                ]
            },

            {
                name: "Scout_SayItAintSo",
                scenarios: [
                    {
                        character: "BLU Scout",
                        text: "",
                        sound: "Scout_SayItAintSo"
                    },
                ]
            },

            {
                name: "Scout_ShBoom",
                scenarios: [
                    {
                        character: "RED Scout",
                        text: "",
                        sound: "Scout_ShBoom"
                    },
                ]
            },

            {
                name: "Scout_WelcomeToTheBlackParade",
                scenarios: [
                    {
                        character: "BLU Scout",
                        text: "",
                        sound: "Scout_WelcomeTo"
                    },
                ]
            },

            {
                name: "Soldier_TickTock",
                scenarios: [
                    {
                        character: "RED Soldier",
                        text: "Tick Tock",
                        sound: "Soldier_TickTock"
                    },
                ]
            },

            {
                name: "Soldier_FortunateSon",
                scenarios: [
                    {
                        character: "BLU Soldier",
                        text: "",
                        sound: "Soldier_FortunateSon"
                    },
                ]
            },

            {
                name: "Soldier_ManOutOfYou",
                scenarios: [
                    {
                        character: "RED Soldier",
                        text: "",
                        sound: "Soldier_ManOutOfYou"
                    },
                ]
            },

            {
                name: "Soldier_StrongerThanYou",
                scenarios: [
                    {
                        character: "BLU Soldier",
                        text: "",
                        sound: "Soldier_StrongerThanYou"
                    },
                ]
            },

            {
                name: "Spy_Ipanema",
                scenarios: [
                    {
                        character: "RED Spy",
                        text: "Seduce Me!",
                        sound: "Spy_Ipanema"
                    },
                ]
            },

            {
                name: "Spy_SnakeEater",
                scenarios: [
                    {
                        character: "BLU Spy",
                        text: "",
                        sound: "Spy_SnakeEater"
                    },
                ]
            },

            {
                name: "Spy_Spyfall",
                scenarios: [
                    {
                        character: "RED Spy",
                        text: "",
                        sound: "Spy_Spyfall"
                    },
                ]
            },
        ];
        this.lastEventTime = null;  // Initialize lastEventTime as null
    }

    // Placeholder for future functionality to generate an event
    generateEvent() {
        // Your future code here
    }

    // Check for special events based on your conditions
    checkForSpecialEvent() {
        const currentTime = new Date().getTime();
        const eventCheck = 600 * 1000;  // 60 seconds * 1000 milliseconds per second

        // Check if it's been more than 6 minutes since the last event
        if (currentTime - this.lastEventTime >= eventCheck) {
            this.lastEventTime = currentTime;  // Update the last event time

            // 5% chance to trigger an event after six minute has passed
            if (Math.random() < 0.05) {  
                return this.getRandomEvent();
            }
        }

        return null; // No event will be triggered
    }

    getRandomEvent() {
        const randomIndex = Math.floor(Math.random() * this.specialEvents.length);
        return this.specialEvents[randomIndex];
    }

    // Placeholder for future functionality to modify an event
    modifyEvent() {
        // Your future code here
    }

    // ... more future methods
}

module.exports = EventController;
