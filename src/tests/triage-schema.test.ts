import { describe, expect, it } from '@jest/globals';

import {
  normalizeCreateTriageSessionInput,
  normalizeSubmitTriageAnswerPayload,
  submitTriageAnswerResponseSchema,
} from '@/src/schemas/triage/triage-answer.schema';
import { triageQuestionSchema } from '@/src/schemas/triage/triage-question.schema';
import { triageResultSchema } from '@/src/schemas/triage/triage-result.schema';
import {
  cancelTriageSessionResponseSchema,
  triageActiveSessionListSchema,
  triageActiveSessionSchema,
  triageSessionSchema,
} from '@/src/schemas/triage/triage-session.schema';

describe('triage schemas', () => {
  it('triageSessionSchema normalizes step and active question', () => {
    const parsed = triageSessionSchema.parse({
      isComplete: false,
      nextQuestionId: 'q2',
      questionIndex: 0,
      questions: [
        {
          id: 'q1',
          options: [{ id: 'o1', label: 'Si' }],
          title: 'Tiene fiebre?',
          type: 'SINGLE_CHOICE',
        },
        {
          id: 'q2',
          options: [{ id: 'o2', label: 'No' }],
          title: 'Tiene dolor de garganta?',
          type: 'SINGLE_CHOICE',
        },
      ],
      sessionId: 'session-1',
      specialty: 'GENERAL_MEDICINE',
      totalQuestions: 2,
    });

    expect(parsed.id).toBe('session-1');
    expect(parsed.currentStep).toBe(1);
    expect(parsed.totalSteps).toBe(2);
    expect(parsed.currentQuestion?.id).toBe('q1');
    expect(parsed.nextQuestionId).toBe('q2');
  });

  it('triageSessionSchema resolves complete state without active question', () => {
    const parsed = triageSessionSchema.parse({
      currentQuestionId: null,
      isComplete: true,
      questions: [],
      sessionId: 'session-2',
      specialty: 'ODONTOLOGY',
      totalSteps: 0,
    });

    expect(parsed.isComplete).toBe(true);
    expect(parsed.currentQuestion).toBeNull();
    expect(parsed.totalSteps).toBe(0);
  });

  it('triageSessionSchema supports questionId and questionText aliases', () => {
    const parsed = triageSessionSchema.parse({
      answeredCount: 0,
      questions: [
        {
          questionId: 'OD-Q1',
          questionText: 'Tienes dolor al masticar?',
          type: 'SINGLE_CHOICE',
        },
      ],
      sessionId: 'session-3',
      specialty: 'ODONTOLOGY',
      status: 'IN_PROGRESS',
      totalQuestions: 1,
    });

    expect(parsed.questions[0]?.id).toBe('OD-Q1');
    expect(parsed.questions[0]?.title).toBe('Tienes dolor al masticar?');
    expect(parsed.currentQuestion?.id).toBe('OD-Q1');
  });

  it('triageSessionSchema resolves current question from nextQuestionId in detail payload', () => {
    const parsed = triageSessionSchema.parse({
      currentQuestionId: null,
      currentStep: 2,
      isComplete: false,
      nextQuestionId: 'MG-Q2',
      questions: [
        {
          options: [{ id: 'MG-Q1-A', label: 'Dolor de cabeza' }],
          questionId: 'MG-Q1',
          questionText: 'Que sintoma principal presentas hoy?',
          type: 'SINGLE_CHOICE',
        },
        {
          options: [{ id: 'MG-Q2-A', label: '1-2 dias' }],
          questionId: 'MG-Q2',
          questionText: 'Desde cuando presentas el sintoma?',
          type: 'SINGLE_CHOICE',
        },
      ],
      sessionId: 'session-4',
      specialty: 'GENERAL_MEDICINE',
      status: 'IN_PROGRESS',
      totalQuestions: 5,
      totalSteps: 5,
    });

    expect(parsed.currentQuestion?.id).toBe('MG-Q2');
    expect(parsed.currentQuestionId).toBe('MG-Q2');
    expect(parsed.currentStep).toBe(2);
  });

  it('triageSessionSchema resolves current question from currentQuestion field', () => {
    const parsed = triageSessionSchema.parse({
      currentQuestion: {
        id: 'q-current',
        options: [{ id: 'o-current', label: 'Ahora' }],
        title: 'Pregunta actual',
        type: 'SINGLE_CHOICE',
      },
      currentQuestionId: 'q-legacy',
      isComplete: false,
      questions: [
        {
          id: 'q-legacy',
          options: [{ id: 'o-legacy', label: 'Antes' }],
          title: 'Pregunta legacy',
          type: 'SINGLE_CHOICE',
        },
      ],
      sessionId: 'session-current-field',
      specialty: 'GENERAL_MEDICINE',
      status: 'IN_PROGRESS',
      totalSteps: 1,
    });

    expect(parsed.currentQuestion?.id).toBe('q-current');
    expect(parsed.currentQuestionId).toBe('q-current');
  });

  it('triageSessionSchema falls back to first question when step and next id do not resolve', () => {
    const parsed = triageSessionSchema.parse({
      currentQuestionId: null,
      currentStep: 9,
      isComplete: false,
      nextQuestionId: 'missing-id',
      questions: [
        {
          id: 'q-first',
          options: [{ id: 'o-first', label: 'Primera' }],
          title: 'Pregunta uno',
          type: 'SINGLE_CHOICE',
        },
      ],
      sessionId: 'session-fallback-first',
      specialty: 'GENERAL_MEDICINE',
      status: 'IN_PROGRESS',
      totalSteps: 3,
    });

    expect(parsed.currentQuestion?.id).toBe('q-first');
  });

  it('triageSessionSchema computes step from answeredCount when current step is missing', () => {
    const parsed = triageSessionSchema.parse({
      answeredCount: 2,
      isComplete: false,
      questions: [
        {
          id: 'q1',
          options: [{ id: 'o1', label: 'A' }],
          title: 'Q1',
          type: 'SINGLE_CHOICE',
        },
        {
          id: 'q2',
          options: [{ id: 'o2', label: 'B' }],
          title: 'Q2',
          type: 'SINGLE_CHOICE',
        },
        {
          id: 'q3',
          options: [{ id: 'o3', label: 'C' }],
          title: 'Q3',
          type: 'SINGLE_CHOICE',
        },
      ],
      sessionId: 'session-answered-count',
      specialty: 'GENERAL_MEDICINE',
      status: 'IN_PROGRESS',
      totalSteps: 5,
    });

    expect(parsed.currentStep).toBe(3);
  });

  it('triageSessionSchema uses result payload and normalizes nested session id', () => {
    const parsed = triageSessionSchema.parse({
      isComplete: true,
      questions: [],
      result: {
        priority: 'LOW',
        redFlags: [],
      },
      sessionId: 'session-with-result',
      specialty: 'GENERAL_MEDICINE',
      status: 'COMPLETED',
      totalSteps: 0,
    });

    expect(parsed.result?.sessionId).toBe('session-with-result');
  });

  it('triageActiveSessionListSchema parses active sessions', () => {
    const parsed = triageActiveSessionListSchema.parse({
      items: [
        {
          createdAt: '2026-04-07T18:18:00.000Z',
          currentQuestionId: 'MG-Q2',
          currentStep: 2,
          id: 'session-1',
          isComplete: false,
          specialty: 'GENERAL_MEDICINE',
          status: 'IN_PROGRESS',
          totalSteps: 5,
          updatedAt: '2026-04-07T18:19:10.000Z',
        },
      ],
      total: 1,
    });

    expect(parsed.total).toBe(1);
    expect(parsed.items[0]?.id).toBe('session-1');
    expect(parsed.items[0]?.currentStep).toBe(2);
  });

  it('triageActiveSessionSchema falls back to nextQuestionId and zero steps when totals are missing', () => {
    const parsed = triageActiveSessionSchema.parse({
      id: 'session-active-fallback',
      isComplete: false,
      nextQuestionId: 'Q-next',
      specialty: 'ODONTOLOGY',
      status: 'IN_PROGRESS',
    });

    expect(parsed.currentQuestionId).toBe('Q-next');
    expect(parsed.totalSteps).toBe(0);
    expect(parsed.currentStep).toBe(0);
  });

  it('triageActiveSessionListSchema defaults total to items length', () => {
    const parsed = triageActiveSessionListSchema.parse({
      items: [
        {
          id: 'session-1',
          specialty: 'GENERAL_MEDICINE',
          status: 'IN_PROGRESS',
        },
        {
          id: 'session-2',
          specialty: 'ODONTOLOGY',
          status: 'IN_PROGRESS',
        },
      ],
    });

    expect(parsed.total).toBe(2);
  });

  it('cancelTriageSessionResponseSchema normalizes nullable fields', () => {
    const parsed = cancelTriageSessionResponseSchema.parse({
      sessionId: 'session-cancel',
      specialty: 'GENERAL_MEDICINE',
      status: 'CANCELED',
    });

    expect(parsed.canceledAt).toBeNull();
    expect(parsed.message).toBeNull();
  });

  it('triageResultSchema supports warningSigns alias', () => {
    const parsed = triageResultSchema.parse({
      analysisMode: 'RULE_BASED',
      noticeCode: 'IA_NOT_IMPLEMENTED_RULE_BASED_FALLBACK',
      priority: 'HIGH',
      sessionId: 'session-1',
      warningSigns: [
        {
          description: 'Opresion en el pecho',
          id: 'rf-1',
          title: 'Dolor toracico',
        },
      ],
    });

    expect(parsed.priority).toBe('HIGH');
    expect(parsed.analysisMode).toBe('RULE_BASED');
    expect(parsed.noticeCode).toBe('IA_NOT_IMPLEMENTED_RULE_BASED_FALLBACK');
    expect(parsed.redFlags).toHaveLength(1);
    expect(parsed.redFlags[0]).toEqual({
      description: 'Opresion en el pecho',
      id: 'rf-1',
      title: 'Dolor toracico',
    });
  });

  it('triageResultSchema keeps compatibility when analysis metadata is missing', () => {
    const parsed = triageResultSchema.parse({
      priority: 'LOW',
      redFlags: [],
      sessionId: 'session-legacy',
    });

    expect(parsed.analysisMode).toBeNull();
    expect(parsed.noticeCode).toBeNull();
  });

  it('triageResultSchema ignores invalid analysis metadata and uses redFlags alias', () => {
    const parsed = triageResultSchema.parse({
      analysisMode: 'SOMETHING_ELSE',
      noticeCode: 'UNKNOWN_NOTICE',
      priority: 'MODERATE',
      redFlags: [
        {
          id: 'rf-alias',
          message: 'Senal por alias',
        },
      ],
      sessionId: 'session-invalid-analysis-meta',
    });

    expect(parsed.analysisMode).toBeNull();
    expect(parsed.noticeCode).toBeNull();
    expect(parsed.redFlags[0]).toEqual({
      description: 'Senal por alias',
      id: 'rf-alias',
      title: 'Senal por alias',
    });
  });

  it('triageQuestionSchema applies option/label/step fallbacks', () => {
    const parsed = triageQuestionSchema.parse({
      id: 'q-fallbacks',
      max: 4,
      min: 6,
      options: [
        {
          id: 'opt-1',
          text: 'Texto opcion',
        },
      ],
      question: 'Titulo por question',
      step: 0,
      type: 'NUMERIC_SCALE',
    });

    expect(parsed.minValue).toBe(6);
    expect(parsed.maxValue).toBe(6);
    expect(parsed.step).toBe(1);
    expect(parsed.options[0]?.label).toBe('Texto opcion');
    expect(parsed.title).toBe('Titulo por question');
  });

  it('normalizeCreateTriageSessionInput validates specialty value', () => {
    const parsed = normalizeCreateTriageSessionInput({ specialty: 'ODONTOLOGY' });

    expect(parsed.specialty).toBe('ODONTOLOGY');
  });

  it('submitTriageAnswerResponseSchema applies defaults when fields are missing', () => {
    const parsed = submitTriageAnswerResponseSchema.parse({});

    expect(parsed).toEqual({
      answeredCount: 0,
      currentQuestionId: null,
      isComplete: false,
      nextQuestionId: null,
      progressPercent: 0,
      remainingQuestions: 0,
      totalQuestions: 0,
    });
  });

  it('submitTriageAnswerResponseSchema keeps provided values when present', () => {
    const parsed = submitTriageAnswerResponseSchema.parse({
      answeredCount: 3,
      currentQuestionId: 'q-current',
      isComplete: true,
      nextQuestionId: null,
      progressPercent: 60,
      remainingQuestions: 2,
      totalQuestions: 5,
    });

    expect(parsed.answeredCount).toBe(3);
    expect(parsed.currentQuestionId).toBe('q-current');
    expect(parsed.isComplete).toBe(true);
    expect(parsed.progressPercent).toBe(60);
  });

  it('normalizeSubmitTriageAnswerPayload maps single, multi and numeric answers', () => {
    const single = normalizeSubmitTriageAnswerPayload({
      questionId: 'q1',
      selectedOptionId: 'o1',
      type: 'SINGLE_CHOICE',
    });

    const multi = normalizeSubmitTriageAnswerPayload({
      questionId: 'q2',
      selectedOptionIds: ['o2', 'o3'],
      type: 'MULTI_CHOICE',
    });

    const numeric = normalizeSubmitTriageAnswerPayload({
      questionId: 'q3',
      type: 'NUMERIC_SCALE',
      value: 7,
    });

    expect(single).toEqual({
      answers: [{ answerValue: 'o1', questionId: 'q1' }],
    });
    expect(multi).toEqual({
      answers: [{ answerValue: ['o2', 'o3'], questionId: 'q2' }],
    });
    expect(numeric).toEqual({
      answers: [{ answerValue: 7, questionId: 'q3' }],
    });
  });
});
