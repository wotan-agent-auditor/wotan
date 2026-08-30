import dotenv from 'dotenv';
dotenv.config();
import { LlmAgent, InMemoryRunner, Gemini } from '@google/adk';

async function testGemini() {
  console.log('Testing ADK Gemini initialization with GEMINI_API_KEY...');
  const apiKey = process.env.GEMINI_API_KEY;
  console.log('API key present:', Boolean(apiKey));

  const geminiModel = new Gemini({
    model: 'gemini-3.7-flash',
    apiKey: apiKey,
  });

  const probeAgent = new LlmAgent({
    name: 'ProbeAgent',
    model: geminiModel,
    instruction: 'You are ProbeAgent. Formulate an adaptive probe.',
  });

  const runner = new InMemoryRunner({
    agent: probeAgent,
    appName: 'TestProbeApp',
  });

  const session = await runner.sessionService.createSession({
    appName: runner.appName,
    userId: 'user-1',
    sessionId: 'session-1',
  });

  console.log('Running runner.runAsync...');
  const stream = runner.runAsync({
    userId: 'user-1',
    sessionId: session.id,
    newMessage: {
      role: 'user',
      parts: [{ text: 'Formulate probe 1 for return policy testing.' }],
    },
  });

  for await (const ev of stream) {
    console.log('Got ADK event:', ev.author, ev.content?.parts);
  }
}

testGemini().catch(console.error);
