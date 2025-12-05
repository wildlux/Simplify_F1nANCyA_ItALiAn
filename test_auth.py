#!/usr/bin/env python3
"""
Test script per verificare l'autenticazione API
"""
import requests
import json

BASE_URL = "http://localhost:5005"

def test_api_key(api_key, description):
    """Testa una API key"""
    print(f"\n🧪 Test: {description}")
    print(f"API Key: {api_key}")

    try:
        # Test endpoint che richiede autenticazione (chat)
        response = requests.post(f"{BASE_URL}/api/chat",
                               json={"text": "test", "mode": "general"},
                               headers={'X-API-Key': api_key},
                               timeout=5)

        if response.status_code == 200:
            print("✅ Accesso consentito")
            print(f"   Risposta: {response.json()}")
        else:
            print(f"❌ Accesso negato (HTTP {response.status_code})")
            try:
                error_data = response.json()
                print(f"   Errore: {error_data.get('message', 'N/A')}")
            except:
                print(f"   Risposta: {response.text}")

    except requests.exceptions.RequestException as e:
        print(f"❌ Errore connessione: {e}")

def main():
    print("🔐 Test Autenticazione API Assistente AI")
    print("=" * 50)

    # Test senza API key
    test_api_key("", "Nessuna API key")

    # Test API key valide
    test_api_key("demo_key_123", "API Key Demo valida")
    test_api_key("admin_key_456", "API Key Admin valida")
    test_api_key("test_key_789", "API Key Test valida")

    # Test API key non valide
    test_api_key("invalid_key", "API Key non valida")
    test_api_key("demo_key_123_extra", "API Key modificata")

    print("\n" + "=" * 50)
    print("🎯 Test completato!")

if __name__ == "__main__":
    main()