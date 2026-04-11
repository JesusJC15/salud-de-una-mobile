import { EntityId, IsoDateString } from '@/src/types/common';

export type TriageSpecialty = 'GENERAL_MEDICINE' | 'ODONTOLOGY';
export type TriageSessionStatus = 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED' | 'EXPIRED' | 'FAILED';

export type TriagePriority = 'LOW' | 'MODERATE' | 'HIGH';
export type TriageAnalysisMode = 'AI_ASSISTED' | 'RULE_BASED';
export type TriageAnalysisNoticeCode =
  | 'IA_NOT_IMPLEMENTED_RULE_BASED_FALLBACK'
  | 'IA_TEMPORARILY_UNAVAILABLE_RULE_BASED_FALLBACK';

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
  analysisMode: TriageAnalysisMode | null;
  noticeCode: TriageAnalysisNoticeCode | null;
}

export interface TriageSession {
  id: EntityId;
  specialty: TriageSpecialty;
  status: TriageSessionStatus;
  questions: TriageQuestion[];
  currentQuestion: TriageQuestion | null;
  currentQuestionId: EntityId | null;
  currentStep: number;
  totalSteps: number;
  isComplete: boolean;
  nextQuestionId: EntityId | null;
  result: TriageResult | null;
  createdAt: IsoDateString | null;
  updatedAt: IsoDateString | null;
}

export interface TriageActiveSession {
  id: EntityId;
  specialty: TriageSpecialty;
  status: TriageSessionStatus;
  currentStep: number;
  totalSteps: number;
  currentQuestionId: EntityId | null;
  isComplete: boolean;
  createdAt: IsoDateString | null;
  updatedAt: IsoDateString | null;
}

export interface TriageActiveSessionList {
  items: TriageActiveSession[];
  total: number;
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
  answers: {
    questionId: EntityId;
    answerValue: string | string[] | number;
  }[];
}

export interface SubmitTriageAnswerResponse {
  isComplete: boolean;
  nextQuestionId: EntityId | null;
  currentQuestionId: EntityId | null;
  answeredCount: number;
  totalQuestions: number;
  remainingQuestions: number;
  progressPercent: number;
}

export interface CancelTriageSessionResponse {
  sessionId: EntityId;
  specialty: TriageSpecialty;
  status: TriageSessionStatus;
  canceledAt: IsoDateString | null;
  message: string | null;
}
