import React from 'react';
import { createRoot } from 'react-dom/client';
import { AuraChat, AuraChatProps } from '../components/AuraChat';
import { AuraVoyager } from '../core/AuraVoyager';
import { AuraVoyagerConfig } from '../core/types';

/**
 * Options for mounting the Aura Chat component to a DOM element
 */
export interface MountAuraChatOptions extends Omit<AuraChatProps, 'agent'> {
  config: AuraVoyagerConfig;
}

/**
 * Helper function to mount AuraChat to a DOM element in non-React applications.
 * 
 * @param containerId The ID of the HTML element to mount the chat into
 * @param options Configuration for the agent and chat component
 */
export function mountAuraChat(containerId: string, options: MountAuraChatOptions) {
  if (typeof window === 'undefined') {
    console.warn('AuraVoyager: mountAuraChat can only be used in a browser environment.');
    return null;
  }

  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`AuraVoyager: Container with ID "${containerId}" not found.`);
    return null;
  }

  const { config, ...chatProps } = options;
  const agent = new AuraVoyager(config);
  const root = createRoot(container);

  root.render(
    <React.StrictMode>
      <AuraChat agent={agent} {...chatProps} />
    </React.StrictMode>
  );

  return {
    unmount: () => root.unmount(),
    agent
  };
}
