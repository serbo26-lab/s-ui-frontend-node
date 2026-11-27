import { i18n } from '@/locales'
import { registerHttpHooks } from '@/plugins/httputil'
import { invalidateIPRequests, useIPControl } from './state'

export function registerIPControlHttpHooks() {
  registerHttpHooks({
    onLogout() { invalidateIPRequests(); useIPControl().$reset() },
    errorMessage(message) {
      const code = /\bip_control_(conflict|invalid|unavailable)\b/.exec(message)?.[1]
      return code ? i18n.global.t('ipControl.errors.' + code) : undefined
    },
  })
}
