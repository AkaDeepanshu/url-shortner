import express from 'express';
import { handleGenerateShortURL, handleGetUrlAnalytics } from '../controllers/url.js';

const router = express.Router();

router.post('/', handleGenerateShortURL);
router.get('/analytics/:shortId', handleGetUrlAnalytics);

export default router;