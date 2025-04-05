from prometheus_client import Histogram, Counter

# Initialize metrics
REQUEST_COUNT = Counter(
    "http_requests_total", 
    "Total HTTP Requests", 
    ["method", "endpoint"]
)

REQUEST_DURATION = Histogram(
    "http_request_duration_seconds", 
    "HTTP Request Duration", 
    ["method", "endpoint"]
)

def setup_metrics(app):
    """Setup Prometheus metrics for the FastAPI app"""
    from prometheus_client import make_asgi_app
    metrics_app = make_asgi_app()
    app.mount("/metrics", metrics_app)
    
    return {
        "request_count": REQUEST_COUNT,
        "request_duration": REQUEST_DURATION
    }