import sys
import os

# Ensure forecast.py is importable regardless of working directory
sys.path.insert(0, os.path.dirname(__file__))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from forecast import run_forecast

# ---------------------------------------------------------------------------
# App initialisation
# ---------------------------------------------------------------------------

app = FastAPI(
    title="ARIMA Forecast API",
    description="Exposes ARIMA-based sales forecasts from local Excel data.",
    version="1.0.0",
)

# Allow requests from the Next.js dev server (and any localhost origin)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

# Absolute path to the Excel file so the API works from any working directory
SALES_FILE = os.path.join(os.path.dirname(__file__), "sales.xlsx")


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/")
def root():
    """Health-check endpoint."""
    return {"message": "ARIMA Forecast API is running"}


@app.get("/forecast")
def forecast():
    """
    Run ARIMA(1,1,1) on the sales Excel file and return:
      - historical: last 5 data points (date -> sales)
      - forecast  : next 3 predicted periods (date -> predicted sales)
    """
    if not os.path.exists(SALES_FILE):
        raise HTTPException(
            status_code=404,
            detail=f"Sales data file not found at: {SALES_FILE}",
        )

    result = run_forecast(SALES_FILE)

    # Convert pd.Series to JSON-safe dicts (ISO date strings as keys)
    historical_series = result["historical"].tail(5)
    forecast_series   = result["forecast"]

    historical_json = {
        str(date.date()): round(float(value), 2)
        for date, value in historical_series.items()
    }

    forecast_json = {
        str(date.date()): round(float(value), 2)
        for date, value in forecast_series.items()
    }

    return {
        "historical": historical_json,
        "forecast":   forecast_json,
    }
