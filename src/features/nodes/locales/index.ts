import { nodesEnglish, nodesRussian } from './nodes'
import { nodeUIEnglish, nodeUIRussian } from './nodeUI'
import { onboardingEnglish, onboardingRussian } from './nodeOnboarding'

export const nodeMessages = {
  en: {
    nodes: nodesEnglish,
    nodeOnboarding: onboardingEnglish,
    nodeUI: { ...nodeUIEnglish, errors: { ...nodeUIEnglish.errors, ...onboardingEnglish.errors } },
  },
  ru: {
    nodes: nodesRussian,
    nodeOnboarding: onboardingRussian,
    nodeUI: { ...nodeUIRussian, errors: { ...nodeUIRussian.errors, ...onboardingRussian.errors } },
  },
}
