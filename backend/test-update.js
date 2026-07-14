async function test() {
  try {
    const login = await fetch('http://localhost:3001/auth/login', { 
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@bizflow.com', password: 'password123' }) 
    }).then(r => r.json());
    
    let token = login?.access_token;
    if (!token) {
      console.log('Registering...');
      const reg = await fetch('http://localhost:3001/auth/register', { 
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@bizflow.com', password: 'password123', name: 'Test' }) 
      }).then(r => r.json());
      token = reg.access_token;
    }
    
    console.log('Creating event...');
    const createRes = await fetch('http://localhost:3001/events', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        title: 'Test Event',
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
      })
    });
    const create = await createRes.json();
    console.log('Event created:', create);
    
    console.log('Updating event...');
    const updateRes = await fetch(`http://localhost:3001/events/${create.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        title: 'Updated Event',
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
      })
    });
    const update = await updateRes.json();
    console.log('Event updated:', update);
  } catch (e) {
    console.error(e);
  }
}
test();
