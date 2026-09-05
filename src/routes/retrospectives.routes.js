import { Router } from 'express';
import * as c from '../controllers/retrospectives.controller.js';

const router = Router();

router.get('/health', c.health);
router.get('/dashboard', c.dashboard);
router.get('/comparison', c.getComparison);
router.get('/actions/open', c.getOpenActions);

router.get('/retrospectives', c.listRetrospectives);
router.post('/retrospectives', c.createRetrospective);
router.get('/retrospectives/:retroId', c.getRetrospective);
router.post('/retrospectives/:retroId/open', c.openRetrospective);
router.post('/retrospectives/:retroId/close', c.closeRetrospective);
router.post('/retrospectives/:retroId/archive', c.archiveRetrospective);

router.get('/retrospectives/:retroId/feedback', c.listFeedback);
router.post('/retrospectives/:retroId/feedback', c.submitFeedback);

router.get('/retrospectives/:retroId/analysis', c.getAnalysis);
router.post('/retrospectives/:retroId/analysis/generate', c.generateAnalysis);

router.get('/retrospectives/:retroId/actions', c.listActions);
router.post('/retrospectives/:retroId/actions', c.createAction);
router.put('/retrospectives/:retroId/actions/:actionId', c.updateAction);
router.post('/retrospectives/:retroId/actions/from-suggestion/:suggestionId', c.createFromSuggestion);

router.get('/retrospectives/:retroId/report', c.getReport);
router.post('/retrospectives/:retroId/report/generate', c.generateReport);

export default router;
