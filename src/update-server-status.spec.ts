import {beforeEach, describe, expect, it} from 'vitest'
import {getServerStatusMessage, ServerStatus} from "./update-server-status";

describe('getServerStatusMessage', () => {
  let serverStatusStub = getServerStatusStub();
  beforeEach(() => {
    serverStatusStub = getServerStatusStub();
  })

  it('offline + online', () => {
    const result = getServerStatusMessage('test.goodmc.org', serverStatusStub)
    expect(result).toMatchInlineSnapshot(`
      "test.goodmc.org
      Online: 2/30
      🟢player1
      🟢player2
      ⚪player5 ~ less than a minute ago
      ⚪player3 ~ 1 minute ago
      ⚪player4 ~ 30 minutes ago"
    `)
  })

  it('no online no offline', () => {
    serverStatusStub.online = [];
    serverStatusStub.offline = [];
    const result = getServerStatusMessage('test.goodmc.org', serverStatusStub)
    expect(result).toMatchInlineSnapshot(`
      "test.goodmc.org
      Online: 0/30
      "
    `)
  })

  it('offline only', () => {
    serverStatusStub.online = [];
    const result = getServerStatusMessage('test.goodmc.org', serverStatusStub)
    expect(result).toMatchInlineSnapshot(`
      "test.goodmc.org
      Online: 0/30
      ⚪player5 ~ less than a minute ago
      ⚪player3 ~ 1 minute ago
      ⚪player4 ~ 30 minutes ago"
    `)
  })

  it('online only', () => {
    serverStatusStub.offline = [];
    const result = getServerStatusMessage('test.goodmc.org', serverStatusStub)
    expect(result).toMatchInlineSnapshot(`
      "test.goodmc.org
      Online: 2/30
      🟢player1
      🟢player2"
    `)
  })

})


function getServerStatusStub(): ServerStatus {
  const _30minsAgo = new Date();
  _30minsAgo.setMinutes(new Date().getMinutes() - 30)
  const _1minAgo = new Date();
  _1minAgo.setMinutes(new Date().getMinutes() - 1);
  const _2hoursAgo = new Date()
      _2hoursAgo.setHours(new Date().getHours() - 2);

  return {
    server: { max: 30 },
    online: [
      {
        lastOnline: new Date(),
        name: 'player1',
        id: 'aaa'
      },
      {
        lastOnline: new Date(),
        name: 'player2',
        id: 'bbb'
      },
    ],
    offline: [
      {
        lastOnline: _1minAgo,
        name: 'player3',
        id: 'basd'
      },
      {
        lastOnline: _30minsAgo,
       name: 'player4',
        id: 'ccc'
      },
      {
        lastOnline: new Date(),
       name: 'player5',
        id: 'sasd'
      },
      {
        lastOnline: _2hoursAgo,
       name: 'player6',
        id: 'sasdas'
      },
    ]
  }
}