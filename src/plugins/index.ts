// Plugins
import vuetify from './vuetify'
import { registerIPControlHttpHooks } from '@/features/antiabuse/integration'
import { registerNodeHttpHooks } from '@/features/nodes/integration'

// Types
import type { App } from 'vue'

export function registerPlugins (app: App) {
  registerNodeHttpHooks()
  registerIPControlHttpHooks()
  app
    .use(vuetify)
}
