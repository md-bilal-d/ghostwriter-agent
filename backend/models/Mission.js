const mongoose = require('mongoose');

const missionSchema = new mongoose.Schema({
  repository: { type: String, required: true },
  prNumber: { type: Number, required: true },
  branchName: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['queued', 'in_progress', 'analyzing', 'testing', 'fixing', 'success', 'failed', 'skipped'],
    default: 'queued'
  },
  logs: [{ type: String }],
  aiReasoning: { type: String },
  prLink: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Mission', missionSchema);
