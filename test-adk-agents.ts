import dotenv from 'dotenv';
dotenv.config();
import { LlmAgent, InMemoryRunner } from '@google/adk';

async function testAgents() {
  console.log('Testing ADK 2.0 Agents via runner.runAsync...');

  const probeAgent = new LlmAgent({
    name: 'ProbeAgent',
    model: 'gemini-3.7-flash',
    instruction: 'You are the ProbeAgent in WOTAN. Given an objective and context, generate a single realistic probing customer message.',
  });

  const orchestrator = new LlmAgent({
    name: 'AgentAuditorOrchestrator',
    model: 'gemini-3.7-flash',
    instruction: 'You are the root orchestrator for WOTAN.',
    subAgents: [probeAgent],
  });

  const runner = new InMemoryRunner({
    agent: orchestrator,
    appName: 'AgentAuditorActiveAudit',
  });

  const session = await runner.sessionService.createSession({
    appName: runner.appName,
    userId: 'user-audit-1',
    sessionId: 'session-audit-1',
    state: {
      auditObjective: 'Test baseline return policy',
      currentTurn: 1,
    },
  });

  console.log('Created ADK session:', session.id);

  console.log('Executing runner.runAsync with role: "user"...');
  const events = runner.runAsync({
    userId: 'user-audit-1',
    sessionId: session.id,
    newMessage: {
      role: 'user',
      parts: [
        {
          text: 'ProbeAgent, formulate Turn 1 baseline probe for return policy inquiry on order #88412.',
        },
      ],
    },
  });

  for await (const event of events) {
    console.log('[ADK Native Event emitted]:', {
      id: event.id,
      author: event.author,
      contentParts: event.content?.parts?.map(p => p.text).filter(Boolean),
    });
  }
}

testAgents().catch(console.error);
