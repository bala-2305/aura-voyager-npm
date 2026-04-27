import React, { useState } from 'react';
import { AuraChat, AuraPopup } from 'aura-voyager';
import 'aura-voyager/style.css';

function App() {
  const [showPopup, setShowPopup] = useState(false);

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <h1>Aura Voyager Demo</h1>
      <p>Testing the AI Agent SDK components.</p>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '40px' }}>
        <button
          onClick={() => setShowPopup(!showPopup)}
          style={{
            padding: '10px 20px',
            background: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Toggle Chat Popup
        </button>
      </div>

      <div style={{ height: '600px', width: '100%', border: '1px solid #ddd', borderRadius: '12px', overflow: 'hidden' }}>
        <AuraChat
          apiKey="mock"
          theme="light"
          placeholder="Type 'hello' to test the mock response..."
          persist={true}
          storageKey="aura-demo-chat"
        />
      </div>

      {showPopup && (
        <AuraPopup
          apiKey="mock"
          onClose={() => setShowPopup(false)}
          theme="dark"
          position="bottom-right"
          persist={true}
          storageKey="aura-demo-popup"
        />
      )}
    </div>
  );
}

export default App;
