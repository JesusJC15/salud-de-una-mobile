import { EntityId, IsoDateString } from '@/src/types/common';

export type TriageSpecialty = 'GENERAL_MEDICINE' | 'DENTISTRY';

export type TriagePriority = 'LOW' | 'MODERATE' | 'HIGH';

export type TriageQuestionType = 'SINGLE_CHOICE' | 'MULTI_CHOICE' | 'NUMERIC_SCALE';

export interface TriageQuestionOption {
  id: EntityId;
  label: string;
  description: string | null;
}

export interface TriageQuestion {
  id: EntityId;
  type: TriageQuestionType;
  title: string;
  description: string | null;
  options: TriageQuestionOption[];
  minValue: number;
  maxValue: number;
  step: number;
}

export interface TriageRedFlag {
  id: EntityId | null;
  title: string;
  description: string | null;
}

export interface TriageResult {
  sessionId: EntityId;
  priority: TriagePriority;
  redFlags: TriageRedFlag[];
  analyzedAt: IsoDateString | null;
}

export interface TriageSession {
  id: EntityId;
  specialty: TriageSpecialty;
  questions: TriageQuestion[];
  currentQuestion: TriageQuestion | null;
  currentQuestionId: EntityId | null;
  currentStep: number;
  totalSteps: number;
  isComplete: boolean;
  nextQuestionId: EntityId | null;
  result: TriageResult | null;
}

export interface CreateTriageSessionInput {
  specialty: TriageSpecialty;
}

export type TriageAnswerSubmissionInput =
  | {
      questionId: EntityId;
      type: 'SINGLE_CHOICE';
      selectedOptionId: EntityId;
    }
  | {
      questionId: EntityId;
      type: 'MULTI_CHOICE';
      selectedOptionIds: EntityId[];
    }
  | {
      questionId: EntityId;
      type: 'NUMERIC_SCALE';
      value: number;
    };

export interface SubmitTriageAnswerPayload {
  questionId: EntityId;
  selectedOptionId?: EntityId;
  selectedOptionIds?: EntityId[];
  numericValue?: number;
}

export interface SubmitTriageAnswerResponse {
  isComplete: boolean;
  nextQuestionId: EntityId | null;
  currentQuestionId: EntityId | null;
}
