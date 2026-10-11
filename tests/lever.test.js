import test from 'node:test';
import assert from 'node:assert/strict';

import { computeLeverState } from '../simulator.js';

test('computeLeverState reports balanced torque and mechanical advantage', () => {
  const state = computeLeverState({
    fulcrumPercent: 35,
    loadMass: 4.39,
    effortForce: 80,
    effortDistance: 0.4,
  });

  assert.equal(state.effortArm, 35);
  assert.equal(state.loadArm, 65);
  assert.ok(state.mechanicalAdvantage > 0);
  assert.ok(Math.abs(state.torqueDifference) <= 10);
  assert.equal(state.balanceStatus, 'balanced');
  assert.ok(state.loadTravel > 0);
});

test('computeLeverState identifies when effort force is insufficient', () => {
  const state = computeLeverState({
    fulcrumPercent: 70,
    loadMass: 30,
    effortForce: 20,
    effortDistance: 0.2,
  });

  assert.ok(state.requiredEffort > state.effortForce);
  assert.equal(state.balanceStatus, 'insufficient');
});
