using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class Collision : MonoBehaviour
{
    void OnTriggerEnter(Collider other)
  {
        if (other.gameObject.tag == "Merc")
        {
            print("ENTER");
        }
  }
  void OnTriggerStay(Collider other)
  {
        if (other.gameObject.tag == "Merc")
        {
            print("STAY");
        }
  }
    void OntriggerExit(Collider other)
    {
        if (other.gameObject.tag == "Merc")
        {
            print("EXIT");
        }
    }
}
