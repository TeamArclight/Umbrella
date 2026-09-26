"""Umbrella Adapters Module."""

from umbrella.adapters.weather import WeatherProvider, OpenMeteoWeatherProvider
from umbrella.adapters.historical_weather import (
    HistoricalWeatherProvider,
    OpenMeteoHistoricalWeatherProvider,
)
from umbrella.adapters.climate import (
    ClimateDataProvider,
    HistoricalClimateProvider,
    CGIARClimateProvider,
)
from umbrella.adapters.portfolio import (
    PortfolioProvider,
    SyntheticPortfolioProvider,
    FineractPortfolioProvider,
)

__all__ = [
    "WeatherProvider",
    "OpenMeteoWeatherProvider",
    "HistoricalWeatherProvider",
    "OpenMeteoHistoricalWeatherProvider",
    "ClimateDataProvider",
    "HistoricalClimateProvider",
    "CGIARClimateProvider",
    "PortfolioProvider",
    "SyntheticPortfolioProvider",
    "FineractPortfolioProvider",
]

