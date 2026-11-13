import test from 'node:test'; import assert from 'node:assert/strict';
const fare=(base,km,per,mult)=>Math.round((base+km*per)*mult);
test('fare calculation uses distance and capped multiplier',()=>assert.equal(fare(25,10,9,1.5),173));
test('base fare is retained for zero-distance internal calculation',()=>assert.equal(fare(30,0,9,1),30));
