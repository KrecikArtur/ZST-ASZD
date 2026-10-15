module.exports = {
  apps: [
    {
      name: "BELL-strona",
      script: "index.js",
      cwd: "/home/bell/site",
      autorestart: true,
    },
    {
      name: "BELL-backend",
      script: "/home/bell/backend/venv/bin/gunicorn",
      args: "backend.wsgi:application --bind 0.0.0.0:8010",
      interpreter: "none",
      env: {
        DJANGO_SETTINGS_MODULE: "backend.settings",
        PYTHONPATH: "/home/bell/backend",
        ENV: "production"
      },
      autorestart: true,
    },
  ],
};
