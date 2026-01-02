import { useSyncExternalStore } from 'react';

// EIP-6963 Type Definitions
interface EIP6963ProviderInfo {
    uuid: string;
    name: string;
    icon: string;
    rdns: string;
}

interface EIP6963ProviderDetail {
    info: EIP6963ProviderInfo;
    provider: any; // EIP-1193 Provider
}

interface EIP6963AnnounceProviderEvent extends CustomEvent {
    detail: EIP6963ProviderDetail;
}

declare global {
    interface WindowEventMap {
        "eip6963:announceProvider": EIP6963AnnounceProviderEvent;
    }
}

let providers: EIP6963ProviderDetail[] = [];
let listeners: (() => void)[] = [];

// Emits an event to all registered listeners
function emitChange() {
    for (const listener of listeners) {
        listener();
    }
}

// Event handler for 'eip6963:announceProvider'
function onAnnounceProvider(event: EIP6963AnnounceProviderEvent) {
    const detail = event.detail;
    if (providers.some(p => p.info.uuid === detail.info.uuid)) return;
    providers = [...providers, detail];
    emitChange();
}

// Subscribes to the store
function subscribe(listener: () => void) {
    listeners = [...listeners, listener];
    return () => {
        listeners = listeners.filter(l => l !== listener);
    };
}

// Returns the current snapshot of providers
function getSnapshot() {
    return providers;
}

// Should initiate discovery (request providers to announce themselves)
// This should only be done once, or when needed.
if (typeof window !== 'undefined') {
    window.addEventListener("eip6963:announceProvider", onAnnounceProvider);
    window.dispatchEvent(new Event("eip6963:requestProvider"));
}

export function useEIP6963() {
    const providers = useSyncExternalStore(subscribe, getSnapshot, () => []);
    return providers;
}
