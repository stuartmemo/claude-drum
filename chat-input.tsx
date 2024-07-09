'use client';
import Spinner from 'components/common/spinner';
import { useState } from 'react';

const ChatInput = ({ onChange }) => {
  const [message, setMessage] = useState('');
  const [showSpinner, setShowSpinner] = useState(false);

  const handleSend = async () => {
    setShowSpinner(true);
    const response = await fetch('/api/beat', {
      method: 'POST',
      body: JSON.stringify({
        message,
      }),
      headers: {
        'content-type': 'application/json',
      },
    });

    const data = await response.json();
    onChange(data);
    setMessage('');
    setShowSpinner(false);
  };

  return (
    <div className="my-4">
      <input
        className="mr-2 py-2 px-4 w-96"
        placeholder="Classic hip-hop beat"
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyUp={(e) => {
          if (e.key === 'Enter') {
            handleSend();
          }
        }}
      />
      <button
        className="align-top border border-ghostbuster bg-button-grey h-10 hover:bg-black hover:text-white"
        onClick={handleSend}
      >
        {showSpinner ? (
          <div className="px-4 w-24">
            <Spinner showSpinner={showSpinner} dark={true} />
          </div>
        ) : (
          <div className="px-4 py-2 w-24">Generate</div>
        )}
      </button>
    </div>
  );
};

export default ChatInput;
