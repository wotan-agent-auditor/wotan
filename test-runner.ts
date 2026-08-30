import dotenv from 'dotenv';
dotenv.config();
import { LlmAgent, InMemoryRunner } from '@google/adk';

async function testRunner() {
  console.log('Testing ADK LlmAgent with InMemoryRunner...');
  const testAgent = new LlmAgent({
    name: 'TestProbeAgent',
    model: 'gemini-3.7-flash',
    instruction: 'You are a test probe agent. Output a single probe message.',
  });

  const runner = new InMemoryRunner({
    agent: testAgent,
    appName: 'TestApp',
  });

  const session = await runner.sessionService.createSession({
    appName: runner.appName,
    userId: 'user-1',
    sessionId: 'session-1',
  });

  console.log('Session created:', session.id);

  const eventStream = runner.runAsync({
    userId: 'user-1',
    sessionId: session.id,
    newMessage: {
      role: 'user',
      parts: [{ text: 'Formulate a probe test.' }],
    },
  });

  for await (const event of eventStream) {
    console.log('Event received from runner.runAsync:', {
      author: event.author,
      content: event.content,
      id: event.id,
    });
  }
}

testRunner().catch(console.error);
