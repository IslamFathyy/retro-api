import * as retrospectiveService from '../services/retrospective.service.js';
import * as feedbackService from '../services/feedback.service.js';
import * as analysisService from '../services/analysis.service.js';
import * as actionService from '../services/action.service.js';
import * as reportService from '../services/report.service.js';
import { AppError } from '../utils/errors.js';

function handle(fn) {
  return async (req, res, next) => {
    try {
      const result = await fn(req, res);
      if (result !== undefined) res.json(result);
    } catch (err) {
      next(err);
    }
  };
}

export const health = (_req, res) => {
  res.json({ status: 'ok', service: 'retro-api' });
};

export const listRetrospectives = handle(async () =>
  retrospectiveService.listRetrospectives()
);

export const createRetrospective = handle(async (req) =>
  retrospectiveService.createRetrospective(req.body)
);

export const getRetrospective = handle(async (req) =>
  retrospectiveService.getRetrospective(req.params.retroId)
);

export const openRetrospective = handle(async (req) =>
  retrospectiveService.openRetrospective(req.params.retroId)
);

export const closeRetrospective = handle(async (req) =>
  retrospectiveService.closeRetrospective(req.params.retroId)
);

export const archiveRetrospective = handle(async (req) =>
  retrospectiveService.archiveRetrospective(req.params.retroId)
);

export const dashboard = handle(async () =>
  retrospectiveService.getDashboardSummary()
);

export const listFeedback = handle(async (req) =>
  feedbackService.listFeedback(req.params.retroId)
);

export const submitFeedback = handle(async (req) =>
  feedbackService.submitFeedback(req.params.retroId, req.body)
);

export const getAnalysis = handle(async (req) => {
  const analysis = await analysisService.getAnalysis(req.params.retroId);
  if (!analysis) throw new AppError('Analysis not found', 404);
  return analysis;
});

export const generateAnalysis = handle(async (req) =>
  analysisService.generateBaselineAnalysis(req.params.retroId)
);

export const getComparison = handle(async () =>
  analysisService.getHistoricalComparison()
);

export const listActions = handle(async (req) =>
  actionService.listActions(req.params.retroId)
);

export const createAction = handle(async (req) =>
  actionService.createAction(req.params.retroId, req.body)
);

export const updateAction = handle(async (req) =>
  actionService.updateAction(req.params.retroId, req.params.actionId, req.body)
);

export const createFromSuggestion = handle(async (req) =>
  actionService.createActionFromSuggestion(req.params.retroId, req.params.suggestionId)
);

export const getOpenActions = handle(async () =>
  actionService.getOpenActionsFromPrevious()
);

export const getReport = handle(async (req) => {
  const report = await reportService.getReport(req.params.retroId);
  if (!report) throw new AppError('Report not found', 404);
  return { markdown: report };
});

export const generateReport = handle(async (req) => {
  const markdown = await reportService.generateReport(req.params.retroId);
  return { markdown };
});
