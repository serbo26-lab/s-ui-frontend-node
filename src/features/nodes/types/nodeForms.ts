import type { NodeInbound, NodeBlueprint, NodeRecord } from './nodes'
import type { Inbound } from '@/types/inbounds'
import { createInbound } from '@/types/inbounds'
import type { tls } from '@/types/tls'

export function isPublishedAddress(value: string): boolean {
  if (!value.trim() || Array.from(value).some(character => !character.trim() || '/?#@'.includes(character))) return false
  try {
    if (value.includes(':')) {
      const bare=value.startsWith('[')&&value.endsWith(']')?value.slice(1,-1):value
      return new URL('http://['+bare+']/').hostname.startsWith('[')
    }
    const hostname=new URL('http://'+value).hostname
    const name=hostname.endsWith('.')?hostname.slice(0,-1):hostname
    return name.length<=253 && name.split('.').every(label=>label.length>0&&label.length<=63&&/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(label))
  } catch {return false}
}

export function nodeStatus(node: NodeRecord, now = Date.now() / 1000): 'offline' | 'error' | 'pending' | 'disabled' | 'applied' {
  if (node.last_error === 'control_unreachable' || node.last_error === 'deployment_unreachable' || (node.last_seen > 0 && now - node.last_seen > 20)) return 'offline'
  if (node.last_error) return 'error'
  if (node.pending || node.desired_revision === 0 || node.desired_revision !== node.applied_revision) return 'pending'
  return node.enable ? 'applied' : 'disabled'
}

export function openNodeInbound(value?: NodeInbound | NodeBlueprint) {
  const protocol = value?.type ?? 'vless'
  const form = createInbound(protocol, { ...JSON.parse(JSON.stringify(value?.options ?? {})), id: 'id' in (value ?? {}) ? (value as NodeInbound).id : 0, tag: value?.tag ?? '', enable: value?.enable ?? true, type: protocol })
  const source = value?.options?.tls as tls['server'] | undefined
  const tlsConfig: tls = { id: 1, name: value?.tag ?? 'Node TLS', server: JSON.parse(JSON.stringify({ enabled:false, server_name:'', ...source })), client: JSON.parse(JSON.stringify(value?.client_tls ?? {})) }
  return { form, tls: tlsConfig }
}

export function serializeNodeInbound(form: Inbound, tlsConfig: tls): Omit<NodeBlueprint, 'key'> {
  const options = JSON.parse(JSON.stringify(form)) as Record<string, unknown>
  for (const key of ['id', 'tag', 'type', 'enable', 'tls_id', 'addrs', 'out_json', 'users', 'tls']) delete options[key]
  if (!(options.transport as { type?: string } | undefined)?.type) delete options.transport
  options.tls = JSON.parse(JSON.stringify(tlsConfig.server))
  return { tag: form.tag.trim(), type: form.type as NodeBlueprint['type'], enable: form.enable !== false, options, client_tls: JSON.parse(JSON.stringify(tlsConfig.client)) }
}
