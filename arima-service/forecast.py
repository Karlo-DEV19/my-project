import pandas as pd
import numpy as np
from datetime import datetime
from statsmodels.tsa.arima.model import ARIMA


# ---------------------------------------------------------------------------
# Step 2: Data Loading and Cleaning
# ---------------------------------------------------------------------------

def load_sales_data(file_path: str) -> pd.DataFrame:
    print(f"[load_sales_data] Reading file: {file_path}")
    df = pd.read_excel(file_path, engine="openpyxl")

    print(f"[load_sales_data] Raw shape      : {df.shape}")
    print(f"[load_sales_data] Columns found  : {df.columns.tolist()}")

    # Identify date column
    date_col = next((c for c in df.columns if "date" in c.lower()), None)
    if date_col is None:
        raise ValueError("No date column found.")

    # Identify sales column
    sales_col = next(
        (c for c in df.columns if any(k in c.lower() for k in ("sales", "amount", "revenue", "total"))),
        None,
    )
    if sales_col is None:
        raise ValueError("No sales/amount column found.")

    print(f"[load_sales_data] Date column    : '{date_col}'")
    print(f"[load_sales_data] Sales column   : '{sales_col}'")

    df = df[[date_col, sales_col]].copy()
    df.dropna(subset=[date_col, sales_col], inplace=True)

    df[date_col] = pd.to_datetime(df[date_col], errors="coerce")
    df.dropna(subset=[date_col], inplace=True)

    df.sort_values(by=date_col, ascending=True, inplace=True)
    df.reset_index(drop=True, inplace=True)

    df.rename(columns={date_col: "date", sales_col: "sales"}, inplace=True)

    print(f"[load_sales_data] Cleaned shape  : {df.shape}")
    print(f"[load_sales_data] Date range     : {df['date'].min()} to {df['date'].max()}")

    return df


def prepare_time_series(df: pd.DataFrame) -> pd.Series:
    print("[prepare_time_series] Preparing time series...")

    ts = df.copy()
    ts["sales"] = pd.to_numeric(ts["sales"], errors="coerce")
    ts.dropna(subset=["sales"], inplace=True)

    ts = ts.groupby("date")["sales"].sum()
    ts.sort_index(inplace=True)

    print(f"[prepare_time_series] Series shape      : {ts.shape}")
    print(f"[prepare_time_series] Series dtype      : {ts.dtype}")
    print(f"[prepare_time_series] First 5 records:\n{ts.head()}")

    return ts


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def run_forecast(data):
    if isinstance(data, str) and data.strip().lower().endswith(".xlsx"):
        print(f"\n[run_forecast] File path detected: {data}")
        df = load_sales_data(data)

        print("\n[run_forecast] --- DataFrame Info ---")
        print(f"Shape:\n{df.shape}")
        print(f"Types:\n{df.dtypes}")
        print(f"Head:\n{df.head()}\n")

        ts = prepare_time_series(df)
        print(f"\n[run_forecast] Time series ready. {len(ts)} data points loaded.")

        # -------------------------------------------------------------------
        # Step 3: ARIMA Forecasting  (business-aware / real-time aligned)
        # -------------------------------------------------------------------
        print("\n[run_forecast] Fitting ARIMA(1,1,1) model...")
        model = ARIMA(ts, order=(1, 1, 1))
        model_fit = model.fit()

        # Determine today at month-start so we can compare with forecast index
        today = datetime.now()
        today_month_start = pd.Timestamp(today.year, today.month, 1)

        # Dynamically extend forecast steps until at least 3 future periods exist
        steps = 3
        while True:
            forecast = model_fit.forecast(steps=steps)

            # Keep only months >= current month (i.e., present or future)
            future_forecast = forecast[forecast.index >= today_month_start]

            if len(future_forecast) >= 3:
                break

            steps += 1  # extend by one more period and retry

        print(f"\n[run_forecast] Total steps generated : {steps}")
        print(f"[run_forecast] Future periods returned: {len(future_forecast)}")
        print(f"[run_forecast] Today (month start)    : {today_month_start.date()}")
        print("\n=== FORECAST OUTPUT (future only) ===")
        print(future_forecast)

        return {
            "historical": ts,
            "forecast": future_forecast,
        }

    print("[run_forecast] Non-file input received — returning data unchanged.")
    return data


# ---------------------------------------------------------------------------
# RUN TEST (FIXED POSITION)
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    print("=== ARIMA Forecast Script Starting ===")

    file_path = "arima-service/sales.xlsx"

    result = run_forecast(file_path)

    print("\n=== HISTORICAL DATA ===")
    print(result["historical"].tail())

    print("\n=== FORECAST DATA ===")
    print(result["forecast"])