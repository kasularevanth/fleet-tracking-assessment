import app from './app';
import { config } from './config/env';

const PORT = config.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${config.NODE_ENV}`);
});

