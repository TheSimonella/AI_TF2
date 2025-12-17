using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Networking;
using UnityEngine.UI;
using TMPro;
using UnityEngine.SceneManagement;
using UnityEngine.Video;
using System.Linq;

public class ScenarioManager : MonoBehaviour
{
    public static ScenarioManager Instance;

    private StoryModel story;
    private List<AudioClip> audioClips = new List<AudioClip>();
    private int scenarioProgress = 0;
    private bool isProcessing = false;

    [SerializeField] private AudioSource dialogueSource;
    [SerializeField] private TextMeshProUGUI subtitles;
    [SerializeField] private TextMeshProUGUI requestor;
    [SerializeField] private TextMeshProUGUI topic;
    [SerializeField] private VideoPlayer videoPlayer;
    [SerializeField] private RawImage videoScreen;
    [SerializeField] private Texture2D placeholderImage;
    [SerializeField] private List<VideoClip> transitionVideos;
    [SerializeField] private AudioSource videoAudioSource;
    [SerializeField] private DynamicCamera dynamicCamera;
    [SerializeField] private List<AudioClip> backgroundMusicClips;
    [SerializeField] private AudioSource backgroundMusic;
    
    [SerializeField] private List<CharacterBehaviour> characters;
    private Dictionary<string, CharacterBehaviour> characterMap;

    private void Awake()
    {
        if (Instance == null)
        {
            Instance = this;
        }
        else
        {
            Destroy(gameObject);
        }

        // Map characters to their names for easy lookup
        characterMap = new Dictionary<string, CharacterBehaviour>();
        foreach (var character in characters)
        {
            characterMap[character.name] = character;
        }
    }

    void Start()
    {
        Debug.Log("🎬 Scenario Manager Initialized. Waiting for stories...");
        StartCoroutine(GetScenario());
    }

    IEnumerator GetScenario()
    {
        Debug.Log("📡 Requesting new story from Director...");

        using (UnityWebRequest webRequest = UnityWebRequest.Get("http://localhost:3001/story/getScenario"))
        {
            yield return webRequest.SendWebRequest();

            if (webRequest.result != UnityWebRequest.Result.Success)
            {
                Debug.LogError($"❌ Failed to get scenario: {webRequest.error}");
                yield return new WaitForSeconds(5f);
                StartCoroutine(GetScenario());
            }
            else
            {
                string jsonResponse = webRequest.downloadHandler.text;
                Debug.Log("✅ Successfully received JSON from Director.");
                Debug.Log($"📜 Raw JSON Response: {jsonResponse}");

                try
                {
                    story = JsonUtility.FromJson<StoryModel>(jsonResponse);
                    if (story == null || story.scenario == null || story.scenario.Count == 0)
                    {
                        Debug.LogWarning("⚠️ Received empty or malformed scenario. Retrying in 5 seconds...");
                        yield return new WaitForSeconds(5f);
                        StartCoroutine(GetScenario());
                        yield break;
                    }

                    Debug.Log($"🎭 Story Loaded: {story.topic} - {story.scenario.Count} lines");
                    StartCoroutine(DownloadAllAudio());
                }
                catch (System.Exception e)
                {
                    Debug.LogError($"❌ JSON Parsing Error: {e.Message}");
                    yield return new WaitForSeconds(5f);
                    StartCoroutine(GetScenario());
                }
            }
        }
    }

    IEnumerator DownloadAllAudio()
    {
        Debug.Log("🎙️ Downloading TTS audio clips...");
        audioClips.Clear();

        for (int i = 0; i < story.scenario.Count; i++)
        {
            Debug.Log($"🔄 Loading audio for: {story.scenario[i].character} - {story.scenario[i].sound}");
            yield return StartCoroutine(GetAudioClip(story.scenario[i].sound, i));
        }

        CheckForSounds();
    }

    IEnumerator GetAudioClip(string url, int index)
    {
        using (UnityWebRequest webRequest = UnityWebRequestMultimedia.GetAudioClip(url, AudioType.WAV))
        {
            yield return webRequest.SendWebRequest();

            if (webRequest.result != UnityWebRequest.Result.Success)
            {
                Debug.LogError($"❌ Failed to load audio for {story.scenario[index].character}: {webRequest.error}");
                audioClips.Add(null);
            }
            else
            {
                Debug.Log($"✅ Audio loaded: {story.scenario[index].character}");
                audioClips.Add(DownloadHandlerAudioClip.GetContent(webRequest));
            }
        }
    }

    void CheckForSounds()
    {
        bool allLoaded = true;

        for (int i = 0; i < audioClips.Count; i++)
        {
            if (audioClips[i] == null)
            {
                allLoaded = false;
                break;
            }
        }

        if (allLoaded)
        {
            Debug.Log("✅ All TTS audio clips loaded. Starting scenario...");
            PlayScenario();
        }
        else
        {
            Debug.Log("⏳ Waiting for all audio clips to load...");
            Invoke("CheckForSounds", 3f);
        }
    }

    void PlayScenario()
    {
        if (isProcessing || scenarioProgress >= story.scenario.Count)
        {
            Debug.Log("🎬 Scenario complete! Returning to idle mode.");
            StartCoroutine(GetScenario());
            return;
        }

        isProcessing = true;
        Debug.Log($"🎙️ Playing line {scenarioProgress + 1}/{story.scenario.Count}: {story.scenario[scenarioProgress].character}");

        AudioSource audioSource = gameObject.AddComponent<AudioSource>();
        audioSource.clip = audioClips[scenarioProgress];
        audioSource.Play();

        subtitles.text = $"{story.scenario[scenarioProgress].character}: {story.scenario[scenarioProgress].text}";

        if (characterMap.TryGetValue(story.scenario[scenarioProgress].character, out var cbTarget))
        {
            dynamicCamera.SetCameraTarget(cbTarget.transform);
            cbTarget.ToggleTalk(true);
        }

        StartCoroutine(WaitForClip(audioSource.clip.length));
    }

    IEnumerator WaitForClip(float duration)
    {
        yield return new WaitForSeconds(duration);
        scenarioProgress++;
        isProcessing = false;
        PlayScenario();
    }
}
