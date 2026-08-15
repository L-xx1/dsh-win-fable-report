import assert from 'node:assert/strict'
import test from 'node:test'

import { apply, name, PLAYBOOK_TEXT } from '../win-tool-playbook.mjs'

function register(config = {}) {
  const listeners = {}
  const hookOptions = {}
  const warns = []
  const ctx = {
    on(event, callback, options) {
      listeners[event] = callback
      hookOptions[event] = options
    },
    logger: {
      warn(message) {
        warns.push(message)
      },
    },
  }
  apply(ctx, config)
  return { listeners, hookOptions, warns }
}

const session = (events, id = 's', header = {}) => ({ id, events, header })
const agent = (events, id = 's', header = {}) => ({ session: session(events, id, header) })
const decision = () => ({ kind: 'enter', messages: [{ id: 'u', role: 'user', content: [{ type: 'text', text: 'hi' }], source: { kind: 'user' } }] })

function prestep(listener, events, id = 's', header = {}) {
  return listener({ agent: agent(events, id, header) }, async () => decision())
}

test('exports a diagnostic plugin name', () => {
  assert.equal(name, 'win-tool-playbook')
})

test('pre-promotion requests get NO playbook', async () => {
  const { listeners } = register()
  const result = await prestep(listeners['agent/pre-step'], [])
  assert.equal(result.messages.length, 1)
  assert.equal(result.messages.some((m) => m.source?.kind === 'win-tool-playbook'), false)
})

test('promoteOn either promotes after a tool call and injects the FULL playbook text', async () => {
  const { listeners } = register()
  const result = await prestep(listeners['agent/pre-step'], [{ type: 'tool/call', seq: 1, data: { name: 'bash' } }])
  assert.equal(result.messages.length, 2)
  const injected = result.messages[1]
  assert.equal(injected.role, 'user')
  assert.equal(injected.source.kind, 'win-tool-playbook')
  assert.equal(injected.source.form, 'playbook')
  assert.equal(injected.content[0].text, PLAYBOOK_TEXT)
})

test('promoteOn either promotes after a first assistant message', async () => {
  const { listeners } = register()
  const result = await prestep(listeners['agent/pre-step'], [{ type: 'assistant/message', seq: 1, data: {} }])
  assert.equal(result.messages.length, 2)
  assert.equal(result.messages[1].content[0].text, PLAYBOOK_TEXT)
})

test('the playbook is injected once per session per epoch', async () => {
  const { listeners } = register()
  const first = await prestep(listeners['agent/pre-step'], [{ type: 'tool/call', seq: 1, data: {} }], 's')
  assert.equal(first.messages.length, 2)
  const second = await prestep(listeners['agent/pre-step'], [{ type: 'tool/call', seq: 1, data: {} }], 's')
  assert.equal(second.messages.length, 1)
})

test('compaction starts a new epoch and allows one fresh injection after re-promotion', async () => {
  const { listeners } = register()
  const agentObject = agent([], 'epoch')
  const event = listeners['session/event']

  // Initial scan memoizes the unpromoted state.
  const before = await listeners['agent/pre-step']({ agent: agentObject }, async () => decision())
  assert.equal(before.messages.length, 1)

  // First promotion: inject for boundary -1.
  event(agentObject.session, { type: 'tool/call', seq: 1, data: {} })
  const first = await listeners['agent/pre-step']({ agent: agentObject }, async () => decision())
  assert.equal(first.messages.length, 2)

  // Compaction resets promotion; a new signal after the boundary re-injects.
  event(agentObject.session, { type: 'compaction/end', seq: 5, data: {} })
  event(agentObject.session, { type: 'assistant/message', seq: 6, data: {} })
  const second = await listeners['agent/pre-step']({ agent: agentObject }, async () => decision())
  assert.equal(second.messages.length, 2)
  assert.match(second.messages[1].id, /-5$/)
})

test('subagents are skipped by default', async () => {
  const { listeners } = register()
  const result = await prestep(
    listeners['agent/pre-step'],
    [{ type: 'tool/call', seq: 1, data: {} }],
    'sub',
    { delegationDepth: 1 },
  )
  assert.equal(result.messages.length, 1)
})

test('skipSubagents: false injects into subagents too', async () => {
  const { listeners } = register({ skipSubagents: false })
  const result = await prestep(
    listeners['agent/pre-step'],
    [{ type: 'tool/call', seq: 1, data: {} }],
    'sub',
    { delegationDepth: 1 },
  )
  assert.equal(result.messages.length, 2)
})

test('promoteOn tool-call requires a tool call', async () => {
  const { listeners } = register({ promoteOn: 'tool-call' })
  const reply = await prestep(listeners['agent/pre-step'], [{ type: 'assistant/message', seq: 1, data: {} }], 'a')
  assert.equal(reply.messages.length, 1)
  const call = await prestep(listeners['agent/pre-step'], [{ type: 'tool/call', seq: 1, data: {} }], 'b')
  assert.equal(call.messages.length, 2)
})

test('promoteOn assistant-message requires a first reply', async () => {
  const { listeners } = register({ promoteOn: 'assistant-message' })
  const call = await prestep(listeners['agent/pre-step'], [{ type: 'tool/call', seq: 1, data: {} }], 'a')
  assert.equal(call.messages.length, 1)
  const reply = await prestep(listeners['agent/pre-step'], [{ type: 'assistant/message', seq: 1, data: {} }], 'b')
  assert.equal(reply.messages.length, 2)
})

test('reject decisions pass through untouched', async () => {
  const { listeners } = register()
  const reject = { kind: 'reject', messages: [{ id: 'u' }] }
  const result = await listeners['agent/pre-step']({ agent: agent([]) }, async () => reject)
  assert.equal(result, reject)
})

test('maxChars below the full playbook length fails at apply time', () => {
  assert.throws(() => register({ maxChars: PLAYBOOK_TEXT.length - 1 }), /never truncated/)
})

test('an injection failure degrades to keeping the decision (never blocks the request)', async () => {
  const listeners = {}
  const ctx = {
    on(event, callback) { listeners[event] = callback },
    logger: { warn() {} },
  }
  apply(ctx, {})
  const broken = {
    session: {
      get id() { throw new Error('broken session id') },
      events: [],
      header: {},
    },
  }
  const result = await listeners['agent/pre-step']({ agent: broken }, async () => decision())
  assert.equal(result.messages.length, 1)
})

test('the playbook listener registers with prepend', () => {
  const { hookOptions } = register()
  assert.deepEqual(hookOptions['agent/pre-step'], { prepend: true })
})
