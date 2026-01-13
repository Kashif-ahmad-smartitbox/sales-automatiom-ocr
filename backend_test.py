import requests
import sys
import json
from datetime import datetime

class FieldOpsAPITester:
    def __init__(self, base_url="https://salestrackr-7.preview.smartItboxagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.company_id = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.territory_id = None
        self.dealer_id = None
        self.executive_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, auth_required=True):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if auth_required and self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            print(f"   Status: {response.status_code}")
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json() if response.content else {}
                    if response_data:
                        print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                except:
                    response_data = {}
                return True, response_data
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json() if response.content else {}
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Raw response: {response.text[:200]}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test basic health endpoint"""
        return self.run_test("Health Check", "GET", "health", 200, auth_required=False)

    def test_company_registration(self):
        """Test company registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        company_data = {
            "company_name": f"Test Company {timestamp}",
            "industry_type": "FMCG",
            "gst": "22AAAAA0000A1Z5",
            "head_office_location": "Mumbai, Maharashtra",
            "admin_name": f"Test Admin {timestamp}",
            "admin_email": f"admin{timestamp}@testcompany.com",
            "admin_mobile": "+91 9876543210",
            "password": "TestPass123!"
        }
        
        success, response = self.run_test(
            "Company Registration",
            "POST",
            "company/register",
            200,
            data=company_data,
            auth_required=False
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.company_id = response.get('company_id')
            self.user_id = response.get('user_id')
            print(f"   ✅ Token obtained: {self.token[:20]}...")
            return True
        return False

    def test_login(self):
        """Test login with registered credentials"""
        timestamp = datetime.now().strftime('%H%M%S')
        login_data = {
            "email": f"admin{timestamp}@testcompany.com",
            "password": "TestPass123!"
        }
        
        success, response = self.run_test(
            "Login",
            "POST",
            "auth/login",
            200,
            data=login_data,
            auth_required=False
        )
        
        if success and 'token' in response:
            self.token = response['token']
            return True
        return False

    def test_get_me(self):
        """Test get current user"""
        return self.run_test("Get Current User", "GET", "auth/me", 200)

    def test_create_territory(self):
        """Test territory creation"""
        territory_data = {
            "name": "Test State",
            "type": "State",
            "parent_id": None,
            "lat": 19.0760,
            "lng": 72.8777
        }
        
        success, response = self.run_test(
            "Create Territory",
            "POST",
            "territories",
            200,
            data=territory_data
        )
        
        if success and 'id' in response:
            self.territory_id = response['id']
            print(f"   ✅ Territory ID: {self.territory_id}")
            return True
        return False

    def test_get_territories(self):
        """Test get territories"""
        return self.run_test("Get Territories", "GET", "territories", 200)

    def test_create_dealer(self):
        """Test dealer creation"""
        if not self.territory_id:
            print("❌ Cannot create dealer - no territory ID available")
            return False
            
        dealer_data = {
            "name": "Test Dealer",
            "dealer_type": "Retailer",
            "category_mapping": [],
            "lat": 19.0760,
            "lng": 72.8777,
            "address": "Test Address, Mumbai",
            "territory_id": self.territory_id,
            "visit_frequency": "Weekly",
            "priority_level": 1,
            "contact_person": "Test Contact",
            "phone": "+91 9876543210"
        }
        
        success, response = self.run_test(
            "Create Dealer",
            "POST",
            "dealers",
            200,
            data=dealer_data
        )
        
        if success and 'id' in response:
            self.dealer_id = response['id']
            print(f"   ✅ Dealer ID: {self.dealer_id}")
            return True
        return False

    def test_get_dealers(self):
        """Test get dealers"""
        return self.run_test("Get Dealers", "GET", "dealers", 200)

    def test_create_sales_executive(self):
        """Test sales executive creation"""
        timestamp = datetime.now().strftime('%H%M%S')
        executive_data = {
            "name": f"Test Executive {timestamp}",
            "email": f"exec{timestamp}@testcompany.com",
            "mobile": "+91 9876543211",
            "password": "TestPass123!",
            "employee_code": f"EMP{timestamp}",
            "territory_ids": [self.territory_id] if self.territory_id else [],
            "product_category_access": []
        }
        
        success, response = self.run_test(
            "Create Sales Executive",
            "POST",
            "sales-executives",
            200,
            data=executive_data
        )
        
        if success and 'id' in response:
            self.executive_id = response['id']
            print(f"   ✅ Executive ID: {self.executive_id}")
            return True
        return False

    def test_get_sales_executives(self):
        """Test get sales executives"""
        return self.run_test("Get Sales Executives", "GET", "sales-executives", 200)

    def test_dashboard_stats(self):
        """Test dashboard statistics"""
        return self.run_test("Dashboard Stats", "GET", "reports/dashboard", 200)

    def test_live_tracking(self):
        """Test live tracking"""
        return self.run_test("Live Tracking", "GET", "tracking/live", 200)

    def test_company_config(self):
        """Test get company config"""
        return self.run_test("Get Company Config", "GET", "company/config", 200)

    def test_visits_today(self):
        """Test get today's visits"""
        return self.run_test("Get Today's Visits", "GET", "visits/today", 200)

    def test_delete_operations(self):
        """Test delete operations"""
        results = []
        
        if self.executive_id:
            success, _ = self.run_test("Delete Sales Executive", "DELETE", f"sales-executives/{self.executive_id}", 200)
            results.append(success)
        
        if self.dealer_id:
            success, _ = self.run_test("Delete Dealer", "DELETE", f"dealers/{self.dealer_id}", 200)
            results.append(success)
            
        if self.territory_id:
            success, _ = self.run_test("Delete Territory", "DELETE", f"territories/{self.territory_id}", 200)
            results.append(success)
            
        return all(results) if results else True

def main():
    print("🚀 Starting FieldOps API Testing...")
    print("=" * 50)
    
    tester = FieldOpsAPITester()
    
    # Test sequence
    test_sequence = [
        ("Health Check", tester.test_health_check),
        ("Company Registration", tester.test_company_registration),
        ("Get Current User", tester.test_get_me),
        ("Create Territory", tester.test_create_territory),
        ("Get Territories", tester.test_get_territories),
        ("Create Dealer", tester.test_create_dealer),
        ("Get Dealers", tester.test_get_dealers),
        ("Create Sales Executive", tester.test_create_sales_executive),
        ("Get Sales Executives", tester.test_get_sales_executives),
        ("Dashboard Stats", tester.test_dashboard_stats),
        ("Live Tracking", tester.test_live_tracking),
        ("Company Config", tester.test_company_config),
        ("Today's Visits", tester.test_visits_today),
        ("Delete Operations", tester.test_delete_operations)
    ]
    
    failed_tests = []
    
    for test_name, test_func in test_sequence:
        try:
            success = test_func()
            if not success:
                failed_tests.append(test_name)
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {str(e)}")
            failed_tests.append(test_name)
    
    # Print results
    print("\n" + "=" * 50)
    print("📊 TEST RESULTS")
    print("=" * 50)
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Tests Failed: {tester.tests_run - tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed / tester.tests_run * 100):.1f}%" if tester.tests_run > 0 else "0%")
    
    if failed_tests:
        print(f"\n❌ Failed Tests:")
        for test in failed_tests:
            print(f"   - {test}")
    else:
        print(f"\n✅ All tests passed!")
    
    return 0 if len(failed_tests) == 0 else 1

if __name__ == "__main__":
    sys.exit(main())