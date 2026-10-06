import { BehaviourDomainId } from '@domain/models/behaviour-domain';
import { PictogramName } from './paper-icons';

export const DOMAIN_PICTOGRAMS: Readonly<Record<BehaviourDomainId, PictogramName>> = {
  comportamento: 'shield',
  tarefas: 'broom',
  escola: 'book',
  conversas: 'balloon',
  familia: 'heart',
};
