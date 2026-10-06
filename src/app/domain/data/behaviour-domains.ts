import { BehaviourDomain, BehaviourDomainId } from '@domain/models/behaviour-domain';

export const BEHAVIOUR_DOMAIN_CATALOGUE: readonly BehaviourDomain[] = [
  { id: 'comportamento', labelKey: 'domainComportamento' },
  { id: 'tarefas', labelKey: 'domainTarefas' },
  { id: 'escola', labelKey: 'domainEscola' },
  { id: 'conversas', labelKey: 'domainConversas' },
  { id: 'familia', labelKey: 'domainFamilia' },
];

export function behaviourDomainOf(id: BehaviourDomainId): BehaviourDomain {
  const domain = BEHAVIOUR_DOMAIN_CATALOGUE.find((candidate) => candidate.id === id);
  if (!domain) throw new Error(`Unknown behaviour domain "${id}".`);
  return domain;
}
