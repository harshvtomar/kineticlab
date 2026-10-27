import { create } from 'zustand';
import { EMPTY_CONTACT_LEDGER, updateContacts, clearContactHistory, type ContactLedger } from '../../domain/contact-ledger';
import { PHYSICS_POLICY } from '../../domain/physics-policy';
import type { CollisionMode } from '../../domain/collision-system';

export interface SimulationState {
  paused: boolean;
  showGrid: boolean;
  resetEpoch: number;
  contactLedger: ContactLedger;
  sensorLedger: ContactLedger;
  collisionMode: CollisionMode;
  sensorEnabled: boolean;
  collisionDebug: boolean;
  beginSensor: (sensorId: string, objectId: string) => void;
  endSensor: (sensorId: string, objectId: string) => void;
  setCollisionMode: (mode: CollisionMode) => void;
  setSensorEnabled: (enabled: boolean) => void;
  toggleCollisionDebug: () => void;
  beginContact: (first: string, second: string) => void;
  endContact: (first: string, second: string) => void;
  clearContactHistory: () => void;
  togglePaused: () => void;
  toggleGrid: () => void;
  restart: () => void;
  pause: () => void;
  remountPaused: () => void;
}

export const initialSimulationView = {
  paused: false,
  showGrid: true,
  resetEpoch: 0,
  contactLedger: EMPTY_CONTACT_LEDGER,
  sensorLedger: EMPTY_CONTACT_LEDGER,
  collisionMode: 'all' as const,
  sensorEnabled: false,
  collisionDebug: false,
} as const;

/** UI state only: Rapier owns the actual physics world. */
export const useSimulationStore = create<SimulationState>((set) => ({
  ...initialSimulationView,
  beginContact: (a, b) => set(state => ({contactLedger: updateContacts(state.contactLedger, 'begin', a, b, PHYSICS_POLICY.maxRecentContacts)})),
  endContact: (a, b) => set(state => ({contactLedger: updateContacts(state.contactLedger, 'end', a, b, PHYSICS_POLICY.maxRecentContacts)})),
  beginSensor: (a, b) => set(state => ({sensorLedger: updateContacts(state.sensorLedger, 'begin', a, b, PHYSICS_POLICY.maxRecentContacts)})),
  endSensor: (a, b) => set(state => ({sensorLedger: updateContacts(state.sensorLedger, 'end', a, b, PHYSICS_POLICY.maxRecentContacts)})),
  setCollisionMode: mode => set(state => mode === state.collisionMode ? state : ({
    collisionMode: mode, resetEpoch: state.resetEpoch + 1,
    contactLedger: EMPTY_CONTACT_LEDGER, sensorLedger: EMPTY_CONTACT_LEDGER,
  })),
  setSensorEnabled: enabled => set(state => enabled === state.sensorEnabled ? state : ({
    sensorEnabled: enabled, resetEpoch: state.resetEpoch + 1,
    contactLedger: EMPTY_CONTACT_LEDGER, sensorLedger: EMPTY_CONTACT_LEDGER,
  })),
  toggleCollisionDebug: () => set(state => ({collisionDebug: !state.collisionDebug})),
  clearContactHistory: () => set(state => ({contactLedger: clearContactHistory(state.contactLedger), sensorLedger: clearContactHistory(state.sensorLedger)})),
  togglePaused: () => set((state) => ({ paused: !state.paused })),
  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
  pause: () => set({paused:true}),
  remountPaused: () => set(state=>({resetEpoch:state.resetEpoch+1,paused:true,contactLedger:EMPTY_CONTACT_LEDGER,sensorLedger:EMPTY_CONTACT_LEDGER})),
  restart: () => set((state) => ({ resetEpoch: state.resetEpoch + 1, paused: false, contactLedger: EMPTY_CONTACT_LEDGER, sensorLedger: EMPTY_CONTACT_LEDGER })),
}));
