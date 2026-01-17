const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// 1. Database Connection (Permanent Storage)
mongoose.connect('mongodb://localhost:27017/Wagoora_VER', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// 2. Data Schema (Matching your Proforma)
const HouseholdSchema = new mongoose.Schema({
  headName: String,
  familyId: String,
  village: { type: String, default: 'Wagoora' },
  tehsil: { type: String, default: 'Wagoora' },
  students: [{
    name: String,
    gender: String,
    dob: Date,
    status: String, // Enrolled, Dropout, OOSC
    isCWSN: Boolean,
    schoolName: String
  }],
  surveyDate: { type: Date, default: Date.now },
  surveyorId: String
});

const Household = mongoose.model('Household', HouseholdSchema);

// 3. The "Receiver" Endpoint
app.post('/api/submit-survey', async (req, res) => {
  try {
    const newSurvey = new Household(req.body);
    await newSurvey.save();
    
    // Logic to check for OOSC and notify HOI
    const ooscChildren = req.body.students.filter(s => s.status === 'OOSC');
    if (ooscChildren.length > 0) {
      console.log(`BELL RINGER: ${ooscChildren.length} OOSC found in Ward ${req.body.wardNo}`);
    }

    res.status(201).json({ message: 'Data Synced Successfully to Wagoora Server' });
  } catch (err) {
    res.status(500).json({ error: 'Sync Failed' });
  }
});

// 4. Endpoint for Part C Summary
app.get('/api/village-summary', async (req, res) => {
  const totalKids = await Household.aggregate([
    { $unwind: "$students" },
    { $count: "total" }
  ]);
  res.json({ total: totalKids[0]?.total || 0 });
});

app.listen(5000, () => console.log('W-VER Server running on Port 5000'));

