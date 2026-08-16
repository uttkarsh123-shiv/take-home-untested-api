const express = require('express');
const taskRoutes = require('./routes/tasks');

const app = express();

app.use(express.json());

// added this so Render knows the app is up and running
// also gives a simple URL to verify the deployment is live
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/tasks', taskRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Task API running on port ${PORT}`);
  });
}

module.exports = app;
