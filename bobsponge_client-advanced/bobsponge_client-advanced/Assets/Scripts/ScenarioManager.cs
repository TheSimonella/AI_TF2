using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Networking;
using UnityEngine.UI;
using TMPro;
using UnityEngine.SceneManagement;
using UnityEngine.Video;

public class ScenarioManager : MonoBehaviour
{
    private StoryModel story;
    private List<AudioClip> audioClips;

    [SerializeField]
    private AudioSource dialogueSource;

    [SerializeField]
    private TextMeshProUGUI subtitles;

    [SerializeField]
    private TextMeshProUGUI requestor;

    [SerializeField]
    private TextMeshProUGUI topic;

    [SerializeField]
    private VideoPlayer videoPlayer;

    [SerializeField]
    private RawImage videoScreen;

    [SerializeField]
    private Texture2D placeholderImage;

    [SerializeField]
    private List<VideoClip> transitionVideos;

    [SerializeField]
    private AudioSource videoAudioSource;
    
    [SerializeField]
    private SongModel song;

    private int scenarioProgress;

    [SerializeField] private CharacterBehaviour scout;
    [SerializeField] private CharacterBehaviour medic;
    [SerializeField] private CharacterBehaviour heavy;
    [SerializeField] private CharacterBehaviour soldier;
    [SerializeField] private CharacterBehaviour engineer;
    [SerializeField] private CharacterBehaviour demoman;
    [SerializeField] private CharacterBehaviour spy;

    [HideInInspector] public Transform cameraTarget;

    [SerializeField] private DynamicCamera dynamicCamera;

    public static ScenarioManager instance;

    private void Awake()
    {
        instance = this;
    }

    // Start is called before the first frame update
    void Start()
    {
        videoPlayer.loopPointReached += OnVideoEnd;
        PlayRandomVideo();
    }

    void LoadStory()
    {
        Debug.Log("LoadStory called");
        PlayRandomVideo();
    }

    void OnVideoEnd(VideoPlayer vp)
    {
        videoScreen.texture = placeholderImage;
        TryGetSong();
    }

    void TryGetSong()
    {
        StartCoroutine(GetSong());
    }

    IEnumerator GetSong()
    {
        using (UnityWebRequest webRequest = UnityWebRequest.Get("http://localhost:3001/song/getSong"))
        {
            yield return webRequest.SendWebRequest();

            song = JsonUtility.FromJson<SongModel>(webRequest.downloadHandler.text);

            if (song == null)
            {
                TryGetStory();
                yield break;
            }

            PlaySong();
        }
    }

    void TryGetStory()
    {
        StartCoroutine(GetStory());
        ResetCharacterPositions();
    }

    void ResetCharacterPositions()
    {
        scout.transform.position = scout.initialPosition;
        scout.transform.rotation = Quaternion.identity;
        medic.transform.position = medic.initialPosition;
        medic.transform.rotation = Quaternion.identity;
        heavy.transform.position = heavy.initialPosition;
        heavy.transform.rotation = Quaternion.identity;
        soldier.transform.position = soldier.initialPosition;
        soldier.transform.rotation = Quaternion.identity;
        engineer.transform.position = engineer.initialPosition;
        engineer.transform.rotation = Quaternion.identity;
        demoman.transform.position = demoman.initialPosition;
        demoman.transform.rotation = Quaternion.identity;
        spy.transform.position = spy.initialPosition;
        spy.transform.rotation = Quaternion.identity;
    }

    void PlayRandomVideo()
    {
        videoAudioSource.Stop();
        videoPlayer.Stop();
        
        // Create a new Render Texture
        RenderTexture rt = new RenderTexture(1920, 1080, 24);
        videoPlayer.targetTexture = rt;
        videoScreen.texture = rt;
        
        int randomIndex = Random.Range(0, transitionVideos.Count);
        videoPlayer.clip = transitionVideos[randomIndex];
        videoPlayer.Play();
        videoScreen.enabled = true;
    }

    void PlayScenario()
    {
        if (scenarioProgress < audioClips.Count)
        {
            PlayScene();
        }
        else
        {
            subtitles.text = "";
            requestor.text = "Waiting For Story";
            topic.text = "";
            PlayRandomVideo();
        }
    }

    void PlayScene()
    {
        dialogueSource.clip = audioClips[scenarioProgress];
        dialogueSource.Play();

        subtitles.text = story.scenario[scenarioProgress].character + ": " + story.scenario[scenarioProgress].text;

        CharacterBehaviour cbTarget = GetCameraTarget(story.scenario[scenarioProgress].character);
        cameraTarget = cbTarget != null ? cbTarget.gameObject.transform : null;

        if (Random.Range(0, 2) == 0)
        {
            dynamicCamera.ChangeCamera();
        }

        ToggleTalkAnimations(story.scenario[scenarioProgress].character);
        scenarioProgress++;
        Invoke("PlayScenario", audioClips[scenarioProgress - 1].length + 0.5f);
    }

    CharacterBehaviour GetCameraTarget(string character)
    {
        if (Random.Range(0, 1) == 0)
        {
            switch (character)
            {
                case "Scout":
                    return scout;
                case "Medic":
                    return medic;
                case "Heavy":
                    return heavy;
                case "Soldier":
                    return soldier;
                case "Engineer":
                    return engineer;
                case "Demoman":
                    return demoman;
                case "Spy":
                    return spy;
                default: return null;
            }
        }
        return null;
    }

    void ToggleTalkAnimations(string character)
    {
        scout.ToggleTalk(character == "Scout");
        medic.ToggleTalk(character == "Medic");
        heavy.ToggleTalk(character == "Heavy");
        soldier.ToggleTalk(character == "Soldier");
        engineer.ToggleTalk(character == "Engineer");
        demoman.ToggleTalk(character == "Demoman");
        spy.ToggleTalk(character == "Spy");
    }

    public CharacterBehaviour GetTalkingCharacter()
    {
        if (scout.talking) return scout;
        if (medic.talking) return medic;
        if (heavy.talking) return heavy;
        if (soldier.talking) return soldier;
        if (engineer.talking) return engineer;
        if (demoman.talking) return demoman;
        if (spy.talking) return spy;

        return null;
    }

    IEnumerator GetStory()
    {
        audioClips = new List<AudioClip>();

        using (UnityWebRequest webRequest = UnityWebRequest.Get("http://localhost:3001/story/getScenario"))
        {
            yield return webRequest.SendWebRequest();

            story = JsonUtility.FromJson<StoryModel>(webRequest.downloadHandler.text);

            //No story found
            if (story == null)
            {
                Invoke("TryGetStory", 2f);
                yield break;
            }

            //Initialize entire list with nulls so you can substitute at the right place as they come back asynchronously.
            for (int i = 0; i < story.scenario.Count; i++)
            {
                audioClips.Add(null);
            }

            for (int i = 0; i < story.scenario.Count; i++)
            {
                StartCoroutine(GetAudioClip(story.scenario[i].sound, i));
            }

            Invoke("CheckForSounds", 3f);
        }
    }

    IEnumerator GetAudioClip(string clipUrl, int pos)
{
    using (UnityWebRequest www = UnityWebRequestMultimedia.GetAudioClip(clipUrl, AudioType.WAV))
    {
        yield return www.SendWebRequest();

        if (www.result == UnityWebRequest.Result.Success)
        {
            audioClips[pos] = DownloadHandlerAudioClip.GetContent(www);
            Debug.Log("Successfully loaded audio clip at position " + pos);
        }
        else
        {
            Debug.LogError("Error loading audio clip at position " + pos + ": " + www.error);
        }
    }
}

    void CheckForSounds()
    {
        for (int i = 0; i < audioClips.Count; i++)
        {
            if (audioClips[i] == null)
            {
                Invoke("CheckForSounds", 3f);
                return;
            }
        }

        videoScreen.enabled = false;  // add this line to hide the placeholder image
        scenarioProgress = 0;
        requestor.text = "Requested By: " + story.requestor_id;
        topic.text = "Topic:" + story.topic;
        cameraTarget = null;
        PlayScenario();
    }
}
