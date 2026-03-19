#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class WhatsAppBusinessAPITester:
    def __init__(self, base_url="https://saas-redesign-7.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.errors = []

    def run_test(self, name, method, endpoint, expected_status=200, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)  # Longer timeout for AI
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            print(f"   Response Status: {response.status_code}")
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ PASSED - Status: {response.status_code}")
                return True, response
            else:
                error_msg = f"Expected {expected_status}, got {response.status_code}"
                self.errors.append(f"{name}: {error_msg}")
                print(f"❌ FAILED - {error_msg}")
                try:
                    print(f"   Response: {response.text[:200]}...")
                except:
                    print("   Response: <Could not read response>")
                return False, response

        except requests.exceptions.Timeout:
            error_msg = "Request timeout"
            self.errors.append(f"{name}: {error_msg}")
            print(f"❌ FAILED - {error_msg}")
            return False, None
        except Exception as e:
            error_msg = f"Error: {str(e)}"
            self.errors.append(f"{name}: {error_msg}")
            print(f"❌ FAILED - {error_msg}")
            return False, None

    def test_health_endpoint(self):
        """Test the health check endpoint"""
        success, response = self.run_test(
            "Health Check", 
            "GET", 
            "api/health", 
            200
        )
        
        if success:
            try:
                json_response = response.json()
                if json_response.get("status") == "ok":
                    print("   ✓ Health check returned correct status")
                    return True
                else:
                    print(f"   ⚠ Unexpected health status: {json_response}")
                    return False
            except:
                print("   ⚠ Health endpoint didn't return valid JSON")
                return False
        return False

    def test_chat_endpoint_basic(self):
        """Test the AI chat endpoint with basic request"""
        chat_data = {
            "clientId": "test-client-123",
            "customerPhone": "+237612345678",
            "message": "Hello, I need help with your products.",
            "conversationHistory": [],
            "clientInfo": {
                "business_name": "Test Business",
                "business_description": "Test business for API testing",
                "location": "Douala, Cameroon",
                "language": "English",
                "tone": "Friendly"
            },
            "productsInfo": "1. Test Product - 5000 XAF - Great test product\n2. Another Product - 3000 XAF - Another great item"
        }
        
        success, response = self.run_test(
            "AI Chat Basic Request",
            "POST",
            "api/chat",
            200,
            chat_data
        )
        
        if success:
            try:
                json_response = response.json()
                if "response" in json_response:
                    ai_response = json_response["response"]
                    print(f"   ✓ AI Response: {ai_response[:100]}...")
                    
                    # Check for expected fields
                    if "escalated" in json_response:
                        print(f"   ✓ Escalated field present: {json_response['escalated']}")
                    else:
                        print("   ⚠ Missing 'escalated' field in response")
                        
                    return True
                else:
                    print(f"   ⚠ Missing 'response' field in: {json_response}")
                    return False
            except Exception as e:
                print(f"   ⚠ Error parsing chat response: {e}")
                return False
        return False

    def test_chat_endpoint_empty_message(self):
        """Test chat endpoint with empty message"""
        chat_data = {
            "clientId": "test-client-123",
            "customerPhone": "+237612345678",
            "message": "",  # Empty message
            "conversationHistory": [],
            "clientInfo": {
                "business_name": "Test Business"
            },
            "productsInfo": ""
        }
        
        success, response = self.run_test(
            "AI Chat Empty Message",
            "POST",
            "api/chat",
            200,
            chat_data
        )
        
        if success:
            try:
                json_response = response.json()
                response_text = json_response.get("response", "")
                if "didn't receive your message" in response_text or "try again" in response_text:
                    print("   ✓ Proper error handling for empty message")
                    return True
                else:
                    print(f"   ⚠ Unexpected response for empty message: {response_text}")
                    return False
            except Exception as e:
                print(f"   ⚠ Error parsing empty message response: {e}")
                return False
        return False

    def test_chat_endpoint_with_history(self):
        """Test chat endpoint with conversation history"""
        chat_data = {
            "clientId": "test-client-123",
            "customerPhone": "+237612345678",
            "message": "What about the Test Product?",
            "conversationHistory": [
                {"role": "customer", "content": "Hello"},
                {"role": "agent", "content": "Hello! How can I help you today?"},
                {"role": "customer", "content": "I want to see your products"}
            ],
            "clientInfo": {
                "business_name": "Test Business",
                "language": "English",
                "tone": "Friendly"
            },
            "productsInfo": "Test Product - 5000 XAF - Great test product"
        }
        
        success, response = self.run_test(
            "AI Chat With History",
            "POST",
            "api/chat",
            200,
            chat_data
        )
        
        if success:
            try:
                json_response = response.json()
                if "response" in json_response:
                    print("   ✓ Chat with history processed successfully")
                    return True
                else:
                    print(f"   ⚠ Invalid response structure: {json_response}")
                    return False
            except Exception as e:
                print(f"   ⚠ Error parsing history response: {e}")
                return False
        return False

    def test_chat_endpoint_invalid_data(self):
        """Test chat endpoint with invalid JSON"""
        success, response = self.run_test(
            "AI Chat Invalid Data",
            "POST",
            "api/chat",
            200,  # Should handle gracefully and return 200 with error message
            {"invalid": "data"}
        )
        
        if success:
            try:
                json_response = response.json()
                if "response" in json_response:
                    print("   ✓ Invalid data handled gracefully")
                    return True
                else:
                    print(f"   ⚠ Unexpected response structure: {json_response}")
                    return False
            except Exception as e:
                print(f"   ⚠ Error parsing invalid data response: {e}")
                return False
        return False

    def run_all_tests(self):
        """Run all API tests"""
        print("=" * 80)
        print("🚀 STARTING WHATSAPP BUSINESS API TESTING")
        print(f"📍 Testing against: {self.base_url}")
        print(f"⏰ Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 80)

        # Test health endpoint first
        print("\n" + "="*50)
        print("🏥 HEALTH CHECK")
        print("="*50)
        health_ok = self.test_health_endpoint()

        # Test AI chat endpoints
        print("\n" + "="*50)
        print("🤖 AI CHAT ENDPOINT TESTS")
        print("="*50)
        
        if health_ok:
            self.test_chat_endpoint_basic()
            self.test_chat_endpoint_empty_message()
            self.test_chat_endpoint_with_history()
            self.test_chat_endpoint_invalid_data()
        else:
            print("⚠️  Skipping chat tests due to health check failure")

        # Print summary
        print("\n" + "="*80)
        print("📊 TEST SUMMARY")
        print("="*80)
        print(f"✅ Tests passed: {self.tests_passed}/{self.tests_run}")
        print(f"❌ Tests failed: {self.tests_run - self.tests_passed}/{self.tests_run}")
        
        if self.errors:
            print("\n🚨 ERRORS FOUND:")
            for i, error in enumerate(self.errors, 1):
                print(f"{i}. {error}")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"\n📈 Success Rate: {success_rate:.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test function"""
    tester = WhatsAppBusinessAPITester()
    
    try:
        success = tester.run_all_tests()
        return 0 if success else 1
    except KeyboardInterrupt:
        print("\n\n⚠️  Tests interrupted by user")
        return 1
    except Exception as e:
        print(f"\n\n💥 Unexpected error: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())