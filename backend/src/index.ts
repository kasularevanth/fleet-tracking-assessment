import app from "./app";
import { config } from "./config/env";
import { initDatabase } from "./database/initDatabase";

const PORT = config.PORT || 5000;

// Initialize database on startup
initDatabase()
  .then(() => {
    // Start server after database initialization
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 Environment: ${config.NODE_ENV}`);
    });
  })
  .catch((error) => {
    console.error("Failed to initialize database:", error);
    // Still start server - migration will be retried on next restart
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 Environment: ${config.NODE_ENV}`);
      console.log("⚠️  Database may not be initialized. Check logs above.");
    });
  });
