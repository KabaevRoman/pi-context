import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';
import { acquire } from '@kabaevroman/pi-code-core';
import { registerContext } from '../extensions/context.ts';
export default function(pi: ExtensionAPI): void { const state = acquire(pi,'context'); if (state) { const r = state.runtime; registerContext(r,false); } }
