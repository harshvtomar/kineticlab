import { beforeEach, describe, expect, it } from 'vitest';
import { EMPTY_CONTACT_LEDGER } from '../../domain/contact-ledger';
import { initialSimulationView, useSimulationStore } from './store';

beforeEach(() => useSimulationStore.setState(initialSimulationView));

describe('Stage 9 physics lifecycle and dual event channels', () => {
  it('starts in compatible default mode without a runtime sensor', () => {
    expect(useSimulationStore.getState().collisionMode).toBe('all');
    expect(useSimulationStore.getState().sensorEnabled).toBe(false);
    expect(useSimulationStore.getState().collisionDebug).toBe(false);
  });
  it('changing collision mode remounts world and clears both ledgers', () => {
    const sim = useSimulationStore.getState();
    sim.beginContact('ball-01','ground-01');
    sim.beginSensor('trigger-zone-01','ball-01');
    useSimulationStore.getState().setCollisionMode('separate-balls');
    const s=useSimulationStore.getState();
    expect(s.resetEpoch).toBe(1);
    expect(s.contactLedger).toBe(EMPTY_CONTACT_LEDGER);
    expect(s.sensorLedger).toBe(EMPTY_CONTACT_LEDGER);
    expect(s.collisionMode).toBe('separate-balls');
  });
  it('setting same mode is a no-op', () => {
    useSimulationStore.getState().setCollisionMode('all');
    expect(useSimulationStore.getState().resetEpoch).toBe(0);
  });
  it('enabling sensor remounts while preserving pause state', () => {
    useSimulationStore.getState().pause();
    useSimulationStore.getState().setSensorEnabled(true);
    expect(useSimulationStore.getState().resetEpoch).toBe(1);
    expect(useSimulationStore.getState().paused).toBe(true);
  });
  it('sensor history is distinct from physical contacts', () => {
    useSimulationStore.getState().beginSensor('trigger-zone-01','ball-01');
    expect(useSimulationStore.getState().contactLedger.starts).toBe(0);
    expect(useSimulationStore.getState().sensorLedger.starts).toBe(1);
    useSimulationStore.getState().endSensor('trigger-zone-01','ball-01');
    expect(useSimulationStore.getState().sensorLedger.ends).toBe(1);
  });
  it('clearing logs retains active intersection pairs and works for both channels', () => {
    const sim = useSimulationStore.getState();
    sim.beginContact('ball-01','ground-01');sim.beginSensor('trigger-zone-01','ball-01');
    sim.clearContactHistory();
    expect(useSimulationStore.getState().contactLedger.records).toHaveLength(0);
    expect(useSimulationStore.getState().sensorLedger.records).toHaveLength(0);
    expect(useSimulationStore.getState().sensorLedger.activeKeys).toHaveLength(1);
  });
  it('restart clears both channels without switching chosen mode', () => {
    useSimulationStore.getState().setSensorEnabled(true);
    useSimulationStore.getState().setCollisionMode('separate-balls');
    useSimulationStore.getState().beginSensor('trigger-zone-01','ball-01');
    useSimulationStore.getState().restart();
    const s=useSimulationStore.getState();
    expect(s.sensorLedger).toBe(EMPTY_CONTACT_LEDGER);
    expect(s.collisionMode).toBe('separate-balls');
    expect(s.sensorEnabled).toBe(true);
    expect(s.paused).toBe(false);
  });
  it('debug toggle does not change physics epoch or reset the world', () => {
    useSimulationStore.getState().toggleCollisionDebug();
    expect(useSimulationStore.getState().collisionDebug).toBe(true);
    expect(useSimulationStore.getState().resetEpoch).toBe(0);
  });
});
