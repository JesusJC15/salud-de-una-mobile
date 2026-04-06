import { describe, expect, it } from '@jest/globals';

import { normalizeSubmitTriageAnswerPayload } from '@/src/schemas/triage/triage-answer.schema';
import { triageResultSchema } from '@/src/schemas/triage/triage-result.schema';
import { triageSessionSchema } from '@/src/schemas/triage/triage-session.schema';

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
      specialty: 'DENTISTRY',
      totalSteps: 0,
    });

    expect(parsed.isComplete).toBe(true);
    expect(parsed.currentQuestion).toBeNull();
    expect(parsed.totalSteps).toBe(0);
  });

  it('triageResultSchema supports warningSigns alias', () => {
    const parsed = triageResultSchema.parse({
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
    expect(parsed.redFlags).toHaveLength(1);
    expect(parsed.redFlags[0]).toEqual({
      description: 'Opresion en el pecho',
      id: 'rf-1',
      title: 'Dolor toracico',
    });
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

    expect(single).toEqual({ questionId: 'q1', selectedOptionId: 'o1' });
    expect(multi).toEqual({ questionId: 'q2', selectedOptionIds: ['o2', 'o3'] });
    expect(numeric).toEqual({ numericValue: 7, questionId: 'q3' });
  });
});
