import test from "node:test";
import assert from "node:assert/strict";
import { addContactPropertyHistory } from "../src/hubspot.js";

test("loads lifecycle-stage history in HubSpot batch reads", async () => {
  const originalFetch = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async (url, options) => {
    requests.push({ url, body:JSON.parse(options.body) });
    const inputs = JSON.parse(options.body).inputs;
    return new Response(JSON.stringify({
      results:inputs.map((input) => ({
        id:input.id,
        propertiesWithHistory:{
          lifecyclestage:[
            { value:"lead", timestamp:"2026-08-19T18:11:00.000Z" },
            { value:"9001", timestamp:"2026-08-19T18:12:00.000Z" },
          ],
        },
      })),
    }), { status:200, headers:{ "content-type":"application/json" } });
  };

  try {
    const contacts = Array.from({ length:101 }, (_, index) => ({
      id:String(index + 1),
      properties:{},
    }));
    const result = await addContactPropertyHistory("test-token", contacts, ["lifecyclestage"]);
    assert.deepEqual(result, { requested:101, loaded:101 });
    assert.equal(requests.length, 2);
    assert.match(requests[0].url, /\/crm\/v3\/objects\/contacts\/batch\/read$/);
    assert.deepEqual(requests[0].body.propertiesWithHistory, ["lifecyclestage"]);
    assert.equal(requests[0].body.inputs.length, 100);
    assert.equal(contacts[0].propertiesWithHistory.lifecyclestage[1].value, "9001");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
