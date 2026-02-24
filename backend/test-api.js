// Simple API test script
// Note: This requires Node.js 18+ for built-in fetch

const API_BASE = 'http://localhost:5000';

async function testAPI() {
    console.log('🧪 Testing SmartStudy API Endpoints...\n');

    try {
        // Test registration
        console.log('1. Testing registration...');
        const registerResponse = await fetch(`${API_BASE}/api/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123'
            })
        });
        
        if (registerResponse.ok) {
            const registerData = await registerResponse.json();
            console.log('✅ Registration successful');
            console.log('User:', registerData.user.name);
            const token = registerData.token;
            
            // Test dashboard
            console.log('\n2. Testing dashboard...');
            const dashboardResponse = await fetch(`${API_BASE}/api/dashboard`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (dashboardResponse.ok) {
                const dashboardData = await dashboardResponse.json();
                console.log('✅ Dashboard access successful');
                console.log('Subjects:', dashboardData.subjects?.length || 0);
            } else {
                console.log('❌ Dashboard access failed');
            }

            // Test adding a subject
            console.log('\n3. Testing add subject...');
            const addSubjectResponse = await fetch(`${API_BASE}/api/subjects`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: 'Test Mathematics',
                    difficulty: 4,
                    exam_date: '2024-06-15'
                })
            });
            
            if (addSubjectResponse.ok) {
                console.log('✅ Subject added successfully');
            } else {
                console.log('❌ Failed to add subject');
            }

            // Test academic recommendation
            console.log('\n4. Testing academic recommendation...');
            const recommendationResponse = await fetch(`${API_BASE}/api/academic-recommendation`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (recommendationResponse.ok) {
                const recommendationData = await recommendationResponse.json();
                console.log('✅ Academic recommendation generated');
                console.log('Recommended path:', recommendationData.recommended_path);
            } else {
                console.log('❌ Failed to get recommendation');
            }

        } else {
            console.log('❌ Registration failed');
        }

        console.log('\n🎉 API testing complete!');

    } catch (error) {
        console.error('❌ API test error:', error.message);
    }
}

testAPI();
