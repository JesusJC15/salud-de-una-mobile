import {
  activeSessionsResponseSchema,
  analyzeSessionResponseSchema,
  createSessionResponseSchema,
  saveAnswersResponseSchema,
  triageQuestionSchema,
  triageSpecialtySchema,
} from '@/src/schemas/triage';

describe('triage schemas', () => {
  it('validates specialties and questions', () => {
    expect(triageSpecialtySchema.parse('GENERAL_MEDICINE')).toBe('GENERAL_MEDICINE');

    const question = triageQuestionSchema.parse({
      id: '1',
      questionId: 'Q1',
      title: 'Dolor',
      questionText: 'Describe el dolor',
      type: 'SINGLE_CHOICE',
      options: [{ id: 'o1', label: 'Leve' }],
    });

    expect(question.type).toBe('SINGLE_CHOICE');
  });

  it('validates create session responses', () => {
    const payload = {
      sessionId: 's1',
      specialty: 'GENERAL_MEDICINE',
      status: 'IN_PROGRESS',
      questions: [],
      totalQuestions: 3,
      answeredCount: 1,
      remainingQuestions: 2,
      progressPercent: 33,
      nextQuestionId: null,
      isComplete: false,
    };

    expect(createSessionResponseSchema.parse(payload)).toEqual(payload);
  });

  it('validates save answers responses', () => {
    const payload = {
      sessionId: 's1',
      answersCount: 2,
      isComplete: false,
      totalQuestions: 3,
      answeredCount: 2,
      remainingQuestions: 1,
      progressPercent: 66,
      nextQuestionId: 'q3',
    };

    expect(saveAnswersResponseSchema.parse(payload)).toEqual(payload);
  });

  it('validates analyze session responses', () => {
    const payload = {
      sessionId: 's1',
      consultationId: 'c1',
      priority: 'LOW',
      redFlags: [{ code: 'RF1', severity: 'INFO', evidence: 'Ninguna' }],
      message: 'Ok',
      highPriorityAlert: false,
    };

    expect(analyzeSessionResponseSchema.parse(payload)).toEqual(payload);
  });

  it('validates active sessions list', () => {
    const payload = {
      items: [
        {
          id: 's1',
          specialty: 'GENERAL_MEDICINE',
          status: 'IN_PROGRESS',
          currentStep: 1,
          totalSteps: 3,
          currentQuestionId: null,
          isComplete: false,
          createdAt: null,
          updatedAt: null,
        },
      ],
      total: 1,
    };

    expect(activeSessionsResponseSchema.parse(payload)).toEqual(payload);
  });
});
