using System;
using System.Collections.Generic;

[Serializable]
public class StoryModel
{
    public string _id;
    public string requestor_id;
    public string topic;
    public string sceneName;
    public List<Scenario> scenario;
    public bool isTipGenerated;
    public float tipAmount;
    public bool isSpecialEvent; 
    public string specialEventName;
}

[Serializable]
public class Scenario
{
    public string character;
    public string text;
    public string sound;
}