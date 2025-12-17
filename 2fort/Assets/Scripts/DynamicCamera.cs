using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class DynamicCamera : MonoBehaviour
{
    public float rotationSpeed = 5f;
    public float zoomSpeed = 5f;
    public float zoomedInFOV = 30f;
    public float zoomedOutFOV = 60f;
    public float referenceDistance = 5f; // The distance at which your reference scale was determined.
    public float referenceFOV = 30f; // The FOV at which your reference scale was determined.


    public float headHeightOffset = 1.5f; // default value, adjust as needed

    private Camera cameraComponent;
    private bool isZooming = false;
    private float targetFOV;

    [SerializeField] private List<Transform> cameraPositions;
    [SerializeField] private Vector3 centerPointingPosition;

    private void Start()
    {
        cameraComponent = GetComponent<Camera>();
        targetFOV = cameraComponent.fieldOfView;
    }

    public void ChangeCamera()
    {
        List<Transform> activeAnchors = cameraPositions.FindAll(anchor => anchor.gameObject.activeSelf);
        if (activeAnchors.Count > 0)
        {
            transform.position = activeAnchors[Random.Range(0, activeAnchors.Count)].position;
        }
    
        isZooming = true; // Start the zooming process
        targetFOV = zoomedOutFOV; // Set the target FOV to zoom out
    }

    private float CalculateAdaptiveFOV(float distance)
    {
        float desiredFOV = 2 * Mathf.Atan(2 * referenceDistance * Mathf.Tan(referenceFOV * 0.5f * Mathf.Deg2Rad) / (2 * distance)) * Mathf.Rad2Deg;
        return desiredFOV;
    }

    public void TeleportToAnchor(Transform anchor)
    {
        transform.position = anchor.position;
        ChangeCamera();  // If you want to invoke the zoom effect once teleported.
    }

    private void Update()
    {
        if (ScenarioManager.instance.cameraTarget != null)
        {
            Vector3 targetDirection = (ScenarioManager.instance.cameraTarget.position + (Vector3.up * headHeightOffset)) - transform.position;
            float distanceToCharacter = targetDirection.magnitude;

            targetFOV = CalculateAdaptiveFOV(distanceToCharacter);
            
            Quaternion targetRotation = Quaternion.LookRotation(targetDirection);
            transform.rotation = Quaternion.Slerp(transform.rotation, targetRotation, rotationSpeed * Time.deltaTime);

            if(isZooming && Mathf.Abs(cameraComponent.fieldOfView - targetFOV) < 0.1f)
            {
                // Once the zoom out is nearly complete, set the target FOV to zoom in
                targetFOV = CalculateAdaptiveFOV(distanceToCharacter);
            }
            else if(!isZooming && Mathf.Abs(cameraComponent.fieldOfView - targetFOV) < 0.1f)
            {
                // Stop the zooming process once the desired FOV is reached
                isZooming = false;
            }
        }
        else
        {
            Vector3 targetDirection = centerPointingPosition - transform.position;
            Quaternion targetRotation = Quaternion.LookRotation(targetDirection);
            transform.rotation = targetRotation;
            targetFOV = zoomedOutFOV;
        }

        // Smoothly interpolate the field of view
        cameraComponent.fieldOfView = Mathf.Lerp(cameraComponent.fieldOfView, targetFOV, zoomSpeed * Time.deltaTime);
    }
}
