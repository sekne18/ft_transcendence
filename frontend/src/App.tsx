import { useState } from 'react'

export async function sendPing(): Promise<{ ping: string }> {
	const response = await fetch('http://localhost:5173/api');
	if (!response.ok) {
	  throw new Error(`Error ${response.status}`);
	}
	return response.json();
  }

function App() {
  const [response, setResponse] = useState('nothing yet');

  return (
    <>
      <h1>Test App</h1>
      <div className="card">
        <button onClick={() => {
			sendPing()
			.then((data) => {
			  setResponse(data.ping);
			})
			.catch((error) => {
			  console.error('Error:', error);
			});
		}
		}>
          response is {response}
        </button>
      </div>
    </>
  )
}

export default App