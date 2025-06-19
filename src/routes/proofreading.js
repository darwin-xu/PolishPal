const express = require('express');
const router = express.Router();
const proofreadingService = require('../services/proofreadingService');
const recordService = require('../services/recordService');

// POST /api/proofread - Main proofreading endpoint
router.post('/proofread', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required and must be a string' });
    }

    if (text.length > 5000) {
      return res.status(400).json({ error: 'Text must be less than 5000 characters' });
    }

    // Get proofreading result
    const proofreadResult = await proofreadingService.proofreadText(text);
    
    // Perform word-by-word analysis
    const analysis = proofreadingService.analyzeChanges(text, proofreadResult.correctedText);
    
    // Save record for future summarization
    const recordId = await recordService.saveRecord({
      originalText: text,
      correctedText: proofreadResult.correctedText,
      analysis: analysis,
      timestamp: new Date().toISOString()
    });

    res.json({
      original: text,
      corrected: proofreadResult.correctedText,
      analysis: analysis,
      recordId: recordId
    });

  } catch (error) {
    console.error('Proofreading error:', error);
    res.status(500).json({ error: 'Failed to process text' });
  }
});

// GET /api/records - Get all proofreading records
router.get('/records', async (req, res) => {
  try {
    const records = await recordService.getAllRecords();
    res.json(records);
  } catch (error) {
    console.error('Error fetching records:', error);
    res.status(500).json({ error: 'Failed to fetch records' });
  }
});

// GET /api/records/:id - Get specific record
router.get('/records/:id', async (req, res) => {
  try {
    const record = await recordService.getRecord(req.params.id);
    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }
    res.json(record);
  } catch (error) {
    console.error('Error fetching record:', error);
    res.status(500).json({ error: 'Failed to fetch record' });
  }
});

module.exports = router;
